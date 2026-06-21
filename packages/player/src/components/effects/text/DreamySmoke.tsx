'use client';

import React, { useRef, useCallback } from 'react';
import { EffectProps, EffectDefinition, ConfigSchema } from '../../../types/effects';
import { useEffectLifecycle } from '../../../hooks/useEffectLifecycle';
import { SPEED_MULTIPLIERS, SpeedOption } from '../../../lib/effects/speed';
import { useFonts } from '../../../hooks/useFonts';
import { useKenBurns } from '../../../hooks/useKenBurns';
import { kenBurnsConfigField, KenBurnsDirection } from '../../../lib/effects/kenBurnsConfig';
import { useBaseCanvas } from '../../../lib/responsive';
import { useFitToBox } from '../../../hooks/useFitToBox';
import { Attribution } from './Attribution';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const configSchema: ConfigSchema = {
  text: {
    type: 'string',
    label: 'Text',
    default: '',
  },
  fontFamily: {
    type: 'font',
    label: 'Font Family',
    default: 'Playfair Display',
  },
  fontSize: {
    type: 'number',
    label: 'Font Size',
    default: 64,
    min: 12,
    max: 200,
    step: 1,
  },
  fontWeight: {
    type: 'select',
    label: 'Font Weight',
    default: '700',
    options: [
      { label: '300', value: '300' },
      { label: '400', value: '400' },
      { label: '500', value: '500' },
      { label: '600', value: '600' },
      { label: '700', value: '700' },
      { label: '800', value: '800' },
    ],
  },
  fontStyle: {
    type: 'select',
    label: 'Font Style',
    default: 'italic',
    options: [
      { label: 'Normal', value: 'normal' },
      { label: 'Italic', value: 'italic' },
    ],
  },
  color: {
    type: 'color',
    label: 'Color',
    default: '#f5f5f5',
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
  // When on, Font Size is treated as a maximum and a long line shrinks to fit.
  fitToBox: {
    type: 'boolean',
    label: 'Fit to box',
    default: false,
  },
  minFontSize: {
    type: 'number',
    label: 'Min Font Size',
    default: 16,
    min: 8,
    max: 120,
    step: 1,
  },
  attribution: {
    type: 'string',
    label: 'Attribution',
    default: '',
  },
  ...kenBurnsConfigField,
};

export function DreamySmoke({ config, isActive, onComplete, durationMs }: EffectProps) {
  const base = useBaseCanvas();
  const text = config.text || '';
  const fontFamily = config.fontFamily || 'Playfair Display';
  const fontSize = config.fontSize ?? 64;
  const fontWeight = config.fontWeight || '700';
  const fontStyle = (config.fontStyle || 'italic') as 'normal' | 'italic';
  const color = config.color || '#f5f5f5';
  const speed = (config.speed || 'medium') as SpeedOption;
  const textAlign = (config.textAlign || 'center') as 'left' | 'center' | 'right';
  const kenBurns = (config.kenBurns || 'none') as KenBurnsDirection;

  const holdDuration = config.duration ?? 0;
  const fitToBox = config.fitToBox ?? false;
  const minFontSize = config.minFontSize ?? 16;
  const attribution = config.attribution || '';

  useFonts([fontFamily]);

  // If user set a hold duration, use it; otherwise fall back to auto-calculated durationMs
  const effectiveDurationMs = holdDuration > 0 ? holdDuration * 1000 : durationMs;

  const multiplier = SPEED_MULTIPLIERS[speed] ?? 1;
  const { zoomRef } = useKenBurns({ direction: kenBurns, durationMs: effectiveDurationMs, speedMultiplier: multiplier });
  // The hook owns the text element ref and drives font-size imperatively, so the
  // fit settles before SplitText captures line breaks. fontSize is not in style.
  const { textRef, fit } = useFitToBox({
    enabled: fitToBox,
    text,
    maxFontSize: fontSize,
    minFontSize,
    base,
    frozen: isActive,
    deps: [fontFamily, fontWeight, fontStyle],
  });
  const splitRef = useRef<SplitText | null>(null);

  const glowColor = hexToRgba(color, 0.5);

  const buildEnter = useCallback((el: HTMLElement) => {
    const textEl = textRef.current;
    if (!textEl) return gsap.to({}, { duration: 0 });

    // Settle the fit-to-box size BEFORE splitting so the split sees the final size.
    fit();

    // Split into chars upfront so the layout is settled before anything is visible.
    // This prevents the text reflow/shift that would happen if we split at exit time.
    if (splitRef.current) {
      splitRef.current.revert();
      splitRef.current = null;
    }
    splitRef.current = new SplitText(textEl, {
      type: 'words,chars',
      charsClass: 'smoke-char',
      wordsClass: 'smoke-word',
    });

    const tl = gsap.timeline();
    tl.set(el, { opacity: 1 });
    tl.fromTo(
      textEl,
      {
        opacity: 0,
        y: 20,
        filter: 'blur(8px)',
      },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0.5px)',
        textShadow: `0 0 2cqmin ${glowColor}`,
        duration: 0.8 * multiplier,
        ease: 'power2.out',
      }
    );

    return tl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiplier, glowColor, fit]);

  const buildExit = useCallback((el: HTMLElement) => {
    const chars = splitRef.current?.chars;
    if (!chars || chars.length === 0) {
      return gsap.to(el, { opacity: 0, duration: 0.4 * multiplier });
    }

    const tl = gsap.timeline();
    tl.to(chars, {
      rotation: 15,
      x: '85%',
      y: '-75%',
      skewX: -30,
      scale: 2,
      opacity: 0,
      filter: 'blur(10px)',
      duration: 1.2 * multiplier,
      stagger: {
        each: 0.06 * multiplier,
        from: 'random',
      },
      ease: 'power1.in',
    });
    tl.set(el, { opacity: 0 });

    return tl;
  }, [multiplier]);

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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          ...(kenBurns !== 'none' ? { willChange: 'transform' } : {}),
        }}
      >
        <div
          ref={textRef}
          style={{
            fontFamily,
            fontWeight,
            fontStyle,
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
        <Attribution text={attribution} color={color} />
      </div>
    </div>
  );
}

export const dreamySmokeDefinition: EffectDefinition = {
  id: 'dreamy-smoke',
  name: 'Dreamy Smoke',
  category: 'text',
  technology: 'html',
  contentInput: 'text',
  configSchema,
  component: DreamySmoke,
  duration: { type: 'auto' },
  performanceCost: 'medium',
  selfCompletes: true,
  description: 'Text fades in with a soft blur glow, then each character smokes away in random order',
};
