'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';

export type LifecyclePhase = 'idle' | 'enter' | 'active' | 'exit' | 'complete';

interface UseEffectLifecycleOptions {
  isActive: boolean;
  onComplete?: () => void;
  durationMs?: number;
  buildEnter?: (el: HTMLElement) => gsap.core.Timeline | gsap.core.Tween;
  buildActive?: (el: HTMLElement, durationSec: number) => gsap.core.Timeline | gsap.core.Tween;
  buildExit?: (el: HTMLElement) => gsap.core.Timeline | gsap.core.Tween;
  resetToIdle?: (el: HTMLElement) => void;
  onDispose?: () => void;
}

export function useEffectLifecycle({
  isActive,
  onComplete,
  durationMs,
  buildEnter,
  buildActive,
  buildExit,
  resetToIdle,
  onDispose,
}: UseEffectLifecycleOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<LifecyclePhase>('idle');

  const tweensRef = useRef<(gsap.core.Timeline | gsap.core.Tween)[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const killAll = useCallback(() => {
    for (const tw of tweensRef.current) {
      tw.kill();
    }
    tweensRef.current = [];
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (!isActive) {
      // Trigger exit if currently in enter or active
      if (phase === 'enter' || phase === 'active') {
        killAll();

        if (buildExit) {
          setPhase('exit');
          const exitTw = buildExit(el);
          tweensRef.current.push(exitTw);
          exitTw.eventCallback('onComplete', () => {
            setPhase('complete');
            resetToIdle?.(el);
            onComplete?.();
          });
        } else {
          setPhase('complete');
          resetToIdle?.(el);
          onComplete?.();
        }
      }
      return;
    }

    // isActive === true: start enter -> active -> (wait durationMs)
    killAll();
    setPhase('idle');

    // Reset element before starting
    resetToIdle?.(el);

    const runEnter = () => {
      if (buildEnter) {
        setPhase('enter');
        const enterTw = buildEnter(el);
        tweensRef.current.push(enterTw);
        enterTw.eventCallback('onComplete', () => {
          runActive();
        });
      } else {
        runActive();
      }
    };

    const runActive = () => {
      setPhase('active');
      const durationSec = durationMs ? durationMs / 1000 : 0;

      if (buildActive) {
        const activeTw = buildActive(el, durationSec);
        tweensRef.current.push(activeTw);
        // If there's no duration, the active tween runs indefinitely (ambient)
        // If there IS duration, the active tween handles its own timing
      } else if (durationMs && durationMs > 0) {
        // Wait for reading/hold duration, then auto-trigger exit
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          if (!containerRef.current) return;

          if (buildExit) {
            setPhase('exit');
            const exitTw = buildExit(containerRef.current);
            tweensRef.current.push(exitTw);
            exitTw.eventCallback('onComplete', () => {
              setPhase('complete');
              resetToIdle?.(containerRef.current!);
              onComplete?.();
            });
          } else {
            setPhase('complete');
            resetToIdle?.(containerRef.current);
            onComplete?.();
          }
        }, durationMs);
      }
    };

    runEnter();

    return () => {
      killAll();
    };
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      killAll();
      onDispose?.();
    };
  }, []);

  return { containerRef, phase };
}
