'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Play } from 'lucide-react';
import type { TextEffect } from '@/lib/types';
import { ANIM_OPTIONS } from '@/lib/types';
import { useStudio } from '@/lib/store';
import { uid } from '@/lib/utils';
import { FilmSurface, FilmText } from './Film';
import { Button, Eyebrow, Field, IconButton, Modal, Pill, Select, TagEditor, TextArea, TextInput } from './ui';

const SERIF = 'var(--font-fraunces), Georgia, serif';
const SAMPLE = 'Still water.';
const PACING = [
  { value: 'slow', label: 'Slow' },
  { value: 'medium', label: 'Medium' },
  { value: 'fast', label: 'Fast' },
];

function blank(): TextEffect {
  return { id: uid('fx'), name: 'New effect', anim: 'rise', register: [], pacing: 'medium', bestFor: [], needs: '' };
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
          <p className="mt-2 max-w-lg text-[13.5px] text-muted">How a line arrives. Hit play on any card to watch it move, then open it to tune or retire it.</p>
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
    <div className="group overflow-hidden rounded-2xl border border-line bg-panel">
      <FilmSurface className="relative aspect-[16/10]" bg="radial-gradient(700px 460px at 50% 45%,rgba(150,172,196,.20),transparent 64%),linear-gradient(180deg,#14191f,#0a0e13)">
        <FilmText text={SAMPLE} anim={fx.anim} font={SERIF} color="#eef3f7" cap={46} pos="center" playKey={playKey} />
        <button
          onClick={() => setPlayKey((k) => k + 1)}
          className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[11.5px] text-white/85 backdrop-blur transition-colors hover:text-white cursor-pointer"
        >
          <Play className="h-3 w-3" /> Replay
        </button>
        <div className="absolute right-2.5 top-2.5 opacity-0 transition-opacity group-hover:opacity-100">
          <IconButton onClick={onEdit} className="border-white/20 bg-black/40 text-white/80 backdrop-blur hover:text-white"><Pencil className="h-3.5 w-3.5" /></IconButton>
        </div>
      </FilmSurface>
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
  const exists = pantry.textEffects.some((f) => f.id === initial.id);
  const patch = (p: Partial<TextEffect>) => setFx((f) => ({ ...f, ...p }));

  const save = () => { upsertEffect(fx); onClose(); };
  const remove = () => { deleteEffect(fx.id); onClose(); };

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={exists ? 'Edit effect' : 'New effect'}
      title={fx.name || 'Untitled'}
      wide
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
      <div className="grid grid-cols-[1.1fr_1fr] gap-7">
        <div>
          <FilmSurface className="relative mb-3 aspect-[16/10] rounded-xl" bg="radial-gradient(700px 460px at 50% 45%,rgba(150,172,196,.20),transparent 64%),linear-gradient(180deg,#14191f,#0a0e13)">
            <FilmText text={SAMPLE} anim={fx.anim} font={SERIF} color="#eef3f7" cap={52} pos="center" playKey={playKey} />
          </FilmSurface>
          <Button onClick={() => setPlayKey((k) => k + 1)} className="w-full"><Play className="h-4 w-4" /> Play effect</Button>
        </div>

        <div>
          <Field label="Name"><TextInput value={fx.name} onChange={(e) => patch({ name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Animation"><Select value={fx.anim} onChange={(v) => { patch({ anim: v as TextEffect['anim'] }); setPlayKey((k) => k + 1); }} options={ANIM_OPTIONS} /></Field>
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
