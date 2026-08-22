'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Background } from '@/lib/types';
import { useStudio } from '@/lib/store';
import { uid } from '@/lib/utils';
import { effectOptions, defaultConfig } from '@/lib/registry';
import { bgEffect } from '@/lib/preview';
import { EffectStage } from './EffectStage';
import { EffectConfigPanel } from './EffectConfigPanel';
import { Button, Eyebrow, Field, IconButton, Modal, Pill, Select, TagEditor, TextArea, TextInput } from './ui';

const CONTRAST = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function blank(): Background {
  return {
    id: uid('bg'),
    name: 'New backdrop',
    role: 'Opener',
    effectType: 'gradient-background',
    config: defaultConfig('gradient-background'),
    mood: [],
    metaphor: '',
    motion: [],
    zones: '',
    contrast: 'low',
  };
}

export function BackgroundsView() {
  const { pantry, deleteBackground } = useStudio();
  const [editing, setEditing] = useState<Background | null>(null);

  return (
    <div>
      <div className="mb-7 flex items-end justify-between">
        <div>
          <Eyebrow className="mb-2">Pantry</Eyebrow>
          <h1 className="font-display text-[34px] leading-none text-paper">Backgrounds</h1>
          <p className="mt-2 max-w-lg text-[13.5px] text-muted">Raw visual ingredients. Each one carries the tags that tell the model when it belongs in a film.</p>
        </div>
        <Button variant="accent" onClick={() => setEditing(blank())}><Plus className="h-4 w-4" /> Add background</Button>
      </div>

      <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
        {pantry.backgrounds.map((bg) => (
          <div
            key={bg.id}
            onClick={() => setEditing(bg)}
            className="group cursor-pointer overflow-hidden rounded-2xl border border-line bg-panel transition-colors hover:border-line2"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-black">
              <EffectStage background={bgEffect(bg)} replayKey={bg.id} className="absolute inset-0" />
              <span className="absolute bottom-2.5 left-3 z-10 rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-filmmuted backdrop-blur">{bg.role}</span>
              <div className="absolute right-2.5 top-2.5 z-10 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <IconButton onClick={(e) => { e.stopPropagation(); deleteBackground(bg.id); }} className="border-white/20 bg-black/40 text-white/80 backdrop-blur hover:border-[#c8694a] hover:text-[#e0a08a]"><Trash2 className="h-3.5 w-3.5" /></IconButton>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-1.5 font-display text-[19px] text-paper">{bg.name}</div>
              <div className="mb-3 line-clamp-2 text-[12.5px] italic text-muted">{bg.metaphor || 'No metaphor yet.'}</div>
              <div className="flex flex-wrap gap-1.5">
                {bg.mood.map((m) => <Pill key={m}>{m}</Pill>)}
                {bg.contrast ? <Pill soft>{bg.contrast} contrast</Pill> : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing ? <BackgroundEditor key={editing.id} initial={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

function BackgroundEditor({ initial, onClose }: { initial: Background; onClose: () => void }) {
  const { pantry, upsertBackground, deleteBackground } = useStudio();
  const [bg, setBg] = useState<Background>(initial);
  const exists = pantry.backgrounds.some((b) => b.id === initial.id);
  const patch = (p: Partial<Background>) => setBg((b) => ({ ...b, ...p }));

  const save = () => { upsertBackground(bg); onClose(); };
  const remove = () => { deleteBackground(bg.id); onClose(); };

  // Switching effect type resets the config to that effect's defaults.
  const changeEffect = (effectType: string) => patch({ effectType, config: defaultConfig(effectType) });

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={exists ? 'Edit background' : 'New background'}
      title={bg.name || 'Untitled'}
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
        {/* Effect: a small fixed preview + picker stay put; only the knobs scroll. */}
        <div className="flex min-h-0 flex-col">
          <div className="flex-none">
            <div className="relative h-[190px] w-full overflow-hidden rounded-xl border border-line bg-black">
              {/* Keyed by effect type only: switching the effect remounts, but
                  editing its config updates the live scene in place. */}
              <EffectStage background={bgEffect(bg)} replayKey={bg.effectType} className="absolute inset-0" />
            </div>
            <Field label="Effect"><Select value={bg.effectType} onChange={changeEffect} options={effectOptions('background')} /></Field>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-line bg-panel p-4">
            <EffectConfigPanel effectType={bg.effectType} config={bg.config} onChange={(config) => patch({ config })} />
          </div>
        </div>

        {/* Curation meta, scrolls independently. */}
        <div className="min-h-0 overflow-y-auto pr-1">
          <Field label="Name"><TextInput value={bg.name} onChange={(e) => patch({ name: e.target.value })} /></Field>
          <Field label="Role in a film"><TextInput value={bg.role} onChange={(e) => patch({ role: e.target.value })} placeholder="Opener, the turn, climax, closer" /></Field>
          <Field label="Metaphor"><TextArea rows={2} value={bg.metaphor} onChange={(e) => patch({ metaphor: e.target.value })} placeholder="What does this evoke in one line?" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contrast"><Select value={bg.contrast} onChange={(v) => patch({ contrast: v })} options={CONTRAST} /></Field>
          </div>
          <Field label="Mood tags"><TagEditor tags={bg.mood} onChange={(mood) => patch({ mood })} /></Field>
          <Field label="Motion tags"><TagEditor tags={bg.motion} onChange={(motion) => patch({ motion })} /></Field>
          <Field label="Safe zones"><TextArea rows={2} value={bg.zones} onChange={(e) => patch({ zones: e.target.value })} placeholder="Where type sits cleanly on this backdrop." /></Field>
        </div>
      </div>
    </Modal>
  );
}
