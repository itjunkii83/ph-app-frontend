'use client';

import React from 'react';
import { Layer } from '@/types/presentation';
import { EffectRenderer } from './EffectRenderer';

interface LayerRendererProps {
  layer: Layer;
  isActive: boolean;
}

export function LayerRenderer({ layer, isActive }: LayerRendererProps) {
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
          left: `${layer.position.x}${layer.position.unit}`,
          top: `${layer.position.y}${layer.position.unit}`,
          width: `${layer.size.width}${layer.size.unit}`,
          height: `${layer.size.height}${layer.size.unit}`,
        }),
  };

  return (
    <div style={style}>
      <EffectRenderer layer={layer} isActive={isActive} />
    </div>
  );
}
