'use client';

import React, { useCallback } from 'react';
import { EffectProps, EffectDefinition, ConfigSchema } from '../../../types/effects';
import { useEffectLifecycle } from '../../../hooks/useEffectLifecycle';
import { SPEED_MULTIPLIERS, SpeedOption } from '../../../lib/effects/speed';
import { useFonts } from '../../../hooks/useFonts';
import { useBaseCanvas } from '../../../lib/responsive';
import { useFitToBox } from '../../../hooks/useFitToBox';
import { Attribution } from './Attribution';
import gsap from 'gsap';

// A fast, hard scale-in cut (ported from the prototype's fxCut). The line snaps
// in with stepped easing, holds, then cuts out. The whole line animates as a
// unit (no SplitText).

const configSchema: ConfigSchema = {
  text: { type: 'string', label: 'Text', default: '' },
  fontFamily: { type: 'font', label: 'Font Family', default: 'Archivo' },
  fontSize: { type: 'number', label: 'Font Size (max)', default: 64, min: 12, max: 200, step: 1 },
  color: { type: 'color', label: 'Color', default: '#ffffff' },
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
  duration: { type: 'number', label: 'Hold Duration (s)', default: 0, min: 0, max: 30, step: 0.5 },
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
  fitToBox: { type: 'boolean', label: 'Fit to box', default: false },
  minFontSize: { type: 'number', label: 'Min Font Size', default: 18, min: 8, max: 120, step: 1 },
  attribution: { type: 'string', label: 'Attribution', default: '' },
};

export function HardCut({ config, isActive, onComplete, durationMs }: EffectProps) {
  const base = useBaseCanvas();
  const text = config.text || '';
  const fontFamily = config.fontFamily || 'Archivo';
  const fontSize = config.fontSize ?? 64;
  const color = config.color || '#ffffff';
  const textAlign = (config.textAlign || 'center') as 'left' | 'center' | 'right';
  const speed = (config.speed || 'medium') as SpeedOption;
  const holdDuration = config.duration ?? 0;
  const fitToBox = config.fitToBox ?? false;
  const minFontSize = config.minFontSize ?? 18;
  const attribution = config.attribution || '';

  useFonts([fontFamily]);

  const effectiveDurationMs = holdDuration > 0 ? holdDuration * 1000 : durationMs;
  const multiplier = SPEED_MULTIPLIERS[speed] ?? 1;

  const { textRef, fit } = useFitToBox({
    enabled: fitToBox,
    text,
    maxFontSize: fontSize,
    minFontSize,
    base,
    frozen: isActive,
    deps: [fontFamily],
  });

  const buildEnter = useCallback((el: HTMLElement) => {
    fit();
    const tl = gsap.timeline();
    tl.set(el, { opacity: 1 });
    tl.fromTo(
      textRef.current,
      { opacity: 0, scale: 1.1 },
      { opacity: 1, scale: 1, duration: 0.34 * multiplier, ease: 'steps(2)' },
    );
    return tl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiplier, fit]);

  const buildExit = useCallback((el: HTMLElement) => {
    return gsap.to(el, { opacity: 0, duration: 0.2 * multiplier, ease: 'steps(2)' });
  }, [multiplier]);

  const resetToIdle = useCallback((el: HTMLElement) => {
    gsap.set(el, { clearProps: 'opacity' });
    if (textRef.current) gsap.set(textRef.current, { clearProps: 'opacity,transform' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { containerRef } = useEffectLifecycle({
    isActive,
    onComplete,
    durationMs: effectiveDurationMs,
    buildEnter,
    buildExit,
    resetToIdle,
  });

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', opacity: 0 }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          ref={textRef}
          style={{
            fontFamily,
            fontWeight: 600,
            color,
            textAlign,
            lineHeight: 1.12,
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

export const hardCutDefinition: EffectDefinition = {
  id: 'hard-cut',
  name: 'Hard Cut',
  category: 'text',
  technology: 'html',
  contentInput: 'text',
  configSchema,
  component: HardCut,
  duration: { type: 'auto' },
  performanceCost: 'low',
  selfCompletes: true,
  description: 'A fast, stepped scale-in cut for a single punchy line',
};
