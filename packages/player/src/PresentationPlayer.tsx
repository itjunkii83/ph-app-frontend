"use client";

import * as React from "react";
import { Presentation } from "./types/presentation";
import { getSections } from "./lib/presentation/normalize";
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
}

const DEFAULT_SLIDE_MS = 5000;

/**
 * Plays a presentation natively: normalizes sections/legacy slides into a linear
 * walk, advances each slide by its duration, drives the SectionRenderer, plays
 * the optional soundtrack, and calls onComplete at the end. Sizing is fully
 * container-relative via PresentationStage (no orientation lock, no letterbox).
 *
 * StrictMode-safe: advance timers and the Audio element are torn down on every
 * cleanup, and a ref guards onComplete against a double fire.
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
        });
      });
    });
    return out;
  }, [sections]);

  const [pos, setPos] = React.useState(0);

  // Keep the latest onComplete without retriggering effects, and guard it.
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;
  const doneRef = React.useRef(false);

  const finish = React.useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onCompleteRef.current?.();
  }, []);

  // Advance the current slide after its duration; finish at the end.
  React.useEffect(() => {
    if (steps.length === 0) {
      finish();
      return;
    }
    if (pos >= steps.length) return;
    const timer = window.setTimeout(() => {
      if (pos + 1 >= steps.length) {
        finish();
      } else {
        setPos((p) => p + 1);
      }
    }, steps[pos].duration);
    return () => window.clearTimeout(timer);
  }, [pos, steps, finish]);

  // Native audio. The /play route's in-route Begin tap is the autoplay gesture,
  // so play() should succeed; we still catch a rejection defensively.
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

  const current = steps.length > 0 ? steps[Math.min(pos, steps.length - 1)] : null;
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
        />
      )}
    </PresentationStage>
  );
}
