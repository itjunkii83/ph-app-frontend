"use client";

import * as React from "react";
import { Presentation, Slide } from "./types/presentation";
import { getSections } from "./lib/presentation/normalize";
import { getEffect } from "./components/effects/registry";
import { SectionRenderer } from "./components/engine/SectionRenderer";
import { PresentationStage } from "./PresentationStage";
import { resolveAssetUrl } from "./lib/assets";
import { registerEffects } from "./registerEffects";

// Guarantee every effect is registered before the first render.
registerEffects();

export interface PresentationPlayerProps {
  presentation: Presentation;
  onComplete: () => void;
  className?: string;
  // Storage base URL for resolving relative media keys (config.src, audioUrl).
  assetBaseUrl?: string;
}

interface PlaybackStep {
  sectionIndex: number;
  slideIndex: number;
  duration: number;
  selfCompletes: boolean;
}

// A mounted section in the crossfade stack. The last entry is the active section;
// earlier entries are outgoing sections kept briefly so their background stays
// visible under the incoming one (crossfade instead of a black gap).
interface SectionEntry {
  id: number;
  sectionIndex: number;
  slideIndex: number;
}

const DEFAULT_SLIDE_MS = 5000;
// Safety net so a self-completing slide can never hang if an effect fails to fire
// onComplete; well beyond any real enter + hold + exit cycle.
const SELF_COMPLETE_SAFETY_MS = 120000;
// How long an outgoing section lingers under the incoming one. Covers the longest
// background enter (cloudy-background fades in over ~1.2s).
const SECTION_CROSSFADE_MS = 1500;

function slideSelfCompletes(slide: Slide): boolean {
  return slide.layers.some(
    (l) =>
      l.visible !== false && getEffect(l.effectType)?.selfCompletes === true,
  );
}

/**
 * Plays a presentation natively. A slide with a self-completing effect (text
 * reveals) advances when that effect finishes its enter -> hold -> exit cycle so
 * the exit plays in full; other slides advance on slide.duration. Section changes
 * crossfade: the outgoing section stays mounted under the incoming one so its
 * background fades across rather than through black. Plays the optional
 * settings.audioUrl and calls onComplete at the end.
 *
 * StrictMode-safe: timers and Audio are torn down on cleanup, advancement is
 * guarded per slide, and onComplete is guarded against a double fire.
 */
export function PresentationPlayer({
  presentation,
  onComplete,
  className,
  assetBaseUrl,
}: PresentationPlayerProps) {
  const sections = React.useMemo(() => getSections(presentation), [presentation]);
  const baseWidth = presentation.settings?.baseWidth || 1920;
  const baseHeight = presentation.settings?.baseHeight || 1080;
  const resolvedAudioUrl = resolveAssetUrl(
    presentation.settings?.audioUrl,
    assetBaseUrl ?? "",
  );

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
  const [entries, setEntries] = React.useState<SectionEntry[]>(() =>
    steps.length > 0
      ? [{ id: 0, sectionIndex: steps[0].sectionIndex, slideIndex: steps[0].slideIndex }]
      : [],
  );

  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;
  const doneRef = React.useRef(false);
  const posRef = React.useRef(0);
  posRef.current = pos;
  const stepsRef = React.useRef(steps);
  stepsRef.current = steps;
  const advancedForPos = React.useRef(-1);
  const entryIdRef = React.useRef(0);

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
    const all = stepsRef.current;
    if (p + 1 >= all.length) {
      finish();
      return;
    }
    const from = all[p];
    const to = all[p + 1];
    setPos(p + 1);

    if (from.sectionIndex === to.sectionIndex) {
      // Same section: change the active slide on the current (last) entry.
      setEntries((es) => {
        if (es.length === 0) return es;
        const next = es.slice();
        next[next.length - 1] = {
          ...next[next.length - 1],
          slideIndex: to.slideIndex,
        };
        return next;
      });
    } else {
      // New section: mount it on top and keep the outgoing one(s) mounted briefly
      // so the backgrounds crossfade, then drop everything older than this entry.
      const id = (entryIdRef.current += 1);
      setEntries((es) => [
        ...es,
        { id, sectionIndex: to.sectionIndex, slideIndex: to.slideIndex },
      ]);
      window.setTimeout(() => {
        setEntries((es) => es.filter((e) => e.id >= id));
      }, SECTION_CROSSFADE_MS);
    }
  }, [finish]);

  // Self-completing slides advance on onSlideComplete (with a long safety cap);
  // ambient/static slides advance on slide.duration.
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
    if (!resolvedAudioUrl) return;
    const audio = new Audio(resolvedAudioUrl);
    audio.loop = true;
    void audio.play().catch(() => {
      /* autoplay blocked: the /play gesture normally prevents this */
    });
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [resolvedAudioUrl]);

  return (
    <PresentationStage
      className={className}
      baseWidth={baseWidth}
      baseHeight={baseHeight}
      assetBaseUrl={assetBaseUrl}
    >
      {entries.map((entry, i) => {
        const section = sections[entry.sectionIndex];
        if (!section) return null;
        const isCurrent = i === entries.length - 1;
        return (
          <div
            key={entry.id}
            style={{
              position: "absolute",
              inset: 0,
              // Each section is its own stacking context so a later section
              // cleanly covers an earlier one and per-layer zIndex never leaks
              // across sections (which caused outgoing text to paint over the
              // incoming section). The outgoing section fades out as one unit
              // (background + text together) for a clean crossfade.
              isolation: "isolate",
              opacity: isCurrent ? 1 : 0,
              transition: `opacity ${SECTION_CROSSFADE_MS}ms ease`,
            }}
          >
            <SectionRenderer
              section={section}
              activeSlideIndex={entry.slideIndex}
              isActive
              playKey={0}
              onSlideComplete={isCurrent ? advanceOrFinish : undefined}
            />
          </div>
        );
      })}
    </PresentationStage>
  );
}
