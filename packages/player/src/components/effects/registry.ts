import { EffectDefinition, EffectCategory } from '../../types/effects';
import React from 'react';

const effectRegistry = new Map<string, EffectDefinition>();

export function registerEffect(definition: EffectDefinition): void {
  effectRegistry.set(definition.id, definition);
}

export function getEffect(id: string): EffectDefinition | undefined {
  return effectRegistry.get(id);
}

export function getAllEffects(): EffectDefinition[] {
  return Array.from(effectRegistry.values());
}

export function getEffectsByCategory(category: EffectCategory): EffectDefinition[] {
  return Array.from(effectRegistry.values()).filter(
    (effect) => effect.category === category
  );
}

export function getEffectComponent(
  id: string
): React.ComponentType<any> | undefined {
  return effectRegistry.get(id)?.component;
}
