"use client";

import { useEffect, useState } from "react";

// SSR and hydration safe localStorage state. The first render (server and
// client) uses `initial`; the saved value is read after mount so the markup
// never mismatches. Writes are held until that first read completes.
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      // localStorage is an external system; this one-shot read after mount is
      // the hydration-safe pattern, so the sync setState here is intentional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      // Unreadable saved state: fall back to the initial value.
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable: state still works in memory.
    }
  }, [key, value, hydrated]);

  return { value, setValue, hydrated };
}
