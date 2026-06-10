# Authoring media in the studio

The studio is the authoring app. Playback (renderer + effects) moved to
`@harbor/player`; the studio consumes it through thin re-export shims at the old
paths (`@/types/*`, `@/components/effects/*`, `@/lib/duration`,
`@/lib/fonts/loader`) and renders the sandbox preview via the package. This doc
covers media upload + how the preview works. The full media model (keys, rules,
cache, resolution) is in [../../../docs/MEDIA.md](../../../docs/MEDIA.md).

## Uploading images (where the UI is)

The image picker lives in a **layer's settings**, only for image effects
(`background-image`, `ken-burns-image`):

1. `/sandbox?id=<presentationId>`.
2. Right debug panel -> **Stage** tab (backgrounds are stage layers) -> click the
   `background-image` layer.
3. Its settings (the EffectConfigurator) show an **Image Source** field with a key
   text box, thumbnails, and **Upload** / **Import bundled** buttons.
4. **Upload** picks a local file; it uploads to Storage under `presentations/media/`
   and sets the layer `src` to the returned **key** (not a URL). **Import bundled**
   seeds the bundled `public/effects/*` images.

Component: `components/debug/StorageImagePicker.tsx` (wired into the `image` case of
`components/debug/EffectConfigurator.tsx`). It stores keys and resolves them via
`NEXT_PUBLIC_STORAGE_BASE_URL` for thumbnail display.

## API routes (firebase-admin)

- `app/api/media/route.ts` — `POST` uploads under `presentations/media/`, sets
  `Cache-Control: public, max-age=31536000`, returns `{ name, key }`; `GET` lists keys.
- `app/api/media/seed/route.ts` — imports the bundled images, returns keys.
- Writes use the admin SDK (service account) and bypass Storage rules; the toolkit
  reads the resulting public, tokenless URLs. Audio uploads should go through the
  same route so they land under the public prefix.

## The sandbox preview

`app/sandbox/page.tsx` renders `<PresentationStage assetBaseUrl=...>` +
`SectionRenderer` from `@harbor/player` (single-slide editing, no orchestrator). It
**preloads every referenced image up front** and gates the preview
("Loading media...") so navigating slides is instant. It wraps the editor in
`StudioFontsProvider` (feeds `/api/fonts` into the player's font context).

## Persisting a presentation

`hooks/usePresentationEditor.ts` autosaves via `PUT /api/presentations/[id]`
(`app/api/presentations/[id]/route.ts`, admin SDK) — the full `sections` tree
(with layer `config.src` keys) + `settings` go to Firestore `presentations/{id}`.

## Migration / fixups

`scripts/migrate-media.cjs` re-uploads bundled images (tokenless, cache header) and
rewrites any presentation `config.src` / `settings.audioUrl` to canonical keys.

## See also

- [../../../docs/MEDIA.md](../../../docs/MEDIA.md) — the media model end to end.
- [EFFECT_SYSTEM.md](./EFFECT_SYSTEM.md) — building effects (source now in the player).
- [../../../packages/player/docs/PLAYBACK.md](../../../packages/player/docs/PLAYBACK.md) — the player.
