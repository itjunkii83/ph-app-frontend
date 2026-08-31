// The only writer of the UserModel. Enforces the two invariants app-side, never
// trusting the model: (1) authorship, identity statements / missions / week
// commitments become approved only through a card confirmation; (2) provenance,
// every entry records user_stated vs model_inferred, and inferences carry a
// confidence. This code runs in the browser and the route (normal runtime), so
// crypto.randomUUID, structuredClone, and Date are all available.
import {
  type UserModel,
  type Entry,
  type Provenance,
  type Dimension,
  type EntryBucket,
  type Mission,
  type WeekDraft,
} from './types';
import type { Update } from './schema';

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

// Buckets whose entries only ever reach "approved" through a card.
const CARD_APPROVED = new Set<EntryBucket>(['identity_statements', 'missions']);

function statusFor(bucket: EntryBucket, provenance: Provenance): Entry<unknown>['status'] {
  if (CARD_APPROVED.has(bucket)) return 'proposed';
  // A fact the user stated is authored; an inference waits until confirmed.
  return provenance === 'user_stated' ? 'approved' : 'proposed';
}

function confidenceFor(provenance: Provenance, raw: number | null): number | undefined {
  if (provenance !== 'model_inferred') return undefined;
  if (raw == null) return 0.5;
  return Math.max(0, Math.min(1, raw));
}

function mkEntry<T>(bucket: EntryBucket, value: T, provenance: Provenance, confidence: number | null): Entry<T> {
  return {
    id: newId(),
    value,
    provenance,
    confidence: confidenceFor(provenance, confidence),
    status: statusFor(bucket, provenance),
    created_at: nowIso(),
  };
}

// Upsert into an entry bucket. op "edit" with a known id updates in place but keeps
// the authorship rule (card buckets stay proposed); anything else is an add.
function upsert<T>(
  list: Entry<T>[],
  bucket: EntryBucket,
  op: 'add' | 'edit',
  id: string | null,
  value: T,
  provenance: Provenance,
  confidence: number | null,
): Entry<T>[] {
  if (op === 'edit' && id) {
    const idx = list.findIndex((e) => e.id === id);
    if (idx >= 0) {
      const next = [...list];
      next[idx] = {
        ...next[idx],
        value,
        provenance,
        confidence: confidenceFor(provenance, confidence),
        status: statusFor(bucket, provenance),
      };
      return next;
    }
  }
  return [...list, mkEntry(bucket, value, provenance, confidence)];
}

// Apply the model's proposed_updates. set_week is intentionally ignored here: the
// week is authored only through the week_draft card (see approveWeek).
export function applyModelUpdates(model: UserModel, updates: Update[]): UserModel {
  const next: UserModel = structuredClone(model);
  for (const u of updates) {
    switch (u.kind) {
      case 'string_entry': {
        const bucket = u.bucket;
        next[bucket] = upsert(next[bucket], bucket, u.op, u.id, u.value, u.provenance, u.confidence);
        break;
      }
      case 'current_reality':
        next.current_reality = upsert(
          next.current_reality,
          'current_reality',
          u.op,
          u.id,
          { working: u.working, not_working: u.not_working, repeated: u.repeated },
          u.provenance,
          u.confidence,
        );
        break;
      case 'constraint':
        next.constraints = upsert(
          next.constraints,
          'constraints',
          u.op,
          u.id,
          { kind: u.constraint_kind, detail: u.detail },
          u.provenance,
          u.confidence,
        );
        break;
      case 'preferences':
        next.preferences = upsert(
          next.preferences,
          'preferences',
          u.op,
          u.id,
          { horizon: u.horizon, reminders: u.reminders, structure: u.structure },
          u.provenance,
          u.confidence,
        );
        break;
      case 'capacity':
        next.capacity = upsert(
          next.capacity,
          'capacity',
          u.op,
          u.id,
          { readiness: clamp(u.readiness, 1, 5), obligations: u.obligations, notes: u.notes ?? undefined },
          u.provenance,
          u.confidence,
        );
        break;
      case 'outcome':
        next.outcomes = upsert(
          next.outcomes,
          'outcomes',
          u.op,
          u.id,
          { text: u.text, horizon: u.horizon, metric: u.metric ?? undefined, why: u.why },
          u.provenance,
          u.confidence,
        );
        break;
      case 'mission':
        next.missions = upsert(
          next.missions,
          'missions',
          u.op,
          u.id,
          { title: u.title, weeks: Math.max(1, Math.round(u.weeks)), why: u.why },
          u.provenance,
          u.confidence,
        );
        break;
      case 'remove': {
        const bucket = u.bucket;
        next[bucket] = (next[bucket] as Entry<unknown>[]).filter((e) => e.id !== u.id) as never;
        break;
      }
      case 'set_dimension':
        next.life_dimensions[u.dimension] = {
          importance: u.importance == null ? next.life_dimensions[u.dimension].importance : clamp(u.importance, 1, 5),
          satisfaction:
            u.satisfaction == null ? next.life_dimensions[u.dimension].satisfaction : clamp(u.satisfaction, 1, 5),
          active: u.active,
          notes: u.notes ?? next.life_dimensions[u.dimension].notes,
        };
        break;
      case 'set_week':
        // Ignored: authored only via the week_draft card (approveWeek).
        break;
    }
  }
  return next;
}

// Card-driven writes. These are the ONLY paths to "approved" for identity and
// missions, and the only path that stores a week.

export interface GridEntry {
  dimension: Dimension;
  importance: number; // 1..5
  active: boolean;
  satisfaction?: number;
  notes?: string;
}

// dimension_grid card result (step 5).
export function applyDimensionGrid(model: UserModel, entries: GridEntry[]): UserModel {
  const next: UserModel = structuredClone(model);
  for (const g of entries) {
    next.life_dimensions[g.dimension] = {
      importance: clamp(g.importance, 1, 5),
      satisfaction: g.satisfaction == null ? next.life_dimensions[g.dimension].satisfaction : clamp(g.satisfaction, 1, 5),
      active: g.active,
      notes: g.notes ?? next.life_dimensions[g.dimension].notes,
    };
  }
  return next;
}

export type ConfirmDecision = { id: string; action: 'approve' | 'reject'; text?: string };

// confirm_statement card result. kind "identity" -> identity_statements (step 2),
// kind "mission" -> missions (step 9). Approval authors the entry (user_stated,
// approved); rejection removes it. Ids should match the proposed entries; if they
// do not, an approval creates a fresh authored entry as a fallback.
export function resolveConfirmStatement(
  model: UserModel,
  kind: 'identity' | 'mission',
  decisions: ConfirmDecision[],
): UserModel {
  const next: UserModel = structuredClone(model);
  if (kind === 'identity') {
    for (const d of decisions) {
      const idx = next.identity_statements.findIndex((e) => e.id === d.id);
      if (d.action === 'reject') {
        if (idx >= 0) next.identity_statements.splice(idx, 1);
        continue;
      }
      if (idx >= 0) {
        next.identity_statements[idx] = {
          ...next.identity_statements[idx],
          value: d.text ?? next.identity_statements[idx].value,
          provenance: 'user_stated',
          confidence: undefined,
          status: 'approved',
        };
      } else if (d.text) {
        next.identity_statements.push({
          id: newId(),
          value: d.text,
          provenance: 'user_stated',
          status: 'approved',
          created_at: nowIso(),
        });
      }
    }
    return next;
  }
  // missions
  for (const d of decisions) {
    const idx = next.missions.findIndex((e) => e.id === d.id);
    if (d.action === 'reject') {
      if (idx >= 0) next.missions.splice(idx, 1);
      continue;
    }
    if (idx >= 0) {
      const value: Mission = { ...next.missions[idx].value, title: d.text ?? next.missions[idx].value.title };
      next.missions[idx] = {
        ...next.missions[idx],
        value,
        provenance: 'user_stated',
        confidence: undefined,
        status: 'approved',
      };
    } else if (d.text) {
      next.missions.push({
        id: newId(),
        value: { title: d.text, weeks: 1, why: '' },
        provenance: 'user_stated',
        status: 'approved',
        created_at: nowIso(),
      });
    }
  }
  return next;
}

// week_draft card approval (step 10). Storing the week means the user authored it;
// its commitments are treated as approved.
export function approveWeek(model: UserModel, week: WeekDraft): UserModel {
  const next: UserModel = structuredClone(model);
  next.week = structuredClone(week);
  return next;
}
