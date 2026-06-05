# Pause Harbor Prototype: Build Brief

## Goal
Ship one working vertical slice today: a single user's assembled dashboard ("Daily Harbor"), fully interactive, in the Pause Harbor noir style. We are deliberately faking the AI step. The dashboard is fully described by `dashboard-config.json`, which was hand-authored as if our assembly model produced it. Your job is to render that config into a real, interactive dashboard and persist the user's input locally.

## Concept in two lines
Pause Harbor turns inspiration into habit, one cinematic morning at a time. Each day the user gets a short motivation moment, then a few personalized exercises (the action layer), then tracks the habit (reinforcement).

## Stack
- We ONLY use pnpm never npm
- Next.js (App Router) with TypeScript
- Tailwind CSS with shadcn/ui
- State: React state plus localStorage for persistence. No backend today.
- Fonts: Fraunces (display) and Archivo (body), loaded via next/font/google

## Data contract
Load `dashboard-config.json` (place it at `/data/dashboard-config.json` and import it). Shape:

- `workspace`: { name, style, greeting }
- `profile`: { goalText, bubbles[], freeText, derivedThemes[] }. Context only. You may show `goalText` subtly near the top. Do not show `freeText` raw.
- `modules[]`: ordered list. Each module is { id, type, title, sourceTag, config }.

Render the modules top to bottom as cards. The `type` field decides which component renders. `sourceTag` is a small label shown on the card (for example "Implementation intention"). Important: do not show any book title or author name anywhere in the UI, with the single exception of the one attributed quote in the motivation module.

## Components (build one per primitive type)
Each component reads its own `config`.

1. **motivation**: hero card pinned at the top. Background is a CSS gradient in the storm-water theme plus the grain overlay (no real video yet). Show the quote in Fraunces with the attribution small underneath. A "Play today's hype" button that for now triggers a subtle shimmer or pulse state (the cinematic film comes later). `mood: "intense"` means higher contrast and a stronger gradient.
2. **list**: prompt plus `itemCount` inputs. The user types items and can check each one off. Persist text and checked state.
3. **timed**: prompt plus a countdown for `durationSeconds`. Start begins the countdown and shows remaining time. Mark complete at zero or when the user taps the done label. Persist completion for the day.
4. **structured**: render `intro`, then the labeled fields inline so they read like one sentence: "I will [behavior] at [time] in [place] right after [anchor]." Each field is an input. Persist all fields.
5. **text**: prompt plus a textarea sized to `rows`. Persist.
6. **tracker**: show `habitLabel` and a large check for `checkLabel`. Tapping it marks today complete and updates the streak. Show the current streak count and a row of the last `historyDays` days. Persist streak and per-day completion.
7. **journal**: prompt, with `prefix` shown as a lead-in line, plus a textarea sized to `rows`. Persist.

## State and persistence
- Key everything by date (YYYY-MM-DD) plus module id in localStorage, so a page refresh keeps today's progress.
- Streak logic: completing the habit on consecutive days increments the streak. A skipped day resets the run to the current day. Keep it simple and readable.
- New day behavior: when the date changes, exercise inputs reset for the fresh day, while the streak and the history row persist.

## Design system (Pause Harbor noir)
Match the founding brief and the messaging doc exactly. Use these tokens as CSS variables:

- ink `#0a0b0d` (page background)
- ink-2 `#111317`
- panel `#13161a` (cards)
- line `rgba(214,224,232,0.10)` (borders)
- paper `#e7ecf1` (primary text)
- muted `#8b939b` (secondary text)
- pewter `#9aa5af` (source tags, small labels)
- silver `#d6dde4` (eyebrows, accents)
- accent gradient: `linear-gradient(100deg,#eef3f7 0%,#a8b3bd 55%,#cfd8df 100%)` for key headings and the streak fill

Other design notes:
- Titles and the quote in Fraunces. Body text and inputs in Archivo.
- Add a fixed grain overlay at about 5.5 percent opacity (fractalNoise SVG, same as the existing docs).
- Card style: panel background, 1px line border, roughly 16px radius. A 3px top bar in the accent gradient on the hero and other key cards.
- Mood: calm, dark, filmic, generous spacing. This is a mobile app concept, so design for phone width first, then center the column on larger screens.

## House rules (carry these into the product)
- No em dashes anywhere in UI copy. Use periods, commas, colons, and parentheses.
- All exercise content is original and method-based. Never render a book title or author as a feature, label, or heading. The single attributed quote is the only named attribution allowed.

## Build order (so we always have a working core)
1. Scaffold the app, wire the design tokens, fonts, and grain overlay.
2. Dashboard page that loads the config and renders one card per module (titles and source tags only).
3. tracker first, since it is the heart of the loop. Streak plus persistence.
4. structured, list, text, journal, with persistence.
5. timed (countdown).
6. motivation hero card polish.
7. New-day reset behavior.

## Definition of done
A user can open Daily Harbor, read the moment, complete every exercise, check the habit, watch the streak move to 1, refresh the page, and find all of their state intact. It looks unmistakably Pause Harbor.
