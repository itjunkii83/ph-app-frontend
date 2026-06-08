"use client";

import * as React from "react";
import { Presentation, Slide } from "./types/presentation";
import { getSections } from "./lib/presentation/normalize";
import { getEffect } from "./components/effects/registry";
import { SectionRenderer } from "./components/engine/SectionRenderer";
import { PresentationStage } from "./PresentationStage";
import { registerEffects } from "./registerEffects";

// Guarantee every effect is registered before the first render.
registerEffects();

export interface PresentationPlayerProps {
  presentation: Presentation;
  onComplete: () => void;
  className?: string;
}

interface PlaybackStep {
  sectionIndex: number;
  slideIndex: number;
  duration: number;
  selfCompletes: boolean;
}

const DEFAULT_SLIDE_MS = 5000;
// Safety net so a self-completing slide can never hang if an effect fails to fire
// onComplete; well beyond any real enter + hold + exit cycle.
const SELF_COMPLETE_SAFETY_MS = 120000;

function slideSelfCompletes(slide: Slide): boolean {
  return slide.layers.some(
    (l) =>
      l.visible !== false && getEffect(l.effectType)?.selfCompletes === true,
  );
}

/**
 * Plays a presentation natively. A slide that contains a self-completing effect
 * (text reveals) advances when that effect finishes its enter -> hold -> exit
 * cycle, so the exit animation plays in full; other slides advance on
 * slide.duration. Plays the optional settings.audioUrl and calls onComplete at
 * the end. Sizing is fully container-relative via PresentationStage.
 *
 * StrictMode-safe: timers and Audio are torn down on cleanup, advancement is
 * guarded per slide, and onComplete is guarded against a double fire.
 */
export function PresentationPlayer({
  presentation,
  onComplete,
  className,
}: PresentationPlayerProps) {
  const sections = React.useMemo(() => getSections(presentation), [presentation]);

  const baseWidth = presentation.settings?.baseWidth || 1920;
  const baseHeight = presentation.settings?.baseHeight || 1080;
  const audioUrl = presentation.settings?.audioUrl;

  const steps = React.useMemo<PlaybackStep[]>(() => {
    const out: PlaybackStep[] = [];
    sections.forEach((section, sectionIndex) => {
      section.slides.forEach((slide, slideIndex) => {
        out.push({
          sectionIndex,
          slideIndex,
          duration: slide.duration || DEFAULT_SLIDE_MS,
          selfCompletes: slideSelfCompletes(slide),
        });
      });
    });
    return out;
  }, [sections]);

  const [pos, setPos] = React.useState(0);

  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;
  const doneRef = React.useRef(false);
  const posRef = React.useRef(0);
  posRef.current = pos;
  const stepsRef = React.useRef(steps);
  stepsRef.current = steps;
  const advancedForPos = React.useRef(-1);

  const finish = React.useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onCompleteRef.current?.();
  }, []);

  // Advance to the next slide, or finish at the end. Guarded so the
  // onSlideComplete signal and the safety/fallback timer can't double-advance.
  const advanceOrFinish = React.useCallback(() => {
    const p = posRef.current;
    if (advancedForPos.current === p) return;
    advancedForPos.current = p;
    if (p + 1 >= stepsRef.current.length) {
      finish();
    } else {
      setPos(p + 1);
    }
  }, [finish]);

  // Self-completing slides advance on onSlideComplete (with a long safety cap);
  // other slides advance on slide.duration.
  React.useEffect(() => {
    if (steps.length === 0) {
      finish();
      return;
    }
    if (pos >= steps.length) return;
    const step = steps[pos];
    const delay = step.selfCompletes ? SELF_COMPLETE_SAFETY_MS : step.duration;
    const timer = window.setTimeout(advanceOrFinish, delay);
    return () => window.clearTimeout(timer);
  }, [pos, steps, advanceOrFinish, finish]);

  // Native audio. The /play route's in-route Begin tap is the autoplay gesture.
  React.useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.loop = true;
    void audio.play().catch(() => {
      /* autoplay blocked: the /play gesture normally prevents this */
    });
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl]);

  const current =
    steps.length > 0 ? steps[Math.min(pos, steps.length - 1)] : null;
  const section = current ? sections[current.sectionIndex] : null;

  return (
    <PresentationStage
      className={className}
      baseWidth={baseWidth}
      baseHeight={baseHeight}
    >
      {section && current && (
        <SectionRenderer
          section={section}
          activeSlideIndex={current.slideIndex}
          isActive
          playKey={pos}
          onSlideComplete={advanceOrFinish}
        />
      )}
    </PresentationStage>
  );
}
