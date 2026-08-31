// Curated OpenRouter models for the Zoltar debug view. Prices are USD per million
// tokens (input / output) from the OpenRouter catalog on 2026-08-30 and are
// ESTIMATES pinned to that date; they can drift. The debug panel labels them as
// estimates. The route rejects any modelId not in this list.
//
// Build-time check (run once when revising this list): GET
// https://openrouter.ai/api/v1/models (no auth) and drop any id that no longer
// resolves. See docs/ZOLTAR.md for the verification note from the last pass.
export type ModelTier = 'budget' | 'mid' | 'ceiling';

export interface ModelSpec {
  id: string;
  label: string;
  tier: ModelTier;
  inputPerM: number;
  outputPerM: number;
}

export const MODELS: ModelSpec[] = [
  // Budget (default is the first entry).
  { id: 'deepseek/deepseek-v4-flash-0731', label: 'deepseek/deepseek-v4-flash-0731', tier: 'budget', inputPerM: 0.065, outputPerM: 0.18 },
  { id: 'qwen/qwen3.8-flash', label: 'qwen/qwen3.8-flash', tier: 'budget', inputPerM: 0.15, outputPerM: 0.47 },
  { id: 'qwen/qwen3.7-flash', label: 'qwen/qwen3.7-flash', tier: 'budget', inputPerM: 0.03, outputPerM: 0.13 },
  { id: 'z-ai/glm-5.3-flash', label: 'z-ai/glm-5.3-flash', tier: 'budget', inputPerM: 0.075, outputPerM: 0.25 },
  { id: 'openai/gpt-oss-120b', label: 'openai/gpt-oss-120b', tier: 'budget', inputPerM: 0.037, outputPerM: 0.17 },
  { id: 'nvidia/nemotron-3-super-120b-a12b', label: 'nvidia/nemotron-3-super-120b-a12b', tier: 'budget', inputPerM: 0.085, outputPerM: 0.4 },
  { id: 'google/gemma-4-31b-it', label: 'google/gemma-4-31b-it', tier: 'budget', inputPerM: 0.09, outputPerM: 0.34 },
  { id: 'google/gemini-3.1-flash-lite', label: 'google/gemini-3.1-flash-lite', tier: 'budget', inputPerM: 0.25, outputPerM: 1.5 },
  // Mid.
  { id: 'qwen/qwen3.8-27b', label: 'qwen/qwen3.8-27b', tier: 'mid', inputPerM: 0.425, outputPerM: 2.55 },
  { id: 'qwen/qwen3.7-plus', label: 'qwen/qwen3.7-plus', tier: 'mid', inputPerM: 0.32, outputPerM: 1.28 },
  { id: 'minimax/minimax-m3', label: 'minimax/minimax-m3', tier: 'mid', inputPerM: 0.3, outputPerM: 1.2 },
  { id: 'moonshotai/kimi-k2.6', label: 'moonshotai/kimi-k2.6', tier: 'mid', inputPerM: 0.95, outputPerM: 4.0 },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b', label: 'nvidia/nemotron-3-ultra-550b-a55b', tier: 'mid', inputPerM: 0.5, outputPerM: 2.2 },
  { id: 'google/gemini-3.7-flash', label: 'google/gemini-3.7-flash', tier: 'mid', inputPerM: 0.75, outputPerM: 3.75 },
  { id: 'openai/gpt-5.4-mini', label: 'openai/gpt-5.4-mini', tier: 'mid', inputPerM: 0.75, outputPerM: 4.5 },
  { id: 'anthropic/claude-haiku-4.5', label: 'anthropic/claude-haiku-4.5', tier: 'mid', inputPerM: 1.0, outputPerM: 5.0 },
  // Reference ceiling.
  { id: 'z-ai/glm-5.3', label: 'z-ai/glm-5.3', tier: 'ceiling', inputPerM: 1.4, outputPerM: 4.4 },
  { id: 'deepseek/deepseek-v4-pro-0813', label: 'deepseek/deepseek-v4-pro-0813', tier: 'ceiling', inputPerM: 1.32, outputPerM: 3.96 },
  { id: 'anthropic/claude-sonnet-5', label: 'anthropic/claude-sonnet-5', tier: 'ceiling', inputPerM: 2.0, outputPerM: 10.0 },
];

export const DEFAULT_MODEL_ID = MODELS[0].id;

export const TIER_LABELS: Record<ModelTier, string> = {
  budget: 'Budget',
  mid: 'Mid',
  ceiling: 'Reference ceiling',
};

export function getModel(id: string): ModelSpec | undefined {
  return MODELS.find((m) => m.id === id);
}

export function isKnownModel(id: string): boolean {
  return MODELS.some((m) => m.id === id);
}

// USD estimate for one turn given token counts.
export function turnCost(model: ModelSpec, promptTokens: number, completionTokens: number): number {
  return (promptTokens / 1_000_000) * model.inputPerM + (completionTokens / 1_000_000) * model.outputPerM;
}

// Grouped for the tier-grouped Select in the debug panel.
export function modelGroups(): { label: string; options: { value: string; label: string }[] }[] {
  const tiers: ModelTier[] = ['budget', 'mid', 'ceiling'];
  return tiers.map((tier) => ({
    label: TIER_LABELS[tier],
    options: MODELS.filter((m) => m.tier === tier).map((m) => ({
      value: m.id,
      label: `${m.label}  $${m.inputPerM} / $${m.outputPerM}`,
    })),
  }));
}
