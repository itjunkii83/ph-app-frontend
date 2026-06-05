# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Use pnpm only, never npm.

- `pnpm dev` - dev server (Next.js App Router, Turbopack)
- `pnpm build` - production build (also runs TypeScript checking)
- `pnpm lint` - ESLint
- `pnpm exec tsc --noEmit` - typecheck only

There is no test framework configured.

## IMPORTANT

The user likes to test, you should never be running nextjs servers or running pnpm dev or trying to access browsers. You do the work, then pass to me (the user) with clear instructions on how to test & validate the work. I will then report back findings.

## What this is

Pause Harbor prototype: a config-driven daily habit dashboard ("Daily Harbor"). The product spec lives in `tmp/BUILD-BRIEF.md`. The AI assembly step is deliberately faked: `data/dashboard-config.json` is hand-authored as if a model produced it, and the app renders it. No backend; all state is in localStorage.

## Architecture

**Config drives everything.** `data/dashboard-config.json` → typed via cast in `lib/config.ts` → `app/page.tsx` (server) renders `components/dashboard.tsx` → `components/module-renderer.tsx` switches on `module.type` to one of seven components in `components/modules/`. The `Module` type in `lib/types.ts` is a discriminated union on `type` (`motivation | list | timed | structured | text | tracker | journal`); `ModuleOf<"list">` extracts one member. Adding a module type means: extend the union, add a component, add a case to the renderer.

**Persistence model** (`lib/`):
- `use-local-storage.ts` - SSR/hydration-safe base hook: first render uses the initial value, the saved value is read in an effect after mount, writes are gated on a `hydrated` flag. Keep this pattern; reading localStorage during render causes hydration mismatches.
- `use-module-state.ts` - exercise state, keyed `harbor:v1:<YYYY-MM-DD>:<moduleId>`. New-day reset is implicit: the date changes, the key changes, old keys are orphaned (no cleanup by design).
- `use-tracker.ts` + `streak.ts` - tracker state is NOT date-scoped (`harbor:v1:tracker:<moduleId>`) so streak/history survive the daily reset. Streak walks back from today (or yesterday if today is unchecked) over a completions map; a missing day breaks the run. Yesterday's streak stays visible the morning after until a real gap exists - this is intentional.
- Date keys are local time (`lib/date.ts`), not UTC: a "day" is the user's day.

**Design system (Pause Harbor noir).** All tokens are CSS variables in `app/globals.css` (ink/panel/line/paper/muted/pewter/silver + `--accent-gradient`), mapped to Tailwind v4 utilities via `@theme inline` (e.g. `bg-panel`, `text-paper`, `border-line`, `font-display`). The standard shadcn semantic variables (`--primary`, `--muted-foreground`, etc.) are also mapped onto the noir palette so stock shadcn components inherit the look. Tailwind v4: no tailwind.config; theme lives in CSS. The `dark` and `data-checked` custom variants are defined in globals.css and required by the shadcn components; `<html>` carries a permanent `dark` class.

- Fonts: Fraunces (`font-display`, titles + quote) and Archivo (`font-body`, everything else) via next/font in `app/layout.tsx`.
- Cards use `components/ui/harbor-card.tsx` (panel bg, line border, 16px radius, optional 3px accent top bar), not the stock shadcn Card.
- The grain overlay (`components/grain-overlay.tsx`) is a fixed fractalNoise SVG at 5.5% opacity over everything.
- Mobile-first: single column, `max-w-md`, centered.

## House rules (product copy)

From the founding brief; these apply to all UI copy:

- No em dashes anywhere in UI copy. Use periods, commas, colons, and parentheses.
- Never render a book title or author name as a feature, label, or heading. The single attributed quote in the motivation module is the only named attribution allowed.
- Never render `profile.freeText` raw; `goalText` may be shown subtly.
