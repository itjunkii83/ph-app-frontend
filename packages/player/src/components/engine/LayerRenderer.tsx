'use client';

import React from 'react';
import { Layer } from '../../types/presentation';
import { EffectRenderer } from './EffectRenderer';
import { cqLength, useBaseCanvas } from '../../lib/responsive';

interface LayerRendererProps {
  layer: Layer;
  isActive: boolean;
  onComplete?: () => void;
}

export function LayerRenderer({ layer, isActive, onComplete }: LayerRendererProps) {
  const base = useBaseCanvas();
  if (!layer.visible) return null;

  const isFullSize =
    layer.size.width === 100 &&
    layer.size.height === 100 &&
    layer.size.unit === '%';

  const style: React.CSSProperties = {
    position: 'absolute',
    overflow: 'hidden',
    zIndex: layer.zIndex,
    opacity: layer.opacity,
    mixBlendMode: layer.blendMode as any,
    ...(isFullSize
      ? { inset: 0 }
      : {
          // Authored px are proportions of the base canvas, emitted as
          // container-relative units so the composition reflows to the live
          // container's aspect rather than scaling a fixed frame.
          left: cqLength(layer.position.x, layer.position.unit, 'x', base),
          top: cqLength(layer.position.y, layer.position.unit, 'y', base),
          width: cqLength(layer.size.width, layer.size.unit, 'x', base),
          height: cqLength(layer.size.height, layer.size.unit, 'y', base),
        }),
  };

  return (
    <div style={style}>
      <EffectRenderer layer={layer} isActive={isActive} onComplete={onComplete} />
    </div>
  );
}
