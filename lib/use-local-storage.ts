"use client";

import {
  useCallback,
  useEffect,
  useState,
  type SetStateAction,
} from "react";
import { useStore } from "@/lib/data/store-provider";

// Persisted React state, keyed by a stable string. The signature is unchanged
// from the original localStorage hook, but reads and writes now flow through
// the Firestore-backed StoreProvider (with a localStorage warm cache). The
// first render still returns `initial` on both server and client, then the
// snapshot reconciles after mount, so the markup never mismatches. Because
// every persistence hook funnels through here, the whole app is now pinned to
// the signed-in user with zero changes to the wrapper hooks.
export function useLocalStorage<T>(key: string, initial: T) {
  const store = useStore();
  const [value, setLocal] = useState<T>(initial);
  const hydrated = store.hydrated;

  // Reconcile from the snapshot after mount, and whenever this key changes in
  // the store (another mounted instance, or a fresh server snapshot).
  useEffect(() => {
    const sync = () => {
      const v = store.get(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (v !== undefined) setLocal(v as T);
    };
    sync();
    return store.subscribe(key, sync);
  }, [key, store]);

  // Supports useState-style updaters (used by points/streak/tracker) and direct
  // values. The resolved value is written through to the store immediately.
  const setValue = useCallback(
    (next: SetStateAction<T>) => {
      setLocal((prev) => {
        const resolved =
          typeof next === "function"
            ? (next as (p: T) => T)(prev)
            : next;
        store.set(key, resolved);
        return resolved;
      });
    },
    [key, store],
  );

  return { value, setValue, hydrated };
}
