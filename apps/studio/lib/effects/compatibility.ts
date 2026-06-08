import { Layer } from '@/types/presentation';
import { getEffect } from '@/components/effects/registry';

export interface CompatibilityResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  totalPerfCost: number;
  webglCount: number;
  layerCount: number;
}

const PERF_COST_MAP: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export function checkSceneCompatibility(layers: Layer[]): CompatibilityResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  let totalPerfCost = 0;
  let webglCount = 0;

  const effectCounts = new Map<string, number>();

  for (const layer of layers) {
    if (!layer.visible) continue;

    const effect = getEffect(layer.effectType);
    if (!effect) continue;

    totalPerfCost += PERF_COST_MAP[effect.performanceCost] || 1;

    if (effect.technology === 'webgl') {
      webglCount++;
    }

    const count = (effectCounts.get(layer.effectType) || 0) + 1;
    effectCounts.set(layer.effectType, count);

    const maxRecommended = 5; // sensible default
    if (count > maxRecommended) {
      warnings.push(
        `${effect.name}: ${count} instances exceed recommended max of ${maxRecommended}`
      );
    }
  }

  if (webglCount >= 8) {
    errors.push(`${webglCount} WebGL contexts — browsers limit to ~8, expect failures`);
  } else if (webglCount >= 4) {
    warnings.push(`${webglCount} WebGL contexts — may cause issues on some devices`);
  }

  if (totalPerfCost > 15) {
    warnings.push(`High total performance cost (${totalPerfCost}) — may cause frame drops`);
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    totalPerfCost,
    webglCount,
    layerCount: layers.filter((l) => l.visible).length,
  };
}
