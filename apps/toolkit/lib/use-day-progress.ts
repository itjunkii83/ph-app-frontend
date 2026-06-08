"use client";

import { getCommitments, getReps, getSessionSteps } from "@/lib/session";
import type { DashboardConfig } from "@/lib/types";
import { useCommitments } from "@/lib/use-commitments";
import { useSession } from "@/lib/use-session";

// The whole day in one place: practice reps plus commitments. The percent is
// an honest fraction of everything there is to do today. dayComplete is the
// binary the streak rides on: the chain only grows when the day is 100 percent.
export function useDayProgress(config: DashboardConfig) {
  const session = useSession();
  const commitments = useCommitments();

  const reps = getReps(getSessionSteps(config));
  const commitmentModules = getCommitments(config);

  const repsDone = reps.filter((r) => session.isComplete(r.id)).length;
  const commitmentsDone = commitmentModules.filter((c) =>
    commitments.isComplete(c.id),
  ).length;

  const total = reps.length + commitmentModules.length;
  const done = repsDone + commitmentsDone;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const dayComplete = total > 0 && done === total;
  const hydrated = session.hydrated && commitments.hydrated;

  return {
    reps,
    repsDone,
    commitmentModules,
    commitmentsDone,
    total,
    done,
    percent,
    dayComplete,
    hydrated,
    session,
    commitments,
  };
}
