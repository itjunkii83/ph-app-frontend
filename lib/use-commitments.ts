"use client";

import { useModuleState } from "@/lib/use-module-state";

interface CommitmentsState {
  completed: string[];
}

// Which commitments are done today. Date scoped like the practice session, so
// it resets on a fresh day while the streak and points total persist.
// Commitments are toggleable: you can uncheck one you ticked by mistake.
export function useCommitments() {
  const { value, setValue, hydrated } = useModuleState<CommitmentsState>(
    "commitments",
    { completed: [] },
  );

  function toggle(moduleId: string) {
    setValue((prev) =>
      prev.completed.includes(moduleId)
        ? { completed: prev.completed.filter((id) => id !== moduleId) }
        : { completed: [...prev.completed, moduleId] },
    );
  }

  function isComplete(moduleId: string) {
    return value.completed.includes(moduleId);
  }

  return { completed: value.completed, toggle, isComplete, hydrated };
}
