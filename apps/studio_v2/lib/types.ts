// The data model. These types map one to one onto the JSON the real
// assembly model will emit, so they port straight into the Next app.

export type Anim = 'rise' | 'cut' | 'build' | 'bloom' | 'pulse';
export type Pacing = 'slow' | 'medium' | 'fast';
export type Position = 'center' | 'upper' | 'lower';

/** Atom: a visual ingredient. Self describing so the AI knows when to use it. */
export interface Background {
  id: string;
  name: string;
  role: string;
  bg: string; // css background value (gradient stands in for real media)
  mood: string[];
  metaphor: string;
  motion: string[];
  zones: string;
  contrast: string;
}

/** Atom: a text effect. How a line arrives and behaves. */
export interface TextEffect {
  id: string;
  name: string;
  anim: Anim;
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
  font: string;
  cap: number;
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
export type View = 'backgrounds' | 'effects' | 'pairings' | 'designer' | 'rules' | 'preview';

export const COLOR_SWATCHES = ['#eef3f7', '#cfd8df', '#9aa5af', '#7f8a94', '#b8935a'];
export const FONT_OPTIONS = [
  { label: 'Fraunces', value: "var(--font-fraunces), Georgia, serif" },
  { label: 'Archivo', value: "var(--font-archivo), system-ui, sans-serif" },
];
export const ANIM_OPTIONS: { value: Anim; label: string }[] = [
  { value: 'rise', label: 'Reveal rise' },
  { value: 'cut', label: 'Hard cut' },
  { value: 'build', label: 'Word build' },
  { value: 'bloom', label: 'Slow bloom' },
  { value: 'pulse', label: 'Pulse' },
];
