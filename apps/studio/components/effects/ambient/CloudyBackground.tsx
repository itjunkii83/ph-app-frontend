'use client';

import React, { useRef, useMemo } from 'react';
import { EffectProps, EffectDefinition, ConfigSchema } from '@/types/effects';
import { useEffectLifecycle } from '@/hooks/useEffectLifecycle';
import { SPEED_MULTIPLIERS, SpeedOption } from '@/lib/effects/speed';
import gsap from 'gsap';

const configSchema: ConfigSchema = {
  cloudColor: {
    type: 'color',
    label: 'Cloud Color',
    default: '#ffffff',
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
  opacity: {
    type: 'number',
    label: 'Cloud Opacity',
    default: 0.4,
    min: 0.1,
    max: 1,
    step: 0.05,
  },
  layers: {
    type: 'number',
    label: 'Cloud Layers',
    default: 3,
    min: 1,
    max: 3,
    step: 1,
  },
  bgGradientTop: {
    type: 'color',
    label: 'Background Top',
    default: '#333333',
  },
  bgGradientBottom: {
    type: 'color',
    label: 'Background Bottom',
    default: '#000000',
  },
};

const CLOUD_URLS = [
  'https://s.cdpn.io/15514/clouds_2.png',
  'https://s.cdpn.io/15514/clouds_1.png',
  'https://s.cdpn.io/15514/clouds_3.png',
];

const BASE_DURATIONS = [20, 15, 17]; // seconds per layer
const DRIFT_WIDTHS = [1000, 1000, 1579]; // px per layer

export function CloudyBackground({ config, isActive }: EffectProps) {
  const cloudColor = config.cloudColor || '#ffffff';
  const speed = (config.speed || 'medium') as SpeedOption;
  const cloudOpacity = config.opacity ?? 0.4;
  const layerCount = Math.min(3, Math.max(1, config.layers ?? 3));
  const bgTop = config.bgGradientTop || '#333333';
  const bgBottom = config.bgGradientBottom || '#000000';

  const multiplier = SPEED_MULTIPLIERS[speed] ?? 1;

  const styleId = useRef(`clouds-${Math.random().toString(36).slice(2, 8)}`);

  const keyframes = useMemo(() => {
    const id = styleId.current;
    let css = '';
    for (let i = 0; i < layerCount; i++) {
      const dur = BASE_DURATIONS[i] * multiplier;
      const drift = DRIFT_WIDTHS[i];
      css += `
        @keyframes ${id}-drift-${i} {
          to { background-position: -${drift}px 0; }
        }
      `;
    }
    return css;
  }, [layerCount, multiplier]);

  const { containerRef, phase } = useEffectLifecycle({
    isActive,
    buildEnter: (el) => gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' }),
    buildExit: (el) => gsap.to(el, { opacity: 0, duration: 1.0, ease: 'power2.in' }),
    resetToIdle: (el) => { gsap.set(el, { clearProps: 'opacity' }); },
  });

  const id = styleId.current;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(${bgTop}, ${bgBottom})`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: cloudOpacity,
          pointerEvents: 'none',
        }}
      >
        {Array.from({ length: layerCount }).map((_, i) => {
          const dur = BASE_DURATIONS[i] * multiplier;
          // Tint the cloud images via CSS filter (approximate color overlay)
          const isWhite = cloudColor === '#ffffff' || cloudColor === '#fff';
          return (
            <div
              key={i}
              style={{
                backgroundImage: `url(${CLOUD_URLS[i]})`,
                backgroundRepeat: 'repeat-x',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '500px',
                animation: `${id}-drift-${i} ${dur}s infinite linear`,
                filter: isWhite ? undefined : `drop-shadow(0 0 0 ${cloudColor})`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export const cloudyBackgroundDefinition: EffectDefinition = {
  id: 'cloudy-background',
  name: 'Cloudy Background',
  category: 'ambient',
  technology: 'css',
  contentInput: 'none',
  configSchema,
  component: CloudyBackground,
  duration: { type: 'indefinite' },
  performanceCost: 'low',
  description: 'Animated cloud layers drifting over a gradient background',
};
