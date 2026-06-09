# @harbor/player

The shared, **Next-agnostic** presentation playback engine: the renderer, the
effect library, the effect hooks, duration logic, font loading, and the
`PresentationPlayer` orchestrator. Both apps (`apps/toolkit`, `apps/studio`)
import from here so there is exactly one copy of the effect code.

> **Architecture + how-to-extend:** [docs/PLAYBACK.md](./docs/PLAYBACK.md).
> **Media model:** [../../docs/MEDIA.md](../../docs/MEDIA.md).

## Hard rules

- **No `next/*` imports and no firebase imports** anywhere in `src/`. It is a
  plain React 19 client-component library.
- **`react`/`react-dom` are peer dependencies** (provided by the consuming app);
  `gsap` is a bundled dependency.
- It styles itself with inline styles only and does not depend on either app's
  Tailwind config.
- Both apps compile it **from source via `transpilePackages`** (no build step);
  this keeps `'use client'` boundaries correct under the App Router.

## Public API (`src/index.ts`)

| Export | Purpose |
| --- | --- |
| `PresentationPlayer` | Primary entry. Props: `{ presentation, onComplete, className }`. Plays a presentation natively. |
| `PresentationStage` | The playback surface: a container-query context + base-canvas sizing. Used by the player and by the studio sandbox preview. |
| `ManagedFontsProvider` / `useManagedFonts` | Font metadata via context (see Fonts). |
| `useFonts` | Loads font families (reads the font context). |
| `registerEffects` | Idempotent: registers every bundled effect. Called at the player module top; the studio calls it before reading the registry. |
| `getAllEffects` / `getEffect` / `getEffectComponent` / `getEffectsByCategory` / `registerEffect` | The effect registry. |
| `SectionRenderer` / `SlideRenderer` / `LayerRenderer` / `EffectRenderer` | Renderer pieces. |
| `getSections`, `findSlide`, … | Read-only presentation normalization. |
| `preloadPresentationMedia` | Warms the cache for all referenced media (with progress). |
| `calculateReadingDuration`, `getTextStats`, `loadFont`, `loadFonts`, `cqFontSize`, `cqLength`, … | Utilities. |
| types | `Presentation`, `Section`, `Slide`, `Layer`, `EffectDefinition`, `EffectProps`, `ConfigSchema`, `ManagedFont`, … |

## Key concepts

- **Responsive sizing** (`lib/responsive.ts`): authored px are interpreted as
  proportions of the base canvas and emitted as container-relative units
  (`cqi`/`cqb`/`cqmin`) with `clamp()` floors — never `vw`/`vh` (the player is
  sometimes boxed in the studio). `PresentationStage` is the container-query
  context. Never forces or locks orientation; no letterboxing.
- **Fonts via context, not a prop**: `useFonts` runs *inside* effects, so managed
  font metadata reaches it through `ManagedFontsContext`. The toolkit provides
  nothing (per-family Google fallback); the studio wraps its editor in
  `ManagedFontsProvider` with its `/api/fonts` result.
- **The orchestrator** (`PresentationPlayer`): walks sections -> slides. A slide
  with a `selfCompletes` effect (text reveals) advances when that effect finishes
  its enter -> hold -> exit cycle, so exits play in full; other slides advance on
  `slide.duration`. Section changes **crossfade** — each section is an isolated
  stacking context (`isolation: isolate`) and the outgoing one fades out as a unit
  (so per-layer zIndex never leaks across sections and text never collides).
  Plays the optional `settings.audioUrl`. StrictMode-safe (timers/Audio torn down
  on cleanup, advancement guarded, `onComplete` guarded against a double fire).

## Adding an effect

1. Create the component in `src/components/effects/<category>/` exporting an
   `EffectDefinition` (set `selfCompletes: true` if it drives a full
   enter/hold/exit and calls `onComplete`).
2. Re-export its definition from the category `index.ts`.
3. Register it in `src/registerEffects.ts`.

Authored px inside effects must use the responsive helpers (`cqFontSize`, etc.),
not fixed `px`/`vw`/`vh`, so they adapt to the container in any orientation.
