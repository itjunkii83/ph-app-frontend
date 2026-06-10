'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Slide } from '../../types/presentation';
import { LayerRenderer } from './LayerRenderer';
import { getEffect } from '../effects/registry';

interface SlideRendererProps {
  slide: Slide;
  isActive?: boolean;
  // Fired once the slide's self-completing effects have finished their full
  // enter -> hold -> exit cycle. The player uses this to advance, so exit
  // animations play in full rather than being cut by a fixed timer.
  onSlideComplete?: () => void;
}

function selfCompletes(effectType: string): boolean {
  return getEffect(effectType)?.selfCompletes === true;
}

export function SlideRenderer({
  slide,
  isActive = true,
  onSlideComplete,
}: SlideRendererProps) {
  const sortedLayers = useMemo(
    () => [...slide.layers].sort((a, b) => a.zIndex - b.zIndex),
    [slide.layers],
  );

  // Layers that will actually fire onComplete (text reveals, etc).
  const completingIds = useMemo(
    () =>
      sortedLayers
        .filter((l) => l.visible && selfCompletes(l.effectType))
        .map((l) => l.id),
    [sortedLayers],
  );

  const remaining = useRef<Set<string>>(new Set());
  const fired = useRef(false);
  useEffect(() => {
    remaining.current = new Set(completingIds);
    fired.current = false;
  }, [completingIds, slide.id]);

  const handleLayerComplete = useCallback(
    (id: string) => {
      remaining.current.delete(id);
      if (remaining.current.size === 0 && !fired.current) {
        fired.current = true;
        onSlideComplete?.();
      }
    },
    [onSlideComplete],
  );

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        // Transparent so the persistent stage background (and crossfading
        // sections beneath) show through during slide/section changes; the
        // PresentationStage provides the black floor.
        background: 'transparent',
      }}
    >
      {sortedLayers.map((layer) => (
        <LayerRenderer
          key={layer.id}
          layer={layer}
          isActive={isActive}
          onComplete={
            completingIds.includes(layer.id)
              ? () => handleLayerComplete(layer.id)
              : undefined
          }
        />
      ))}
    </div>
  );
}
