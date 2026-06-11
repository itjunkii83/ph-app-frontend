'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Background } from '@/lib/types';
import { useStudio } from '@/lib/store';
import { uid } from '@/lib/utils';
import { FilmSurface } from './Film';
import { Button, Eyebrow, Field, IconButton, Modal, Pill, Select, TagEditor, TextArea, TextInput } from './ui';

const PRESET_BGS: { label: string; bg: string }[] = [
  { label: 'Storm water', bg: 'radial-gradient(900px 540px at 56% 34%,rgba(150,172,196,.34),transparent 64%),linear-gradient(180deg,#1b232c 0%,#0e141a 60%,#0a0e13 100%)' },
  { label: 'First light', bg: 'radial-gradient(880px 560px at 68% 80%,rgba(228,176,120,.40),transparent 66%),linear-gradient(180deg,#191310 0%,#241a14 70%,#15100d 100%)' },
  { label: 'Deep current', bg: 'radial-gradient(920px 620px at 42% 28%,rgba(96,138,190,.38),transparent 64%),linear-gradient(180deg,#0d1822 0%,#0a121c 55%,#070d15 100%)' },
  { label: 'Ember', bg: 'radial-gradient(760px 520px at 50% 92%,rgba(228,116,72,.46),transparent 64%),linear-gradient(180deg,#1a1310 0%,#241410 65%,#120b09 100%)' },
  { label: 'Horizon', bg: 'linear-gradient(180deg,#141c24 0%,#222c36 50%,#0f161d 100%),radial-gradient(1100px 480px at 50% 50%,rgba(180,196,212,.30),transparent 62%)' },
  { label: 'Slate dusk', bg: 'radial-gradient(820px 560px at 40% 78%,rgba(120,140,170,.32),transparent 64%),linear-gradient(180deg,#161a20 0%,#0d1014 70%,#090b0e 100%)' },
];

const CONTRAST = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function blank(): Background {
  return { id: uid('bg'), name: 'New backdrop', role: 'Opener', bg: PRESET_BGS[0].bg, mood: [], metaphor: '', motion: [], zones: '', contrast: 'low' };
}

export function BackgroundsView() {
  const { pantry } = useStudio();
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
          <div key={bg.id} className="group overflow-hidden rounded-2xl border border-line bg-panel">
            <FilmSurface bg={bg.bg} className="relative aspect-[16/10]">
              <div className="absolute right-2.5 top-2.5 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <IconButton onClick={() => setEditing(bg)} className="border-white/20 bg-black/40 text-white/80 backdrop-blur hover:text-white"><Pencil className="h-3.5 w-3.5" /></IconButton>
              </div>
              <span className="absolute bottom-2.5 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-filmmuted backdrop-blur">{bg.role}</span>
            </FilmSurface>
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

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={exists ? 'Edit background' : 'New background'}
      title={bg.name || 'Untitled'}
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
          <FilmSurface bg={bg.bg} className="mb-3 aspect-[16/10] rounded-xl" />
          <div className="mb-2 text-xs text-muted">Pick a visual</div>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_BGS.map((p) => (
              <button
                key={p.label}
                onClick={() => patch({ bg: p.bg })}
                title={p.label}
                className={`aspect-[16/10] rounded-lg border transition-all ${bg.bg === p.bg ? 'border-pewter ring-1 ring-pewter' : 'border-line hover:border-line2'}`}
                style={{ background: p.bg }}
              />
            ))}
          </div>
        </div>

        <div>
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
