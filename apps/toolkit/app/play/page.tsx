"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PresentationPlayer,
  preloadPresentationMedia,
  type Presentation,
} from "@harbor/player";
import { uiConfig } from "@/lib/config";
import { getMotivation } from "@/lib/session";
import { getPresentation, getLatestPresentation } from "@/lib/presentations";
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
  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState<{ loaded: number; total: number }>({
    loaded: 0,
    total: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Pinned id wins; otherwise fall back to the latest studio presentation.
        const p = presentationId
          ? await getPresentation(presentationId)
          : await getLatestPresentation();
        if (cancelled) return;
        if (!p) {
          console.warn(
            `[/play] no presentation found (${
              presentationId
                ? `id: ${presentationId}`
                : "no presentationId set; looked for the latest in the presentations collection"
            })`,
          );
          setPhase("error");
          return;
        }
        // Buffer all media (images + audio) before enabling Begin, so the moment
        // plays instantly with no black-frame pop-in between slides.
        await preloadPresentationMedia(p, (loaded, total) => {
          if (!cancelled) setProgress({ loaded, total });
        });
        if (cancelled) return;
        setPresentation(p);
        setPhase("ready");
      } catch (err) {
        if (cancelled) return;
        // Most commonly a Firestore permission error: the `presentations` read
        // rule in firestore.rules has not been deployed to the project yet.
        console.error("[/play] failed to load presentation:", err);
        setPhase("error");
      }
    })();
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
            {"Today's moment is not ready to play."}
          </p>
          <button
            type="button"
            onClick={finish}
            className="h-11 rounded-full border border-line px-7 text-sm text-paper transition-colors hover:border-ring"
          >
            Continue
          </button>
        </div>
      ) : phase === "ready" ? (
        <button
          type="button"
          onClick={() => setPhase("playing")}
          aria-label="Begin the moment"
          className="flex size-28 items-center justify-center rounded-full border border-line text-sm font-medium transition"
          style={{ background: "var(--accent-gradient)", color: "#0a0b0d" }}
        >
          Begin
        </button>
      ) : (
        <div className="flex w-64 max-w-[80vw] flex-col items-center gap-3">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full border border-line bg-ink-2"
            role="progressbar"
            aria-label="Buffering the moment"
            aria-valuemin={0}
            aria-valuemax={progress.total || 1}
            aria-valuenow={progress.loaded}
          >
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${
                  progress.total > 0
                    ? (progress.loaded / progress.total) * 100
                    : 8
                }%`,
                background: "var(--accent-gradient)",
              }}
            />
          </div>
          <p className="text-xs tabular-nums text-pewter">
            {progress.total > 0
              ? `Loading ${progress.loaded} / ${progress.total}`
              : "Loading..."}
          </p>
        </div>
      )}
    </div>
  );
}
