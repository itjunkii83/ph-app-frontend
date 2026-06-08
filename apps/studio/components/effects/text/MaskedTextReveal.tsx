'use client';

import React, { useRef, useCallback } from 'react';
import { EffectProps, EffectDefinition, ConfigSchema } from '@/types/effects';
import { useEffectLifecycle } from '@/hooks/useEffectLifecycle';
import { SPEED_MULTIPLIERS, SpeedOption } from '@/lib/effects/speed';
import { useFonts } from '@/hooks/useFonts';
import { useKenBurns } from '@/hooks/useKenBurns';
import { kenBurnsConfigField, KenBurnsDirection } from '@/lib/effects/kenBurnsConfig';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

// Per-mode animation config (matching the original Osmo CodePen)
const SPLIT_CONFIG = {
  lines: { enterDuration: 0.8, enterStagger: 0.08, exitDuration: 0.6, exitStagger: 0.05 },
  words: { enterDuration: 0.6, enterStagger: 0.06, exitDuration: 0.5, exitStagger: 0.04 },
  chars: { enterDuration: 0.4, enterStagger: 0.008, exitDuration: 0.3, exitStagger: 0.006 },
};

const configSchema: ConfigSchema = {
  text: {
    type: 'string',
    label: 'Text',
    default: '',
  },
  fontFamily: {
    type: 'font',
    label: 'Font Family',
    default: 'Lato',
  },
  fontSize: {
    type: 'number',
    label: 'Font Size',
    default: 48,
    min: 12,
    max: 200,
    step: 1,
  },
  color: {
    type: 'color',
    label: 'Color',
    default: '#ffffff',
  },
  splitMode: {
    type: 'select',
    label: 'Split Mode',
    default: 'lines',
    options: [
      { label: 'Lines', value: 'lines' },
      { label: 'Words', value: 'words' },
      { label: 'Characters', value: 'chars' },
    ],
  },
  duration: {
    type: 'number',
    label: 'Hold Duration (s)',
    default: 0,
    min: 0,
    max: 30,
    step: 0.5,
  },
  speed: {
    type: 'select',
    label: 'Speed',
    default: 'medium',
    options: [
      { label: 'Slow', value: 'slow' },
      { label: 'Medium', value: 'medium' },
      { label: 'Fast', value: 'fast' },
    ],
  },
  textAlign: {
    type: 'select',
    label: 'Text Align',
    default: 'center',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' },
    ],
  },
  ...kenBurnsConfigField,
};

export function MaskedTextReveal({ config, isActive, onComplete, durationMs }: EffectProps) {
  const text = config.text || '';
  const fontFamily = config.fontFamily || 'Lato';
  const fontSize = config.fontSize ?? 48;
  const color = config.color || '#ffffff';
  const splitMode = (config.splitMode || 'lines') as 'lines' | 'words' | 'chars';
  const speed = (config.speed || 'medium') as SpeedOption;
  const textAlign = (config.textAlign || 'center') as 'left' | 'center' | 'right';
  const kenBurns = (config.kenBurns || 'none') as KenBurnsDirection;
  const holdDuration = config.duration ?? 0;

  useFonts([fontFamily]);

  const effectiveDurationMs = holdDuration > 0 ? holdDuration * 1000 : durationMs;
  const multiplier = SPEED_MULTIPLIERS[speed] ?? 1;
  const { zoomRef } = useKenBurns({ direction: kenBurns, durationMs: effectiveDurationMs, speedMultiplier: multiplier });
  const textRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef<SplitText | null>(null);

  const buildEnter = useCallback((el: HTMLElement) => {
    const textEl = textRef.current;
    if (!textEl) return gsap.to({}, { duration: 0 });

    // Clean up previous split
    if (splitRef.current) {
      splitRef.current.revert();
      splitRef.current = null;
    }

    // Always split all three levels with line-level masking.
    // mask: 'lines' wraps each line in an overflow:hidden container,
    // hiding text that is offset via yPercent until it animates into view.
    splitRef.current = new SplitText(textEl, {
      type: 'lines, words, chars',
      mask: 'lines',
      linesClass: 'split-line',
      wordsClass: 'split-word',
      charsClass: 'split-char',
    });

    // Animate whichever level the user picked
    const targets = splitRef.current[splitMode];
    if (!targets || targets.length === 0) {
      return gsap.to({}, { duration: 0 });
    }

    const { enterDuration, enterStagger } = SPLIT_CONFIG[splitMode];

    const tl = gsap.timeline();
    tl.set(el, { opacity: 1 });
    tl.fromTo(
      targets,
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: enterDuration * multiplier,
        stagger: enterStagger * multiplier,
        ease: 'power3.out',
      }
    );

    return tl;
  }, [splitMode, multiplier]);

  const buildExit = useCallback((el: HTMLElement) => {
    if (!splitRef.current) {
      return gsap.to(el, { opacity: 0, duration: 0.4 * multiplier });
    }

    const targets = splitRef.current[splitMode];
    if (!targets || targets.length === 0) {
      return gsap.to(el, { opacity: 0, duration: 0.4 * multiplier });
    }

    const { exitDuration, exitStagger } = SPLIT_CONFIG[splitMode];

    const tl = gsap.timeline();
    tl.to(targets, {
      yPercent: -110,
      duration: exitDuration * multiplier,
      stagger: exitStagger * multiplier,
      ease: 'power3.in',
    });
    tl.set(el, { opacity: 0 });

    return tl;
  }, [splitMode, multiplier]);

  const resetToIdle = useCallback((el: HTMLElement) => {
    if (splitRef.current) {
      splitRef.current.revert();
      splitRef.current = null;
    }
    gsap.set(el, { clearProps: 'opacity' });
  }, []);

  const onDispose = useCallback(() => {
    if (splitRef.current) {
      splitRef.current.revert();
      splitRef.current = null;
    }
  }, []);

  const { containerRef } = useEffectLifecycle({
    isActive,
    onComplete,
    durationMs: effectiveDurationMs,
    buildEnter,
    buildExit,
    resetToIdle,
    onDispose,
  });

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        opacity: 0,
      }}
    >
      <div
        ref={zoomRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          ...(kenBurns !== 'none' ? { willChange: 'transform' } : {}),
        }}
      >
        <div
          ref={textRef}
          style={{
            fontFamily,
            fontSize: `${fontSize}px`,
            color,
            textAlign,
            lineHeight: 1.4,
            maxWidth: '80%',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

export const maskedTextRevealDefinition: EffectDefinition = {
  id: 'masked-text-reveal',
  name: 'Masked Text Reveal',
  category: 'text',
  technology: 'html',
  contentInput: 'text',
  configSchema,
  component: MaskedTextReveal,
  duration: { type: 'auto' },
  performanceCost: 'medium',
  description: 'Text reveals line-by-line (or word/char) with a masked sliding animation',
};
