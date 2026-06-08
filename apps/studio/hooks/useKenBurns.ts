'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { KenBurnsDirection } from '@/lib/effects/kenBurnsConfig';

interface UseKenBurnsOptions {
  direction: KenBurnsDirection;
  durationMs?: number;
  speedMultiplier?: number;
}

const SCALE_RANGE = 0.12; // 12% zoom

export function useKenBurns({ direction, durationMs, speedMultiplier = 1 }: UseKenBurnsOptions) {
  const zoomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = zoomRef.current;
    if (!el || direction === 'none') return;

    const fromScale = direction === 'in' ? 1.0 : 1.0 + SCALE_RANGE;
    const toScale = direction === 'in' ? 1.0 + SCALE_RANGE : 1.0;

    let tween: gsap.core.Tween;

    if (durationMs && durationMs > 0) {
      // Finite: cover active hold + enter/exit budget
      const totalDuration = (durationMs / 1000) + (2.5 * speedMultiplier);
      tween = gsap.fromTo(
        el,
        { scale: fromScale },
        { scale: toScale, duration: totalDuration, ease: 'none' }
      );
    } else {
      // Indefinite: breathing yoyo
      tween = gsap.fromTo(
        el,
        { scale: fromScale },
        { scale: toScale, duration: 15, ease: 'none', yoyo: true, repeat: -1 }
      );
    }

    return () => {
      tween.kill();
      gsap.set(el, { clearProps: 'scale' });
    };
  }, [direction, durationMs, speedMultiplier]);

  return { zoomRef };
}
