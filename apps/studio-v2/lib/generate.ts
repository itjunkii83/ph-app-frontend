import type { Beat, Pairing, Pantry, Taste, Film, SampleContext, TextEffect } from './types';
import { LINES, QUOTES } from './seed';
import { rand } from './utils';

export const SAMPLE_CONTEXTS: SampleContext[] = [
  { mood: 'Fired up', goal: 'Morning workout', why: 'Wants the energy to carry the day', arc: ['calm', 'struggle', 'intensity', 'hope'] },
  { mood: 'Heavy', goal: 'Get unstuck', why: 'Has been quitting on himself', arc: ['introspection', 'resolve', 'drive'] },
  { mood: 'Steady', goal: 'Build the habit', why: 'Day forty of showing up', arc: ['clarity', 'resolve', 'hope'] },
];

const SOFT_REGISTERS = ['reflective', 'meditative', 'tender', 'deliberate', 'building'];

// Beats in these moods (and the reflective quote beat) hold perfectly still.
// Stillness is a beat too: constant motion loses the contrast that makes the
// zooms feel alive. The moving beats alternate in/out down the film, the
// classic documentary rhythm, so consecutive zooms never repeat a direction.
const STILL_MOODS = ['calm', 'introspection', 'clarity'];

function pickPairing(pantry: Pantry, slot: string, moodTag: string): Pairing {
  let cands = pantry.pairings.filter((p) => p.best.includes(slot));
  if (!cands.length) cands = pantry.pairings.filter((p) => p.mood.includes(moodTag));
  if (!cands.length) cands = pantry.pairings.slice();
  const withMood = cands.filter((p) => p.mood.includes(moodTag));
  return rand(withMood.length ? withMood : cands);
}

function pickReflective(pantry: Pantry, moodTag: string): Pairing {
  const reflectiveFx = pantry.textEffects
    .filter((f: TextEffect) => f.register.some((r) => SOFT_REGISTERS.includes(r)))
    .map((f) => f.id);
  let cands = pantry.pairings.filter((p) => reflectiveFx.includes(p.fxId));
  if (!cands.length) cands = pantry.pairings.filter((p) => p.mood.some((m) => ['calm', 'introspection', 'resolve', 'clarity'].includes(m)));
  if (!cands.length) cands = pantry.pairings.slice();
  const withMood = cands.filter((p) => p.mood.includes(moodTag));
  return rand(withMood.length ? withMood : cands);
}

export function beatDuration(text: string): number {
  return Math.min(8, Math.max(3, 2.6 + text.length * 0.05));
}

function beatFromPairing(p: Pairing, text: string, attr: string, slot: string): Beat {
  return {
    pairingId: p.id,
    bgId: p.bgId,
    fxId: p.fxId,
    font: p.font,
    color: p.color,
    pos: p.pos,
    cap: p.cap || 64,
    text,
    attr,
    slot,
    dur: beatDuration(text),
  };
}

/** Faked AI. Reads the same tags and taste controls a real model would. */
export function generateFilm(pantry: Pantry, taste: Taste): Film | null {
  if (!pantry.pairings.length) return null;
  const ctx = rand(SAMPLE_CONTEXTS);
  const n = taste.maxBeats;

  let moods: string[];
  if (taste.arc === 'mood') {
    moods = ctx.arc.slice(0, n);
    while (moods.length < n) moods.push(ctx.arc[ctx.arc.length - 1]);
  } else if (taste.arc === 'drive') {
    moods = ['drive', 'intensity', 'intensity', 'drive', 'intensity', 'drive'].slice(0, n);
  } else {
    moods = ['calm', 'resolve', 'introspection', 'intensity', 'hope', 'clarity'].slice(0, n);
    moods[0] = 'calm';
    moods[n - 1] = 'hope';
  }

  const slotForStep = (i: number) => (i === 0 ? 'opening' : i === n - 1 ? 'resolution' : i === n - 2 ? 'climax' : 'the turn');
  const lineSlot = (i: number) => (i === 0 ? 'opener' : i === n - 1 ? 'closer' : i === n - 2 ? 'climax' : 'turn');
  const quoteAt = n >= 3 ? 1 : -1;
  const q = rand(QUOTES);

  let lastBg: string | null = null;
  let zoomIn = true; // the next moving beat zooms in; flips after each use
  const beats: Beat[] = moods.map((moodTag, i) => {
    const slot = slotForStep(i);
    const ls = lineSlot(i);
    const isQuote = i === quoteAt;
    let p = isQuote && taste.quotesReflective ? pickReflective(pantry, moodTag) : pickPairing(pantry, slot, moodTag);
    if (taste.backdrop === 'every' && lastBg && p.bgId === lastBg) {
      const alt = pantry.pairings.filter((x) => x.bgId !== lastBg);
      if (alt.length) {
        const slotAlt = alt.filter((x) => x.best.includes(slot));
        p = rand(slotAlt.length ? slotAlt : alt);
      }
    }
    lastBg = p.bgId;
    const text = isQuote ? q.text : rand(LINES[ls] || LINES.turn);
    const attr = isQuote ? q.attr : '';
    const beat = beatFromPairing(p, text, attr, ls);
    // Compositional Ken Burns: quote and calm beats sit still; the rest
    // alternate zoom in / zoom out so motion breathes instead of droning.
    const still = isQuote || STILL_MOODS.includes(moodTag);
    if (still) {
      beat.kenBurns = 'none';
    } else {
      beat.kenBurns = zoomIn ? 'in' : 'out';
      zoomIn = !zoomIn;
    }
    return beat;
  });

  return { beats, total: beats.reduce((s, b) => s + b.dur, 0), ctx };
}

export { beatFromPairing };
