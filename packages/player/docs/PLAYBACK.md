# @harbor/player — playback engine

The shared, Next-agnostic engine that renders a Presentation JSON: the renderer,
the effect library, the lifecycle hooks, the orchestrator, responsive sizing, and
asset/font resolution. Both apps import it; the effect code exists here once.

The README is the quick API reference; this is the architecture + how-to-extend.

## Hard rules

- **No `next/*` and no firebase imports** in `src/`. Plain React 19 client lib.
- `react`/`react-dom` are peer deps; `gsap` is bundled.
- Inline styles only — never depends on either app's Tailwind.
- Both apps compile it from source via `transpilePackages` (no build step), so
  `'use client'` boundaries are handled by each app's Next compiler. Every
  effect/renderer/hook file keeps its `'use client'` directive.

## Rendering pipeline

```
PresentationPlayer (orchestrator: timing, crossfade, audio, onComplete)
  -> PresentationStage (container-query context + sizing + asset base)
    -> SectionRenderer (stage layers persist; one active slide)
      -> SlideRenderer (sorts layers by zIndex; tracks self-completing effects)
        -> LayerRenderer (position/size in container units, opacity, blendMode)
          -> EffectRenderer (registry lookup, duration calc)
            -> effect component (renders the visual, owns its GSAP lifecycle)
```

The studio sandbox renders `SectionRenderer` directly inside a `PresentationStage`
(no orchestrator) for single-slide editing.

## The orchestrator (`PresentationPlayer.tsx`)

- Flattens `getSections(presentation)` into a linear walk of `(section, slide)`
  steps.
- **Advancement:** a slide with a `selfCompletes` effect (text reveals) advances
  when that effect finishes its enter -> hold -> exit cycle (so the exit plays in
  full); other slides advance on `slide.duration`. A long safety cap prevents a
  stuck slide from hanging.
- **Section crossfade:** on a section change the outgoing section stays mounted
  briefly under the incoming one; each section wrapper is its own stacking context
  (`isolation: isolate`) so per-layer `zIndex` never leaks across sections, and the
  outgoing section fades out as one unit (background + text together). Tunable via
  `SECTION_CROSSFADE_MS`. Section/slide containers are transparent so the crossfade
  shows through (the stage provides the black floor).
- **Audio:** plays `settings.audioUrl` (resolved to a URL) via `new Audio()`.
- **StrictMode-safe:** timers and Audio are torn down on cleanup, advancement is
  guarded per slide, `onComplete` is guarded against a double fire. (Apps still run
  with `reactStrictMode: false` because the GSAP/SplitText *effects* are not
  StrictMode-safe.)

## Effect system

- Registry: `components/effects/registry.ts` (`registerEffect`/`getEffect`/
  `getAllEffects`). `registerEffects.ts` is the idempotent single registration
  entry — called at the player module top and by the studio before it reads the
  registry.
- Each effect exports an `EffectDefinition` (`id`, `category`, `technology`,
  `configSchema`, `component`, `duration`, `performanceCost`, optional
  `selfCompletes`). `configSchema` drives the studio's debug panel controls.
- `EffectProps` = `{ config, isActive, onComplete?, durationMs? }`.
- **Lifecycle:** `hooks/useEffectLifecycle.ts` drives `isActive -> enter -> active
  -> (hold durationMs) -> exit -> complete` on a GSAP timeline. Effects that drive
  this full cycle and call `onComplete` set `selfCompletes: true` (DreamySmoke,
  MaskedTextReveal) so the orchestrator advances on their completion. Static text
  and ambient backgrounds do not.
- `EffectRenderer` computes `durationMs` from the effect's `duration` mode
  (`fixed` | `auto` = reading time from text | `indefinite`).

### WebGL (three.js) effects

WebGL effects (`components/effects/webgl/`, e.g. Ocean) sit on a small foundation in
`lib/three/`:

- `useThreeEffect(hostRef, factory, config)` lazy-`import('three')`s, creates one
  `WebGLRenderer` (HDR `HalfFloatType` output + ACES tone mapping, capped pixel
  ratio) sized to the host element, runs `setAnimationLoop`, keeps the renderer and
  scene in sync with the responsive container via `ResizeObserver`, pushes live
  config edits through `applyConfig`, and disposes everything on unmount (including
  the unmount-before-the-async-`import`-resolves race).
- A `ThreeSceneFactory` returns a `ThreeSceneHandle`
  (`render`/`resize`/`applyConfig`/`dispose`); adding a three.js effect = writing a
  factory. The component just pairs `useThreeEffect` with `useEffectLifecycle` — the
  lifecycle fades the wrapper's opacity in/out while the canvas keeps drawing.
- three and its addons are imported **dynamically inside the factory**, so three
  (~700 KB) is code-split and never enters a presentation's bundle unless a WebGL
  effect renders. The clouds-enabled `Sky` is vendored (`lib/three/vendor/SkyClouds.js`);
  `Water`/`UnrealBloomPass` are stock `three/addons/*`. Config fields can set
  `group` to render under collapsible sections in the studio panel (Ocean uses Sky /
  Water / Bloom / Clouds).

See [EFFECT_SYSTEM.md](../../../apps/studio/docs/EFFECT_SYSTEM.md) for the deep
guide on building effects (SplitText, duration/speed, config schema, CodePen ports).
Note its file paths now point here (`packages/player/src/components/effects/...`).

## Responsive sizing (`lib/responsive.ts`)

`PresentationStage` is a container-query context (`container-type: size`). Authored
px are interpreted as proportions of the base canvas (`settings.baseWidth/Height`,
default 1920x1080) and emitted as **container-relative units** — `cqi`/`cqb` for
extents, `cqmin` for type with `clamp()` floors — **never `vw`/`vh`** (the player is
sometimes boxed in the studio). `LayerRenderer` uses `cqLength`; text effects use
`cqFontSize`. Never forces/locks orientation; no letterboxing.

Exception: `CloudyBackground`'s cloud-band height is a fixed `500px` — it is
image-intrinsic (matches the cloud PNG, which fades at its bottom), not an authored
dimension. Making it container-relative hard-clips the image (a visible border).

## Asset + font resolution

- Assets: `lib/assets.ts`. Effects call `useAssetUrl(config.src)`; the player
  resolves `settings.audioUrl`. See [docs/MEDIA.md](../../../docs/MEDIA.md).
- Fonts: `fonts/fonts-context.tsx` + `hooks/useFonts.ts`. `useFonts` runs *inside*
  effects, so managed-font metadata reaches it via `ManagedFontsContext` (a prop
  couldn't); it loads families directly from Google Fonts (no `/api/fonts` coupling).
  The studio wraps its editor in `ManagedFontsProvider`; the toolkit relies on the
  Google fallback.
- Preloading: `lib/preload.ts` warms all referenced media before display (depends
  on cacheable responses — see MEDIA.md).

## Adding an effect

1. Create the component in `src/components/effects/<category>/` exporting an
   `EffectDefinition` (set `selfCompletes: true` if it owns a full
   enter/hold/exit and calls `onComplete`).
2. Re-export its definition from the category `index.ts`.
3. Register it in `src/registerEffects.ts`.
4. Size internal lengths with the responsive helpers (`cqFontSize`, etc.), not
   fixed `px`/`vw`/`vh`, unless the dimension is image-intrinsic.
