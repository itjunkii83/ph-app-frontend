# The moment (`/play`)

How the toolkit plays a presentation. The "moment" is session step zero — a
chromeless, full-viewport takeover that plays today's presentation via
`@harbor/player`, then returns to the runner. The toolkit never renders
presentations itself; it reads the JSON and hands it to the player.

## Flow

```
Harbor "Start practice" -> /practice (runner)
  runner step zero = the motivation moment (components/steps/motivation-step.tsx)
    its CTA navigates to /play          (navigation only; the real gesture is on /play)
/play (app/play/page.tsx, chromeless)
  reads today's presentation            (lib/presentations.ts)
  preloads all media                    (preloadPresentationMedia; buffering bar)
  Begin = the primary gesture + loading state
    tap -> <PresentationPlayer presentation onComplete assetBaseUrl />
  onComplete -> session.completeStep(<momentId>) -> router.replace('/practice')
runner re-mounts, firstIncomplete resume lands on the next step
```

## Key pieces

- **`app/play/page.tsx`** — the route. Derives the presentation from the config's
  motivation `presentationId` (or, as a dev convenience, the latest presentation if
  none is pinned). Preloads media before enabling **Begin**; the Begin tap is the
  autoplay user-activation that starts audio synchronously. Passes
  `assetBaseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL` to the player and the
  preloader.
- **`lib/presentations.ts`** — `getPresentation(id)` / `getLatestPresentation()` via
  the client SDK (shared Firebase project). Requires the `presentations` read rule
  (firestore.rules).
- **`lib/types.ts`** — `MotivationConfig.presentationId` (set in
  `data/dashboard-config.json`).
- **`components/steps/motivation-step.tsx`** — the runner's step-zero poster; its
  CTA only navigates to `/play` (no play/audio intent). Falls back to the inline
  placeholder when no `presentationId`.
- **`components/onboarding/first-run-redirect.tsx`** — exempts `/play` from the
  first-run onboarding bounce (a direct load can read the default onboarding value
  for a render before the store hydrates; the value reconciles before it returns to
  `/practice`).

## Why the advance survives the round trip

`/play` and `/practice` are both under the root layout's `StoreProvider`
(`AuthProvider -> AuthGate -> StoreProvider`). `completeStep` writes the shared
in-memory snapshot **and** the synchronous localStorage mirror, so when the runner
re-mounts on `/practice` its `firstIncomplete` resume sees the moment complete and
lands on the next step.

## Media + playback

Media is preloaded before Begin and resolved from relative keys — see
[../../../docs/MEDIA.md](../../../docs/MEDIA.md). The player's behavior (timing,
crossfades, audio) is in
[../../../packages/player/docs/PLAYBACK.md](../../../packages/player/docs/PLAYBACK.md).

## Gotchas

- The toolkit keeps `reactStrictMode: false` — the player's GSAP/SplitText effects
  break under StrictMode's dev double-invoke.
- `NEXT_PUBLIC_STORAGE_BASE_URL` must be set (`.env.local`); env changes need a dev
  server restart. If unset, `resolveAssetUrl` warns in the console and media won't
  resolve.
