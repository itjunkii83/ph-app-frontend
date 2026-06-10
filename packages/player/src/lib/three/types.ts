// The contract every three.js-backed effect implements.
//
// A "scene" is a self-contained bundle of three.js objects plus an
// update/resize/dispose lifecycle. `useThreeEffect` owns everything *around* the
// scene — loading three, the WebGLRenderer, the animation loop, container
// sizing, and teardown — so each effect only has to build its objects and say
// how to render/update/dispose them. Adding a new three.js effect is therefore
// "write a new ThreeSceneFactory"; nothing else in the player changes.
//
// three is loosely typed (`any`) on purpose: r184 adds renderer APIs
// (`outputBufferType`, `setEffects`) that are not yet in @types/three, and the
// vendored addons are untyped. Keeping the glue `any` lets the player typecheck
// cleanly without fighting incomplete upstream types.

export interface ThreeSceneHandle {
  /**
   * Called once per animation frame.
   * @param elapsedSec seconds since the scene started
   * @param deltaSec   seconds since the previous frame
   */
  render(elapsedSec: number, deltaSec: number): void;
  /** Container resized — update camera aspect, passes, render targets, etc. */
  resize(width: number, height: number): void;
  /** Live config changed — map config values onto uniforms / params. */
  applyConfig(config: Record<string, any>): void;
  /** Release all GPU resources (geometries, materials, textures, targets). */
  dispose(): void;
}

export interface ThreeSceneContext {
  /** The loaded three module (loosely typed — see file header). */
  THREE: any;
  /** The shared `THREE.WebGLRenderer` owned by `useThreeEffect`. */
  renderer: any;
  /** Initial container size in CSS pixels. */
  width: number;
  height: number;
  /** Initial config snapshot. */
  config: Record<string, any>;
}

export type ThreeSceneFactory = (
  ctx: ThreeSceneContext,
) => ThreeSceneHandle | Promise<ThreeSceneHandle>;
