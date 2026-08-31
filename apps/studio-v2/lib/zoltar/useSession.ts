'use client';

// localStorage-backed Zoltar session. Owns the one-call-per-turn loop, a guarded
// opener (fires on an empty transcript, and also re-fires when the only thing in the
// transcript is a degenerate opener with no user input, so a reload recovers from a
// blank first turn), compact history (assistant messages sent back to the model are
// only the visible text plus a one-line card tag), Start fresh, Retry, and Export.
// A useRef in-flight flag stops React StrictMode's dev double-effect from firing two
// calls at once.
import { useCallback, useRef, useState } from 'react';
import { authedFetch } from '@/lib/firebase/authedFetch';
import { DEFAULT_MODEL_ID, getModel, turnCost } from './models';
import { applyModelUpdates } from './apply';
import {
  type Session,
  type UserModel,
  type TranscriptEntry,
  type TurnLog,
  type ZoltarTurn,
  emptyUserModel,
} from './types';

const KEY = 'zoltar:session:v1';

function nowIso(): string {
  return new Date().toISOString();
}

function createSession(modelId = DEFAULT_MODEL_ID, thinking = false): Session {
  return {
    version: 1,
    modelId,
    thinking,
    transcript: [],
    userModel: emptyUserModel(),
    turns: [],
    started: false,
    lastError: null,
    created_at: nowIso(),
  };
}

function load(): Session {
  if (typeof window === 'undefined') return createSession();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return createSession();
    const parsed = JSON.parse(raw) as Session;
    if (parsed.version !== 1) return createSession();
    return parsed;
  } catch {
    return createSession();
  }
}

function persist(session: Session): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Quota or private mode: the session simply is not saved this render.
  }
}

// Assistant turns are sent back compact: the visible message plus a one-line card
// tag. The user model in the system prompt carries the structured state.
function compactMessages(transcript: TranscriptEntry[]): { role: 'user' | 'assistant'; content: string }[] {
  return transcript.map((e) =>
    e.role === 'user'
      ? { role: 'user', content: e.content }
      : { role: 'assistant', content: e.turn.card ? `${e.turn.message}\n[card: ${e.turn.card.type}]` : e.turn.message },
  );
}

// A turn with no visible message and no card gives the user nothing to act on.
function isDegenerate(entry: TranscriptEntry): boolean {
  return entry.role === 'assistant' && !entry.turn.message.trim() && !entry.turn.card;
}

export interface UseSession {
  session: Session;
  loading: boolean;
  error: string | null;
  send: (userText: string, mutate?: (m: UserModel) => UserModel) => void;
  regenerate: () => void;
  openIfEmpty: () => void;
  setModel: (id: string) => void;
  setThinking: (on: boolean) => void;
  markStarted: () => void;
  startFresh: () => void;
  exportSession: () => void;
}

export function useSession(): UseSession {
  const [session, setSession] = useState<Session>(load);
  const sessionRef = useRef<Session>(session);
  const inFlight = useRef(false);
  const opened = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Commit synchronously to the ref (so the in-flight guard and callers see the
  // latest state immediately) as well as to React state and localStorage.
  const commit = useCallback((next: Session) => {
    sessionRef.current = next;
    persist(next);
    setSession(next);
  }, []);

  // Run one model turn against an exact transcript (which already ends in whatever
  // the model should respond to). The caller decides the transcript and base model.
  const runTurn = useCallback(
    async (transcript: TranscriptEntry[], baseModel: UserModel) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setLoading(true);
      setError(null);
      const cur = sessionRef.current;
      commit({ ...cur, transcript, userModel: baseModel });

      try {
        const res = await authedFetch('/api/zoltar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId: cur.modelId,
            thinking: cur.thinking,
            messages: compactMessages(transcript),
            userModel: baseModel,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          const message = data?.error ? `${data.error}${data.status ? ` (${data.status})` : ''}` : `Request failed (${res.status})`;
          setError(message);
          commit({ ...sessionRef.current, lastError: { message, raw: data?.raw ?? data?.content ?? data ?? null } });
          return;
        }
        const turn = data.turn as ZoltarTurn;
        const finalModel = applyModelUpdates(baseModel, turn.proposed_updates);
        const spec = getModel(cur.modelId);
        const log: TurnLog = {
          modelId: cur.modelId,
          usage: data.usage,
          cost: spec ? turnCost(spec, data.usage.prompt_tokens, data.usage.completion_tokens) : 0,
          raw: data.raw ?? null,
          at: nowIso(),
        };
        commit({
          ...cur,
          transcript: [...transcript, { role: 'assistant', turn, at: nowIso() }],
          userModel: finalModel,
          turns: [...cur.turns, log],
          lastError: null,
        });
      } catch (e) {
        const message = (e as Error).message;
        setError(message);
        commit({ ...sessionRef.current, lastError: { message, raw: null } });
      } finally {
        inFlight.current = false;
        setLoading(false);
      }
    },
    [commit],
  );

  const send = useCallback(
    (userText: string, mutate?: (m: UserModel) => UserModel) => {
      const cur = sessionRef.current;
      const base = mutate ? mutate(cur.userModel) : cur.userModel;
      void runTurn([...cur.transcript, { role: 'user', content: userText, at: nowIso() }], base);
    },
    [runTurn],
  );

  // Re-run the last turn: drop a trailing assistant turn (a blank or errored reply)
  // and ask again from the same point. On an opener this simply re-opens.
  const regenerate = useCallback(() => {
    const cur = sessionRef.current;
    const transcript =
      cur.transcript.length && cur.transcript[cur.transcript.length - 1].role === 'assistant'
        ? cur.transcript.slice(0, -1)
        : cur.transcript;
    void runTurn(transcript, cur.userModel);
  }, [runTurn]);

  const openIfEmpty = useCallback(() => {
    if (opened.current) return;
    const t = sessionRef.current.transcript;
    const noUserYet = !t.some((e) => e.role === 'user');
    const allDegenerate = t.every(isDegenerate);
    // Open when there is nothing yet, or when a prior opener produced only blank
    // turns and the user has not spoken (a reload then recovers automatically).
    if (t.length === 0 || (noUserYet && allDegenerate)) {
      opened.current = true;
      void runTurn([], sessionRef.current.userModel);
    }
  }, [runTurn]);

  const setModel = useCallback((id: string) => commit({ ...sessionRef.current, modelId: id }), [commit]);
  const setThinking = useCallback((on: boolean) => commit({ ...sessionRef.current, thinking: on }), [commit]);
  const markStarted = useCallback(() => commit({ ...sessionRef.current, started: true }), [commit]);

  const startFresh = useCallback(() => {
    if (typeof window !== 'undefined' && !window.confirm('Start fresh? This clears the current Zoltar session.')) return;
    const cur = sessionRef.current;
    commit(createSession(cur.modelId, cur.thinking));
    opened.current = true;
    void runTurn([], sessionRef.current.userModel);
  }, [commit, runTurn]);

  const exportSession = useCallback(() => {
    if (typeof window === 'undefined') return;
    const blob = new Blob([JSON.stringify(sessionRef.current, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zoltar-session-${sessionRef.current.created_at.slice(0, 19).replace(/[:T]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return { session, loading, error, send, regenerate, openIfEmpty, setModel, setThinking, markStarted, startFresh, exportSession };
}
