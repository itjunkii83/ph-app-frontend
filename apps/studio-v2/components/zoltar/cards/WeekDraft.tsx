'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button, Select, TextInput, Eyebrow, IconButton } from '@/components/ui';
import { approveWeek } from '@/lib/zoltar/apply';
import type { WeekDraft } from '@/lib/zoltar/types';
import { type CardProps, type Of, clean } from './shared';

type Day = WeekDraft['commitments'][number]['day'];

const DAYS: { slug: Day; label: string }[] = [
  { slug: 'mon', label: 'Mon' },
  { slug: 'tue', label: 'Tue' },
  { slug: 'wed', label: 'Wed' },
  { slug: 'thu', label: 'Thu' },
  { slug: 'fri', label: 'Fri' },
  { slug: 'sat', label: 'Sat' },
  { slug: 'sun', label: 'Sun' },
];

export function WeekDraftCard({ card, onSubmit, disabled }: CardProps<Of<'week_draft'>>) {
  const [week, setWeek] = useState<WeekDraft>(() => structuredClone(card.week));

  const setTitle = (id: string, title: string) =>
    setWeek((w) => ({ ...w, commitments: w.commitments.map((c) => (c.id === id ? { ...c, title } : c)) }));
  const setDay = (id: string, day: Day) =>
    setWeek((w) => ({ ...w, commitments: w.commitments.map((c) => (c.id === id ? { ...c, day } : c)) }));
  const remove = (id: string) => setWeek((w) => ({ ...w, commitments: w.commitments.filter((c) => c.id !== id) }));

  const submit = () => {
    const summary = `${week.commitments.length} commitments, must-win: ${week.must_win.map(clean).join(', ') || 'none'}`;
    onSubmit(`[week_draft] approved: ${summary}`, (m) => approveWeek(m, week));
  };

  return (
    <div className="flex flex-col gap-4">
      {week.must_win.length > 0 && (
        <div>
          <Eyebrow>Must win</Eyebrow>
          <ul className="mt-1 text-[13px] text-paper">
            {week.must_win.map((x, i) => (
              <li key={i}>- {x}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((d) => (
          <div key={d.slug} className="min-h-[80px] rounded-[10px] border border-line bg-ink2 p-2">
            <div className="mb-2 text-[10.5px] uppercase tracking-[0.18em] text-muted2">{d.label}</div>
            <div className="flex flex-col gap-2">
              {week.commitments
                .filter((c) => c.day === d.slug)
                .map((c) => (
                  <div key={c.id} className="rounded-[8px] border border-line2 bg-panel p-2">
                    <TextInput value={c.title} disabled={disabled} onChange={(e) => setTitle(c.id, e.target.value)} className="text-[12px]" />
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <div className="flex-1">
                        <Select
                          value={c.day}
                          onChange={(v) => setDay(c.id, v as Day)}
                          options={DAYS.map((x) => ({ value: x.slug, label: x.label }))}
                        />
                      </div>
                      <IconButton disabled={disabled} onClick={() => remove(c.id)} aria-label="Remove commitment">
                        <X className="h-3.5 w-3.5" />
                      </IconButton>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {week.routines.length > 0 && (
        <div>
          <Eyebrow>Routines</Eyebrow>
          <ul className="mt-1 text-[12.5px] text-muted">
            {week.routines.map((r) => (
              <li key={r.id}>
                - {r.title} ({r.cadence})
              </li>
            ))}
          </ul>
        </div>
      )}

      {week.open_capacity_note && <div className="text-[12.5px] text-silver">Open capacity: {week.open_capacity_note}</div>}

      <div>
        <Button sm variant="accent" disabled={disabled} onClick={submit}>
          Approve week
        </Button>
      </div>
    </div>
  );
}
