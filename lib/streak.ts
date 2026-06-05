import { addDays } from "@/lib/date";

export type Completions = Record<string, true>;

// Walk back from today (or yesterday, if today is not checked yet) counting
// consecutive completed days. A missing day breaks the walk, so a skipped day
// resets the run on its own. Yesterday's run stays visible in the morning
// until a real gap exists.
export function computeStreak(completions: Completions, today: string): number {
  let cursor = completions[today] ? today : addDays(today, -1);
  let count = 0;
  while (completions[cursor]) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}
