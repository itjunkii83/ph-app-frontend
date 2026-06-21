'use client';

import React from 'react';
import { EffectProps, EffectDefinition, ConfigSchema } from '../../../types/effects';

// A trusted CSS background layer. The `background` value is any valid CSS
// `background` shorthand (gradients, layered gradients, solid colors). It is
// authored in the studio (a trusted surface), so the raw string is written
// straight into the style. This is the canonical way curated gradient backdrops
// become real, playable layers rather than ad-hoc CSS in the editor.

const configSchema: ConfigSchema = {
  background: {
    type: 'string',
    label: 'CSS Background',
    default:
      'linear-gradient(180deg,#1b232c 0%,#0e141a 60%,#0a0e13 100%)',
  },
};

export function GradientBackground({ config }: EffectProps) {
  const background =
    config.background || 'linear-gradient(180deg,#1b232c 0%,#0e141a 60%,#0a0e13 100%)';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background,
      }}
    />
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
  description: 'A CSS gradient or solid color backdrop layer',
};
