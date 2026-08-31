// The data model. Atoms reference real @harbor/player effects by id plus a typed
// config blob (validated against the effect's configSchema), and carry the studio
// curation tags the generator reads. This is the durable pantry artifact.

export type Pacing = 'slow' | 'medium' | 'fast';
export type Position = 'center' | 'upper' | 'lower';

/** Atom: a visual backdrop. References a background-category effect + config. */
export interface Background {
  id: string;
  name: string;
  role: string;
  // A background-category effect id: 'gradient-background' | 'background-image' | 'ocean'.
  effectType: string;
  config: Record<string, unknown>;
  mood: string[];
  metaphor: string;
  motion: string[];
  zones: string;
  contrast: string;
}

/** Atom: a text effect. References a text-category effect + config. */
export interface TextEffect {
  id: string;
  name: string;
  // A text-category effect id: 'masked-text-reveal' | 'dreamy-smoke' | 'hard-cut' | 'pulse' | 'bloom' | 'basic-text'.
  effectType: string;
  config: Record<string, unknown>;
  register: string[];
  pacing: Pacing;
  bestFor: string[];
  needs: string;
}

/** Molecule: a blessed background plus effect plus treatment. Human taste. */
export interface Pairing {
  id: string;
  bgId: string;
  fxId: string;
  text: string; // sample line only; the AI supplies the real quote
  attr: string;
  font: string; // a real font family name (e.g. "Fraunces"), not a CSS var
  cap: number; // the MAX font size; fit-to-box shrinks long lines below it
  color: string;
  pos: Position;
  mood: string[];
  best: string[];
}

/** Composition controls the generator obeys. */
export interface Taste {
  arc: 'calm-charged' | 'mood' | 'drive';
  maxBeats: number;
  backdrop: 'shift' | 'every';
  quotesReflective: boolean;
}

export interface Pantry {
  backgrounds: Background[];
  textEffects: TextEffect[];
  pairings: Pairing[];
  rules: string[];
}

/** A single beat of an assembled film. */
export interface Beat {
  pairingId: string;
  bgId: string;
  fxId: string;
  font: string;
  color: string;
  pos: Position;
  cap: number;
  text: string;
  attr: string;
  slot: string;
  dur: number;
  // Per-beat Ken Burns direction, a compositional call the generator makes
  // (alternating in/out, with calm beats left still). When set, it overrides
  // the atom's own kenBurns config; when absent, the atom's setting stands.
  kenBurns?: 'none' | 'in' | 'out';
}

export interface Film {
  beats: Beat[];
  total: number;
  ctx: SampleContext;
}

export interface SampleContext {
  mood: string;
  goal: string;
  why: string;
  arc: string[];
}

export type Theme = 'dark' | 'light';
export type View = 'backgrounds' | 'effects' | 'pairings' | 'designer' | 'rules' | 'preview' | 'zoltar';

// Runtime list of views, used to map the URL path to a view and back.
export const VIEWS: View[] = ['backgrounds', 'effects', 'pairings', 'designer', 'rules', 'preview', 'zoltar'];
export function isView(value: string): value is View {
  return (VIEWS as string[]).includes(value);
}

export const COLOR_SWATCHES = ['#eef3f7', '#cfd8df', '#9aa5af', '#7f8a94', '#b8935a'];
export const FONT_OPTIONS = [
  { label: 'Fraunces', value: 'Fraunces' },
  { label: 'Archivo', value: 'Archivo' },
];
