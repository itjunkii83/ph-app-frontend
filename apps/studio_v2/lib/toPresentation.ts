import type { Presentation, Section, Slide, LayerPosition, LayerSize } from '@harbor/player';
import { calculateReadingDuration } from '@harbor/player';
import type { Background, Beat, Film, Pantry, Position } from './types';
import { makeLayer } from './makeLayer';
import { uid } from './utils';

// How long each beat holds on screen (the time the text sits after entering,
// before it exits). 'quick' is a fixed 2s for fast review; 'realistic' uses the
// player's reading-time math (200 wpm) so a long line holds long enough to read.
export type Timing = 'quick' | 'realistic';

function beatTiming(text: string, timing: Timing): { holdSec: number; slideMs: number } {
  if (timing === 'quick') return { holdSec: 2, slideMs: 2000 };
  const ms = calculateReadingDuration(text);
  return { holdSec: ms / 1000, slideMs: ms };
}

// Film -> Presentation. The one contract between the studio's pantry model and
// what @harbor/player plays (and therefore what ships on /play). The atoms carry
// real effect ids + config, so this reads them directly.

// A CSS background for editor swatches/timeline chips. Real for gradients; a
// neutral chip for image / ocean backgrounds (which cannot be a CSS string).
export function bgSwatch(bg?: Background): string {
  if (!bg) return '#0a0e13';
  if (bg.effectType === 'gradient-background') {
    return String(bg.config.background ?? '#0a0e13');
  }
  return '#11161c';
}

// Vertical placement. The text effects center within their layer box, so upper /
// lower are expressed as a band rather than a font-position config.
export function bandFromPos(pos: Position): { position: LayerPosition; size: LayerSize } {
  switch (pos) {
    case 'upper':
      return { position: { x: 0, y: 8, unit: '%' }, size: { width: 100, height: 46, unit: '%' } };
    case 'lower':
      return { position: { x: 0, y: 54, unit: '%' }, size: { width: 100, height: 46, unit: '%' } };
    default:
      return { position: { x: 0, y: 0, unit: '%' }, size: { width: 100, height: 100, unit: '%' } };
  }
}

// Group beats into contiguous runs sharing a bgId. Each run becomes a Section
// whose stageLayer is the background; a backdrop change starts a new Section.
// This is the "change the backdrop only on meaning shift" rule, expressed as
// section boundaries.
function groupByBackdrop(beats: Beat[]): Beat[][] {
  const runs: Beat[][] = [];
  for (const beat of beats) {
    const last = runs[runs.length - 1];
    if (last && last[0].bgId === beat.bgId) last.push(beat);
    else runs.push([beat]);
  }
  return runs;
}

export function filmToPresentation(
  film: Film,
  pantry: Pantry,
  opts: { title?: string; id?: string; timing?: Timing } = {},
): Presentation {
  const timing = opts.timing ?? 'realistic';
  const bgById = (id: string) => pantry.backgrounds.find((b) => b.id === id);
  const fxById = (id: string) => pantry.textEffects.find((f) => f.id === id);

  const fonts = new Set<string>();

  const sections: Section[] = groupByBackdrop(film.beats).map((run) => {
    const bg = bgById(run[0].bgId);
    const bgLayer = makeLayer(
      bg?.effectType ?? 'gradient-background',
      bg ? { ...bg.config } : {},
      { zIndex: 0 },
    );

    const slides: Slide[] = run.map((beat) => {
      const fx = fxById(beat.fxId);
      fonts.add(beat.font);
      const band = bandFromPos(beat.pos);
      const { holdSec, slideMs } = beatTiming(beat.text, timing);

      const textLayer = makeLayer(
        fx?.effectType ?? 'basic-text',
        {
          // The atom's curated effect options first (splitMode, speed, etc.),
          // then the pairing/beat treatment overrides.
          ...(fx?.config ?? {}),
          text: beat.text,
          fontFamily: beat.font,
          // The pairing cap is the MAX size; fitToBox shrinks long lines to fit.
          fontSize: beat.cap,
          fitToBox: true,
          minFontSize: 18,
          color: beat.color,
          textAlign: 'center',
          attribution: beat.attr || undefined,
          // Self-completing text effects honor config.duration (seconds) as the
          // hold; the slide.duration below is the fallback for non-self-completing
          // effects (basic-text).
          duration: holdSec,
        },
        { zIndex: 10, position: band.position, size: band.size },
      );

      return {
        id: uid('slide'),
        layers: [textLayer],
        duration: slideMs,
      };
    });

    return {
      id: uid('section'),
      name: bg?.name ?? 'Section',
      stageLayers: [bgLayer],
      slides,
    };
  });

  return {
    id: opts.id ?? uid('pres'),
    title: opts.title ?? 'Sample',
    sections,
    // sections is authoritative; the legacy flat slides array stays empty.
    slides: [],
    settings: {
      defaultTransition: { type: 'fade', duration: 500, easing: 'ease' },
      autoPlay: true,
      loop: false,
      baseWidth: 1920,
      baseHeight: 1080,
    },
    fonts: Array.from(fonts),
  };
}
