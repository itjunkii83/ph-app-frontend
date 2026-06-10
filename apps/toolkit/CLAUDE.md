# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Monorepo:** this app is `apps/toolkit` (package `wisdom-toolkit`) in a pnpm
> workspace. Run it from the repo root with `pnpm --filter wisdom-toolkit dev`.
> Playback (the renderer + effects) lives in the shared `@harbor/player` package,
> not here. The motivation moment plays via `@harbor/player` on the chromeless
> `/play` route, fed by today's presentation read from Firestore
> (`lib/presentations.ts`). See the root `CLAUDE.md` for the workspace overview.
>
> **Read the docs before any work (required):** the root [`docs/`](../../docs/)
> (architecture, media model) and this app's [`docs/MOMENT.md`](./docs/MOMENT.md)
> before touching the moment / playback. Update the relevant doc in the same change.

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

Pause Harbor prototype: a config-driven daily habit ritual ("Daily Harbor") with a Duolingo-style two-screen UX. The product spec lives in `tmp/BUILD-BRIEF.md` (v2, the two-screen brief); `tmp/preview__1.html` is a UX-bones-only reference (never copy its visual style). The AI assembly step is deliberately faked: `data/dashboard-config.json` is hand-authored as if a model produced it, and the app renders it. No backend; all state is in localStorage.

Two views, one config:
- **Harbor** (`/`, `components/harbor/harbor.tsx`): the lobby. Stats (streak + history dots, Knots, reps progress), lesson path preview, quests, today's rule, quote teaser, start/resume control. Owns Motivate and Reinforce.
- **The Practice** (`/practice`, `components/runner/runner.tsx`): full-screen focused runner. One step at a time, top progress bar, reward beats (toast + noir confetti), completion screen. Owns Act. Never put stats/quests/history inside the runner; the brief is explicit about not blurring this line.

## Architecture

**Config drives everything.** `data/dashboard-config.json` → typed via cast in `lib/config.ts`. Pages pass `uiConfig` (NOT `config`) to the client components: it blanks `profile.freeText` so it never reaches the serialized client payload. The ordered `modules[]` array doubles as the lesson path; `lib/session.ts` splits it into steps (session order) and reps (point-earning steps, everything except motivation). The `Module` type in `lib/types.ts` is a discriminated union on `type` (`motivation | list | timed | structured | text | tracker | journal`); `ModuleOf<"list">` extracts one member. Adding a module type means: extend the union, add a step component in `components/steps/`, add a case to `components/runner/step-renderer.tsx`.

**Session flow** (`lib/constants.ts` holds the knobs):
- `MOMENT_AS_STEP_ZERO` (default true): motivation opens the session as step zero. Flipped false, it renders as a play card on Harbor (`components/harbor/moment-card.tsx`) and the session starts at the first action module.
- `CURRENCY_NAME` (default "Knots") is the session currency label; `REP_POINTS`/`TRACKER_POINTS` the per-step rewards. The tracker is always the final step; finishing it is what extends the streak.
- The runner footer is debug navigation: Back and Next, always enabled, never gated on exercise completion (this is a prototype for feeling out the flow, not a validated funnel). Back from step zero exits to Harbor. Keyboard: Enter/ArrowRight advance, ArrowLeft goes back, Escape exits. Steps with their own lifecycle (the timed countdown's Begin/Done, the tracker's check) keep those controls inside the step content, under the interaction.
- Resume: the runner waits for session hydration, then mounts at the first incomplete step; Back/Next allow free movement from there. Points are awarded once per module per day; the reward beat (toast + confetti) only fires when points are actually earned, so re-walking completed steps navigates silently.

**Persistence model** (`lib/`):
- `use-local-storage.ts` - SSR/hydration-safe base hook: first render uses the initial value, the saved value is read in an effect after mount, writes are gated on a `hydrated` flag. Keep this pattern; reading localStorage during render causes hydration mismatches.
- `use-module-state.ts` - exercise state, keyed `harbor:v1:<YYYY-MM-DD>:<moduleId>`. New-day reset is implicit: the date changes, the key changes, old keys are orphaned (no cleanup by design). The completed-today set (`lib/use-session.ts`) rides the same mechanism under the pseudo module id `session`.
- `use-points.ts` - currency total at `harbor:v1:points` (`{ total, byDay }`). Not date-scoped; survives the new day.
- `use-tracker.ts` + `streak.ts` - tracker state is NOT date-scoped (`harbor:v1:tracker:<moduleId>`) so streak/history survive the daily reset. Streak walks back from today (or yesterday if today is unchecked) over a completions map; a missing day breaks the run. Yesterday's streak stays visible the morning after until a real gap exists - this is intentional.
- Date keys are local time (`lib/date.ts`), not UTC: a "day" is the user's day.
- Several components instantiate the same storage key through separate hook instances (for example the completion screen re-reads points/tracker). This works because each instance reads at mount and the flows are sequential; there is no cross-instance sync, so do not have two simultaneously mounted writers on one key.

**Design system (Pause Harbor noir).** All tokens are CSS variables in `app/globals.css` (ink/panel/line/paper/muted/pewter/silver + `--accent-gradient`), mapped to Tailwind v4 utilities via `@theme inline` (e.g. `bg-panel`, `text-paper`, `border-line`, `font-display`). The standard shadcn semantic variables (`--primary`, `--muted-foreground`, etc.) are also mapped onto the noir palette so stock shadcn components inherit the look. Tailwind v4: no tailwind.config; theme lives in CSS. The `dark` and `data-checked` custom variants are defined in globals.css and required by the shadcn components; `<html>` carries a permanent `dark` class.

- Fonts: Fraunces (`font-display`, titles + quote) and Archivo (`font-body`, everything else) via next/font in `app/layout.tsx`.
- Cards use `components/ui/harbor-card.tsx` (panel bg, line border, 16px radius, optional 3px accent top bar), not the stock shadcn Card.
- The grain overlay (`components/grain-overlay.tsx`) is a fixed fractalNoise SVG at 5.5% opacity over everything.
- Mobile-first: the runner is always a single centered `max-w-md` column; Harbor widens to a two-column grid on `lg`.
- Reward effects stay filmic and restrained: silver/paper confetti (`components/runner/confetti-burst.tsx`), accent-gradient progress and streak fills. No rainbow, no warm trophy gold.

## House rules (product copy)

From the founding brief; these apply to all UI copy:

- No em dashes anywhere in UI copy. Use periods, commas, colons, and parentheses.
- Never render a book title or author name as a feature, label, or heading. The single attributed quote in the motivation module is the only named attribution allowed.
- Never render `profile.freeText` raw; `goalText` may be shown subtly.
