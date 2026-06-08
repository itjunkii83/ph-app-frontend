"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompletionScreen } from "@/components/runner/completion-screen";
import {
  ConfettiBurst,
  makeConfetti,
  type ConfettiPiece,
} from "@/components/runner/confetti-burst";
import { StepRenderer } from "@/components/runner/step-renderer";
import { CURRENCY_NAME } from "@/lib/constants";
import { getReps, getSessionSteps, stepPoints } from "@/lib/session";
import type { DashboardConfig } from "@/lib/types";
import { usePoints } from "@/lib/use-points";
import { useSession } from "@/lib/use-session";

// Short lines in the harbor voice for the reward beats.
const TOAST_LINES = [
  "Logged. The water holds it.",
  "Another knot tied.",
  "Steady on. The bow stays pointed.",
  "That counts. The chain grows.",
  "Quiet progress. The kind that keeps.",
];
const FINAL_TOAST = "Day secured. The chain holds.";

type Session = ReturnType<typeof useSession>;

// Waits for the persisted session to hydrate, then mounts the runner at the
// first incomplete step (mid-session resume). A fully complete day re-runs
// from the top.
export function Runner({ config }: { config: DashboardConfig }) {
  const session = useSession();
  const steps = getSessionSteps(config);

  if (!session.hydrated) {
    return <div className="fixed inset-0 z-40 bg-ink" />;
  }

  const firstIncomplete = steps.findIndex(
    (s) => !session.completed.includes(s.id),
  );

  return (
    <RunnerSession
      config={config}
      session={session}
      initialIndex={firstIncomplete > 0 ? firstIncomplete : 0}
    />
  );
}

function RunnerSession({
  config,
  session,
  initialIndex,
}: {
  config: DashboardConfig;
  session: Session;
  initialIndex: number;
}) {
  const router = useRouter();
  const steps = getSessionSteps(config);
  const reps = getReps(steps);
  const points = usePoints();

  const [index, setIndex] = useState(initialIndex);
  const [complete, setComplete] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<ConfettiPiece[] | null>(null);
  const toastTimer = useRef(0);
  const advanceTimer = useRef(0);
  const burstSeed = useRef(0);

  const step = steps[index];
  const isRep = step.type !== "motivation";
  const repNumber = reps.findIndex((r) => r.id === step.id) + 1;

  const clearConfetti = useCallback(() => setConfetti(null), [setConfetti]);

  useEffect(
    () => () => {
      window.clearTimeout(toastTimer.current);
      window.clearTimeout(advanceTimer.current);
    },
    [],
  );

  function showToast(message: string) {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1700);
  }

  // Next always works: this is a debug prototype, navigation is never gated.
  // Completing a step awards its points once per day; re-walking a completed
  // step navigates silently.
  function advance() {
    if (advancing) return;
    const current = steps[index];
    const earned =
      current.type === "motivation" || session.isComplete(current.id)
        ? 0
        : stepPoints(current);
    session.completeStep(current.id);

    if (earned > 0) {
      points.addPoints(earned);
      const isLastStep = index + 1 >= steps.length;
      const line = isLastStep
        ? FINAL_TOAST
        : TOAST_LINES[
            reps.findIndex((r) => r.id === current.id) % TOAST_LINES.length
          ];
      showToast(`${line} +${earned} ${CURRENCY_NAME}`);
      burstSeed.current += 1;
      setConfetti(
        makeConfetti(index + 1 >= steps.length ? 40 : 16, burstSeed.current),
      );
    }

    const next = index + 1;
    setAdvancing(true);
    window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(
      () => {
        if (next >= steps.length) setComplete(true);
        else setIndex(next);
        setAdvancing(false);
      },
      earned > 0 ? 420 : 120,
    );
  }

  function goBack() {
    if (advancing) return;
    if (index === 0) {
      router.push("/");
      return;
    }
    setIndex(index - 1);
  }

  function runAgain() {
    setComplete(false);
    setIndex(0);
  }

  // Debug navigation: Enter or ArrowRight advances, ArrowLeft goes back
  // (when not typing), Escape returns to Harbor.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        router.push("/");
        return;
      }
      if (complete) return;
      const el = document.activeElement;
      const typing =
        el instanceof HTMLElement &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "BUTTON");
      if (typing) return;
      if (e.key === "Enter" || e.key === "ArrowRight") advance();
      if (e.key === "ArrowLeft") goBack();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const progress = complete
    ? 100
    : (steps.filter((s) => session.completed.includes(s.id)).length /
        steps.length) *
      100;

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-ink">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 py-6">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            aria-label="Exit practice"
            onClick={() => router.push("/")}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-ink-2 text-muted-foreground transition-colors hover:border-ring hover:text-paper"
          >
            <X className="size-4.5" />
          </button>
          <div
            className="h-2 flex-1 overflow-hidden rounded-full border border-line bg-ink-2"
            aria-label="Practice progress"
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: "var(--accent-gradient)",
              }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-xs tabular-nums text-pewter">
            {complete ? "Done" : isRep ? `${repNumber} / ${reps.length}` : ""}
          </span>
        </div>

        {/* Toast zone: the breathing room between the progress bar and the
            step title. Absolutely positioned so the step never shifts. */}
        <div className="relative h-0">
          {toast && (
            <div
              className="absolute left-1/2 top-6 z-10 w-max max-w-full rounded-full border border-line bg-ink-2 px-5 py-3 text-center text-sm text-paper shadow-[0_18px_48px_rgba(0,0,0,0.5)]"
              style={{
                animation: "toast-in 0.28s ease",
                transform: "translateX(-50%)",
              }}
            >
              {toast}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-center py-10">
          {complete ? (
            <CompletionScreen config={config} onRunAgain={runAgain} />
          ) : (
            <div key={step.id}>
              <StepRenderer module={step} />
            </div>
          )}
        </div>

        {!complete && (
          <div className="flex items-center justify-between gap-3 pb-2">
            <Button
              variant="outline"
              onClick={goBack}
              className="h-11 rounded-full border-line px-7 text-sm text-paper"
            >
              Back
            </Button>
            <Button
              onClick={advance}
              className="h-11 rounded-full px-7 text-sm font-medium"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {confetti && <ConfettiBurst pieces={confetti} onDone={clearConfetti} />}
    </div>
  );
}
