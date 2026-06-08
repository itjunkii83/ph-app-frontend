"use client";

import * as React from "react";

/**
 * Placeholder for Phase 2. The real orchestrator (timing, isActive, audio,
 * onComplete, responsive container-unit sizing, StrictMode-safe GSAP) lands in
 * Phase 3, when the playback subsystem moves in from the studio. `presentation`
 * is typed `unknown` until the real Presentation type moves into this package.
 */
export interface PresentationPlayerProps {
  presentation: unknown;
  onComplete: () => void;
  className?: string;
}

export function PresentationPlayer(
  props: PresentationPlayerProps,
): React.ReactElement {
  return (
    <div
      data-harbor-player-placeholder=""
      className={props.className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
