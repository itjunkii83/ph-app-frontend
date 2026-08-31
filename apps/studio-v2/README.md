# Pause Harbor Studio v2

The internal tool for stocking the pantry, blessing pairings, and watching the
generator compose cinematic films from them. Built as a real React app in the
monorepo so it ports cleanly into the main Next.js app.

## Run it

From the monorepo root:

```bash
pnpm install
pnpm --filter studio-v2 dev
```

Then open http://localhost:3002

## The model

- **Pantry** holds the atoms: `Backgrounds` and `Text effects`. Self describing,
  tagged so the model knows when each belongs in a film. Every atom can be
  created, edited, played, and deleted.
- **Pairings** are the molecules. A blessed background plus an effect plus a
  treatment. This is the one surface where your taste is captured. The sample
  line is only a stand in; the model injects the real quote at generation.
- **Taste rules** are two layers: hard composition dials the generator obeys,
  and free text house notes handed to the model as guidance.
- **Preview bench** is the only place a timeline appears. It composes a film for
  a sample person and lets you swap a beat's pairing or reword a line.

## The one rule that matters structurally

The film and the chrome never share a color. `FilmSurface` and `FilmText` draw
from a fixed palette (`--color-filmtext`, `--color-filmmuted`, literal hexes on
pairings). Chrome tokens flip with the theme; film tokens never do. Flipping the
editor to light chrome can never touch what ships inside a film.

## Porting notes

- `lib/types.ts` is the JSON shape the real assembly model will emit. Pure data.
- `lib/generate.ts` is a pure function of `pantry` plus `taste`. Swap the fake
  for a real model call without touching the renderer.
- `lib/store.tsx` persists to localStorage today. Abstract the read and write
  pair behind the same actions to move to Firestore later.
- Chrome color tokens live in `app/globals.css`. Map them onto the main app's
  shadcn HSL variables at port time. The film tokens stay exactly as they are.
