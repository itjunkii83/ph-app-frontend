# Architecture (monorepo)

A pnpm workspace with two Next.js 16 / React 19 apps and one shared package.

```
apps/toolkit     Pause Harbor — user-facing daily ritual (harbor, onboarding,
                 the step runner, the /play moment). pkg name: wisdom-toolkit
apps/studio      Presentation engine — sandbox template editor, /admin,
                 firebase-admin API routes, media uploads. pkg name: wisdom
packages/player  @harbor/player — the shared, Next-agnostic playback engine
                 (renderer + effects + hooks + asset/font resolution). Both
                 apps import it; effect code exists here ONCE.
```

## The boundary: Presentation JSON

A presentation is pure serializable JSON: `sections -> slides -> layers`, each
layer referencing an effect by string id plus a `config` blob, and each
`config.src` / `settings.audioUrl` referencing media by a **relative Storage key**.
It is the only contract between authoring and playback:

```
Studio (authoring)                         Toolkit (playback)
  sandbox/admin edits a Presentation         /play reads the presentation
  -> firebase-admin writes it to             -> client SDK getDoc (lib/presentations.ts)
     Firestore `presentations/{id}`          -> @harbor/player renders it
  media uploaded to Firebase Storage         media loaded from Storage by key
     under presentations/media/ (keys)          resolved against a base URL
```

Both apps target the same Firebase project (`humanos-8eeb8`). See
[MEDIA.md](./MEDIA.md) for the media model and [FIREBASE](#firebase) below.

## Dev workflow

Use **pnpm only**. From the repo root:

```bash
pnpm install                              # one root lockfile
pnpm --filter wisdom-toolkit dev          # run the toolkit
pnpm --filter wisdom dev                  # run the studio
pnpm --filter wisdom-toolkit build        # build (runs tsc)
pnpm --filter wisdom-toolkit lint
pnpm --filter @harbor/player typecheck
pnpm build                                # build both apps
```

There is no test framework. Verify with `build` (tsc) + `lint` + the package
`typecheck`. App owners test in the browser; agents should not start dev servers.

## Firebase

- Shared project `humanos-8eeb8`; client config is public (in each app's
  `lib/firebase/client.ts`). The studio also uses firebase-admin
  (`lib/firebase/admin.ts`, `service-account.json`, gitignored).
- **Storage is enabled**; default bucket `humanos-8eeb8.firebasestorage.app`.
- Security rules live at the repo root: `firestore.rules`, `storage.rules`,
  wired by `firebase.json` + `.firebaserc`. Deploy with `firebase deploy`.
- Per-app env: `NEXT_PUBLIC_STORAGE_BASE_URL` (in each app's `.env.local`;
  documented in `.env.example`). See [MEDIA.md](./MEDIA.md).

## Conventions / gotchas

- **`@harbor/player` is Next-agnostic** — no `next/*` and no firebase imports.
  Both apps compile it from source via `transpilePackages` (no build step). Its
  internals + API: [packages/player/docs/PLAYBACK.md](../packages/player/docs/PLAYBACK.md).
- **The toolkit sets `reactStrictMode: false`** (matching the studio): StrictMode's
  dev double-invoke restarts the GSAP/SplitText effect timelines and leaves text
  static. The player is otherwise StrictMode-safe.
- Each app keeps **its own tsconfig + eslint** (toolkit is `strict`, studio is
  not; different design systems). No shared base — intentional for two apps.
- react/react-dom/next are unified across the apps; the player declares `react` as
  a peer dependency only.

## Where to read more

- [docs/MEDIA.md](./MEDIA.md) — the relative-key media model, Storage rules, cache.
- [packages/player/docs/PLAYBACK.md](../packages/player/docs/PLAYBACK.md) — the player.
- [apps/toolkit/docs/MOMENT.md](../apps/toolkit/docs/MOMENT.md) — the `/play` moment.
- [apps/studio/docs/MEDIA_AUTHORING.md](../apps/studio/docs/MEDIA_AUTHORING.md) — authoring + uploads.
- [apps/studio/docs/EFFECT_SYSTEM.md](../apps/studio/docs/EFFECT_SYSTEM.md) — building effects (now in the player package).
