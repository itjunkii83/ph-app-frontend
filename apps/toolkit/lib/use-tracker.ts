"use client";

import { addDays, todayKey } from "@/lib/date";
import { computeStreak, type Completions } from "@/lib/streak";
import { useLocalStorage } from "@/lib/use-local-storage";

interface TrackerState {
  completions: Completions;
}

// The tracker store is deliberately not date scoped: the streak and history
// survive the new-day reset that clears exercise inputs.
export function useTracker(moduleId: string, historyDays: number) {
  const { value, setValue, hydrated } = useLocalStorage<TrackerState>(
    `harbor:v1:tracker:${moduleId}`,
    { completions: {} },
  );

  const today = todayKey();
  const completedToday = Boolean(value.completions[today]);
  const streak = computeStreak(value.completions, today);
  const history = Array.from({ length: historyDays }, (_, i) => {
    const date = addDays(today, -(historyDays - 1 - i));
    return { date, done: Boolean(value.completions[date]) };
  });

  function toggleToday() {
    setValue((prev) => {
      const completions = { ...prev.completions };
      if (completions[today]) {
        delete completions[today];
      } else {
        completions[today] = true;
      }
      return { completions };
    });
  }

  return { completedToday, streak, history, toggleToday, hydrated };
}
