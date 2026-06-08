'use client';

import React, { useMemo } from 'react';
import { Section, Slide } from '../../types/presentation';
import { LayerRenderer } from './LayerRenderer';
import { SlideRenderer } from './SlideRenderer';

interface SectionRendererProps {
  section: Section;
  activeSlideIndex: number;
  isActive?: boolean;
  playKey?: number; // Change this to replay animations
  onSlideComplete?: () => void;
}

/**
 * SectionRenderer manages the rendering of a section, including:
 * - Stage layers: persist across all slides within the section (animate once when section starts)
 * - Slides: content animates in/out per slide
 *
 * Stage layers only animate (enter/loop/exit) once per section lifecycle,
 * while slide content layers animate on each slide change.
 */
export function SectionRenderer({
  section,
  activeSlideIndex,
  isActive = true,
  playKey = 0,
  onSlideComplete,
}: SectionRendererProps) {
  // Get current slide (if valid index)
  const currentSlide = useMemo(() => {
    if (activeSlideIndex >= 0 && activeSlideIndex < section.slides.length) {
      return section.slides[activeSlideIndex];
    }
    return section.slides[0] || null;
  }, [section.slides, activeSlideIndex]);

  // Sort stage layers by zIndex
  const sortedStageLayers = useMemo(() => {
    return [...section.stageLayers].sort((a, b) => a.zIndex - b.zIndex);
  }, [section.stageLayers]);

  // Stage layers get a stable key based on section ID (animate once per section)
  // Slide gets a key based on slide ID + playKey (animate on slide change or replay)
  const stageKey = `stage-${section.id}-${playKey}`;
  const slideKey = currentSlide ? `slide-${currentSlide.id}-${playKey}` : null;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      {/* Stage Layers - persist across slides, render behind slide content */}
      {sortedStageLayers.map((layer) => (
        <LayerRenderer
          key={`${stageKey}-${layer.id}`}
          layer={layer}
          isActive={isActive}
        />
      ))}

      {/* Current Slide Content - re-animates on slide change */}
      {currentSlide && slideKey && (
        <SlideRenderer
          key={slideKey}
          slide={currentSlide}
          isActive={isActive}
          onSlideComplete={onSlideComplete}
        />
      )}
    </div>
  );
}
