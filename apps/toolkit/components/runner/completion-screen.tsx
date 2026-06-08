"use client";

import Link from "next/link";
import { Anchor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CURRENCY_NAME } from "@/lib/constants";
import { getStructured } from "@/lib/session";
import type { DashboardConfig, StructuredField } from "@/lib/types";
import { useDayProgress } from "@/lib/use-day-progress";
import { useDayStreak } from "@/lib/use-day-streak";
import { useModuleState } from "@/lib/use-module-state";
import { usePoints } from "@/lib/use-points";

function buildActionSentence(
  fields: StructuredField[],
  values: Record<string, string>,
): string | null {
  const parts = fields
    .filter((f) => (values[f.key] ?? "").trim() !== "")
    .map((f) => `${f.label} ${values[f.key].trim()}`);
  if (parts.length === 0) return null;
  return `${parts.join(" ")}.`;
}

export function CompletionScreen({
  config,
  onRunAgain,
}: {
  config: DashboardConfig;
  onRunAgain: () => void;
}) {
  const structured = getStructured(config);
  const progress = useDayProgress(config);
  const { commitmentModules, commitmentsDone, dayComplete } = progress;
  const { streak } = useDayStreak(dayComplete, progress.hydrated);
  const { earnedToday } = usePoints();
  const { value: structuredValues } = useModuleState<Record<string, string>>(
    structured?.id ?? "structured",
    {},
  );

  const sentence = structured
    ? buildActionSentence(structured.config.fields, structuredValues)
    : null;

  const commitmentsLeft = commitmentModules.length - commitmentsDone;
  const body =
    commitmentsLeft > 0
      ? "You are primed and the plan is set. The day is not done until your commitments are."
      : "Primed, planned, and every commitment kept. The chain holds.";

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="flex size-24 items-center justify-center rounded-full shadow-[0_0_56px_rgba(214,224,232,0.25)]"
        style={{ background: "var(--accent-gradient)" }}
      >
        <Anchor className="size-11 text-ink" strokeWidth={2.25} />
      </div>
      <h2 className="text-accent-gradient mt-7 font-display text-4xl">
        Practice complete.
      </h2>
      <p className="mt-3 max-w-sm text-base leading-relaxed text-muted-foreground">
        {body}
      </p>

      <div className="mt-8 grid w-full grid-cols-3 gap-3">
        <div className="rounded-2xl border border-line bg-panel p-4 text-left">
          <p className="font-display text-2xl text-paper">+{earnedToday}</p>
          <p className="mt-1 text-xs text-muted-foreground">{CURRENCY_NAME}</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4 text-left">
          <p className="font-display text-2xl text-paper">{streak}</p>
          <p className="mt-1 text-xs text-muted-foreground">day streak</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4 text-left">
          <p className="font-display text-2xl text-paper">{commitmentsLeft}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {commitmentsLeft === 1 ? "commitment left" : "commitments left"}
          </p>
        </div>
      </div>

      {sentence && (
        <div className="relative mt-4 w-full overflow-hidden rounded-2xl border border-line bg-panel p-5 text-left">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{ background: "var(--accent-gradient)" }}
          />
          <p className="text-[11px] uppercase tracking-[0.14em] text-pewter">
            Your move today
          </p>
          <p className="mt-2 font-display text-lg leading-snug text-silver">
            {sentence}
          </p>
        </div>
      )}

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild className="h-11 rounded-full px-6">
          <Link href="/">
            {commitmentsLeft > 0 ? "Go to your commitments" : "Return to Harbor"}
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={onRunAgain}
          className="h-11 rounded-full border-line px-6 text-paper"
        >
          Run it again
        </Button>
      </div>
    </div>
  );
}
