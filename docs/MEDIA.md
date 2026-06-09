# Media model

How presentation media (images, audio) is stored, served, resolved, and cached.
This spans the studio (writes), Firebase Storage (serves), and the toolkit +
player (reads). Read this before touching anything media-related.

## The rule: relative keys, not baked URLs

Presentations store a **relative Storage key** (the object path), never an
absolute or tokenized URL:

```json
{ "config": { "src": "presentations/media/bg.jpg" } }
{ "settings": { "audioUrl": "presentations/media/theme.mp3" } }
```

The player resolves the key at render time against a **per-app configured base
URL**. So moving buckets or fronting a CDN is a config change, not a data rewrite,
and there are no revocable per-object download tokens baked into the data.

> History: an earlier pass baked absolute `getDownloadURL` strings (with
> `?token=…`) into docs. That is the anti-pattern this model replaces — tokens are
> revocable and the bucket is embedded in every URL.

## All media lives under `presentations/media/**`

This is the **only public-read prefix** (see Storage rules below). It matters most
for audio: a browser `<img>`/`<audio>` GET carries no Firebase auth, so an asset
outside the public prefix **403s silently** even on an authenticated `/play`. The
upload route writes everything (images and audio) under this prefix by default.

## Resolution (`resolveAssetUrl`)

`packages/player/src/lib/assets.ts` is the single chokepoint for images and audio.
`resolveAssetUrl(src, base)`:

- empty -> empty.
- absolute/`data:`/`blob:` -> **fenced external escape hatch** (dev `console.warn`;
  relative keys are canonical).
- non-empty key + **empty base** -> dev `console.warn` (`NEXT_PUBLIC_STORAGE_BASE_URL`
  unset).
- key **not under `presentations/media/`** -> dev `console.warn` (will 403 tokenlessly).
- otherwise -> `base + encodeURIComponent(key) + "?alt=media"`.

The base URL is `NEXT_PUBLIC_STORAGE_BASE_URL`, e.g.
`https://firebasestorage.googleapis.com/v0/b/humanos-8eeb8.firebasestorage.app/o/`.
Set it in each app's `.env.local` (gitignored); documented in `.env.example`.
Effects read it via the `AssetContext` that `PresentationStage` provides; the
toolkit `/play` and studio sandbox pass it as `assetBaseUrl`.

## Storage security rules (`storage.rules`)

```
match /presentations/media/{allPaths=**} { allow read: if true; }       // public
match /presentations/{allPaths=**}        { allow read: if request.auth != null; }
```

- Public read is scoped **exactly** to `presentations/media/**` — keep nothing
  sensitive there. The rest of `presentations/` is auth-gated; the rest of the
  bucket is default-deny.
- No client write rule: uploads go through the studio's firebase-admin route,
  which bypasses rules.
- Deploy: `firebase deploy --only storage`.

## Cache-Control (why preloading works)

Firebase serves objects with `Cache-Control: private, max-age=0` by default, so the
browser will not cache them and re-downloads on every display — which defeats
preloading. Uploads therefore set **`Cache-Control: public, max-age=31536000`** on
every object (`apps/studio/app/api/media/route.ts`, `seed/route.ts`, and the
migration). Media is stable per key; a changed asset gets a new key.

## Upload + authoring

- Route: `apps/studio/app/api/media/route.ts` (admin SDK). `POST` uploads under
  `presentations/media/`, sets the cache header, returns `{ name, key }`.
  `GET` lists keys. `/api/media/seed` imports the bundled `public/effects/*`.
- Picker: `apps/studio/components/debug/StorageImagePicker.tsx` (used by the
  EffectConfigurator's `image` field). Stores the **key** on the layer; resolves
  the key for thumbnail display. **Upload** = pick a local file; **Import bundled**
  = seed the bundled images.
- See [apps/studio/docs/MEDIA_AUTHORING.md](../apps/studio/docs/MEDIA_AUTHORING.md).

## Preloading

Media is warmed before display so there is no black-frame pop-in:
- Toolkit `/play`: `preloadPresentationMedia(presentation, base, onProgress)` runs
  before the Begin gate; the buffering bar shows progress.
- Studio sandbox: preloads all referenced images up front and gates the preview
  ("Loading media...") so slide navigation is instant.
Preloading only helps because the objects are cacheable (see Cache-Control).

## CORS

Not needed: every image-loading effect uses CSS `background-image` (no canvas /
WebGL texture sampling). If a future effect samples an image into a canvas/WebGL,
bucket CORS for the app origins would be required.

## Migration / fixups

`apps/studio/scripts/migrate-media.cjs` (run with the service account from the repo
root: `node apps/studio/scripts/migrate-media.cjs`) re-uploads the bundled images
tokenlessly with the cache header and rewrites any presentation `config.src` /
`settings.audioUrl` to canonical keys (extracting the object path from legacy
absolute URLs). Safe to re-run.

## Setup checklist (new environment)

1. Enable Firebase Storage on the project (console) — provisions the default bucket.
2. `firebase deploy --only firestore:rules,storage`.
3. `cp .env.example .env.local` in each app and confirm `NEXT_PUBLIC_STORAGE_BASE_URL`.
4. Upload media via the studio picker (or `migrate-media.cjs` to seed the bundled set).
