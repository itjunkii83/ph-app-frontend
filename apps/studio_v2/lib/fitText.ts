'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/** Binary search the largest font size that fits the text inside a box. */
export function fitText(el: HTMLElement, boxW: number, boxH: number, min: number, max: number): number {
  el.style.maxWidth = `${boxW}px`;
  el.style.whiteSpace = 'normal';
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
  const px = Math.floor(best);
  el.style.fontSize = `${px}px`;
  return px;
}

interface FitOpts {
  text: string;
  cap: number;
  min?: number;
  widthRatio?: number;
  heightRatio?: number;
}

/**
 * Auto fit a line into a container. Returns refs for the container and the
 * text, plus the computed pixel size for read outs. Re fits on text, cap,
 * and container resize. This is why nobody ever sets a font size by hand.
 */
export function useFitText({ text, cap, min = 16, widthRatio = 0.82, heightRatio = 0.5 }: FitOpts) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(cap);

  const run = useCallback(() => {
    const c = containerRef.current;
    const t = textRef.current;
    if (!c || !t || c.clientWidth === 0) return;
    const px = fitText(t, c.clientWidth * widthRatio, c.clientHeight * heightRatio, min, cap);
    setSize(px);
  }, [cap, min, widthRatio, heightRatio]);

  useLayoutEffect(() => {
    run();
  }, [text, cap, run]);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver(() => run());
    ro.observe(c);
    return () => ro.disconnect();
  }, [run]);

  return { containerRef, textRef, size };
}
