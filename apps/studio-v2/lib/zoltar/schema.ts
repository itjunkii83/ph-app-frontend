// zod schemas for the model's per-turn response, plus a JSON-schema export shaped
// for OpenRouter's strict structured-output mode.
//
// Two rules keep the exported schema strict-compatible (OpenAI style, which
// OpenRouter passes through):
//   1. Never use .optional() in a response field. Optional keys drop out of
//      `required`, which strict mode rejects. Use .nullable() so the key stays
//      required and the model emits null when it has nothing.
//   2. Fixed-key maps (step_status) are explicit objects, never z.record, so they
//      emit fixed properties with additionalProperties:false.
// z.toJSONSchema already emits additionalProperties:false and full `required`. We
// post-process to rename oneOf (from discriminated unions) to anyOf and strip the
// $schema/$defs noise, which some providers reject.
import { z } from 'zod';
import { DIMENSION_SLUGS, ENTRY_BUCKETS, type EntryBucket } from './types';

export type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

const Provenance = z.enum(['user_stated', 'model_inferred']);
const StepStatusValue = z.enum(['pending', 'in_progress', 'done']);
const Day = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

// A drafted week (onboarding step 10). Referenced by the week_draft card and the
// set_week update, so it is defined once.
export const WeekDraftSchema = z.object({
  must_win: z.array(z.string()), // 1 to 3 outcomes for the week
  commitments: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      day: Day,
      window: z.string().nullable(),
      success_criteria: z.string(),
      difficulty: z.number().int(), // 1..3, clamped in apply.ts
      reason: z.string(),
      mission_id: z.string().nullable(),
    }),
  ),
  routines: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      cadence: z.string(),
      preferred_timing: z.string().nullable(),
    }),
  ),
  open_capacity_note: z.string(),
});

const OptionSchema = z.object({ id: z.string(), label: z.string() });

export const CardSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('single_choice'), prompt: z.string(), options: z.array(OptionSchema) }),
  z.object({
    type: z.literal('multi_choice'),
    prompt: z.string(),
    options: z.array(OptionSchema),
    min: z.number().int().nullable(),
    max: z.number().int().nullable(),
  }),
  z.object({
    type: z.literal('scale'),
    prompt: z.string(),
    min: z.number().int(),
    max: z.number().int(),
    min_label: z.string(),
    max_label: z.string(),
  }),
  z.object({ type: z.literal('dimension_grid'), prompt: z.string() }),
  z.object({
    type: z.literal('confirm_statement'),
    prompt: z.string(),
    kind: z.enum(['identity', 'mission']),
    items: z.array(z.object({ id: z.string(), text: z.string(), why: z.string().nullable() })),
  }),
  z.object({ type: z.literal('week_draft'), prompt: z.string(), week: WeekDraftSchema }),
]);

// A structured state change. apply.ts is the only writer; it enforces authorship
// and provenance regardless of what the model claims here.
export const UpdateSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('string_entry'),
    bucket: z.enum(['desired_change', 'identity_statements', 'why_now']),
    op: z.enum(['add', 'edit']),
    id: z.string().nullable(),
    value: z.string(),
    provenance: Provenance,
    confidence: z.number().nullable(),
  }),
  z.object({
    kind: z.literal('current_reality'),
    op: z.enum(['add', 'edit']),
    id: z.string().nullable(),
    working: z.array(z.string()),
    not_working: z.array(z.string()),
    repeated: z.array(z.string()),
    provenance: Provenance,
    confidence: z.number().nullable(),
  }),
  z.object({
    kind: z.literal('constraint'),
    op: z.enum(['add', 'edit']),
    id: z.string().nullable(),
    constraint_kind: z.string(),
    detail: z.string(),
    provenance: Provenance,
    confidence: z.number().nullable(),
  }),
  z.object({
    kind: z.literal('preferences'),
    op: z.enum(['add', 'edit']),
    id: z.string().nullable(),
    horizon: z.string(),
    reminders: z.string(),
    structure: z.string(),
    provenance: Provenance,
    confidence: z.number().nullable(),
  }),
  z.object({
    kind: z.literal('capacity'),
    op: z.enum(['add', 'edit']),
    id: z.string().nullable(),
    readiness: z.number().int(),
    obligations: z.array(z.string()),
    notes: z.string().nullable(),
    provenance: Provenance,
    confidence: z.number().nullable(),
  }),
  z.object({
    kind: z.literal('outcome'),
    op: z.enum(['add', 'edit']),
    id: z.string().nullable(),
    text: z.string(),
    horizon: z.string(),
    metric: z.string().nullable(),
    why: z.string(),
    provenance: Provenance,
    confidence: z.number().nullable(),
  }),
  z.object({
    kind: z.literal('mission'),
    op: z.enum(['add', 'edit']),
    id: z.string().nullable(),
    title: z.string(),
    weeks: z.number().int(),
    why: z.string(),
    provenance: Provenance,
    confidence: z.number().nullable(),
  }),
  z.object({
    kind: z.literal('remove'),
    bucket: z.enum(ENTRY_BUCKETS as [EntryBucket, ...EntryBucket[]]),
    id: z.string(),
  }),
  z.object({
    kind: z.literal('set_dimension'),
    dimension: z.enum(DIMENSION_SLUGS),
    importance: z.number().int().nullable(),
    satisfaction: z.number().int().nullable(),
    active: z.boolean(),
    notes: z.string().nullable(),
  }),
  z.object({ kind: z.literal('set_week'), week: WeekDraftSchema }),
]);

// step_status: a fixed object with keys "1".."10". Explicit, not z.record, so it
// stays strict-compatible.
const StepStatusSchema = z.object({
  '1': StepStatusValue,
  '2': StepStatusValue,
  '3': StepStatusValue,
  '4': StepStatusValue,
  '5': StepStatusValue,
  '6': StepStatusValue,
  '7': StepStatusValue,
  '8': StepStatusValue,
  '9': StepStatusValue,
  '10': StepStatusValue,
});

export const ZoltarTurnSchema = z.object({
  message: z.string(),
  card: CardSchema.nullable(),
  step_focus: z.number().int(),
  step_status: StepStatusSchema,
  proposed_updates: z.array(UpdateSchema),
  ready_to_start: z.boolean(),
});

export type Card = z.infer<typeof CardSchema>;
export type WeekDraft = z.infer<typeof WeekDraftSchema>;
export type Update = z.infer<typeof UpdateSchema>;
export type ZoltarTurn = z.infer<typeof ZoltarTurnSchema>;
export type StepStatus = z.infer<typeof StepStatusSchema>;

// Recursively rename oneOf to anyOf (equivalent for disjoint discriminated unions)
// and drop the $schema key. Providers vary in what JSON-schema keywords they honor;
// anyOf is the broadly supported one.
function strictify(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(strictify);
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(node as Record<string, unknown>)) {
      if (key === '$schema') continue;
      out[key === 'oneOf' ? 'anyOf' : key] = strictify(val);
    }
    return out;
  }
  return node;
}

// The JSON schema handed to OpenRouter response_format. `reused: 'inline'` keeps
// WeekDraft expanded in place rather than behind a $ref, which some providers drop.
export const zoltarTurnJsonSchema = strictify(
  z.toJSONSchema(ZoltarTurnSchema, { reused: 'inline' }),
) as Record<string, unknown>;
