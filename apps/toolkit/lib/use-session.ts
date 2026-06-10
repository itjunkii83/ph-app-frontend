"use client";

import { useModuleState } from "@/lib/use-module-state";

interface SessionState {
  completed: string[];
}

// The completed-today set. Date scoped like exercise inputs, so it resets on
// a fresh day while the streak and points total persist.
export function useSession() {
  const { value, setValue, hydrated } = useModuleState<SessionState>(
    "session",
    { completed: [] },
  );

  function completeStep(moduleId: string) {
    setValue((prev) =>
      prev.completed.includes(moduleId)
        ? prev
        : { completed: [...prev.completed, moduleId] },
    );
  }

  function isComplete(moduleId: string) {
    return value.completed.includes(moduleId);
  }

  return { completed: value.completed, completeStep, isComplete, hydrated };
}
