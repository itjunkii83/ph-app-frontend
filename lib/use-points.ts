"use client";

import { todayKey } from "@/lib/date";
import { useLocalStorage } from "@/lib/use-local-storage";

interface PointsState {
  total: number;
  byDay: Record<string, number>;
}

// The running currency total. Not date scoped: points survive the new day.
export function usePoints() {
  const { value, setValue, hydrated } = useLocalStorage<PointsState>(
    "harbor:v1:points",
    { total: 0, byDay: {} },
  );

  const today = todayKey();
  const earnedToday = value.byDay[today] ?? 0;

  // Positive on completing something, negative when a commitment is unchecked.
  // Totals never drop below zero.
  function addPoints(amount: number) {
    if (amount === 0) return;
    setValue((prev) => ({
      total: Math.max(0, prev.total + amount),
      byDay: {
        ...prev.byDay,
        [today]: Math.max(0, (prev.byDay[today] ?? 0) + amount),
      },
    }));
  }

  return { total: value.total, earnedToday, addPoints, hydrated };
}
