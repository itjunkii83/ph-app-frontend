# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Important:** Read `VISION.md` for product direction, architecture decisions, and the phased implementation plan. That document describes WHERE we're going. This document describes WHAT EXISTS today.

## Commands

```bash
pnpm dev          # Start dev server (Next.js)
pnpm build        # Production build (includes TypeScript + ESLint checks)
pnpm lint         # ESLint only
pnpm start        # Serve production build
```

Always use **pnpm**, not npm.

No test framework is configured. There are no test commands.

## Architecture

Wisdom is a **layer-based presentation engine** built with Next.js 15 (App Router), React 19, and Firebase. Users compose slides by stacking effect layers (background images, text, particles, etc.) that render independently and composite together.

### Rendering Pipeline

```
Slide { layers[] }
  → SlideRenderer (sorts by zIndex)
    → LayerRenderer × N (position, size, opacity, blendMode)
      → EffectRenderer (registry lookup)
        → EffectComponent (renders the actual visual)
```

- `components/engine/SlideRenderer.tsx` — top-level renderer, takes a `Slide` object
- `components/engine/LayerRenderer.tsx` — applies layer layout properties
- `components/engine/EffectRenderer.tsx` — resolves effect by ID from registry, renders component

### Effect System

> **Before creating, modifying, or debugging any effect, read `docs/EFFECT_SYSTEM.md`.** It covers the lifecycle hook, SplitText rules, duration modes, speed system, config schema patterns, and how to port CodePen references into Wisdom effects.

Effects are self-registering modules. Each exports an `EffectDefinition` (id, name, category, technology, configSchema, component, performanceCost) and registers itself via `registerEffect()`.

- `components/effects/registry.ts` — Map-based registry with `registerEffect()`, `getEffect()`, `getAllEffects()`
- `components/effects/index.ts` — Side-effect imports that trigger registration at module load
- `components/effects/backgrounds/`, `components/effects/text/` — Effect implementations
- `tools/codepen/pens/` — CodePen HTML references for porting new effects

To add a new effect: create the component, export its definition, and add a side-effect import in `components/effects/index.ts`.

The `configSchema` on each effect drives the debug panel UI — field types (`string`, `number`, `range`, `boolean`, `color`, `select`, `image`, `font`) map to shadcn form controls in `EffectConfigurator`.

### Debug Panel (Sandbox Editor)

`app/sandbox/page.tsx` is the live editor. The right-side debug panel (`components/debug/`) uses **shadcn/ui** with **dark mode scoped via `className="dark"`** on the panel wrapper only (not on `<html>`). The rest of the app stays unaffected.

Portaled Radix components (Popover, Select, Tooltip) need `className="dark z-[250]"` because the debug panel is at `z-[200]` and portals render at the document body.

Layer reordering uses `@dnd-kit/sortable`. The API is `onReorderLayers(orderedIds: string[])` — the callback receives the full ordered array and reassigns zIndex values.

### Firebase

- `lib/firebase/client.ts` — browser SDK (Firestore, Storage)
- `lib/firebase/admin.ts` — server SDK via `service-account.json`
- Firestore collections: `presentations`, `fonts`
- API routes in `app/api/presentations/` and `app/api/fonts/` use the admin SDK

### Font System

Two-tier: managed fonts (Firestore) and fallback defaults. The `useFonts` hook (`hooks/useFonts.ts`) loads fonts dynamically via Google Fonts CDN link injection. The `/api/fonts/google` route searches Google Fonts with a local fallback list.

### Key Pages

- `/` — Landing page (black background, particle effects)
- `/sandbox` — Live slide editor with debug controls
- `/admin` — Font management, presentation list
- `/admin/fonts` — Add/manage Google Fonts
- `/admin/presentations` — CRUD presentations, link to sandbox

### UI Components

`components/ui/` contains shadcn/ui components (new-york style, zinc base color). Configured via `components.json`. The `cn()` utility is in `lib/utils.ts`.

## Key Conventions

- `reactStrictMode: false` in next.config.ts (required for animation libraries like GSAP and Three.js)
- TypeScript strict mode is off (`strict: false`, `noImplicitAny: false` in tsconfig)
- Path alias: `@/*` maps to project root
- `body` is always `bg-black` (set in globals.css) — the presentation canvas needs true black, not theme background
- Tailwind dark mode uses class strategy (`darkMode: ["class"]`), scoped to individual components rather than `<html>`
- Effect technologies: `css`, `canvas`, `webgl`, `svg`, `html` — tracked for performance/compatibility via `lib/effects/compatibility.ts`
