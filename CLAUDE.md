# CLAUDE.md — monorepo root

This is a pnpm workspace holding two Next.js 16 apps and one shared package. For
app-specific guidance, read the CLAUDE.md inside each app.

## Layout

```
apps/toolkit    Pause Harbor — the user-facing daily ritual (the "harbor",
                onboarding, the step runner, the /play moment). package: wisdom-toolkit
apps/studio     The presentation engine — sandbox template editor, /admin,
                firebase-admin API routes. package: wisdom
packages/player @harbor/player — the shared, Next-agnostic playback engine
                (renderer + effects + hooks). Both apps import it.
```

## Commands

Use **pnpm only**, never npm. From the repo root:

```bash
pnpm install                          # one root lockfile for the whole workspace
pnpm --filter wisdom-toolkit dev      # run the toolkit
pnpm --filter wisdom dev              # run the studio
pnpm --filter wisdom-toolkit build    # build one app (runs its tsc + eslint)
pnpm --filter @harbor/player typecheck
pnpm build                            # build both apps (root script)
```

There is no test framework.

## IMPORTANT — testing

The user tests. Never run `pnpm dev` / Next servers or drive a browser yourself.
Do the work, build/typecheck to verify, then hand off with clear test steps.

The user commits their own code — do not run `git commit`/`git push`.

## The boundary: Presentation JSON

A presentation is pure serializable JSON (sections -> slides -> layers, each layer
referencing an effect by string id + a config blob). It is the only contract
between authoring and playback:

- **Studio** authors presentations and writes them to the Firestore `presentations`
  collection via firebase-admin API routes. Referenced media (images, audio) lives
  in **Firebase Storage** as absolute tokenized download URLs (see `app/api/media`).
- **Toolkit** reads a presentation with the client SDK (`lib/presentations.ts`) and
  renders it with `@harbor/player` on the chromeless `/play` route.

Both apps target the same Firebase project (`humanos-8eeb8`). Storage was enabled
on it; the default bucket is `humanos-8eeb8.firebasestorage.app`. Security rules
live at the root (`firestore.rules`, `storage.rules`, wired by `firebase.json`);
deploy with `firebase deploy`.

## Conventions / gotchas

- **`@harbor/player` is Next-agnostic** — no `next/*` and no firebase imports.
  Both apps compile it from source via `transpilePackages` (no build step). Its
  contract and rules are in `packages/player/README.md`.
- **The toolkit sets `reactStrictMode: false`** (matching the studio): StrictMode's
  dev double-invoke breaks the GSAP/SplitText effect timelines. The player is
  otherwise StrictMode-safe.
- Each app keeps **its own tsconfig and eslint config** (the toolkit is `strict`,
  the studio is not, and they have different design systems). A shared
  tsconfig/eslint base was intentionally not introduced — the per-app configs work
  and a shared base buys little for two apps.
- React/react-dom/next are unified across the apps; the player declares `react` as
  a peer dependency only.
```
