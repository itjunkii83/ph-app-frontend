'use client';

import { useState } from 'react';
import { Button, Slider, Toggle } from '@/components/ui';
import { DIMENSIONS, type Dimension } from '@/lib/zoltar/types';
import { applyDimensionGrid, type GridEntry } from '@/lib/zoltar/apply';
import { type CardProps, type Of, clean } from './shared';

type Row = { importance: number; active: boolean };

// The dimension_grid card carries only a prompt (shown in the assistant message);
// this control renders the fixed eight dimensions directly.
export function DimensionGridCard({ onSubmit, disabled }: CardProps<Of<'dimension_grid'>>) {
  const [rows, setRows] = useState<Record<Dimension, Row>>(() =>
    DIMENSIONS.reduce(
      (acc, d) => {
        acc[d.slug] = { importance: 3, active: false };
        return acc;
      },
      {} as Record<Dimension, Row>,
    ),
  );

  const setRow = (slug: Dimension, patch: Partial<Row>) => setRows((s) => ({ ...s, [slug]: { ...s[slug], ...patch } }));

  const submit = () => {
    const entries: GridEntry[] = DIMENSIONS.map((d) => ({
      dimension: d.slug,
      importance: rows[d.slug].importance,
      active: rows[d.slug].active,
    }));
    const summary = DIMENSIONS.map((d) => `${clean(d.label)} ${rows[d.slug].importance}${rows[d.slug].active ? ' active' : ''}`).join(', ');
    onSubmit(`[dimension_grid] ${summary}`, (m) => applyDimensionGrid(m, entries));
  };

  return (
    <div className="flex flex-col gap-2.5">
      {DIMENSIONS.map((d) => {
        const r = rows[d.slug];
        return (
          <div key={d.slug} className="flex items-center gap-3">
            <div className="w-[150px] flex-none text-[13px] text-paper">{d.label}</div>
            <div className="flex-1">
              <Slider value={r.importance} min={1} max={5} onChange={(v) => setRow(d.slug, { importance: v })} />
            </div>
            <div className="w-4 flex-none text-center text-[12px] text-silver">{r.importance}</div>
            <Toggle on={r.active} onClick={() => setRow(d.slug, { active: !r.active })} label="active" />
          </div>
        );
      })}
      <div className="pt-1">
        <Button sm variant="accent" disabled={disabled} onClick={submit}>
          Save dimensions
        </Button>
      </div>
    </div>
  );
}
