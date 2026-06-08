"use client";

import { useEffect } from "react";
import { addDays, todayKey } from "@/lib/date";
import { computeStreak, type Completions } from "@/lib/streak";
import { useLocalStorage } from "@/lib/use-local-storage";

interface DayStreakState {
  completions: Completions;
}

// The streak rides on full-day completion. Harbor (and the completion screen)
// pass in whether today is 100 percent done; this records that against the
// date and counts the consecutive run. Not date scoped: the history survives
// the new-day reset that clears today's inputs.
export function useDayStreak(dayComplete: boolean, ready: boolean) {
  const { value, setValue, hydrated } = useLocalStorage<DayStreakState>(
    "harbor:v1:day-streak",
    { completions: {} },
  );

  const today = todayKey();

  // Sync today's flag whenever completion flips. Guarded so it only writes on a
  // real change, which keeps this out of a render loop.
  useEffect(() => {
    if (!ready || !hydrated) return;
    setValue((prev) => {
      const has = Boolean(prev.completions[today]);
      if (dayComplete === has) return prev;
      const completions = { ...prev.completions };
      if (dayComplete) completions[today] = true;
      else delete completions[today];
      return { completions };
    });
  }, [dayComplete, ready, hydrated, today, setValue]);

  const streak = computeStreak(value.completions, today);
  const completedToday = Boolean(value.completions[today]);

  function history(days: number) {
    return Array.from({ length: days }, (_, i) => {
      const date = addDays(today, -(days - 1 - i));
      return { date, done: Boolean(value.completions[date]) };
    });
  }

  return { streak, completedToday, history, hydrated };
}
