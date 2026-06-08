"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepShell } from "@/components/steps/step-shell";
import type { ModuleOf } from "@/lib/types";
import { useModuleState } from "@/lib/use-module-state";
import { cn } from "@/lib/utils";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Self-contained: Begin lives under the timer and drives the countdown. The
// runner footer (Back / Next) never gates on completion.
export function TimedStep({ module }: { module: ModuleOf<"timed"> }) {
  const { prompt, durationSeconds, startLabel, doneLabel } = module.config;
  const { value, setValue } = useModuleState<{ completed: boolean }>(
    module.id,
    { completed: false },
  );
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(durationSeconds);
  const endAtRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const left = Math.max(
        0,
        Math.ceil((endAtRef.current - Date.now()) / 1000),
      );
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        setValue({ completed: true });
      }
    }, 250);
    return () => window.clearInterval(id);
    // setValue from useState is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function start() {
    endAtRef.current = Date.now() + durationSeconds * 1000;
    setRemaining(durationSeconds);
    setRunning(true);
  }

  function markDone() {
    setRunning(false);
    setValue({ completed: true });
  }

  return (
    <StepShell
      kicker={module.sourceTag}
      title={module.title}
      subtitle={prompt}
    >
      <div className="flex flex-col items-center gap-5 py-6">
        <div
          className={cn(
            "flex size-44 items-center justify-center rounded-full border transition-all duration-500",
            running
              ? "border-silver/40 shadow-[0_0_60px_rgba(214,224,232,0.12)]"
              : "border-line bg-ink-2",
            value.completed && "border-transparent",
          )}
          style={
            value.completed
              ? { background: "var(--accent-gradient)" }
              : undefined
          }
        >
          {value.completed ? (
            <Check className="size-12 text-ink" strokeWidth={2.5} />
          ) : (
            <span className="font-display text-5xl tabular-nums text-paper">
              {formatTime(remaining)}
            </span>
          )}
        </div>
        {value.completed ? (
          <p className="text-sm text-muted-foreground">Complete for today.</p>
        ) : running ? (
          <Button
            variant="outline"
            onClick={markDone}
            className="h-10 rounded-full border-line px-6 text-paper"
          >
            {doneLabel}
          </Button>
        ) : (
          <Button onClick={start} className="h-10 rounded-full px-6">
            {startLabel}
          </Button>
        )}
      </div>
    </StepShell>
  );
}
