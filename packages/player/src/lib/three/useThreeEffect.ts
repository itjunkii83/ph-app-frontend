'use client';

import { useEffect, useRef, type RefObject } from 'react';
import type { ThreeSceneFactory, ThreeSceneHandle } from './types';

/**
 * Mounts a three.js scene into `hostRef` and drives its whole lifecycle.
 *
 * Responsibilities (so individual effects don't repeat them):
 * - lazy `import('three')` so three is code-split out of the base bundle and
 *   only loads when a WebGL effect actually renders;
 * - create one `WebGLRenderer` (HDR `HalfFloatType` output + ACES tone mapping,
 *   capped pixel ratio) sized to the host element, append its canvas;
 * - build the scene via the supplied `factory`, then run `setAnimationLoop`;
 * - keep the renderer + scene in sync with the responsive container via a
 *   `ResizeObserver` (the player sizes effect containers with container-query
 *   units, so the host's pixel size changes as the viewport does);
 * - push live `config` changes into the scene via `applyConfig`;
 * - tear everything down on unmount, including the case where the component
 *   unmounts before the async `import`/`factory` resolves.
 *
 * The host must be a positioned, sized element (e.g. `position:absolute; inset:0`).
 */
export function useThreeEffect<T extends HTMLElement = HTMLElement>(
  hostRef: RefObject<T | null>,
  factory: ThreeSceneFactory,
  config: Record<string, any>,
) {
  // Latest config, readable from the async setup closure without re-running it.
  const configRef = useRef(config);
  configRef.current = config;

  // Live handle, so the config effect can push updates after async setup.
  const handleRef = useRef<ThreeSceneHandle | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let renderer: any = null;
    let handle: ThreeSceneHandle | null = null;
    let observer: ResizeObserver | null = null;
    let timer: any = null;
    // `any` (not HTMLCanvasElement | null): it's assigned from the untyped
    // renderer, and strict null-checks in the consuming app otherwise flag it.
    let canvas: any = null;

    const readSize = () => {
      const rect = host.getBoundingClientRect();
      return {
        width: Math.max(1, Math.floor(rect.width)),
        height: Math.max(1, Math.floor(rect.height)),
      };
    };

    (async () => {
      const THREE: any = await import('three');
      if (cancelled) return;

      const { width, height } = readSize();

      // HalfFloat output is required for `renderer.setEffects([...])` (the r184
      // built-in post-processing path used for bloom).
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        outputBufferType: THREE.HalfFloatType,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;

      canvas = renderer.domElement;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      host.appendChild(canvas);

      const built = await factory({
        THREE,
        renderer,
        width,
        height,
        config: configRef.current,
      });

      // Unmounted while the factory was resolving — dispose what we made.
      if (cancelled) {
        try {
          built.dispose();
        } catch {
          /* ignore */
        }
        renderer.dispose();
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        renderer = null;
        canvas = null;
        return;
      }

      handle = built;
      handleRef.current = built;
      handle.applyConfig(configRef.current);
      handle.resize(width, height);

      // Timer is Clock's successor (Clock is deprecated as of r180). Connecting
      // it to `document` opts into the Page Visibility API so a large delta
      // spike isn't emitted when a backgrounded tab is refocused.
      timer = new THREE.Timer();
      timer.connect(document);
      renderer.setAnimationLoop((timestamp: number) => {
        timer.update(timestamp);
        handle?.render(timer.getElapsed(), timer.getDelta());
      });

      observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry || !renderer) return;
        const w = Math.max(1, Math.floor(entry.contentRect.width));
        const h = Math.max(1, Math.floor(entry.contentRect.height));
        renderer.setSize(w, h);
        handle?.resize(w, h);
      });
      observer.observe(host);
    })();

    return () => {
      cancelled = true;
      handleRef.current = null;
      if (observer) observer.disconnect();
      if (renderer) renderer.setAnimationLoop(null);
      if (timer) timer.dispose();
      if (handle) {
        try {
          handle.dispose();
        } catch {
          /* ignore */
        }
      }
      if (renderer) renderer.dispose();
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
    // Set up once per mount; `config` updates flow through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push live config edits (sandbox sliders) into the running scene.
  useEffect(() => {
    handleRef.current?.applyConfig(config);
  }, [config]);
}
