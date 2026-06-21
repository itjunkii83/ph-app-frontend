import type { Background, Position, TextEffect } from './types';

// Helpers that assemble {effectType, config} pairs for the live EffectStage
// previews, keeping the preview config identical to what toPresentation emits so
// the preview is literally what ships.

export interface EffectRef {
  effectType: string;
  config: Record<string, unknown>;
}

export function bgEffect(bg?: Background | null): EffectRef | null {
  if (!bg) return null;
  return { effectType: bg.effectType, config: { ...bg.config } };
}

// A neutral dark backdrop for previewing a text effect on its own.
export const NEUTRAL_BG: EffectRef = {
  effectType: 'gradient-background',
  config: {
    background:
      'radial-gradient(700px 460px at 50% 45%,rgba(150,172,196,.20),transparent 64%),linear-gradient(180deg,#14191f,#0a0e13)',
  },
};

export interface Treatment {
  text: string;
  font: string;
  color: string;
  cap: number;
  attr?: string;
  align?: 'left' | 'center' | 'right';
}

export function textEffect(fx: TextEffect | undefined | null, t: Treatment): EffectRef | null {
  if (!fx) return null;
  return {
    effectType: fx.effectType,
    config: {
      // The atom's curated animation options first, then the treatment.
      ...fx.config,
      text: t.text,
      fontFamily: t.font,
      fontSize: t.cap,
      fitToBox: true,
      minFontSize: 18,
      color: t.color,
      textAlign: t.align ?? 'center',
      attribution: t.attr || undefined,
    },
  };
}

export type { Position };
