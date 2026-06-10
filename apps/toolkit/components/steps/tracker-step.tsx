"use client";

import { Check } from "lucide-react";
import { StepShell } from "@/components/steps/step-shell";
import type { ModuleOf } from "@/lib/types";
import { useTracker } from "@/lib/use-tracker";
import { cn } from "@/lib/utils";

// The final step: the proof beat that closes the session. No stats here; the
// streak and history live on Harbor and the completion screen.
export function TrackerStep({ module }: { module: ModuleOf<"tracker"> }) {
  const { habitLabel, checkLabel, historyDays } = module.config;
  const { completedToday, toggleToday } = useTracker(module.id, historyDays);

  return (
    <StepShell
      kicker={module.sourceTag}
      title={module.title}
      subtitle="This ties today's knot. The chain only grows when you mark it."
    >
      <div className="flex flex-col items-center gap-5 py-6">
        <button
          type="button"
          aria-pressed={completedToday}
          onClick={toggleToday}
          className={cn(
            "flex size-32 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
            completedToday
              ? "border-transparent text-ink shadow-[0_0_48px_rgba(214,224,232,0.25)]"
              : "border-line bg-ink-2 text-muted-foreground hover:border-ring",
          )}
          style={
            completedToday
              ? { background: "var(--accent-gradient)" }
              : undefined
          }
        >
          <Check className="size-14" strokeWidth={2.5} />
        </button>
        <div className="text-center">
          <p className="font-display text-2xl text-paper">{habitLabel}</p>
          <p className="mt-1.5 text-sm text-muted-foreground">{checkLabel}</p>
        </div>
      </div>
    </StepShell>
  );
}
