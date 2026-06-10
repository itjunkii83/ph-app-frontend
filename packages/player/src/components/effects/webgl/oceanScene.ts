// The three.js ocean scene, ported from the r184 `webgl_shaders_ocean` example
// into a reusable `ThreeSceneFactory`. The demo's bobbing chrome box, OrbitControls,
// stats, and lil-gui are dropped — this is a static-camera presentation backdrop.
//
// Everything three-related is imported *inside* the factory (which only runs when
// an ocean layer mounts) so three + addons stay code-split out of the base bundle.
// `THREE` and `renderer` arrive already-loaded from `useThreeEffect`.

import type {
  ThreeSceneContext,
  ThreeSceneFactory,
  ThreeSceneHandle,
} from '../../../lib/three/types';

// Resolved to an emitted asset URL by the bundler; this is just a string and does
// not pull three into the base bundle.
const WATER_NORMALS_URL = new URL(
  '../../../lib/three/assets/waternormals.jpg',
  import.meta.url,
).href;

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
}

export const oceanScene: ThreeSceneFactory = async ({
  THREE,
  renderer,
  width,
  height,
}: ThreeSceneContext): Promise<ThreeSceneHandle> => {
  const [{ Water }, { UnrealBloomPass }, { Sky }] = await Promise.all([
    import('three/addons/objects/Water.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),
    import('../../../lib/three/vendor/SkyClouds.js'),
  ]);

  const scene: any = new THREE.Scene();

  const camera: any = new THREE.PerspectiveCamera(55, width / height, 1, 20000);
  camera.position.set(30, 30, 100);
  camera.lookAt(0, 10, 0);

  const sun: any = new THREE.Vector3();

  // Water
  const waterGeometry: any = new THREE.PlaneGeometry(10000, 10000);
  const waterNormals: any = new THREE.TextureLoader().load(
    WATER_NORMALS_URL,
    (texture: any) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    },
  );
  const water: any = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals,
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: false,
  });
  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  // Sky (vendored: includes the procedural cloud layer)
  const sky: any = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;
  skyUniforms['turbidity'].value = 10;
  skyUniforms['rayleigh'].value = 2;
  skyUniforms['mieCoefficient'].value = 0.005;
  skyUniforms['mieDirectionalG'].value = 0.8;

  // Environment map — regenerated only when the sun moves (it's expensive).
  const pmremGenerator: any = new THREE.PMREMGenerator(renderer);
  const sceneEnv: any = new THREE.Scene();
  let renderTarget: any = null;

  // Tracks the sun params currently baked into the env map. NaN forces the first
  // applyConfig() to run updateSun() (which also seeds sunPosition/sunDirection
  // and scene.environment before the first frame renders).
  const sunState = { elevation: NaN, azimuth: NaN };

  function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - sunState.elevation);
    const theta = THREE.MathUtils.degToRad(sunState.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    skyUniforms['sunPosition'].value.copy(sun);
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();

    if (renderTarget) renderTarget.dispose();

    sceneEnv.add(sky);
    renderTarget = pmremGenerator.fromScene(sceneEnv);
    scene.add(sky);

    scene.environment = renderTarget.texture;
  }

  // Bloom via the r184 built-in post-processing path (needs the renderer's
  // HalfFloat output buffer, configured by useThreeEffect).
  const bloomPass: any = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    1.5,
    0.4,
    0.85,
  );
  bloomPass.threshold = 0;
  renderer.setEffects([bloomPass]);

  return {
    render(elapsedSec: number) {
      // Matches the example's fixed-rate advance (independent of frame delta).
      water.material.uniforms['time'].value += 1.0 / 60.0;
      sky.material.uniforms['time'].value = elapsedSec;
      renderer.render(scene, camera);
    },

    resize(w: number, h: number) {
      // useThreeEffect already called renderer.setSize(w, h).
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      bloomPass.setSize(w, h);
    },

    applyConfig(cfg: Record<string, any>) {
      // Sky / sun (defaults mirror the configSchema below)
      const elevation = num(cfg.elevation, 2);
      const azimuth = num(cfg.azimuth, 140.2);
      if (elevation !== sunState.elevation || azimuth !== sunState.azimuth) {
        sunState.elevation = elevation;
        sunState.azimuth = azimuth;
        updateSun();
      }
      renderer.toneMappingExposure = num(cfg.exposure, 0.0781);

      // Clouds
      skyUniforms['cloudCoverage'].value = num(cfg.cloudCoverage, 0);
      skyUniforms['cloudDensity'].value = num(cfg.cloudDensity, 0);
      skyUniforms['cloudElevation'].value = num(cfg.cloudElevation, 1);

      // Water
      water.material.uniforms['distortionScale'].value = num(
        cfg.distortionScale,
        1.3,
      );
      water.material.uniforms['size'].value = num(cfg.size, 1);

      // Bloom
      bloomPass.strength = num(cfg.bloomStrength, 0.16);
      bloomPass.radius = num(cfg.bloomRadius, 1);
    },

    dispose() {
      // Detach the pass before the renderer is disposed by useThreeEffect.
      renderer.setEffects([]);
      bloomPass.dispose();

      if (renderTarget) renderTarget.dispose();
      pmremGenerator.dispose();

      waterGeometry.dispose();
      water.material.dispose();
      waterNormals.dispose();

      sky.geometry.dispose();
      sky.material.dispose();

      scene.environment = null;
      // Water's private reflection render target is freed when useThreeEffect
      // disposes the renderer and drops the canvas (the GL context is lost).
    },
  };
};
