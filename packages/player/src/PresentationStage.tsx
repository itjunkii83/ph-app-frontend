"use client";

import * as React from "react";
import { BaseCanvas, DEFAULT_BASE, SizingContext } from "./lib/responsive";

export interface PresentationStageProps {
  baseWidth?: number;
  baseHeight?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * The playback surface. Establishes a container-query context
 * (`container-type: size`) so descendant effects size themselves in cqi/cqb/cqmin
 * relative to THIS box, and provides the base-canvas dimensions used to interpret
 * authored px as proportions. Fills whatever box it is given (full viewport on
 * /play, a boxed preview in the studio); never forces, locks, or prompts
 * orientation, and renders with no black bars in any orientation.
 */
export function PresentationStage({
  baseWidth,
  baseHeight,
  className,
  style,
  children,
}: PresentationStageProps) {
  const value = React.useMemo<BaseCanvas>(
    () => ({
      baseWidth: baseWidth || DEFAULT_BASE.baseWidth,
      baseHeight: baseHeight || DEFAULT_BASE.baseHeight,
    }),
    [baseWidth, baseHeight],
  );

  return (
    <SizingContext.Provider value={value}>
      <div
        className={className}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "#000",
          containerType: "size",
          ...style,
        }}
      >
        {children}
      </div>
    </SizingContext.Provider>
  );
}
