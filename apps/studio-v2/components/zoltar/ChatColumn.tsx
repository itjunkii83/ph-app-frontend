'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button, TextArea, Eyebrow } from '@/components/ui';
import type { TranscriptEntry } from '@/lib/zoltar/types';
import { CardRenderer } from './cards/CardRenderer';
import type { CardMutate } from './cards/shared';

export function ChatColumn({
  transcript,
  loading,
  error,
  onSend,
  onRegenerate,
}: {
  transcript: TranscriptEntry[];
  loading: boolean;
  error: string | null;
  onSend: (text: string, mutate?: CardMutate) => void;
  onRegenerate: () => void;
}) {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Copy the whole conversation as JSON: user answers and Zoltar's full turns
  // (message, card, step_focus/status, proposed_updates) in order.
  const copyLog = async () => {
    const payload = transcript.map((e) =>
      e.role === 'user' ? { role: 'user', content: e.content, at: e.at } : { role: 'zoltar', ...e.turn, at: e.at },
    );
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable (non-secure context); nothing else to do
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [transcript.length, loading]);

  const last = transcript[transcript.length - 1];
  const activeCard = last && last.role === 'assistant' && last.turn.card ? last.turn.card : null;
  const lastIsBlank = !!last && last.role === 'assistant' && !last.turn.message.trim() && !last.turn.card;

  const submit = () => {
    const t = text.trim();
    if (!t || loading) return;
    setText('');
    onSend(t);
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex-none flex items-center justify-between gap-4 border-b border-line px-8 py-5">
        <div>
          <div className="font-display text-[19px] text-paper">Zoltar</div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-muted">Onboarding coach, debug</div>
        </div>
        <Button sm onClick={copyLog} disabled={transcript.length === 0} title="Copy the full chat log as JSON">
          <span className="inline-flex items-center gap-1.5">
            {copied ? <Check className="h-[15px] w-[15px]" /> : <Copy className="h-[15px] w-[15px]" />}
            {copied ? 'Copied' : 'Copy log'}
          </span>
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto flex max-w-[720px] flex-col gap-5">
          {transcript.length === 0 && !loading && (
            <div className="text-[13px] text-muted">Waiting for Zoltar to open the conversation.</div>
          )}

          {transcript.map((e, i) =>
            e.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] whitespace-pre-wrap rounded-[12px] border border-line bg-panel px-3.5 py-2.5 text-[13.5px] text-paper">
                  {e.content}
                </div>
              </div>
            ) : (
              <div key={i} className="flex flex-col gap-1.5">
                <Eyebrow>Zoltar</Eyebrow>
                {e.turn.message.trim() ? (
                  <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-paper">{e.turn.message}</div>
                ) : (
                  <div className="text-[13px] italic text-muted">
                    This model returned an empty message. Check Raw last turn, or try another model.
                  </div>
                )}
              </div>
            ),
          )}

          {loading && <div className="text-[13px] text-muted">Zoltar is thinking...</div>}
          {error && (
            <div className="rounded-[10px] border border-line2 px-3.5 py-2.5 text-[13px] text-[#e0a08a]">
              {error}
            </div>
          )}
          {!loading && (error || lastIsBlank) && (
            <div className="flex justify-start">
              <Button sm onClick={onRegenerate}>
                Retry
              </Button>
            </div>
          )}

          {activeCard && !loading && (
            <div className="rounded-[12px] border border-line2 bg-ink2 p-4">
              <CardRenderer card={activeCard} onSubmit={onSend} disabled={loading} />
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="flex-none border-t border-line px-8 py-4">
        <div className="mx-auto flex max-w-[720px] items-end gap-3">
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="Type a reply. A card, when shown, is a shortcut, not a gate."
            className="flex-1"
          />
          <Button variant="accent" disabled={loading || !text.trim()} onClick={submit}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
