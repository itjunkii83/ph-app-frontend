# CLAUDE.md: studio_v2 (Pause Harbor Studio, the active editor)

This is `apps/studio_v2` (package `studio-v2`), the real pantry editor. It curates
the pantry (backgrounds, text effects, pairings, taste, rules) and renders every
preview through the shared `@harbor/player` engine, so a preview is literally what
ships on the toolkit `/play` route. `apps/studio` ("wisdom") is the permanent
reference parts-donor, not the active editor.

> Read the root [`CLAUDE.md`](../../CLAUDE.md), the player docs
> ([`PLAYBACK.md`](../../packages/player/docs/PLAYBACK.md)), and the effect guides
> ([`EFFECT_SYSTEM.md`](../studio/docs/EFFECT_SYSTEM.md),
> [`CODEPEN.md`](../../docs/CODEPEN.md)) before touching effects. Update the doc you
> touch in the same change.

---

## The cache trap (read this first, it cost us days)

studio_v2 consumes `@harbor/player` **from source**: `transpilePackages:
['@harbor/player']` plus a pnpm `workspace:*` symlink. There is no player build
step. The dev server compiles the player itself.

The hazard: when you edit an effect in `packages/player/src`, the dev server has to
recompile the player. If Next does not know the real workspace root, Turbopack
treats the player source (which lives ABOVE the app dir) as an outside-root,
effectively-immutable input. Result: **your change does not show up**, and wiping
`.next` by hand is the only cure.

The cruelest part of the symptom: an effect's **config schema** recompiles cheaply,
so a new config field (a dropdown, a color) appears in the editor and fools you into
thinking the new code is live. Meanwhile the effect **component's runtime behavior**
(its animation) is still the STALE compiled version. We burned roughly six rewrites
chasing an animation bug that did not exist. The code was right; the bundle was old.

What is in place to prevent it:

- `next.config.ts` sets `turbopack.root` and `outputFileTracingRoot` to the repo
  root. This makes `packages/player/src` a first-class watched input, so a save to a
  player effect hot-reloads here. Keep these set. The toolkit and studio have the
  identical from-source setup and want the same two lines if they ever show the same
  staleness.
- `pnpm --filter studio-v2 dev:clean` wipes `.next` then starts dev, for the rare
  residual stale cache. You should almost never need it now.

Rules that follow from this:

1. **If a `@harbor/player` change does not appear, suspect the cache before the
   code.** Verify the new code is actually live before debugging logic: drop an
   unmistakable sentinel into the change (a bright fill, a `console.log` on mount). If
   the sentinel does not show, it is the cache, not your logic. Do not rewrite the
   implementation on a hypothesis.
2. **Never run `pnpm build` (or `next build`) while the dev server is running.** It
   writes production artifacts into the same `.next` the dev server reads and muddies
   the dev cache. To verify player changes, use
   `pnpm --filter @harbor/player typecheck` (it writes nothing). The user runs
   builds.
3. New FILES cannot be stale. If you are unsure whether HMR is the problem, adding a
   brand-new effect file is a clean test (it must recompile).

---

## The preview render path (where the pixels come from)

Every preview in this app goes through the real player. There is no separate "fake"
renderer anymore (the donor's `Film.tsx` / `FilmSurface` / `FilmText` were deleted).

```
EffectStage (this app)                 builds a one-section Presentation via makeLayer
  -> PresentationPlayer (@harbor/player)
    -> SectionRenderer                 stage layers (backgrounds) + the current slide
      -> LayerRenderer                 absolute, overflow:hidden, full-size box
        -> EffectRenderer              registry lookup, computes durationMs
          -> the effect component      draws the visual, owns its own animation
```

Key facts about `components/EffectStage.tsx`:

- A **background** is a `stageLayer` (zIndex 0); **text** is a slide `layer` (zIndex
  10) inside a band derived from `pos`.
- A background-only preview gives the slide a 1-hour duration so it never completes
  and the backdrop just runs. A text preview loops by remounting on `onComplete` via
  a `tick`.
- The player is keyed by `replayKey` + `tick` ONLY, never by config. Editing config
  updates the live scene in place (e.g. recoloring an orb, the ocean's `applyConfig`)
  instead of remounting and re-fading. Stable `preview-*` layer ids keep the same
  instance mounted across edits.
- `lib/preview.ts` (`bgEffect`, `textEffect`, `NEUTRAL_BG`) assembles the
  `{ effectType, config }` pairs and must stay identical to what `lib/toPresentation.ts`
  emits, so the preview is honest.

Background effects use `duration: indefinite` and do NOT use `useEffectLifecycle`;
the Section transition owns the crossfade, so the effect's animation runs from mount.

---

## Adding or editing an effect

Effects live in `@harbor/player`, not here. The studio is generic over the registry,
so you usually do NOT write studio UI for a new effect:

1. Create the component under `packages/player/src/components/effects/<category>/`,
   export its `EffectDefinition`, add it to that folder's `index.ts`, and register it
   in `packages/player/src/registerEffects.ts`.
2. It then appears automatically in the studio's Effect picker (`effectOptions()` in
   `lib/registry.ts` reads `getEffectsByCategory`) and gets an auto-generated config
   panel from its `configSchema` (`components/EffectConfigPanel.tsx` renders
   `color`, `select`, `number`, `boolean`, `string`, `image`, `font`). No studio
   change needed for standard field types.
3. Update the effects table in `apps/studio/docs/EFFECT_SYSTEM.md` (same change).

Animated CSS / background idiom (see `CloudyBackground.tsx`,
`LiquidGradientBackground.tsx`):

- Inject scoped `@keyframes` via `<style dangerouslySetInnerHTML>` with a
  per-instance id so multiple instances never collide.
- Drive colors through CSS custom properties set inline on the root, so editing a
  color repaints live without rebuilding the keyframes or restarting the motion.
- Make motion large enough to read at small preview sizes; tiny amplitudes look dead
  in a 250px card.

Seeds: `lib/seed.ts` holds the seed pantry. The store hydrates from
localStorage / Firestore, so a NEWLY added seed atom does not appear automatically on
an already-hydrated pantry. To see a new effect immediately, use **Add background**
(or Add effect) and pick it from the dropdown, or **Reset pantry** to reseed.

---

## Working norms (hard constraints)

- **The user tests and runs the apps.** Do NOT run `pnpm dev` / Next servers or drive
  a browser. Do the work, typecheck, and hand off with concrete test steps.
- **The user commits.** Do not `git commit` / `git push`.
- **pnpm only**, never npm. Node is at `$HOME/.nvm/versions/node/v22.22.2/bin`.
- **No em dashes anywhere** (code, copy, comments, commit messages). Use periods,
  commas, colons, parentheses. Before handing off, grep for the em dash character
  across `apps/studio_v2` and `packages/player` and confirm it returns nothing.
- Keep the film / chrome boundary: never pass chrome theme tokens into the player or
  any preview. The player owns its own palette.

## The method lesson (why this was so hard, so it is not again)

When you cannot see the screen, the user is your only renderer and each round-trip is
expensive. The failure mode is debugging blind by rewriting on a hypothesis. Instead:
isolate ONE variable, instrument it (sentinel value, log), confirm the new code is
live BEFORE debugging its logic, and remember that a passing typecheck says nothing
about whether pixels move. For this app specifically, "my `@harbor/player` change did
not show" means **stale cache** until proven otherwise.
