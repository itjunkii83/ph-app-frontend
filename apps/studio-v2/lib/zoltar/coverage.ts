// App-derived coverage, shown next to the model's own step_status so disagreements
// are visible. A step is covered when its bucket has at least one entry; steps 2, 9,
// and 10 require at least one APPROVED entry (authorship). Minimum viable profile
// (the spec's "start now" path) is steps 1, 2, 5, 6, 8.
import { type UserModel, type StepId, MVP_STEPS } from './types';
import type { Entry } from './types';

function hasApproved(list: Entry<unknown>[]): boolean {
  return list.some((e) => e.status === 'approved');
}

export function computeCoverage(model: UserModel): Record<StepId, boolean> {
  const activeDimension = Object.values(model.life_dimensions).some((d) => d.active);
  return {
    1: model.desired_change.length > 0,
    2: hasApproved(model.identity_statements),
    3: model.why_now.length > 0,
    4: model.current_reality.length > 0,
    5: activeDimension,
    6: model.constraints.length > 0,
    7: model.preferences.length > 0,
    8: model.capacity.length > 0,
    9: hasApproved(model.missions),
    10: model.week != null && model.week.commitments.length > 0,
  };
}

export function isMvpComplete(coverage: Record<StepId, boolean>): boolean {
  return MVP_STEPS.every((s) => coverage[s]);
}

// Steps still missing for the minimum viable profile, for a short panel hint.
export function missingForMvp(coverage: Record<StepId, boolean>): StepId[] {
  return MVP_STEPS.filter((s) => !coverage[s]);
}
