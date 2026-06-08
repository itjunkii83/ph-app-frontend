'use client';

import React from 'react';
import { EffectProps, EffectDefinition, ConfigSchema } from '@/types/effects';

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
      { label: 'None', value: 'none' },
    ],
  },
  position: {
    type: 'select',
    label: 'Position',
    default: 'center',
    options: [
      { label: 'Center', value: 'center' },
      { label: 'Top', value: 'top' },
      { label: 'Bottom', value: 'bottom' },
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
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

export function BackgroundImage({ config }: EffectProps) {
  const src = config.src || '';
  const fit = config.fit || 'cover';
  const position = config.position || 'center';
  const blur = config.blur ?? 0;
  const brightness = config.brightness ?? 100;

  const filters: string[] = [];
  if (blur > 0) filters.push(`blur(${blur}px)`);
  if (brightness !== 100) filters.push(`brightness(${brightness}%)`);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundImage: src ? `url(${src})` : 'none',
        backgroundSize: fit === 'fill' ? '100% 100%' : fit,
        backgroundPosition: position,
        backgroundRepeat: 'no-repeat',
        filter: filters.length > 0 ? filters.join(' ') : undefined,
      }}
    />
  );
}

export const backgroundImageDefinition: EffectDefinition = {
  id: 'background-image',
  name: 'Background Image',
  category: 'background',
  technology: 'css',
  contentInput: 'image',
  configSchema,
  component: BackgroundImage,
  duration: { type: 'indefinite' },
  performanceCost: 'low',
};
