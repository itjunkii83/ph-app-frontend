// Shim: effect types now live in @harbor/player. Re-exported so the studio's
// existing `@/types/effects` imports keep resolving.
export type {
  EffectDefinition,
  EffectProps,
  ConfigSchema,
  ConfigFieldSchema,
  ConfigFieldType,
  EffectCategory,
  RenderTechnology,
  ContentInputType,
  DurationMode,
} from "@harbor/player";
