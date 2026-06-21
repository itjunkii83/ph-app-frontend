'use client';

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { BaseCanvas, DEFAULT_BASE, cqFontSize } from '../lib/responsive';

// Content fitting (shrink-to-fit) for text effects. The authored size (the cap)
// is an absolute MAXIMUM: a binary search finds the largest size at or below it
// that fits the actual rendered box, with a legibility floor. So a short line
// renders near the cap and fills its box, and a long line shrinks to fit. Ported
// from the studio prototype's `fitText`. This is content fitting, not the
// responsive base-canvas scaling in `cqFontSize` (used only when fit is off).
//
// The hook drives the text element's font-size imperatively rather than through a
// style prop, so a SplitText effect can call `fit()` immediately before it splits
// and capture line breaks at the final size. The consuming effect must NOT set
// `fontSize` in its style (the hook owns it).

/** Binary search the largest font size (px) whose text fits the given box. */
function searchFontSize(
  el: HTMLElement,
  boxW: number,
  boxH: number,
  min: number,
  max: number,
): number {
  let lo = min;
  let hi = max;
  let best = min;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    el.style.fontSize = `${mid}px`;
    if (el.scrollWidth <= Math.ceil(boxW) + 1 && el.scrollHeight <= Math.ceil(boxH) + 1) {
      best = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return Math.floor(best);
}

export interface UseFitToBoxOptions {
  // When false, the hook applies the responsive `cqFontSize` value and does not
  // measure, so non-fitting consumers behave exactly as before.
  enabled: boolean;
  // The text being fit. A change re-fits.
  text: string;
  // The authored size in base-canvas px (the pairing cap). This is the ceiling.
  maxFontSize: number;
  // Floor in base-canvas px so a very long line stays legible (default 16).
  minFontSize?: number;
  // Base canvas, to scale the ceiling/floor to the actual container the way
  // cqFontSize does (a ratio of base height applied to the box's smaller axis).
  base?: BaseCanvas;
  // Fractions of the measured box to fit within. Default 0.8 wide / 0.9 tall, to
  // match the text effects' 80% maxWidth with vertical breathing room.
  widthRatio?: number;
  heightRatio?: number;
  // Extra inputs that should re-fit (e.g. fontFamily, fontWeight).
  deps?: unknown[];
  // Suppress resize-driven re-fits (for example, while an animation is mid-flight
  // so a re-fit does not invalidate a settled SplitText). Text/deps changes still
  // fit via the layout effect; only the ResizeObserver is gated.
  frozen?: boolean;
}

export interface UseFitToBoxResult {
  // Attach to the text element being sized.
  textRef: React.RefObject<HTMLDivElement | null>;
  // Imperative: measure and apply the font-size now. Call before a SplitText
  // split so the split sees the final size.
  fit: () => void;
}

export function useFitToBox(opts: UseFitToBoxOptions): UseFitToBoxResult {
  const {
    enabled,
    text,
    maxFontSize,
    minFontSize = 16,
    base = DEFAULT_BASE,
    widthRatio = 0.82,
    heightRatio = 0.72,
    deps = [],
    frozen = false,
  } = opts;

  const textRef = useRef<HTMLDivElement | null>(null);

  const fit = useCallback(() => {
    const el = textRef.current;
    if (!el) return;

    if (!enabled) {
      // Match the previous behavior: responsive scaling, no content fitting.
      el.style.fontSize = cqFontSize(maxFontSize, base);
      return;
    }

    const box = el.parentElement;
    if (!box) return;
    const boxW = box.clientWidth;
    const boxH = box.clientHeight;
    if (boxW === 0 || boxH === 0) return;

    // The cap is an absolute max in px: short lines fill the box up to it, long
    // lines shrink to fit. Do NOT pre-scale by the base canvas (that made the cap
    // collapse to a few px inside a small preview box).
    const maxPx = maxFontSize;
    const minPx = Math.max(8, Math.min(minFontSize, maxFontSize));

    // Measure with the same wrapping the final render uses, then restore the
    // inline styles we touched (font-size we keep; it is what we are setting).
    const prevMaxWidth = el.style.maxWidth;
    const prevWhiteSpace = el.style.whiteSpace;
    el.style.maxWidth = `${boxW * widthRatio}px`;
    el.style.whiteSpace = 'normal';
    const px = searchFontSize(
      el,
      boxW * widthRatio,
      boxH * heightRatio,
      minPx,
      Math.max(minPx, maxPx),
    );
    el.style.maxWidth = prevMaxWidth;
    el.style.whiteSpace = prevWhiteSpace;
    el.style.fontSize = `${px}px`;
  }, [enabled, maxFontSize, minFontSize, base, widthRatio, heightRatio]);

  // Fit before paint on mount and whenever text or declared deps change.
  useLayoutEffect(() => {
    fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fit, text, ...deps]);

  // Re-fit on container resize, unless frozen (mid-animation).
  useEffect(() => {
    if (frozen) return;
    const box = textRef.current?.parentElement;
    if (!box) return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(box);
    return () => ro.disconnect();
  }, [fit, frozen]);

  return { textRef, fit };
}
