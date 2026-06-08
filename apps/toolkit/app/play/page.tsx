"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PresentationPlayer, type Presentation } from "@harbor/player";
import { uiConfig } from "@/lib/config";
import { getMotivation } from "@/lib/session";
import { getPresentation } from "@/lib/presentations";
import { useSession } from "@/lib/use-session";

// The moment: a chromeless, full-viewport takeover. The in-route Begin tap is the
// PRIMARY gesture (it doubles as the loading state) so audio starts synchronously
// inside a fresh user-activation, after the async fetch resolves. On completion we
// mark the moment step done and return to /practice, where the runner resumes on
// the next step (the StoreProvider write survives the client navigation).
type Phase = "loading" | "ready" | "playing" | "error";

export default function PlayPage() {
  const router = useRouter();
  const session = useSession();

  const moment = getMotivation(uiConfig);
  const momentId = moment?.id ?? "moment";
  const presentationId = moment?.config.presentationId;

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [phase, setPhase] = useState<Phase>(presentationId ? "loading" : "error");

  useEffect(() => {
    if (!presentationId) return;
    let cancelled = false;
    getPresentation(presentationId)
      .then((p) => {
        if (cancelled) return;
        if (p) {
          setPresentation(p);
          setPhase("ready");
        } else {
          setPhase("error");
        }
      })
      .catch(() => {
        if (!cancelled) setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, [presentationId]);

  // Mark the moment complete and return to the session. The runner's
  // firstIncomplete resume lands on the next step.
  const finish = useCallback(() => {
    session.completeStep(momentId);
    router.replace("/practice");
  }, [session, momentId, router]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black">
      {phase === "playing" && presentation ? (
        <PresentationPlayer presentation={presentation} onComplete={finish} />
      ) : phase === "error" ? (
        <div className="flex flex-col items-center gap-6 px-8 text-center">
          <p className="max-w-xs text-sm text-pewter">
            Today's moment is not ready to play.
          </p>
          <button
            type="button"
            onClick={finish}
            className="h-11 rounded-full border border-line px-7 text-sm text-paper transition-colors hover:border-ring"
          >
            Continue
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => phase === "ready" && setPhase("playing")}
          disabled={phase !== "ready"}
          aria-label={phase === "ready" ? "Begin the moment" : "Loading the moment"}
          className="flex size-28 items-center justify-center rounded-full border border-line text-sm transition disabled:cursor-default"
          style={
            phase === "ready"
              ? { background: "var(--accent-gradient)" }
              : undefined
          }
        >
          <span
            className={phase === "ready" ? "font-medium" : "text-pewter"}
            style={phase === "ready" ? { color: "#0a0b0d" } : undefined}
          >
            {phase === "ready" ? "Begin" : "..."}
          </span>
        </button>
      )}
    </div>
  );
}
