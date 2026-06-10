"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES, type Pick } from "@/components/onboarding/constants";
import { useBubblePit } from "@/components/onboarding/use-bubble-pit";
import styles from "@/components/onboarding/onboarding.module.css";

// The physics screen body: the canvas pit plus the live tray of picks. The
// canvas is driven entirely by the controller; React only renders the tray and
// reports/removes picks.
export function BubblePit({
  picks,
  onPicksChange,
}: {
  picks: Pick[];
  onPicksChange: (picks: Pick[]) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(picks.length);
  // Capture the picks once at mount to re-seed the controller's selection.
  const [initialSelection] = useState(() => picks.map((p) => p.label));

  const { deselect } = useBubblePit({
    wrapRef,
    canvasRef,
    themes: THEMES,
    initialSelection,
    onSelectionChange: onPicksChange,
  });

  // When a pick is added, scroll the tray to reveal the newest badge. On
  // removal, leave the scroll position alone so the user can drag to browse.
  useEffect(() => {
    const el = trayRef.current;
    if (el && picks.length > prevCount.current) {
      el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    }
    prevCount.current = picks.length;
  }, [picks.length]);

  return (
    <>
      <div ref={wrapRef} className={styles.pitWrap}>
        <canvas ref={canvasRef} className={styles.pit} />
      </div>
      <div ref={trayRef} className={styles.tray}>
        {picks.length === 0 ? (
          <span className={styles.trayEmpty}>
            Nothing picked yet. Tap a bubble.
          </span>
        ) : (
          picks.map((p) => (
            <span key={p.label} className={styles.tchip}>
              <span>{p.label}</span>
              <button
                type="button"
                aria-label={`Remove ${p.label}`}
                onClick={() => deselect(p.label)}
              >
                &times;
              </button>
            </span>
          ))
        )}
      </div>
    </>
  );
}
