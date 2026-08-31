'use client';

import { useMemo, useState } from 'react';
import { PresentationPlayer, type Presentation } from '@harbor/player';
import { makeLayer } from '@/lib/makeLayer';
import { bandFromPos } from '@/lib/toPresentation';
import type { EffectRef } from '@/lib/preview';
import type { Position } from '@/lib/types';

const ASSET_BASE = process.env.NEXT_PUBLIC_STORAGE_BASE_URL ?? '';

// A live preview through the real @harbor/player renderer: a background stage
// layer plus an optional text layer as a single looping slide. This is the one
// preview surface for the editors and the pairing designer, so a preview is
// literally what ships. The `replayKey` remounts the player to replay.
export function EffectStage({
  background,
  text,
  pos = 'center',
  replayKey,
  className,
}: {
  background?: EffectRef | null;
  text?: EffectRef | null;
  pos?: Position;
  replayKey?: number | string;
  className?: string;
}) {
  // Stable ids (preview-*) keep the same effect instance mounted across config
  // edits, so dragging a slider updates the live scene (the ocean's applyConfig)
  // instead of remounting and re-fading. The player is keyed only by `replayKey`
  // + `tick`, never by the config, for the same reason.
  const presentation = useMemo<Presentation>(() => {
    const stageLayers = background
      ? [makeLayer(background.effectType, { ...background.config }, { id: 'preview-bg', zIndex: 0 })]
      : [];
    const band = bandFromPos(pos);
    const layers = text
      ? [makeLayer(text.effectType, { ...text.config }, { id: 'preview-text', zIndex: 10, position: band.position, size: band.size })]
      : [];
    const fontFamily = text?.config?.fontFamily;
    return {
      id: 'preview',
      title: 'Preview',
      sections: [
        // A text effect loops (replays its arrival); a background-only preview
        // runs continuously, so its slide effectively never completes.
        { id: 'preview-section', name: 'Preview', stageLayers, slides: [{ id: 'preview-slide', layers, duration: text ? 6000 : 3_600_000 }] },
      ],
      slides: [],
      settings: {
        defaultTransition: { type: 'fade', duration: 400, easing: 'ease' },
        autoPlay: true,
        loop: true,
        baseWidth: 1920,
        baseHeight: 1080,
      },
      fonts: fontFamily ? [String(fontFamily)] : [],
    };
  }, [background, text, pos]);

  // Loop a text effect by remounting when it finishes. Backgrounds do not loop,
  // so editing a background never triggers a remount.
  const [tick, setTick] = useState(0);

  return (
    <div className={className}>
      <PresentationPlayer
        key={`${replayKey ?? ''}:${tick}`}
        presentation={presentation}
        assetBaseUrl={ASSET_BASE}
        onComplete={text ? () => setTick((t) => t + 1) : () => {}}
      />
    </div>
  );
}
