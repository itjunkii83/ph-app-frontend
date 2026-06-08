"use client";

import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { db } from "@/lib/firebase/client";

// The single abstraction boundary over Firestore. Every persisted key in the
// app lives in one document per user (users/{uid}) under a `data` map. The
// provider loads that snapshot once, keeps it live with onSnapshot, and flushes
// writes (debounced) back with a merge. A localStorage mirror gives an instant
// warm paint and an offline fallback. useLocalStorage reads/writes through here,
// so every existing persistence hook is upgraded without changes.

type StoreValue = unknown;
type Subscriber = () => void;

interface StoreContextValue {
  get: (key: string) => StoreValue | undefined;
  set: (key: string, value: StoreValue) => void;
  subscribe: (key: string, cb: Subscriber) => () => void;
  hydrated: boolean;
  reset: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const FLUSH_DELAY_MS = 500;
const mirrorKey = (uid: string) => `harbor:v1:store:${uid}`;

// Strip undefined/functions so only JSON-clean data reaches Firestore.
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null)) as T;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const snapshotRef = useRef<Map<string, StoreValue>>(new Map());
  const dirtyRef = useRef<Map<string, StoreValue>>(new Map());
  const subscribersRef = useRef<Map<string, Set<Subscriber>>>(new Map());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const notify = useCallback((key: string) => {
    const subs = subscribersRef.current.get(key);
    if (subs) for (const cb of subs) cb();
  }, []);

  const writeMirror = useCallback(() => {
    if (!uid) return;
    try {
      const obj = Object.fromEntries(snapshotRef.current);
      window.localStorage.setItem(mirrorKey(uid), JSON.stringify(obj));
    } catch {
      // Mirror is best effort; the live store still works in memory.
    }
  }, [uid]);

  const flush = useCallback(() => {
    if (!uid) return;
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    if (dirtyRef.current.size === 0) return;
    const entries = Object.fromEntries(dirtyRef.current);
    const pending = new Map(dirtyRef.current);
    dirtyRef.current.clear();
    setDoc(
      doc(db, "users", uid),
      { data: clean(entries), updatedAt: serverTimestamp() },
      { merge: true },
    ).catch(() => {
      // Re-queue on failure so the next flush retries (last write wins).
      for (const [k, v] of pending) {
        if (!dirtyRef.current.has(k)) dirtyRef.current.set(k, v);
      }
    });
  }, [uid]);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(flush, FLUSH_DELAY_MS);
  }, [flush]);

  // Load + live subscription, re-run when the user changes. The provider only
  // mounts under the authenticated branch, so uid is present in practice; the
  // guard keeps types honest without resetting state synchronously here.
  useEffect(() => {
    if (!uid) return;

    // Warm the snapshot synchronously from the mirror for an instant paint.
    snapshotRef.current = new Map();
    try {
      const raw = window.localStorage.getItem(mirrorKey(uid));
      if (raw) {
        const obj = JSON.parse(raw) as Record<string, StoreValue>;
        for (const [k, v] of Object.entries(obj)) snapshotRef.current.set(k, v);
      }
    } catch {
      // Ignore an unreadable mirror.
    }

    const unsub = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        const data = (snap.data()?.data ?? {}) as Record<string, StoreValue>;
        const next = new Map<string, StoreValue>();
        for (const [k, v] of Object.entries(data)) next.set(k, v);
        // Keep locally dirty (un-flushed) writes on top of server data.
        for (const [k, v] of dirtyRef.current) next.set(k, v);

        const changed = new Set<string>();
        const prev = snapshotRef.current;
        for (const [k, v] of next) {
          if (JSON.stringify(prev.get(k)) !== JSON.stringify(v)) changed.add(k);
        }
        snapshotRef.current = next;
        writeMirror();
        setHydrated(true);
        for (const k of changed) notify(k);
      },
      () => {
        // Permission/network error: fall back to the mirror we already loaded.
        setHydrated(true);
      },
    );

    return () => {
      flush();
      unsub();
    };
  }, [uid, flush, notify, writeMirror]);

  // Flush in-flight writes when the tab is hidden or closed.
  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [flush]);

  const get = useCallback((key: string) => snapshotRef.current.get(key), []);

  const set = useCallback(
    (key: string, value: StoreValue) => {
      const cleaned = clean(value);
      snapshotRef.current.set(key, cleaned);
      dirtyRef.current.set(key, cleaned);
      writeMirror();
      notify(key);
      scheduleFlush();
    },
    [notify, scheduleFlush, writeMirror],
  );

  const subscribe = useCallback((key: string, cb: Subscriber) => {
    let subs = subscribersRef.current.get(key);
    if (!subs) {
      subs = new Set();
      subscribersRef.current.set(key, subs);
    }
    subs.add(cb);
    return () => {
      subs?.delete(cb);
    };
  }, []);

  const reset = useCallback(async () => {
    if (!uid) return;
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    const keys = Array.from(snapshotRef.current.keys());
    snapshotRef.current = new Map();
    dirtyRef.current = new Map();
    try {
      window.localStorage.removeItem(mirrorKey(uid));
    } catch {
      // Ignore.
    }
    for (const k of keys) notify(k);
    await setDoc(
      doc(db, "users", uid),
      { data: {}, updatedAt: serverTimestamp() },
      { merge: true },
    ).catch(() => {});
  }, [uid, notify]);

  const value = useMemo<StoreContextValue>(
    () => ({ get, set, subscribe, hydrated, reset }),
    [get, set, subscribe, hydrated, reset],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
