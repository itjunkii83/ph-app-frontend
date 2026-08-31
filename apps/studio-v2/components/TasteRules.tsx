'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useStudio } from '@/lib/store';
import { Button, Eyebrow, Field, Select, Slider, TextArea, Toggle } from './ui';

const ARC_OPTIONS = [
  { value: 'calm-charged', label: 'Arrive calm, leave charged' },
  { value: 'mood', label: 'Follow the person\u2019s mood arc' },
  { value: 'drive', label: 'Pure drive, all gas' },
];
const BACKDROP_OPTIONS = [
  { value: 'shift', label: 'Only when meaning shifts' },
  { value: 'every', label: 'Fresh backdrop every beat' },
];

export function TasteRulesView() {
  const { pantry, taste, setTaste, setRule, addRule, deleteRule } = useStudio();

  return (
    <div className="max-w-3xl">
      <Eyebrow className="mb-2">Taste</Eyebrow>
      <h1 className="font-display text-[34px] leading-none text-paper">Taste rules</h1>
      <p className="mt-2 max-w-xl text-[13.5px] text-muted">Two layers. The dials are hard limits the generator obeys. The notes are guidance handed to the model as it composes.</p>

      <section className="mt-8 rounded-2xl border border-line bg-panel p-6">
        <div className="mb-5 text-[13px] font-semibold uppercase tracking-[0.2em] text-silver">Composition controls</div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          <Field label="Emotional arc"><Select value={taste.arc} onChange={(v) => setTaste({ arc: v as typeof taste.arc })} options={ARC_OPTIONS} /></Field>
          <Field label="Backdrop changes"><Select value={taste.backdrop} onChange={(v) => setTaste({ backdrop: v as typeof taste.backdrop })} options={BACKDROP_OPTIONS} /></Field>
          <Field label={`Max beats per film (${taste.maxBeats})`}><Slider value={taste.maxBeats} min={2} max={6} onChange={(maxBeats) => setTaste({ maxBeats })} /></Field>
          <div className="flex items-end pb-5">
            <Toggle on={taste.quotesReflective} onClick={() => setTaste({ quotesReflective: !taste.quotesReflective })} label="Quotes prefer reflective effects" />
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-panel p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="text-[13px] font-semibold uppercase tracking-[0.2em] text-silver">House notes</div>
          <Button sm onClick={addRule}><Plus className="h-3.5 w-3.5" /> Add note</Button>
        </div>
        <div className="space-y-3">
          {pantry.rules.map((r, i) => (
            <div key={i} className="flex items-start gap-3">
              <TextArea rows={1} value={r} onChange={(e) => setRule(i, e.target.value)} className="min-h-0" />
              <button onClick={() => deleteRule(i)} className="mt-2 flex-none text-muted2 hover:text-[#e0a08a] cursor-pointer"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          {pantry.rules.length === 0 ? <p className="text-[13px] text-muted">No house notes yet. Add one to shape how the model composes.</p> : null}
        </div>
      </section>
    </div>
  );
}
