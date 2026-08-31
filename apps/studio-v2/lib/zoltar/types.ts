// Zoltar data model. The onboarding subset of ZOLTAR_SPEC section 03 (the living
// user model), plus the session envelope. The response-shaped types (Card,
// WeekDraft, Update, ZoltarTurn) are the source of truth in schema.ts and imported
// here as types only, so there is no runtime import cycle.
import type { Card, WeekDraft, Update, ZoltarTurn, StepStatus, StepId } from './schema';

export type { Card, WeekDraft, Update, ZoltarTurn, StepStatus, StepId };

// The eight life dimensions. The names live in ZOLTAR_SPEC section 01 (the
// practical coverage model); we store the short slug and render the full label.
export type Dimension =
  | 'health'
  | 'work'
  | 'money'
  | 'relationships'
  | 'growth'
  | 'meaning'
  | 'joy'
  | 'environment';

export const DIMENSIONS: { slug: Dimension; label: string }[] = [
  { slug: 'health', label: 'Health and energy' },
  { slug: 'work', label: 'Work and creation' },
  { slug: 'money', label: 'Money and security' },
  { slug: 'relationships', label: 'Relationships' },
  { slug: 'growth', label: 'Growth and mastery' },
  { slug: 'meaning', label: 'Meaning and identity' },
  { slug: 'joy', label: 'Joy and recovery' },
  { slug: 'environment', label: 'Environment and systems' },
];

export const DIMENSION_SLUGS = DIMENSIONS.map((d) => d.slug) as [Dimension, ...Dimension[]];

export function dimensionLabel(slug: Dimension): string {
  return DIMENSIONS.find((d) => d.slug === slug)?.label ?? slug;
}

// Provenance separates what the user said from what the model guessed (section 03).
export type Provenance = 'user_stated' | 'model_inferred';
export type EntryStatus = 'proposed' | 'approved';

export interface Entry<T> {
  id: string;
  value: T;
  provenance: Provenance;
  confidence?: number; // 0..1, present only for model_inferred
  status: EntryStatus;
  created_at: string;
}

export interface CurrentReality {
  working: string[];
  not_working: string[];
  repeated: string[];
}
export interface Constraint {
  kind: string;
  detail: string;
}
export interface Preferences {
  horizon: string;
  reminders: string;
  structure: string;
}
export interface Capacity {
  readiness: number; // 1..5
  obligations: string[];
  notes?: string;
}
export interface Outcome {
  text: string;
  horizon: string;
  metric?: string;
  why: string;
}
export interface Mission {
  title: string;
  weeks: number;
  why: string;
}

export interface DimensionState {
  importance?: number; // 1..5
  satisfaction?: number; // 1..5
  active: boolean;
  notes?: string;
}

export interface UserModel {
  desired_change: Entry<string>[]; // step 1
  identity_statements: Entry<string>[]; // step 2 (approved only via card)
  why_now: Entry<string>[]; // step 3
  current_reality: Entry<CurrentReality>[]; // step 4
  life_dimensions: Record<Dimension, DimensionState>; // step 5
  constraints: Entry<Constraint>[]; // step 6
  preferences: Entry<Preferences>[]; // step 7
  capacity: Entry<Capacity>[]; // step 8
  outcomes: Entry<Outcome>[];
  missions: Entry<Mission>[]; // step 9 (approved only via card)
  week: WeekDraft | null; // step 10 (commitments approved only via card)
}

// Buckets that hold a list of entries (everything except life_dimensions and week).
export type EntryBucket =
  | 'desired_change'
  | 'identity_statements'
  | 'why_now'
  | 'current_reality'
  | 'constraints'
  | 'preferences'
  | 'capacity'
  | 'outcomes'
  | 'missions';

export const ENTRY_BUCKETS: EntryBucket[] = [
  'desired_change',
  'identity_statements',
  'why_now',
  'current_reality',
  'constraints',
  'preferences',
  'capacity',
  'outcomes',
  'missions',
];

// Buckets whose entries only ever become approved through a card confirmation.
export const CARD_APPROVED_BUCKETS: EntryBucket[] = ['identity_statements', 'missions'];

export function emptyDimensions(): Record<Dimension, DimensionState> {
  return DIMENSION_SLUGS.reduce(
    (acc, slug) => {
      acc[slug] = { active: false };
      return acc;
    },
    {} as Record<Dimension, DimensionState>,
  );
}

export function emptyUserModel(): UserModel {
  return {
    desired_change: [],
    identity_statements: [],
    why_now: [],
    current_reality: [],
    life_dimensions: emptyDimensions(),
    constraints: [],
    preferences: [],
    capacity: [],
    outcomes: [],
    missions: [],
    week: null,
  };
}

// The ten onboarding steps (ZOLTAR_SPEC section 04). `elicits` is a short reminder
// used by the debug panel and folded into the prompt.
export interface StepDef {
  n: StepId;
  key: string;
  label: string;
  elicits: string;
}

export const STEPS: StepDef[] = [
  { n: 1, key: 'desired_change', label: 'Desired change', elicits: 'What would make this app materially improve their life in six months.' },
  { n: 2, key: 'identity', label: 'Identity', elicits: 'Who they are trying to become, in observable terms, not a slogan.' },
  { n: 3, key: 'why_now', label: 'Why now', elicits: 'Urgency, the emotional reason, what changed recently.' },
  { n: 4, key: 'current_reality', label: 'Current reality', elicits: 'What is working, what is not, what keeps repeating.' },
  { n: 5, key: 'active_domains', label: 'Active domains', elicits: 'Which of the eight dimensions matter now, and how much.' },
  { n: 6, key: 'constraints', label: 'Constraints', elicits: 'Calendar, caregiving, work hours, money, energy, sleep, travel, injuries.' },
  { n: 7, key: 'planning_style', label: 'Planning style', elicits: 'Horizon of visibility, tolerance for reminders, structure versus flexibility.' },
  { n: 8, key: 'readiness_load', label: 'Readiness and load', elicits: 'How much change they want now, plus a concrete inventory of obligations.' },
  { n: 9, key: 'first_mission', label: 'First mission', elicits: 'One or two 1 to 4 week missions, proposed with a why, approved by the user.' },
  { n: 10, key: 'first_week', label: 'First week', elicits: 'A drafted week: must-win outcomes, commitments on days, protected slack.' },
];

// Steps that only count as covered once at least one approved entry exists.
export const APPROVED_STEPS: StepId[] = [2, 9, 10];
// Minimum viable profile: the spec's "start now" path.
export const MVP_STEPS: StepId[] = [1, 2, 5, 6, 8];

// One recorded model call, kept for the debug panel and cost meter.
export interface TurnLog {
  modelId: string;
  usage: { prompt_tokens: number; completion_tokens: number; reasoningUnsupported?: boolean };
  cost: number; // USD estimate
  raw: { request: unknown; response: unknown } | null;
  at: string;
}

// A transcript entry. Assistant entries keep the full ZoltarTurn so the panel and
// the renderer can read the card; only a compacted form is sent back to the model.
export type TranscriptEntry =
  | { role: 'user'; content: string; at: string }
  | { role: 'assistant'; turn: ZoltarTurn; at: string };

export interface Session {
  version: 1;
  modelId: string;
  thinking: boolean;
  transcript: TranscriptEntry[];
  userModel: UserModel;
  turns: TurnLog[];
  started: boolean; // flipped when the user presses "Start now" at MVP
  lastError?: { message: string; raw: unknown } | null; // last failed call, for the panel
  created_at: string;
}
