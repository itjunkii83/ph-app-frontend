// Shim: the Presentation JSON types now live in @harbor/player (the single
// source of truth shared with the toolkit). Re-exported here so the studio's
// existing `@/types/presentation` imports keep resolving.
export type {
  Presentation,
  Section,
  Slide,
  Layer,
  LayerPosition,
  LayerSize,
  TransitionConfig,
  PresentationSettings,
} from "@harbor/player";
