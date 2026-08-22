'use client';

import React, { useRef, useMemo } from 'react';
import { EffectProps, EffectDefinition, ConfigSchema } from '../../../types/effects';
import { SPEED_MULTIPLIERS, SpeedOption } from '../../../lib/effects/speed';

// Liquid Gradient background (ported from tools/codepen/pens/animated_background.html).
//
// Five colored radial-gradient "orbs" drift and rotate over a base color. An SVG
// "goo" filter (gaussian blur + an alpha-contrast color matrix) merges the soft
// orbs into liquid metaball blobs, so the color fields flow into one another
// instead of reading as separate circles. The whole thing is pure CSS keyframes
// plus one SVG filter: no WebGL, no rAF, no per-frame JS. It runs continuously as
// a persistent stage layer (no useEffectLifecycle, like GradientBackground); the
// Section transition owns the crossfade.
//
// Color handling is the elegant part: the base color and the five orb colors are
// written as CSS custom properties on the root, and the orb radial-gradients read
// `rgba(var(--cN), ...)`. So editing a color in the studio updates the paint live
// without rebuilding the keyframes or restarting the motion. The injected
// stylesheet only depends on the per-instance id, the speed multiplier (durations),
// and the blend mode. The mouse-following bubble from the original pen is dropped:
// a backdrop behind text is passive, and a window mousemove listener would react to
// the whole editor page.

const configSchema: ConfigSchema = {
  backgroundColor: {
    type: 'color',
    label: 'Background',
    default: '#080a0f',
  },
  color1: { type: 'color', label: 'Orb 1', default: '#1271ff' },
  color2: { type: 'color', label: 'Orb 2', default: '#dd4aff' },
  color3: { type: 'color', label: 'Orb 3', default: '#64dcff' },
  color4: { type: 'color', label: 'Orb 4', default: '#c83232' },
  color5: { type: 'color', label: 'Orb 5', default: '#b4b432' },
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
  blendMode: {
    type: 'select',
    label: 'Blend',
    default: 'hard-light',
    options: [
      { label: 'Hard light', value: 'hard-light' },
      { label: 'Screen', value: 'screen' },
      { label: 'Lighten', value: 'lighten' },
      { label: 'Normal', value: 'normal' },
    ],
  },
};

// Parse a hex color (#rgb or #rrggbb) into an "r, g, b" triplet for use inside
// rgba(var(--cN), alpha). Falls back to white on anything unparseable.
function hexToRgb(hex: string): string {
  let h = (hex || '').trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return '255, 255, 255';
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

// A darker companion of the base color, used as the second stop of the base
// gradient so the backdrop has a little depth instead of a flat fill.
function darken(hex: string, factor: number): string {
  let h = (hex || '').trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return 'rgb(10, 10, 10)';
  const n = parseInt(h, 16);
  const r = Math.round(((n >> 16) & 255) * (1 - factor));
  const g = Math.round(((n >> 8) & 255) * (1 - factor));
  const b = Math.round((n & 255) * (1 - factor));
  return `rgb(${r}, ${g}, ${b})`;
}

// Seconds for one full cycle per orb (before the speed multiplier). Faithful to
// the original pen's per-orb timings.
const BASE_DURATIONS = { g1: 30, g2: 20, g3: 40, g4: 40, g5: 20 };

export function LiquidGradientBackground({ config }: EffectProps) {
  const bg = (config.backgroundColor as string) || '#080a0f';
  const speed = (config.speed || 'slow') as SpeedOption;
  const blend = (config.blendMode as string) || 'hard-light';
  const multiplier = SPEED_MULTIPLIERS[speed] ?? SPEED_MULTIPLIERS.slow;

  // A stable per-instance id scopes the keyframes, the orb selectors, and the
  // SVG filter id, so multiple instances on one page never collide.
  const idRef = useRef(`liquid-${Math.random().toString(36).slice(2, 8)}`);
  const id = idRef.current;

  // Keyframes + orb rules. Rebuilt only when speed or blend change; colors ride
  // on CSS custom properties (set inline below), so recoloring never touches this.
  const css = useMemo(() => {
    const d = {
      g1: (BASE_DURATIONS.g1 * multiplier).toFixed(1),
      g2: (BASE_DURATIONS.g2 * multiplier).toFixed(1),
      g3: (BASE_DURATIONS.g3 * multiplier).toFixed(1),
      g4: (BASE_DURATIONS.g4 * multiplier).toFixed(1),
      g5: (BASE_DURATIONS.g5 * multiplier).toFixed(1),
    };
    const orb = (n: number) =>
      `radial-gradient(circle at center, rgba(var(--c${n}), 0.8) 0, rgba(var(--c${n}), 0) 50%) no-repeat`;
    return `
      .${id} .gradients-container {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        filter: url(#${id}-goo) blur(25px);
      }
      .${id} .orb {
        position: absolute;
        mix-blend-mode: ${blend};
        width: var(--circle-size);
        height: var(--circle-size);
        top: calc(50% - var(--circle-size) / 2);
        left: calc(50% - var(--circle-size) / 2);
        transform-origin: center center;
        opacity: 1;
      }
      .${id} .g1 { background: ${orb(1)}; animation: ${id}-moveVertical ${d.g1}s ease infinite; }
      .${id} .g2 { background: ${orb(2)}; animation: ${id}-moveInCircle ${d.g2}s reverse infinite; }
      .${id} .g3 {
        background: ${orb(3)};
        top: calc(50% - var(--circle-size) / 2 + 18%);
        left: calc(50% - var(--circle-size) / 2 - 26%);
        animation: ${id}-moveInCircle ${d.g3}s linear infinite;
      }
      .${id} .g4 { background: ${orb(4)}; opacity: 0.7; animation: ${id}-moveHorizontal ${d.g4}s ease infinite; }
      .${id} .g5 {
        background: ${orb(5)};
        width: calc(var(--circle-size) * 2);
        height: calc(var(--circle-size) * 2);
        top: calc(50% - var(--circle-size));
        left: calc(50% - var(--circle-size));
        transform-origin: calc(50% - 42%) calc(50% + 18%);
        animation: ${id}-moveInCircle ${d.g5}s ease infinite;
      }
      @keyframes ${id}-moveInCircle {
        0% { transform: rotate(0deg); }
        50% { transform: rotate(180deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes ${id}-moveVertical {
        0% { transform: translateY(-50%); }
        50% { transform: translateY(50%); }
        100% { transform: translateY(-50%); }
      }
      @keyframes ${id}-moveHorizontal {
        0% { transform: translateX(-50%) translateY(-10%); }
        50% { transform: translateX(50%) translateY(10%); }
        100% { transform: translateX(-50%) translateY(-10%); }
      }
      @media (prefers-reduced-motion: reduce) {
        .${id} .orb { animation: none !important; }
      }
    `;
  }, [id, multiplier, blend]);

  const rootStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: `linear-gradient(40deg, ${bg}, ${darken(bg, 0.55)})`,
    '--circle-size': '80%',
    '--c1': hexToRgb((config.color1 as string) || '#1271ff'),
    '--c2': hexToRgb((config.color2 as string) || '#dd4aff'),
    '--c3': hexToRgb((config.color3 as string) || '#64dcff'),
    '--c4': hexToRgb((config.color4 as string) || '#c83232'),
    '--c5': hexToRgb((config.color5 as string) || '#b4b432'),
  } as React.CSSProperties;

  return (
    <div className={id} style={rootStyle}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {/* The goo filter: blur, then push alpha contrast hard so overlapping soft
          orbs fuse into liquid blobs with crisp edges. */}
      <svg aria-hidden style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id={`${id}-goo`}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div className="gradients-container">
        <div className="orb g1" />
        <div className="orb g2" />
        <div className="orb g3" />
        <div className="orb g4" />
        <div className="orb g5" />
      </div>
    </div>
  );
}

export const liquidGradientBackgroundDefinition: EffectDefinition = {
  id: 'liquid-gradient',
  name: 'Liquid Gradient',
  category: 'background',
  technology: 'css',
  contentInput: 'none',
  configSchema,
  component: LiquidGradientBackground,
  duration: { type: 'indefinite' },
  performanceCost: 'medium',
  description: 'Colored orbs drifting over a base color, fused into liquid blobs by an SVG goo filter. Base and orb colors are configurable.',
};
