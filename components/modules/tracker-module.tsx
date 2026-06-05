"use client";

import { Check } from "lucide-react";
import { HarborCard } from "@/components/ui/harbor-card";
import type { ModuleOf } from "@/lib/types";
import { weekdayLetter } from "@/lib/date";
import { useTracker } from "@/lib/use-tracker";
import { cn } from "@/lib/utils";

export function TrackerModule({ module }: { module: ModuleOf<"tracker"> }) {
  const { habitLabel, checkLabel, historyDays } = module.config;
  const { completedToday, streak, history, toggleToday, hydrated } = useTracker(
    module.id,
    historyDays,
  );

  return (
    <HarborCard title={module.title} sourceTag={module.sourceTag} accentBar>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-pressed={completedToday}
          onClick={toggleToday}
          className={cn(
            "flex size-16 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
            completedToday
              ? "border-transparent text-ink shadow-[0_0_28px_rgba(214,224,232,0.22)]"
              : "border-line bg-ink-2 text-muted-foreground hover:border-ring",
          )}
          style={
            completedToday
              ? { background: "var(--accent-gradient)" }
              : undefined
          }
        >
          <Check className="size-7" strokeWidth={2.5} />
        </button>
        <div>
          <p className="font-display text-xl text-paper">{habitLabel}</p>
          <p className="mt-1 text-sm text-muted-foreground">{checkLabel}</p>
        </div>
      </div>

      <div
        className={cn(
          "mt-5 flex items-end justify-between border-t border-line pt-4 transition-opacity duration-300",
          hydrated ? "opacity-100" : "opacity-0",
        )}
      >
        <div>
          <p
            className={cn(
              "font-display text-4xl leading-none",
              streak > 0 ? "text-accent-gradient" : "text-muted-foreground",
            )}
          >
            {streak}
          </p>
          <p className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-pewter">
            day streak
          </p>
        </div>
        <div className="flex items-end gap-2">
          {history.map((day, i) => {
            const isToday = i === history.length - 1;
            return (
              <div key={day.date} className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "size-3.5 rounded-full border",
                    day.done
                      ? "border-transparent"
                      : "border-line bg-ink-2",
                    isToday && !day.done && "border-pewter",
                  )}
                  style={
                    day.done
                      ? { background: "var(--accent-gradient)" }
                      : undefined
                  }
                />
                <span className="text-[10px] text-muted-foreground">
                  {weekdayLetter(day.date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </HarborCard>
  );
}
