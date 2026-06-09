# CodePen Extractor (`apps/studio/tools/codepen`)

The **front door of the effect pipeline.** Every visual effect in the player
begins life as someone else's CodePen. This tool pulls a pen's HTML/CSS/JS down
into a self-contained, build-free `.html` file, catalogs it in a local library
with tags + previews, and from there it gets hand-ported into a `@harbor/player`
effect. Nothing in `packages/player/src/components/effects/` exists without a
reference pen having been extracted here first.

```
codepen.io/{user}/pen/{id}
   │  paste URL into the local UI (or `node extract.js <url>`)
   ▼
extract.js  ── puppeteer scrapes the editor, compiles preprocessors,
   │           reassembles ONE standalone .html (no build step needed)
   ▼
apps/studio/tools/codepen/pens/{snake_case_title}.html   +   pens.json (title, tags)
   │  browse / preview / tag in the local catalog UI (server.js, :3333)
   ▼
hand-port into a player effect   →  see apps/studio/docs/EFFECT_SYSTEM.md
   │  (lifecycle, configSchema, SplitText, fromTo, cleanup)
   ▼
@harbor/player effect  →  referenced from Presentation JSON  →  rendered on /play
```

This is the **only** automated step. Extraction is mechanical; the port from a
saved pen to a registered effect is a human/Claude task and is documented in
[apps/studio/docs/EFFECT_SYSTEM.md](../apps/studio/docs/EFFECT_SYSTEM.md) under
*"Porting Effects from CodePen References."* This doc covers everything up to
(and including) the saved pen.

## Where it sits in the monorepo

`apps/studio/tools/codepen` is a **standalone Node tool, not a workspace member.**
It is nested inside `apps/studio`, but the pnpm workspace globs only the top level
of `apps/*` and `packages/*` (see `pnpm-workspace.yaml`) — a nested subdirectory is
not its own workspace package — so this tool keeps its **own** `package.json` and
`node_modules` and its own dependency (`puppeteer`). It does not import from — and is
not imported by — the apps or the player. The handoff to the rest of the repo is
purely the saved `.html` files a human reads while building an effect.

The curated `pens/` library **is committed to git** (it is the team's shared
reference collection); only `node_modules/` is ignored. `pens/.gitkeep` keeps
the directory present even when empty.

## Running it

Install and run from inside the tool — **not** from the repo root, since it is
not a workspace member:

```bash
cd apps/studio/tools/codepen
pnpm install        # pulls puppeteer; downloads a Chromium (allowed via package.json "onlyBuiltDependencies")
pnpm dev            # == node server.js  → http://localhost:3333
```

Then paste a CodePen URL into the form. You can also extract headlessly from the
CLI without the server:

```bash
node extract.js https://codepen.io/GreenSock/pen/emNjgpy
```

Either path writes `pens/{title}.html` and upserts `pens.json`.

> Per the repo testing convention, the app owner runs servers. Treat the above
> as hand-off steps, not something to launch yourself.

## The two files

| File | Role |
|------|------|
| `extract.js` | The scraper. Puppeteer-drives the CodePen editor, compiles any preprocessors, reassembles one standalone HTML file, and upserts `pens.json`. Exports `extractPen(url)`; also runnable as a CLI. |
| `server.js`  | The local catalog. A dependency-free Node `http` server on `:3333` serving a single-page dark UI + a small JSON API for extracting, listing, previewing, code-viewing, and tagging pens. |

There is no framework, no bundler, no build. `server.js` `require`s `extract.js`
directly.

## `extract.js` — the scraper

`extractPen(url)` is the whole story:

1. **Validate + normalize the URL.** Accepts `/pen/`, `/full/`, and `/details/`
   forms via `codepen\.io/([^/]+)/(?:pen|full|details)/([a-zA-Z0-9]+)` and
   normalizes to the canonical `…/pen/{id}` editor URL. A non-matching URL throws
   `Invalid CodePen URL`.
2. **Launch headless Chromium** (viewport 1440×900, a desktop Chrome UA to avoid
   mobile/bot variants), `goto` with `networkidle2` (30s), then wait for
   `#box-html .CodeMirror` (15s) — i.e. wait for the editor to hydrate.
3. **Read the editor DOM** (`page.evaluate`):
   - **Title** from `#editable-title-span` (fallback: `document.title` minus the
     ` - CodePen` suffix).
   - **Source** by reaching into each CodeMirror instance
     (`#box-html`, `#box-css`, `#box-js` → `.CodeMirror.CodeMirror.getValue()`).
   - **Preprocessor flags** by checking whether each `#view-compiled-{html,css,js}`
     button is present and *not* `.hide` (a visible "View Compiled" button means
     that pane uses Pug/Haml, SCSS/LESS, TS/Babel, etc.).
   - **External resources** from the editor's resource inputs
     (`input.css-resource.external-resource`, `input.js-resource.external-resource`)
     — these become `<link>`/`<script src>` tags so CDN deps (GSAP, Three.js,
     Splitting.js…) keep working in the saved file.
4. **Resolve preprocessors to compiled output.** If any pane uses a preprocessor,
   the editor source is *not* runnable as-is, so the tool reads the
   already-compiled output from CodePen's live preview iframe (the frame named
   `CodePen`, behind `#result`): compiled CSS from its `<style>` tags, compiled JS
   from `#rendered-js` (with CodePen's trailing `//# sourceURL=pen.js` comment
   stripped), and compiled HTML from `document.body` with scripts/styles/stylesheet
   links removed. These override the raw editor values. **Net effect: a saved pen
   is always plain HTML/CSS/JS with no build step**, even if the original used
   SCSS or Pug.
5. **Reassemble one standalone document** (`buildHtml`): `<head>` (charset,
   viewport, title), external CSS `<link>`s, an inline `<style>` (when there is
   CSS), then `<body>` with the markup, external JS `<script src>`s, and an inline
   `<script>`. The inline script is tagged `type="module"` when `usesESModules()`
   detects `import`/`export` syntax (module scope changes globals/`this`, so this
   matters when porting).
6. **Persist.** Filename = `toSnakeCase(title) + ".html"` (strip non-alphanumerics,
   spaces→`_`, lowercase). Write into `pens/` (created if missing), then **upsert**
   `pens.json`: add a record with the title and empty tags for a new file, or just
   refresh the title for an existing one — **tags are preserved** across
   re-extraction.

Returns `{ filename, title, outputPath }`.

## `server.js` — the local catalog UI + API

A single Node `http` server (port `3333`, no external deps) that serves one
self-contained HTML page and a small API. The UI: an extract form (top), a
sidebar list of saved pens (starred first, then newest — starred pens marked with a
★), an iframe live-preview, a per-pen tag bar with a "+" to mint new tags, a tag
filter dropdown, top-bar **star** and **delete** actions for the selected pen, and a
Prism-highlighted source-code modal.

### API

| Method & path | Does |
|---------------|------|
| `GET /` | Serve the UI (the big inline `HTML` string). |
| `GET /api/pens` | `{ pens: [{filename,title,tags,starred,mtime}] (starred-desc, then mtime-desc), tags: [...] }`. |
| `GET /api/pens/{file}/code` | Raw source of a pen as `text/plain`. |
| `PUT /api/pens/{file}/tags` | Body `{ tag, action: "add"\|"remove" }` — toggle a tag on one pen. |
| `PUT /api/pens/{file}/star` | Body `{ starred: true\|false }` — pin/unpin a pen to the top of the list (persisted as `starred` on the record). |
| `DELETE /api/pens/{file}` | Delete a pen — removes the `.html` file from `pens/` **and** its `pens.json` record. Destructive; confirmed in the UI. |
| `POST /api/tags` | Body `{ name }` — create a **global** tag (lowercased, deduped). |
| `POST /api/extract` | Body `{ url }` — run `extractPen`, return `{filename,title,outputPath}`. |
| `GET /pens/{file}` | Serve the standalone pen file (the iframe `src`); html/css/js/json mime. |

File-path params are guarded with `path.basename(...)` so requests can't escape
`pens/`.

### `pens.json` — the database

A single JSON file, the source of truth for titles, tags, and starred state:

```jsonc
{
  "pens": {
    "gsap_animate_text.html": { "title": "Gsap Animate Text", "tags": ["gsap", "text"], "starred": true }
  },
  "tags": ["gsap", "text", "bg", "three.js", "splitting.js", "transition", "ui", "canvas", "..."]
}
```

- `tags` is the **global** vocabulary; each pen's `tags` is a subset of it.
- `starred` is an **optional** per-pen boolean, written only when a pen is pinned
  (absent ⇒ not starred), so the committed `pens.json` stays minimal. Starred pens
  sort to the top of the list.
- **`loadDb()` self-heals on every read** via `syncPens()`: it scans `pens/` and
  (a) adds a record for any `.html` file missing from `pens.json` — auto-titling
  it by Title-Casing the filename — and (b) drops records whose file no longer
  exists. So you can drop an `.html` into `pens/` by hand and it shows up in the
  UI; **delete a pen by deleting its file** and the next load prunes the record.
- `syncPens` only **adds/removes whole records** — it never rewrites fields on a
  surviving record, so a pen's `tags` and `starred` survive the self-heal.
- **Pens can be deleted from the UI** (`DELETE /api/pens/{file}`), which removes both
  the file and the record immediately. Hand-deleting the file still works (the next
  `syncPens` prunes the record). Tags remain append-only — there is no delete-tag
  endpoint.

## Gotchas / invariants

- **Standalone, not a workspace package.** `pnpm install` / `pnpm dev` must be run
  from `apps/studio/tools/codepen`, not the repo root. The root `pnpm`/`build`/`lint`
  scripts never touch it.
- **Extraction is coupled to CodePen's editor DOM.** The selectors
  (`#box-html/css/js .CodeMirror`, `#view-compiled-*`, `#editable-title-span`,
  `#result` + the `CodePen`-named frame, `#rendered-js`, the `*-resource` inputs)
  are CodePen internals. If CodePen reskins the editor, extraction breaks here —
  this is the tool's main fragility. The compiled-output path also assumes the pen
  is public and renders without auth.
- **Saved pens are compiled + standalone.** When a pen used a preprocessor, the
  file holds the *compiled* CSS/JS/HTML — you won't see the original SCSS/Pug/TS.
  External CDN resources stay as `<link>`/`<script src>`, so the file needs network
  access to run, just like the original pen did.
- **Filenames derive from titles and can collide.** Two pens that Title-Case to the
  same slug write to the same file; re-extracting a renamed pen yields a *new*
  filename (the old record/tags stay until you delete the old file). Keep titles
  distinct.
- **`pens/` is committed; `node_modules/` is not.** Treat the `.html` library as
  curated source, not scratch — adding/removing pens (including via the UI delete
  button) is a real change to the shared reference collection.

## See also

- [apps/studio/docs/EFFECT_SYSTEM.md](../apps/studio/docs/EFFECT_SYSTEM.md) — the
  downstream step: turning a saved pen into a registered effect (lifecycle,
  `configSchema`, SplitText, `fromTo`, cleanup, and the per-pen mapping table).
- [packages/player/docs/PLAYBACK.md](../packages/player/docs/PLAYBACK.md) — where
  finished effects run.
- [docs/ARCHITECTURE.md](./ARCHITECTURE.md) — how the apps + player fit together.
