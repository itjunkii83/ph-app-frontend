'use client';

import React, { useRef } from 'react';
import { EffectProps, EffectDefinition, ConfigSchema } from '@/types/effects';
import { useEffectLifecycle } from '@/hooks/useEffectLifecycle';
import { SPEED_MULTIPLIERS, SpeedOption } from '@/lib/effects/speed';
import gsap from 'gsap';

const configSchema: ConfigSchema = {
  src: {
    type: 'image',
    label: 'Image Source',
    default: '',
  },
  fit: {
    type: 'select',
    label: 'Fit',
    default: 'cover',
    options: [
      { label: 'Cover', value: 'cover' },
      { label: 'Contain', value: 'contain' },
      { label: 'Fill', value: 'fill' },
    ],
  },
  direction: {
    type: 'select',
    label: 'Direction',
    default: 'zoom-in',
    options: [
      { label: 'Zoom In', value: 'zoom-in' },
      { label: 'Zoom Out', value: 'zoom-out' },
    ],
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
  blur: {
    type: 'number',
    label: 'Blur',
    default: 0,
    min: 0,
    max: 20,
    step: 1,
  },
  brightness: {
    type: 'number',
    label: 'Brightness',
    default: 100,
    min: 0,
    max: 200,
    step: 5,
  },
};

export function KenBurnsImage({ config, isActive, durationMs }: EffectProps) {
  const src = config.src || '';
  const fit = config.fit || 'cover';
  const direction = config.direction || 'zoom-in';
  const speed = (config.speed || 'medium') as SpeedOption;
  const blur = config.blur ?? 0;
  const brightness = config.brightness ?? 100;

  const multiplier = SPEED_MULTIPLIERS[speed] ?? 1;
  const imgRef = useRef<HTMLDivElement>(null);

  const startScale = direction === 'zoom-in' ? 1.0 : 1.2;
  const endScale = direction === 'zoom-in' ? 1.2 : 1.0;

  const effectiveDuration = durationMs ? (durationMs / 1000) * multiplier : 8 * multiplier;

  const { containerRef } = useEffectLifecycle({
    isActive,
    buildEnter: (el) => {
      const img = imgRef.current;
      if (img) gsap.set(img, { scale: startScale });
      return gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out' });
    },
    buildActive: (_el, _dur) => {
      const img = imgRef.current;
      if (!img) return gsap.to({}, { duration: 0 });
      return gsap.to(img, {
        scale: endScale,
        duration: effectiveDuration,
        ease: 'none',
      });
    },
    buildExit: (el) => {
      return gsap.to(el, { opacity: 0, duration: 0.8, ease: 'power2.in' });
    },
    resetToIdle: (el) => {
      gsap.set(el, { clearProps: 'opacity' });
      const img = imgRef.current;
      if (img) gsap.set(img, { clearProps: 'scale' });
    },
  });

  const filters: string[] = [];
  if (blur > 0) filters.push(`blur(${blur}px)`);
  if (brightness !== 100) filters.push(`brightness(${brightness}%)`);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        ref={imgRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: src ? `url(${src})` : 'none',
          backgroundSize: fit === 'fill' ? '100% 100%' : fit,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          willChange: 'transform',
          filter: filters.length > 0 ? filters.join(' ') : undefined,
        }}
      />
    </div>
  );
}

export const kenBurnsImageDefinition: EffectDefinition = {
  id: 'ken-burns-image',
  name: 'Ken Burns Image',
  category: 'image',
  technology: 'css',
  contentInput: 'image',
  configSchema,
  component: KenBurnsImage,
  duration: { type: 'fixed', ms: 8000 },
  performanceCost: 'low',
  description: 'Slow zoom (Ken Burns effect) on an image with fade transitions',
};
