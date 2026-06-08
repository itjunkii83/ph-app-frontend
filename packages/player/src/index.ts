// @harbor/player — the shared, Next-agnostic presentation playback engine.
// Renderer, effects, hooks, duration, fonts, and the player live ONLY here; both
// apps import from this entry. No next/* imports anywhere in this package.

// Primary playback surface.
export { PresentationPlayer } from "./PresentationPlayer";
export type { PresentationPlayerProps } from "./PresentationPlayer";
export { PresentationStage } from "./PresentationStage";
export type { PresentationStageProps } from "./PresentationStage";

// Font delivery via context (useFonts runs inside effects; a prop can't reach it).
export { ManagedFontsProvider, useManagedFonts } from "./fonts/fonts-context";
export { useFonts } from "./hooks/useFonts";

// Effect registration + registry (the studio editor consumes these).
export { registerEffects } from "./registerEffects";
export {
  registerEffect,
  getEffect,
  getAllEffects,
  getEffectsByCategory,
  getEffectComponent,
} from "./components/effects/registry";

// Renderer pieces (the studio sandbox renders a single section/slide directly).
export {
  SectionRenderer,
  SlideRenderer,
  LayerRenderer,
  EffectRenderer,
} from "./components/engine";

// Read-only normalization shared with the studio editor's CRUD helpers.
export {
  getSections,
  usesSectionsFormat,
  getAllSlides,
  getTotalSlideCount,
  findSlide,
  findSection,
  getPositionFromFlatIndex,
  getFlatIndex,
} from "./lib/presentation/normalize";

// Media preloading (buffer a presentation before playback).
export { preloadPresentationMedia, preloadImage } from "./lib/preload";

// Duration + font loading utilities.
export { calculateReadingDuration, getTextStats } from "./lib/duration";
export { loadFont, loadFonts } from "./lib/fonts/loader";

// Responsive sizing helpers (also usable by app-side wrappers).
export {
  cqWidth,
  cqHeight,
  cqFontSize,
  cqLength,
  useBaseCanvas,
  DEFAULT_BASE,
} from "./lib/responsive";
export type { BaseCanvas } from "./lib/responsive";

// Types — the Presentation JSON contract + effect/font types.
export type {
  Presentation,
  Section,
  Slide,
  Layer,
  LayerPosition,
  LayerSize,
  TransitionConfig,
  PresentationSettings,
} from "./types/presentation";
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
} from "./types/effects";
export type { ManagedFont } from "./types/fonts";
