"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HarborCard } from "@/components/ui/harbor-card";
import type { ModuleOf } from "@/lib/types";
import { useModuleState } from "@/lib/use-module-state";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TimedModule({ module }: { module: ModuleOf<"timed"> }) {
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
    <HarborCard title={module.title} sourceTag={module.sourceTag}>
      <p className="text-sm text-muted-foreground">{prompt}</p>
      <div className="mt-5 flex items-center justify-between gap-4">
        {value.completed ? (
          <>
            <p className="font-display text-3xl text-accent-gradient">
              {doneLabel}
            </p>
            <span className="flex size-10 items-center justify-center rounded-full border border-line text-silver">
              <Check className="size-5" />
            </span>
          </>
        ) : (
          <>
            <p className="font-display text-4xl tabular-nums leading-none text-paper">
              {formatTime(running ? remaining : durationSeconds)}
            </p>
            {running ? (
              <Button
                variant="outline"
                onClick={markDone}
                className="h-9 border-line px-4 text-paper"
              >
                {doneLabel}
              </Button>
            ) : (
              <Button
                onClick={start}
                className="h-9 px-5"
              >
                {startLabel}
              </Button>
            )}
          </>
        )}
      </div>
    </HarborCard>
  );
}
