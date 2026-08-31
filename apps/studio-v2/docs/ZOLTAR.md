# Zoltar (studio-v2 debug view)

Zoltar is an additive debug surface for testing which OpenRouter models "speak well"
to a user during onboarding, and whether the conversation produces a credible first
plan. It is not shipped to users. It persists to localStorage only and has a Start
fresh reset. The product contract it runs is `docs/ZOLTAR_SPEC.md`.

Reach it from the rail: Intelligence -> Zoltar. Left column is the chat, right column
is the debug panel (model picker, cost meter, step coverage, live user model, raw I/O).

## Where things live

```
lib/zoltar/types.ts       UserModel, Entry, Session, Dimension, the 10 steps, MVP steps
lib/zoltar/schema.ts      zod schemas + strict JSON-schema export (oneOf -> anyOf, no $schema)
lib/zoltar/models.ts      curated OpenRouter models with pinned prices (estimates)
lib/zoltar/persona.ts     Zoltar's voice (the thing under test)
lib/zoltar/prompt.ts      system-prompt assembly from the spec sections
lib/zoltar/apply.ts       the only writer of UserModel; enforces authorship + provenance
lib/zoltar/coverage.ts    per-step coverage + minimum viable profile
lib/zoltar/useSession.ts  localStorage session, guarded opener, compact history, export
app/api/zoltar/route.ts   POST: one model call per turn; reads NEXT_OPEN_ROUTE_KEY (server only)
components/zoltar/*        ZoltarView, ChatColumn, DebugPanel, cards/*
```

Additive edits outside that folder: `lib/types.ts` (added `'zoltar'` to `View`),
`components/Rail.tsx` (Intelligence group), `components/Studio.tsx` (Surface case +
full-width main branch), `components/ui.tsx` (Select gained an optional `groups` prop,
backward compatible). New dependency: `zod` (4.5.4).

## Invariants (enforced in app code, not the prompt)

- Authorship: identity statements (step 2), missions (step 9), and the week (step 10)
  become `approved` only through a card confirmation (`resolveConfirmStatement`,
  `approveWeek`). Model-proposed versions land as `proposed`. `apply.ts` forces this.
- Provenance: every entry records `user_stated` vs `model_inferred`; inferences carry a
  confidence. The model never silently promotes an inference to a fact.

## The model call

`POST /api/zoltar` reads `process.env.NEXT_OPEN_ROUTE_KEY` (already in the gitignored
`.env.local`; not in `.env.example`). The key never reaches the client. The route sends
`response_format` with a strict `json_schema`, maps the thinking toggle to the unified
`reasoning` param (`effort: none` off, `effort: medium` on), retries once without
`reasoning` if a 400 mentions reasoning (and flags `reasoningUnsupported`), and retries
once on a zod validation failure before returning 422 with the raw content. `raw` in the
response carries no key (the Authorization header is not part of the stored body).

## Verifications done on 2026-08-30

- Model ids: all 19 in `models.ts` resolve against `https://openrouter.ai/api/v1/models`.
  Prices are estimates pinned to this date; re-check when revising the list.
- OpenRouter request shapes (structured outputs, reasoning) confirmed against the docs.
- `tsc --noEmit` clean. Em-dash grep across `components lib app` returns nothing.
- Runtime check: the strict JSON-schema builds (anyOf, no $schema, additionalProperties
  on every object) and a sample turn round-trips through the zod validator.

## Known environment note

The project's eslint (`eslint .` via FlatCompat + eslint-config-next on eslint 9.39.4)
crashes at config load in this workspace with "Converting circular structure to JSON",
before linting any file. This is pre-existing and unrelated to Zoltar (it reproduces on
the unchanged config). Zoltar's files were linted with a standalone typescript-eslint
pass: 0 errors, and the only warning (`Plus` unused in `ui.tsx`) pre-dates this work.
Run the project lint in an environment where the config loads.

## Test steps

1. Open Studio, Intelligence -> Zoltar. Expect an opener from the default model.
2. Answer a slogan ("wealthy and successful"); expect a follow-up asking for the concrete
   normal-weekday version.
3. Reach step 5; expect a dimension grid (8 dimensions, importance 1 to 5, active toggle).
4. Switch models mid-session; confirm the cost meter and the per-turn log update.
5. Reach a mission (confirm_statement, kind mission) and a week (week_draft); approving
   flips them to approved in the user model panel.
6. Start fresh clears everything and re-opens. Export downloads the session JSON.
