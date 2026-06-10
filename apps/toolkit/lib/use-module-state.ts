"use client";

import { todayKey } from "@/lib/date";
import { useLocalStorage } from "@/lib/use-local-storage";

// Exercise state is keyed by date plus module id, so a refresh keeps today's
// progress and a new day starts fresh (yesterday's keys are simply orphaned).
export function useModuleState<T>(moduleId: string, initial: T) {
  return useLocalStorage<T>(`harbor:v1:${todayKey()}:${moduleId}`, initial);
}
