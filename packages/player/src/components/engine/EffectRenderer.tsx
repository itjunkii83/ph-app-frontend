'use client';

import React from 'react';
import { Layer } from '../../types/presentation';
import { getEffect, getEffectComponent } from '../../components/effects/registry';
import { calculateReadingDuration } from '../../lib/duration';

interface EffectRendererProps {
  layer: Layer;
  isActive: boolean;
  onComplete?: () => void;
}

function getDurationMs(layer: Layer): number | undefined {
  const def = getEffect(layer.effectType);
  if (!def) return undefined;

  const mode = def.duration;
  if (mode.type === 'fixed') return mode.ms;
  if (mode.type === 'auto') {
    const text = layer.config?.text;
    if (typeof text === 'string' && text.trim()) {
      return calculateReadingDuration(text);
    }
    return 5000; // fallback for auto with no text
  }
  // indefinite
  return undefined;
}

export function EffectRenderer({ layer, isActive, onComplete }: EffectRendererProps) {
  const Component = getEffectComponent(layer.effectType);

  if (!Component) {
    console.warn(`Effect not found: "${layer.effectType}"`);
    return null;
  }

  const durationMs = getDurationMs(layer);

  return (
    <Component
      config={layer.config}
      isActive={isActive}
      onComplete={onComplete}
      durationMs={durationMs}
    />
  );
}
