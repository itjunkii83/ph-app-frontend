import {
  getEffect,
  getEffectsByCategory,
  registerEffects,
  type EffectCategory,
} from '@harbor/player';

// The studio reads the player's effect registry to drive the effect pickers and
// the configSchema panels. registerEffects is idempotent.
registerEffects();

export function effectOptions(category: EffectCategory): { value: string; label: string }[] {
  return getEffectsByCategory(category).map((e) => ({ value: e.id, label: e.name }));
}

// The default config for an effect, built from its schema field defaults. Used
// when creating an atom or switching its effect type.
export function defaultConfig(effectType: string): Record<string, unknown> {
  const effect = getEffect(effectType);
  if (!effect) return {};
  const cfg: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(effect.configSchema)) {
    cfg[key] = schema.default;
  }
  return cfg;
}
