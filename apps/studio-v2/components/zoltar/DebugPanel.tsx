'use client';

import { Button, Select, Toggle, Pill, Eyebrow, Field } from '@/components/ui';
import { cn } from '@/lib/utils';
import { modelGroups } from '@/lib/zoltar/models';
import { computeCoverage, isMvpComplete, missingForMvp } from '@/lib/zoltar/coverage';
import { STEPS, DIMENSIONS, dimensionLabel, type Session, type Entry, type EntryBucket, type StepId } from '@/lib/zoltar/types';

const BUCKETS: { key: EntryBucket; label: string }[] = [
  { key: 'desired_change', label: 'Desired change' },
  { key: 'identity_statements', label: 'Identity' },
  { key: 'why_now', label: 'Why now' },
  { key: 'current_reality', label: 'Current reality' },
  { key: 'constraints', label: 'Constraints' },
  { key: 'preferences', label: 'Preferences' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'outcomes', label: 'Outcomes' },
  { key: 'missions', label: 'Missions' },
];

function summarize(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function EntryRow({ entry }: { entry: Entry<unknown> }) {
  return (
    <div className="flex flex-col gap-1 border-t border-line py-2 first:border-t-0">
      <div className="text-[12.5px] text-paper break-words">{summarize(entry.value)}</div>
      <div className="flex gap-1.5">
        <Pill soft>{entry.provenance === 'user_stated' ? 'user' : `inferred ${(entry.confidence ?? 0).toFixed(1)}`}</Pill>
        <Pill>{entry.status}</Pill>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line px-5 py-4">
      <Eyebrow className="mb-3">{title}</Eyebrow>
      {children}
    </div>
  );
}

export function DebugPanel({
  session,
  setModel,
  setThinking,
  markStarted,
  startFresh,
  exportSession,
}: {
  session: Session;
  setModel: (id: string) => void;
  setThinking: (on: boolean) => void;
  markStarted: () => void;
  startFresh: () => void;
  exportSession: () => void;
}) {
  const lastAssistant = [...session.transcript].reverse().find((e) => e.role === 'assistant');
  const modelStatus = lastAssistant && lastAssistant.role === 'assistant' ? lastAssistant.turn.step_status : null;
  const stepFocus = lastAssistant && lastAssistant.role === 'assistant' ? lastAssistant.turn.step_focus : null;
  const lastLog = session.turns[session.turns.length - 1] ?? null;
  const sessionCost = session.turns.reduce((sum, t) => sum + t.cost, 0);

  const coverage = computeCoverage(session.userModel);
  const mvp = isMvpComplete(coverage);
  const missing = missingForMvp(coverage);

  return (
    <aside className="flex w-[380px] flex-none flex-col overflow-y-auto border-l border-line bg-ink2">
      <Section title="Model">
        <Field label="OpenRouter model">
          <Select value={session.modelId} onChange={setModel} groups={modelGroups()} />
        </Field>
        <div className="mt-3">
          <Toggle on={session.thinking} onClick={() => setThinking(!session.thinking)} label="Thinking" />
        </div>
      </Section>

      <Section title="Cost (estimate)">
        {lastLog ? (
          <div className="flex flex-col gap-1 text-[12.5px] text-silver">
            <div>
              Last turn: {lastLog.usage.prompt_tokens} in / {lastLog.usage.completion_tokens} out, ${lastLog.cost.toFixed(5)}
            </div>
            <div>Session total: ${sessionCost.toFixed(5)}</div>
            {lastLog.usage.reasoningUnsupported && <Pill soft>reasoning unsupported, retried without it</Pill>}
          </div>
        ) : (
          <div className="text-[12.5px] text-muted">No turns yet.</div>
        )}
      </Section>

      <Section title="Onboarding steps">
        <div className="flex flex-col gap-1">
          {STEPS.map((s) => {
            const ms = modelStatus ? modelStatus[String(s.n) as `${StepId}`] : 'pending';
            const covered = coverage[s.n];
            const focused = stepFocus === s.n;
            return (
              <div
                key={s.n}
                className={cn(
                  'flex items-center justify-between rounded-[8px] px-2 py-1.5 text-[12.5px]',
                  focused ? 'bg-paper/[0.06] text-paper' : 'text-muted',
                )}
              >
                <span className="truncate pr-2">
                  {s.n}. {s.label}
                </span>
                <span className="flex flex-none items-center gap-1.5">
                  <span className="text-[11px] text-silver">{ms}</span>
                  <span className={cn('h-2 w-2 rounded-full', covered ? 'bg-grad' : 'border border-line2')} />
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3">
          {mvp ? (
            session.started ? (
              <Pill>Started</Pill>
            ) : (
              <Button sm variant="accent" onClick={markStarted}>
                Start now
              </Button>
            )
          ) : (
            <div className="text-[11.5px] text-muted">
              Minimum viable profile needs steps {missing.join(', ')} (1, 2, 5, 6, 8).
            </div>
          )}
        </div>
      </Section>

      <Section title="User model">
        <div className="flex flex-col gap-2">
          {BUCKETS.map((b) => {
            const entries = session.userModel[b.key] as Entry<unknown>[];
            return (
              <details key={b.key} className="rounded-[8px] border border-line px-3 py-2">
                <summary className="cursor-pointer text-[12.5px] text-silver">
                  {b.label} ({entries.length})
                </summary>
                <div className="mt-1">
                  {entries.length === 0 ? (
                    <div className="text-[12px] text-muted">empty</div>
                  ) : (
                    entries.map((e) => <EntryRow key={e.id} entry={e} />)
                  )}
                </div>
              </details>
            );
          })}

          <details className="rounded-[8px] border border-line px-3 py-2">
            <summary className="cursor-pointer text-[12.5px] text-silver">Life dimensions</summary>
            <div className="mt-1 flex flex-col gap-1">
              {DIMENSIONS.map((d) => {
                const st = session.userModel.life_dimensions[d.slug];
                return (
                  <div key={d.slug} className="flex items-center justify-between text-[12px] text-muted">
                    <span>{dimensionLabel(d.slug)}</span>
                    <span className="text-silver">
                      {st.importance ?? '-'}
                      {st.active ? ' active' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </details>

          <details className="rounded-[8px] border border-line px-3 py-2">
            <summary className="cursor-pointer text-[12.5px] text-silver">Week</summary>
            <div className="mt-1 text-[12px] text-muted">
              {session.userModel.week
                ? `${session.userModel.week.commitments.length} commitments, must-win: ${session.userModel.week.must_win.join(', ') || 'none'}`
                : 'no week yet'}
            </div>
          </details>
        </div>
      </Section>

      <Section title="Raw last turn">
        {session.lastError && (
          <details className="mb-2 rounded-[8px] border border-line2 px-3 py-2" open>
            <summary className="cursor-pointer text-[12.5px] text-[#e0a08a]">Last error: {session.lastError.message}</summary>
            <pre className="mt-2 max-h-[240px] overflow-auto text-[11px] leading-snug text-muted">
              {JSON.stringify(session.lastError.raw, null, 2)}
            </pre>
          </details>
        )}
        {lastLog?.raw ? (
          <div className="flex flex-col gap-2">
            <details className="rounded-[8px] border border-line px-3 py-2">
              <summary className="cursor-pointer text-[12.5px] text-silver">Request</summary>
              <pre className="mt-2 max-h-[240px] overflow-auto text-[11px] leading-snug text-muted">
                {JSON.stringify(lastLog.raw.request, null, 2)}
              </pre>
            </details>
            <details className="rounded-[8px] border border-line px-3 py-2">
              <summary className="cursor-pointer text-[12.5px] text-silver">Response</summary>
              <pre className="mt-2 max-h-[240px] overflow-auto text-[11px] leading-snug text-muted">
                {JSON.stringify(lastLog.raw.response, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <div className="text-[12.5px] text-muted">No raw payload yet.</div>
        )}
      </Section>

      <div className="mt-auto flex gap-2 px-5 py-4">
        <Button sm variant="danger" onClick={startFresh}>
          Start fresh
        </Button>
        <Button sm onClick={exportSession}>
          Export session
        </Button>
      </div>
    </aside>
  );
}
