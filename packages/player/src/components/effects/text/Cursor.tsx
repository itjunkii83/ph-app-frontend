'use client';

import React, { useRef, useCallback } from 'react';
import { EffectProps, EffectDefinition, ConfigSchema } from '../../../types/effects';
import { useEffectLifecycle } from '../../../hooks/useEffectLifecycle';
import { SPEED_MULTIPLIERS, SpeedOption } from '../../../lib/effects/speed';
import { useFonts } from '../../../hooks/useFonts';
import { useKenBurns } from '../../../hooks/useKenBurns';
import { kenBurnsConfigField, KenBurnsDirection } from '../../../lib/effects/kenBurnsConfig';
import { useBaseCanvas } from '../../../lib/responsive';
import { useFitToBox } from '../../../hooks/useFitToBox';
import { Attribution } from './Attribution';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

// One blink cycle in seconds AT MEDIUM SPEED. The effect scales this by the
// speed multiplier, so Speed governs the blink rate and the three-blink
// lead-in as well as the typing cadence.
const BLINK_S = 1.06;

// A typewriter arrival: a lone cursor blinks for a beat, then the line is typed
// out character by character with the cursor tracking the typing position. The
// text is split and fully laid out (final line breaks) BEFORE anything is
// visible, and chars are revealed in place, so typing never reflows the line.
// The cursor is absolutely positioned (moved via rects), so it adds no layout.

const configSchema: ConfigSchema = {
  text: { type: 'string', label: 'Text', default: '' },
  fontFamily: { type: 'font', label: 'Font Family', default: 'Archivo' },
  fontSize: { type: 'number', label: 'Font Size (max)', default: 56, min: 12, max: 200, step: 1 },
  color: { type: 'color', label: 'Color', default: '#ffffff' },
  textAlign: {
    type: 'select',
    label: 'Text Align',
    default: 'center',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' },
    ],
  },
  duration: { type: 'number', label: 'Hold Duration (s)', default: 0, min: 0, max: 30, step: 0.5 },
  speed: {
    type: 'select',
    label: 'Speed',
    default: 'medium',
    options: [
      { label: 'Slow', value: 'slow' },
      { label: 'Medium', value: 'medium' },
      { label: 'Fast', value: 'fast' },
    ],
  },
  fitToBox: { type: 'boolean', label: 'Fit to box', default: false },
  minFontSize: { type: 'number', label: 'Min Font Size', default: 18, min: 8, max: 120, step: 1 },
  attribution: { type: 'string', label: 'Attribution', default: '' },
  ...kenBurnsConfigField,
};

export function Cursor({ config, isActive, onComplete, durationMs }: EffectProps) {
  const base = useBaseCanvas();
  const text = config.text || '';
  const fontFamily = config.fontFamily || 'Archivo';
  const fontSize = config.fontSize ?? 56;
  const color = config.color || '#ffffff';
  const textAlign = (config.textAlign || 'center') as 'left' | 'center' | 'right';
  const speed = (config.speed || 'medium') as SpeedOption;
  const holdDuration = config.duration ?? 0;
  const fitToBox = config.fitToBox ?? false;
  const minFontSize = config.minFontSize ?? 18;
  const attribution = config.attribution || '';
  const kenBurns = (config.kenBurns || 'none') as KenBurnsDirection;

  useFonts([fontFamily]);

  const effectiveDurationMs = holdDuration > 0 ? holdDuration * 1000 : durationMs;
  const multiplier = SPEED_MULTIPLIERS[speed] ?? 1;
  // Speed-scaled blink cycle: fast blinks snappier, slow blinks lazier.
  const blinkCycle = BLINK_S * multiplier;
  // The zoom target IS the positioning wrapper: the cursor lives inside it, so
  // the zoom scales text and cursor together and they can never drift apart.
  const { zoomRef } = useKenBurns({ direction: kenBurns, durationMs: effectiveDurationMs, speedMultiplier: multiplier });

  const { textRef, fit } = useFitToBox({
    enabled: fitToBox,
    text,
    maxFontSize: fontSize,
    minFontSize,
    base,
    frozen: isActive,
    deps: [fontFamily],
  });

  const splitRef = useRef<SplitText | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLSpanElement | null>(null);

  // Park the cursor against a character. `after` false = leading edge (the
  // pre-typing blink position), true = trailing edge (tracks the typing).
  // Rect-based and absolutely positioned, so moving it never shifts layout.
  // The wrapper may be mid Ken Burns zoom: rects are post-transform, but the
  // cursor's left/top resolve in the wrapper's PRE-transform space, so deltas
  // are divided by the live scale. Sizes divide too (the transform rescales
  // them right back), keeping the cursor glued to the char at any zoom.
  const moveCursor = useCallback((charEl: Element | null, after: boolean) => {
    const cursor = cursorRef.current;
    const wrap = wrapRef.current;
    if (!cursor || !wrap) return;
    if (!charEl) {
      cursor.style.opacity = '0';
      return;
    }
    const c = charEl.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    const s = wrap.offsetWidth > 0 ? w.width / wrap.offsetWidth : 1;
    const charH = c.height / s;
    const width = Math.max(2, charH * 0.06);
    cursor.style.width = `${width}px`;
    cursor.style.height = `${charH * 0.82}px`;
    cursor.style.left = `${((after ? c.right : c.left) - w.left) / s + 1}px`;
    cursor.style.top = `${(c.top - w.top) / s + charH * 0.09}px`;
    cursor.style.opacity = '1';
  }, []);

  const buildEnter = useCallback((el: HTMLElement) => {
    const textEl = textRef.current;
    if (!textEl) return gsap.to({}, { duration: 0 });

    // Settle the fit-to-box size BEFORE splitting so line breaks are captured
    // at the final font size.
    fit();

    if (splitRef.current) {
      splitRef.current.revert();
      splitRef.current = null;
    }
    splitRef.current = new SplitText(textEl, {
      type: 'words,chars',
      wordsClass: 'cursor-word',
      charsClass: 'cursor-char',
    });

    const chars = splitRef.current.chars ?? [];
    const tl = gsap.timeline();
    if (chars.length === 0) {
      tl.set(el, { opacity: 1 });
      tl.to(textEl, { opacity: 1, duration: 0.3 * multiplier });
      return tl;
    }

    // Hide every char while layout is already final, then reveal the stage.
    // Restart the blink animation as the cursor appears so its phase begins
    // on the visible half: three full, clean blinks before typing starts.
    gsap.set(chars, { autoAlpha: 0 });
    tl.set(el, { opacity: 1 });
    tl.call(() => {
      moveCursor(chars[0], false);
      const cur = cursorRef.current;
      if (cur) {
        cur.style.animation = 'none';
        void cur.offsetWidth; // force reflow so the animation truly restarts
        cur.style.animation = `harbor-cursor-blink ${blinkCycle}s steps(1) infinite`;
      }
    }, undefined, 0);

    // Type. Base cadence scales with speed; long text adapts so a paragraph
    // finishes in a bounded time instead of typing forever. Word gaps and
    // sentence punctuation get slightly longer pauses for a human rhythm.
    const per = Math.min(0.055 * multiplier, (6 * multiplier) / chars.length);
    let t = 3 * blinkCycle; // three full blinks of the lone cursor before typing
    chars.forEach((ch, i) => {
      tl.set(ch, { autoAlpha: 1 }, t);
      tl.call(() => moveCursor(ch, true), undefined, t);
      const glyph = ch.textContent || '';
      const wordGap = i + 1 < chars.length && chars[i + 1].parentElement !== ch.parentElement;
      if (/[.!?;:]/.test(glyph)) t += per * 2.6;
      else if (/[,]/.test(glyph)) t += per * 1.8;
      else if (wordGap) t += per * 1.5;
      else t += per;
    });

    // A short settle so the last character lands before the hold begins.
    tl.to({}, { duration: 0.25 }, t);
    return tl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiplier, fit, moveCursor]);

  const buildExit = useCallback((el: HTMLElement) => {
    // The cursor is a child of the container, so it fades out with the text.
    return gsap.to(el, { opacity: 0, duration: 0.4 * multiplier, ease: 'power1.in' });
  }, [multiplier]);

  const resetToIdle = useCallback((el: HTMLElement) => {
    if (splitRef.current) {
      splitRef.current.revert();
      splitRef.current = null;
    }
    // Re-assert the authored hidden idle state. clearProps would DELETE the
    // inline opacity (React's opacity: 0), snapping the container to computed
    // opacity 1 and flashing the reverted text for a frame before React advances.
    gsap.set(el, { opacity: 0 });
    if (cursorRef.current) cursorRef.current.style.opacity = '0';
  }, []);

  const onDispose = useCallback(() => {
    if (splitRef.current) {
      splitRef.current.revert();
      splitRef.current = null;
    }
  }, []);

  const { containerRef } = useEffectLifecycle({
    isActive,
    onComplete,
    durationMs: effectiveDurationMs,
    buildEnter,
    buildExit,
    resetToIdle,
    onDispose,
  });

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', opacity: 0 }}>
      <style>{`@keyframes harbor-cursor-blink { 0%, 55% { visibility: visible; } 56%, 100% { visibility: hidden; } }`}</style>
      <div
        ref={(el) => {
          wrapRef.current = el;
          zoomRef.current = el;
        }}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          ...(kenBurns !== 'none' ? { willChange: 'transform' } : {}),
        }}
      >
        <div
          ref={textRef}
          style={{
            fontFamily,
            color,
            textAlign,
            lineHeight: 1.3,
            maxWidth: '80%',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
          }}
        >
          {text}
        </div>
        <span
          ref={cursorRef}
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 2,
            height: '1em',
            background: color,
            opacity: 0,
            pointerEvents: 'none',
            animation: `harbor-cursor-blink ${blinkCycle}s steps(1) infinite`,
          }}
        />
        <Attribution text={attribution} color={color} />
      </div>
    </div>
  );
}

export const cursorDefinition: EffectDefinition = {
  id: 'cursor',
  name: 'Cursor',
  category: 'text',
  technology: 'html',
  contentInput: 'text',
  configSchema,
  component: Cursor,
  duration: { type: 'auto' },
  performanceCost: 'low',
  selfCompletes: true,
  description: 'A blinking cursor types the line out character by character',
};
