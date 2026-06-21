'use client';

import { useState } from 'react';
import { Plus, Trash2, Play } from 'lucide-react';
import type { TextEffect } from '@/lib/types';
import { useStudio } from '@/lib/store';
import { cn, uid } from '@/lib/utils';
import { effectOptions, defaultConfig } from '@/lib/registry';
import { NEUTRAL_BG, textEffect } from '@/lib/preview';
import { EffectStage } from './EffectStage';
import { EffectConfigPanel, TEXT_TREATMENT_FIELDS } from './EffectConfigPanel';
import { Button, Eyebrow, Field, Modal, Pill, Select, TagEditor, TextArea, TextInput } from './ui';

const SAMPLE_TREATMENT = { font: 'Fraunces', color: '#eef3f7', cap: 64 };
// Demo copy at three lengths, so you can watch the effect (and fit-to-box) handle
// a short line, a sentence, and a full paragraph.
const SAMPLES: Record<'small' | 'medium' | 'large', string> = {
  small: 'Still water.',
  medium: 'Begin before you feel ready. The day is already yours.',
  large:
    'We are what we repeatedly do. Excellence, then, is not an act but a habit. The impediment to action advances action, and what stands in the way becomes the way.',
};
type Len = keyof typeof SAMPLES;
const PACING = [
  { value: 'slow', label: 'Slow' },
  { value: 'medium', label: 'Medium' },
  { value: 'fast', label: 'Fast' },
];

function blank(): TextEffect {
  return {
    id: uid('fx'),
    name: 'New effect',
    effectType: 'masked-text-reveal',
    config: defaultConfig('masked-text-reveal'),
    register: [],
    pacing: 'medium',
    bestFor: [],
    needs: '',
  };
}

export function TextEffectsView() {
  const { pantry } = useStudio();
  const [editing, setEditing] = useState<TextEffect | null>(null);

  return (
    <div>
      <div className="mb-7 flex items-end justify-between">
        <div>
          <Eyebrow className="mb-2">Pantry</Eyebrow>
          <h1 className="font-display text-[34px] leading-none text-paper">Text effects</h1>
          <p className="mt-2 max-w-lg text-[13.5px] text-muted">How a line arrives. Hit replay on any card to watch it move, then open it to tune or retire it.</p>
        </div>
        <Button variant="accent" onClick={() => setEditing(blank())}><Plus className="h-4 w-4" /> Add effect</Button>
      </div>

      <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
        {pantry.textEffects.map((fx) => (
          <EffectCard key={fx.id} fx={fx} onEdit={() => setEditing(fx)} />
        ))}
      </div>

      {editing ? <EffectEditor key={editing.id} initial={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

function EffectCard({ fx, onEdit }: { fx: TextEffect; onEdit: () => void }) {
  const [playKey, setPlayKey] = useState(0);
  return (
    <div onClick={onEdit} className="cursor-pointer overflow-hidden rounded-2xl border border-line bg-panel transition-colors hover:border-line2">
      <div className="relative aspect-[16/10] overflow-hidden bg-black">
        <EffectStage background={NEUTRAL_BG} text={textEffect(fx, { ...SAMPLE_TREATMENT, cap: 46, text: SAMPLES.small })} replayKey={`${fx.id}:${playKey}`} className="absolute inset-0" />
        <button
          onClick={(e) => { e.stopPropagation(); setPlayKey((k) => k + 1); }}
          className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[11.5px] text-white/85 backdrop-blur transition-colors hover:text-white cursor-pointer"
        >
          <Play className="h-3 w-3" /> Replay
        </button>
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-display text-[19px] text-paper">{fx.name}</div>
          <Pill soft>{fx.pacing}</Pill>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {fx.register.map((r) => <Pill key={r}>{r}</Pill>)}
          {fx.bestFor.map((b) => <Pill key={b} soft>{b}</Pill>)}
        </div>
      </div>
    </div>
  );
}

function EffectEditor({ initial, onClose }: { initial: TextEffect; onClose: () => void }) {
  const { pantry, upsertEffect, deleteEffect } = useStudio();
  const [fx, setFx] = useState<TextEffect>(initial);
  const [playKey, setPlayKey] = useState(0);
  const [len, setLen] = useState<Len>('small');
  const exists = pantry.textEffects.some((f) => f.id === initial.id);
  const patch = (p: Partial<TextEffect>) => setFx((f) => ({ ...f, ...p }));

  const save = () => { upsertEffect(fx); onClose(); };
  const remove = () => { deleteEffect(fx.id); onClose(); };

  const changeEffect = (effectType: string) => { patch({ effectType, config: defaultConfig(effectType) }); setPlayKey((k) => k + 1); };

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={exists ? 'Edit effect' : 'New effect'}
      title={fx.name || 'Untitled'}
      wide
      tall
      footer={
        <div className="flex items-center justify-between">
          {exists ? <Button variant="danger" onClick={remove}><Trash2 className="h-4 w-4" /> Delete</Button> : <span />}
          <div className="flex gap-2.5">
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="accent" onClick={save}>{exists ? 'Save changes' : 'Add to pantry'}</Button>
          </div>
        </div>
      }
    >
      <div className="grid h-full min-h-0 grid-cols-[1.05fr_1fr] gap-7">
        {/* Effect: a small fixed preview + demo/replay stay put; options scroll. */}
        <div className="flex min-h-0 flex-col">
          <div className="flex-none">
            <div className="relative h-[190px] w-full overflow-hidden rounded-xl border border-line bg-black">
              <EffectStage background={NEUTRAL_BG} text={textEffect(fx, { ...SAMPLE_TREATMENT, text: SAMPLES[len] })} replayKey={`${fx.effectType}:${len}:${playKey}`} className="absolute inset-0" />
            </div>
            <div className="mb-3 mt-3 flex items-center gap-2">
              <span className="text-xs text-muted">Demo text</span>
              <div className="flex gap-1.5">
                {(['small', 'medium', 'large'] as Len[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLen(l); setPlayKey((k) => k + 1); }}
                    className={cn(
                      'rounded-[8px] border px-3 py-1.5 text-xs capitalize transition-colors cursor-pointer',
                      len === l ? 'border-pewter bg-paper/[0.06] text-paper' : 'border-line text-muted hover:border-line2 hover:text-paper',
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={() => setPlayKey((k) => k + 1)} className="mb-3 w-full"><Play className="h-4 w-4" /> Replay effect</Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-line bg-panel p-4">
            <div className="mb-2 text-xs text-muted">Effect options</div>
            <EffectConfigPanel effectType={fx.effectType} config={fx.config} onChange={(config) => patch({ config })} exclude={TEXT_TREATMENT_FIELDS} />
          </div>
        </div>

        {/* Curation meta, scrolls independently. */}
        <div className="min-h-0 overflow-y-auto pr-1">
          <Field label="Name"><TextInput value={fx.name} onChange={(e) => patch({ name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Effect"><Select value={fx.effectType} onChange={changeEffect} options={effectOptions('text')} /></Field>
            <Field label="Pacing"><Select value={fx.pacing} onChange={(v) => patch({ pacing: v as TextEffect['pacing'] })} options={PACING} /></Field>
          </div>
          <Field label="Register tags"><TagEditor tags={fx.register} onChange={(register) => patch({ register })} /></Field>
          <Field label="Best for"><TagEditor tags={fx.bestFor} onChange={(bestFor) => patch({ bestFor })} /></Field>
          <Field label="What it needs"><TextArea rows={3} value={fx.needs} onChange={(e) => patch({ needs: e.target.value })} placeholder="The conditions where this effect lands. The model reads this." /></Field>
        </div>
      </div>
    </Modal>
  );
}
