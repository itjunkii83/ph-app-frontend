import type { Layer, LayerPosition, LayerSize } from '@harbor/player';
import { uid } from './utils';

// Every layer the studio emits must carry all of @harbor/player's required Layer
// fields. LayerRenderer returns null when `visible` is false and only treats a
// layer as full-bleed when size is exactly {100,100,'%'}, so partial layers
// render blank. This is the single place those defaults live.

const FULL_BLEED_POSITION: LayerPosition = { x: 0, y: 0, unit: '%' };
const FULL_BLEED_SIZE: LayerSize = { width: 100, height: 100, unit: '%' };

interface MakeLayerOpts {
  // A stable id keeps the same effect instance mounted across config edits, so
  // the renderer updates it in place (live) instead of remounting it. Previews
  // pass a fixed id; generated films omit it and get a fresh uid.
  id?: string;
  zIndex?: number;
  position?: LayerPosition;
  size?: LayerSize;
  opacity?: number;
}

export function makeLayer(
  effectType: string,
  config: Record<string, unknown>,
  opts: MakeLayerOpts = {},
): Layer {
  return {
    id: opts.id ?? uid('layer'),
    effectType,
    config,
    position: opts.position ?? FULL_BLEED_POSITION,
    size: opts.size ?? FULL_BLEED_SIZE,
    opacity: opts.opacity ?? 1,
    blendMode: 'normal',
    zIndex: opts.zIndex ?? 0,
    visible: true,
    locked: false,
  };
}
