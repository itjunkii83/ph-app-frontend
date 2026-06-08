"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STORM_GRADIENTS } from "@/components/steps/motivation-step";
import type { ModuleOf } from "@/lib/types";
import { cn } from "@/lib/utils";

// When MOMENT_AS_STEP_ZERO is false, the moment lives on Harbor as a play
// card instead of opening the session.
export function MomentCard({ module }: { module: ModuleOf<"motivation"> }) {
  const { mood, quote, attribution, ctaLabel } = module.config;
  const [pulse, setPulse] = useState(0);
  const timerRef = useRef(0);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  function playHype() {
    window.clearTimeout(timerRef.current);
    setPulse((p) => p + 1);
    timerRef.current = window.setTimeout(() => setPulse(0), 1700);
  }

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-line"
      style={{ background: STORM_GRADIENTS[mood] ?? STORM_GRADIENTS.calm }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: "var(--accent-gradient)" }}
      />
      {pulse > 0 && (
        <div
          key={pulse}
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          style={{ animation: "hero-sheen 1.6s ease" }}
        />
      )}
      <div className="relative p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg text-paper">{module.title}</h2>
          <span className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-pewter">
            {module.sourceTag}
          </span>
        </div>
        <blockquote
          className={cn(
            "mt-5 font-display text-2xl leading-snug text-paper",
            mood === "intense" && "[text-shadow:0_1px_28px_rgba(0,0,0,0.55)]",
            pulse > 0 && "animate-pulse",
          )}
        >
          {quote}
        </blockquote>
        <p className="mt-3 text-xs text-pewter">{attribution}</p>
        <Button
          variant="outline"
          onClick={playHype}
          className="mt-6 h-10 gap-2 border-line bg-white/5 px-4 text-paper hover:bg-white/10 hover:text-paper dark:bg-white/5 dark:hover:bg-white/10"
        >
          <Play className="size-4" />
          {ctaLabel}
        </Button>
      </div>
    </section>
  );
}
