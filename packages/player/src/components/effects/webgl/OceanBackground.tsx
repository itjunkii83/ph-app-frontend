'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import {
  EffectProps,
  EffectDefinition,
  ConfigSchema,
} from '../../../types/effects';
import { useEffectLifecycle } from '../../../hooks/useEffectLifecycle';
import { useThreeEffect } from '../../../lib/three/useThreeEffect';
import { oceanScene } from './oceanScene';

// Mirrors the example's GUI: Sky / Water / Bloom / Clouds folders. Defaults are
// the values from the reference screenshot (which differ from the example file's
// own defaults). Note Sky and Clouds both have an "elevation" control — the
// config keys differ (`elevation` vs `cloudElevation`); only the labels collide.
const configSchema: ConfigSchema = {
  // Sky
  elevation: { type: 'number', label: 'elevation', default: 2, min: 0, max: 90, step: 0.1, group: 'Sky' },
  azimuth: { type: 'number', label: 'azimuth', default: 140.2, min: -180, max: 180, step: 0.1, group: 'Sky' },
  exposure: { type: 'number', label: 'exposure', default: 0.0781, min: 0, max: 1, step: 0.0001, group: 'Sky' },
  // Water
  distortionScale: { type: 'number', label: 'distortionScale', default: 1.3, min: 0, max: 8, step: 0.1, group: 'Water' },
  size: { type: 'number', label: 'size', default: 1, min: 0.1, max: 10, step: 0.1, group: 'Water' },
  // Bloom
  bloomStrength: { type: 'number', label: 'strength', default: 0.16, min: 0, max: 3, step: 0.01, group: 'Bloom' },
  bloomRadius: { type: 'number', label: 'radius', default: 1, min: 0, max: 1, step: 0.01, group: 'Bloom' },
  // Clouds
  cloudCoverage: { type: 'number', label: 'coverage', default: 0, min: 0, max: 1, step: 0.01, group: 'Clouds' },
  cloudDensity: { type: 'number', label: 'density', default: 0, min: 0, max: 1, step: 0.01, group: 'Clouds' },
  cloudElevation: { type: 'number', label: 'elevation', default: 1, min: 0, max: 1, step: 0.01, group: 'Clouds' },
};

export function OceanBackground({ config, isActive }: EffectProps) {
  // The fade wrapper (driven by the lifecycle) and the WebGL host are separate:
  // the wrapper's opacity animates in/out while the canvas keeps rendering.
  const hostRef = useRef<HTMLDivElement>(null);

  const { containerRef } = useEffectLifecycle({
    isActive,
    buildEnter: (el) =>
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' }),
    buildExit: (el) => gsap.to(el, { opacity: 0, duration: 1.0, ease: 'power2.in' }),
    resetToIdle: (el) => {
      gsap.set(el, { clearProps: 'opacity' });
    },
  });

  useThreeEffect(hostRef, oceanScene, config);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        opacity: 0,
      }}
    >
      <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}

export const oceanDefinition: EffectDefinition = {
  id: 'ocean',
  name: 'Ocean',
  category: 'background',
  technology: 'webgl',
  contentInput: 'none',
  configSchema,
  component: OceanBackground,
  duration: { type: 'indefinite' },
  performanceCost: 'high',
  description:
    'Animated three.js ocean with a dynamic Preetham sky, procedural clouds, and bloom',
};
