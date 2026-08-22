'use client';

import React, { useEffect, useRef } from 'react';
import { EffectProps, EffectDefinition, ConfigSchema } from '../../../types/effects';
import { SPEED_MULTIPLIERS, SpeedOption } from '../../../lib/effects/speed';

// A trusted CSS background layer. The `background` value is any valid CSS
// `background` shorthand (gradients, layered gradients, solid colors). It is
// authored in the studio (a trusted surface), so the raw string is written
// straight into the style.
//
// `motion` adds slow, ambient life so a gradient backdrop does not sit dead
// still behind text. It is driven by a requestAnimationFrame loop (the exact
// mechanism the WebGL effects use, the one path proven to run in every preview),
// writing transform / filter onto the element each frame. The loop only touches
// transform/filter; the `background` string stays React-managed, so editing the
// gradient updates colors live without disturbing the motion.
//
// The amplitudes are large on purpose: the seeded radial glows are authored at
// ~900px inside a small card, so a tiny pan is invisible. A real zoom and
// brightness swing reads at any size.

const DEFAULT_BG = 'linear-gradient(180deg,#1b232c 0%,#0e141a 60%,#0a0e13 100%)';

const configSchema: ConfigSchema = {
  background: {
    type: 'string',
    label: 'CSS Background',
    default: DEFAULT_BG,
  },
  motion: {
    type: 'select',
    label: 'Motion',
    default: 'drift',
    options: [
      { label: 'None', value: 'none' },
      { label: 'Drift', value: 'drift' },
      { label: 'Breathe', value: 'breathe' },
      { label: 'Glow', value: 'glow' },
    ],
  },
  speed: {
    type: 'select',
    label: 'Motion Speed',
    default: 'slow',
    options: [
      { label: 'Slow', value: 'slow' },
      { label: 'Medium', value: 'medium' },
      { label: 'Fast', value: 'fast' },
    ],
  },
};

type Motion = 'none' | 'drift' | 'breathe' | 'glow';

// Seconds for one full cycle (before the speed multiplier).
const BASE_PERIOD: Record<Exclude<Motion, 'none'>, number> = {
  drift: 14,
  breathe: 10,
  glow: 9,
};

const TWO_PI = Math.PI * 2;

export function GradientBackground({ config }: EffectProps) {
  const background = config.background || DEFAULT_BG;
  const motion = (config.motion ?? 'drift') as Motion;
  const speed = (config.speed ?? 'slow') as SpeedOption;
  const multiplier = SPEED_MULTIPLIERS[speed] ?? SPEED_MULTIPLIERS.slow;

  const ref = useRef<HTMLDivElement | null>(null);

  // Drive transform/filter every frame. Re-runs only when motion/speed change,
  // so editing the gradient colors never interrupts it. Every motion keeps a
  // baseline scale above 1, and the drift translate stays inside that scale's
  // headroom, so the layer edge is never revealed.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (motion === 'none') {
      el.style.transform = 'none';
      el.style.filter = 'none';
      return;
    }

    const period = BASE_PERIOD[motion] * multiplier;
    let raf = 0;
    let start = 0;

    const tick = (now: number) => {
      if (!start) start = now;
      const p = (((now - start) / 1000) / period) * TWO_PI;
      const s = Math.sin(p);
      const c = Math.cos(p);

      if (motion === 'drift') {
        // The light wanders on a gentle ellipse while the field slowly zooms.
        const x = 8 * s;
        const y = 6 * c;
        const scale = 1.24 + 0.06 * s; // 1.18 .. 1.30
        el.style.transform = `translate(${x}%, ${y}%) scale(${scale})`;
        el.style.filter = `brightness(${1 + 0.05 * s})`;
      } else if (motion === 'breathe') {
        const scale = 1.18 + 0.12 * s; // 1.06 .. 1.30, an obvious swell
        el.style.transform = `scale(${scale})`;
        el.style.filter = `brightness(${1 + 0.04 * s})`;
      } else {
        // glow: a strong brightness pulse, visible regardless of gradient shape
        const scale = 1.1 + 0.04 * s; // 1.06 .. 1.14
        el.style.transform = `scale(${scale})`;
        el.style.filter = `brightness(${1 + 0.22 * s})`; // 0.78 .. 1.22
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.style.transform = 'none';
      el.style.filter = 'none';
    };
  }, [motion, multiplier]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div
        ref={ref}
        style={{
          position: 'absolute',
          inset: 0,
          background,
          willChange: 'transform, filter',
        }}
      />
    </div>
  );
}

export const gradientBackgroundDefinition: EffectDefinition = {
  id: 'gradient-background',
  name: 'Gradient Background',
  category: 'background',
  technology: 'css',
  contentInput: 'none',
  configSchema,
  component: GradientBackground,
  duration: { type: 'indefinite' },
  performanceCost: 'low',
  description: 'A CSS gradient or solid color backdrop layer, with optional slow radiance motion',
};
