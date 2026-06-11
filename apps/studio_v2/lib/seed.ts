import type { Pantry } from './types';

const SERIF = 'var(--font-fraunces), Georgia, serif';
const SANS = 'var(--font-archivo), system-ui, sans-serif';

export const SEED_PANTRY: Pantry = {
  backgrounds: [
    {
      id: 'storm-water',
      name: 'Storm water',
      role: 'Opener',
      bg: 'radial-gradient(900px 540px at 56% 34%,rgba(150,172,196,.34),transparent 64%),linear-gradient(180deg,#1b232c 0%,#0e141a 60%,#0a0e13 100%)',
      mood: ['resolve', 'calm'],
      metaphor: 'A still surface over real depth.',
      motion: ['slow push in', 'drift'],
      zones: 'Center and lower third are dark and safe for type.',
      contrast: 'low',
    },
    {
      id: 'first-light',
      name: 'First light',
      role: 'Closer',
      bg: 'radial-gradient(880px 560px at 68% 80%,rgba(228,176,120,.40),transparent 66%),linear-gradient(180deg,#191310 0%,#241a14 70%,#15100d 100%)',
      mood: ['hope', 'breakthrough'],
      metaphor: 'First light coming up off the water.',
      motion: ['pan up', 'slow push in'],
      zones: 'Upper half holds type best.',
      contrast: 'low',
    },
    {
      id: 'deep-current',
      name: 'Deep current',
      role: 'The turn',
      bg: 'radial-gradient(920px 620px at 42% 28%,rgba(96,138,190,.38),transparent 64%),linear-gradient(180deg,#0d1822 0%,#0a121c 55%,#070d15 100%)',
      mood: ['introspection', 'struggle'],
      metaphor: 'The weight underneath the calm.',
      motion: ['drift'],
      zones: 'Center only. Edges fall off dark.',
      contrast: 'low',
    },
    {
      id: 'ember',
      name: 'Ember',
      role: 'Climax',
      bg: 'radial-gradient(760px 520px at 50% 92%,rgba(228,116,72,.46),transparent 64%),linear-gradient(180deg,#1a1310 0%,#241410 65%,#120b09 100%)',
      mood: ['intensity', 'drive'],
      metaphor: 'A banked fire about to catch.',
      motion: ['slow push in'],
      zones: 'Upper and center. Keep type off the glow.',
      contrast: 'medium',
    },
    {
      id: 'horizon',
      name: 'Horizon',
      role: 'Opener or closer',
      bg: 'linear-gradient(180deg,#141c24 0%,#222c36 50%,#0f161d 100%),radial-gradient(1100px 480px at 50% 50%,rgba(180,196,212,.30),transparent 62%)',
      mood: ['clarity', 'purpose'],
      metaphor: 'An open line where the sky meets the water.',
      motion: ['pan right', 'push in'],
      zones: 'Center band is clean.',
      contrast: 'low',
    },
  ],
  textEffects: [
    { id: 'reveal-rise', name: 'Reveal rise', anim: 'rise', register: ['tender', 'reflective'], pacing: 'slow', bestFor: ['opening', 'resolution'], needs: 'A high-contrast zone with room to breathe.' },
    { id: 'hard-cut', name: 'Hard cut', anim: 'cut', register: ['punchy', 'urgent'], pacing: 'fast', bestFor: ['climax'], needs: 'Strong contrast behind a single line.' },
    { id: 'word-build', name: 'Word build', anim: 'build', register: ['building', 'deliberate'], pacing: 'medium', bestFor: ['the turn'], needs: 'Short lines of three to six words.' },
    { id: 'slow-bloom', name: 'Slow bloom', anim: 'bloom', register: ['meditative', 'calm'], pacing: 'slow', bestFor: ['opening'], needs: 'Space and a quiet background.' },
    { id: 'pulse', name: 'Pulse', anim: 'pulse', register: ['intense'], pacing: 'medium', bestFor: ['climax'], needs: 'One strong line, nothing competing.' },
  ],
  pairings: [
    { id: 'p1', bgId: 'storm-water', fxId: 'reveal-rise', text: 'Be one.', attr: '', font: SERIF, cap: 64, color: '#eef3f7', pos: 'center', mood: ['resolve', 'calm'], best: ['opening'] },
    { id: 'p2', bgId: 'horizon', fxId: 'slow-bloom', text: 'Still water.', attr: '', font: SERIF, cap: 72, color: '#eef3f7', pos: 'center', mood: ['clarity', 'calm'], best: ['opening'] },
    { id: 'p3', bgId: 'deep-current', fxId: 'word-build', text: 'The work is the want.', attr: '', font: SERIF, cap: 60, color: '#cfd8df', pos: 'center', mood: ['introspection', 'resolve'], best: ['the turn'] },
    { id: 'p4', bgId: 'ember', fxId: 'hard-cut', text: 'Move now.', attr: '', font: SANS, cap: 64, color: '#eef3f7', pos: 'center', mood: ['intensity', 'drive'], best: ['climax'] },
    { id: 'p5', bgId: 'ember', fxId: 'pulse', text: 'This is the rep.', attr: '', font: SERIF, cap: 62, color: '#eef3f7', pos: 'center', mood: ['intensity'], best: ['climax'] },
    { id: 'p6', bgId: 'first-light', fxId: 'reveal-rise', text: 'Carry it into the day.', attr: '', font: SERIF, cap: 58, color: '#eef3f7', pos: 'upper', mood: ['hope', 'breakthrough'], best: ['resolution'] },
    { id: 'p7', bgId: 'horizon', fxId: 'reveal-rise', text: 'Then you set out.', attr: '', font: SERIF, cap: 64, color: '#eef3f7', pos: 'center', mood: ['clarity', 'purpose'], best: ['resolution'] },
  ],
  rules: [
    'Arrive calm. Leave charged.',
    'Match motion energy to the weight of the line.',
    'Change the backdrop only when the meaning actually shifts.',
    'Give the hero line its own beat with room around it.',
    'Never drop a soft effect on a soft zone.',
    'Let the message decide how many beats, not a template.',
  ],
};

export const SEED_TASTE = {
  arc: 'calm-charged' as const,
  maxBeats: 4,
  backdrop: 'shift' as const,
  quotesReflective: true,
};

export const QUOTES = [
  { text: 'Waste no more time arguing about what a good person should be. Be one.', attr: 'Marcus Aurelius' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act but a habit.', attr: 'Aristotle' },
  { text: 'The impediment to action advances action. What stands in the way becomes the way.', attr: 'Marcus Aurelius' },
];

export const LINES: Record<string, string[]> = {
  opener: ['Still water.', 'Begin before you feel ready.', 'The day is already yours.', 'Be one.'],
  turn: ['The work is the want.', 'Small and certain beats big and someday.', 'You have done hard things before.'],
  climax: ['Then you set out.', 'Move now, feel it later.', 'This is the rep that counts.'],
  closer: ['Every rep is a vote for who you become.', 'Show up before the world wakes.', 'Carry it into the day.'],
};
