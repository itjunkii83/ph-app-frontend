'use client';

import { useEffect } from 'react';
import type { Anim, Position } from '@/lib/types';
import { useFitText } from '@/lib/fitText';
import { cn } from '@/lib/utils';

const FX_CLASSES = ['fx-rise', 'fx-cut', 'fx-bloom', 'fx-pulse', 'fx-build'];
const FX_MAP: Record<Anim, string> = {
  rise: 'fx-rise',
  cut: 'fx-cut',
  bloom: 'fx-bloom',
  pulse: 'fx-pulse',
  build: 'fx-build',
};

/**
 * The product surface. Always dark, always cinematic. It draws from a fixed
 * palette and never reads a chrome theme token, so flipping the editor to
 * light mode can never touch what ships inside a film.
 */
export function FilmSurface({ bg, className, children, style }: {
  bg?: string;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ background: bg || '#0a0e13', ...style }}
    >
      {children}
    </div>
  );
}

interface FilmTextProps {
  text: string;
  attr?: string;
  anim: Anim;
  font: string;
  color: string;
  cap: number;
  pos: Position;
  playKey?: number;
  bold?: boolean;
}

/** A single line on film. Auto fits, then performs its effect on demand. */
export function FilmText({ text, attr, anim, font, color, cap, pos, playKey = 0, bold }: FilmTextProps) {
  const { containerRef, textRef } = useFitText({ text, cap });
  const fxClass = FX_MAP[anim] || 'fx-rise';

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.classList.remove(...FX_CLASSES);
    // force reflow so the animation restarts cleanly
    void el.offsetWidth;
    el.classList.add(fxClass);
  }, [playKey, fxClass, text, textRef]);

  const align = pos === 'upper' ? 'flex-start' : pos === 'lower' ? 'flex-end' : 'center';
  const pad = pos === 'upper' ? '12%' : pos === 'lower' ? '12%' : '0';

  const words = text.split(' ');

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex justify-center px-[8%]"
      style={{ alignItems: align, paddingTop: pos === 'upper' ? pad : 0, paddingBottom: pos === 'lower' ? pad : 0 }}
    >
      <div className="text-center">
        <div
          ref={textRef}
          style={{ fontFamily: font, color, lineHeight: 1.12, fontWeight: bold ? 600 : 400 }}
        >
          {anim === 'build'
            ? words.map((w, i) => (
                <span key={i} className="w" style={{ animationDelay: `${i * 0.12}s` }}>
                  {w}
                  {i < words.length - 1 ? '\u00A0' : ''}
                </span>
              ))
            : text}
        </div>
        {attr ? <div className="mt-3 text-[13px] tracking-wide text-filmmuted">{attr}</div> : null}
      </div>
    </div>
  );
}
