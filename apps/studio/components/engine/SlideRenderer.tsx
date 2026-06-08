'use client';

import React from 'react';
import { Slide } from '@/types/presentation';
import { LayerRenderer } from './LayerRenderer';

interface SlideRendererProps {
  slide: Slide;
  isActive?: boolean;
}

export function SlideRenderer({ slide, isActive = true }: SlideRendererProps) {
  const sortedLayers = [...slide.layers].sort((a, b) => a.zIndex - b.zIndex);

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
      {sortedLayers.map((layer) => (
        <LayerRenderer key={layer.id} layer={layer} isActive={isActive} />
      ))}
    </div>
  );
}
