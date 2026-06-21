'use client';

import { useState } from 'react';
import { Plus, Trash2, Play, Monitor, Smartphone, ArrowLeft } from 'lucide-react';
import type { Pairing, Pantry } from '@/lib/types';
import { FONT_OPTIONS, COLOR_SWATCHES } from '@/lib/types';
import { useStudio } from '@/lib/store';
import { uid } from '@/lib/utils';
import { bgEffect, textEffect } from '@/lib/preview';
import { EffectStage } from './EffectStage';
import { Button, Eyebrow, Field, IconButton, Modal, Pill, Select, Slider, TagEditor, TextInput } from './ui';

const POS_OPTIONS = [
  { value: 'center', label: 'Center' },
  { value: 'upper', label: 'Upper third' },
  { value: 'lower', label: 'Lower third' },
];

function blankPairing(pantry: Pantry): Pairing {
  const bg = pantry.backgrounds[0];
  const fx = pantry.textEffects[0];
  return { id: uid('p'), bgId: bg?.id ?? '', fxId: fx?.id ?? '', text: 'Still water.', attr: '', font: FONT_OPTIONS[0].value, cap: 64, color: '#eef3f7', pos: 'center', mood: [], best: [] };
}

export function PairingsView() {
  const { pantry, bgById, fxById, deletePairing } = useStudio();
  const [designer, setDesigner] = useState<Pairing | null>(null);

  if (designer) return <PairingDesigner key={designer.id} initial={designer} onClose={() => setDesigner(null)} />;

  return (
    <div>
      <div className="mb-7 flex items-end justify-between">
        <div>
          <Eyebrow className="mb-2">Taste</Eyebrow>
          <h1 className="font-display text-[34px] leading-none text-paper">Pairings</h1>
          <p className="mt-2 max-w-xl text-[13.5px] text-muted">A blessed background, an effect, and a treatment. This is the one place your judgment is captured. The model only composes from what you bless here.</p>
        </div>
        <Button variant="accent" onClick={() => setDesigner(blankPairing(pantry))}><Plus className="h-4 w-4" /> New pairing</Button>
      </div>

      <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
        {pantry.pairings.map((p) => {
          const bg = bgById(p.bgId);
          const fx = fxById(p.fxId);
          return (
            <div
              key={p.id}
              onClick={() => setDesigner(p)}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-line bg-panel transition-colors hover:border-line2"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-black">
                <EffectStage background={bgEffect(bg)} text={textEffect(fx, { text: p.text, font: p.font, color: p.color, cap: p.cap, attr: p.attr })} pos={p.pos} replayKey={p.id} className="absolute inset-0" />
                <div className="absolute right-2.5 top-2.5 z-10 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <IconButton onClick={(e) => { e.stopPropagation(); deletePairing(p.id); }} className="border-white/20 bg-black/40 text-white/80 backdrop-blur hover:border-[#c8694a] hover:text-[#e0a08a]"><Trash2 className="h-3.5 w-3.5" /></IconButton>
                </div>
              </div>
              <div className="p-4">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <Pill>{bg?.name ?? 'missing bg'}</Pill>
                  <span className="text-muted2">+</span>
                  <Pill>{fx?.name ?? 'missing fx'}</Pill>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.best.map((b) => <Pill key={b} soft>{b}</Pill>)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PairingDesigner({ initial, onClose }: { initial: Pairing; onClose: () => void }) {
  const { pantry, bgById, fxById, upsertPairing, deletePairing } = useStudio();
  const [p, setP] = useState<Pairing>(initial);
  const [playKey, setPlayKey] = useState(0);
  const [device, setDevice] = useState(false);
  const exists = pantry.pairings.some((x) => x.id === initial.id);
  const patch = (patchObj: Partial<Pairing>) => setP((prev) => ({ ...prev, ...patchObj }));

  const bg = bgById(p.bgId);
  const fx = fxById(p.fxId);
  const txt = textEffect(fx, { text: p.text, font: p.font, color: p.color, cap: p.cap, attr: p.attr });

  const save = () => { upsertPairing(p); onClose(); };
  const remove = () => { deletePairing(p.id); onClose(); };

  return (
    <div>
      <button onClick={onClose} className="mb-5 inline-flex items-center gap-2 text-[13px] text-muted hover:text-paper cursor-pointer">
        <ArrowLeft className="h-4 w-4" /> Back to pairings
      </button>

      <div className="grid grid-cols-[1.25fr_1fr] gap-7">
        <div>
          <Eyebrow className="mb-2">{exists ? 'Edit pairing' : 'New pairing'}</Eyebrow>
          <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-black">
            <EffectStage background={bgEffect(bg)} text={txt} pos={p.pos} replayKey={`${p.bgId}:${p.fxId}:${playKey}`} className="absolute inset-0" />
          </div>
          <div className="flex gap-2.5">
            <Button onClick={() => setPlayKey((k) => k + 1)}><Play className="h-4 w-4" /> Replay</Button>
            <Button onClick={() => setDevice(true)}><Monitor className="h-4 w-4" /> Preview on devices</Button>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Background"><Select value={p.bgId} onChange={(v) => patch({ bgId: v })} options={pantry.backgrounds.map((b) => ({ value: b.id, label: b.name }))} /></Field>
            <Field label="Effect"><Select value={p.fxId} onChange={(v) => { patch({ fxId: v }); setPlayKey((k) => k + 1); }} options={pantry.textEffects.map((f) => ({ value: f.id, label: f.name }))} /></Field>
          </div>

          <Field label="Sample line"><TextInput value={p.text} onChange={(e) => patch({ text: e.target.value })} /></Field>
          <p className="-mt-2 mb-4 text-[11.5px] text-muted2">Sample only. The model swaps in the real line at generation. Treatment is what gets saved.</p>
          <Field label="Attribution (optional)"><TextInput value={p.attr} onChange={(e) => patch({ attr: e.target.value })} placeholder="Marcus Aurelius" /></Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Font"><Select value={p.font} onChange={(v) => patch({ font: v })} options={FONT_OPTIONS} /></Field>
            <Field label="Position"><Select value={p.pos} onChange={(v) => patch({ pos: v as Pairing['pos'] })} options={POS_OPTIONS} /></Field>
          </div>

          <Field label="Color">
            <div className="flex gap-2">
              {COLOR_SWATCHES.map((c) => (
                <button key={c} onClick={() => patch({ color: c })} className={`h-7 w-7 rounded-full border transition-all ${p.color === c ? 'border-pewter ring-2 ring-pewter ring-offset-2 ring-offset-panel' : 'border-line'}`} style={{ background: c }} />
              ))}
            </div>
          </Field>

          <Field label={`Size cap (${p.cap}px)`}><Slider value={p.cap} min={28} max={96} onChange={(cap) => patch({ cap })} /></Field>

          <Field label="Mood tags"><TagEditor tags={p.mood} onChange={(mood) => patch({ mood })} /></Field>
          <Field label="Best for"><TagEditor tags={p.best} onChange={(best) => patch({ best })} /></Field>

          <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
            {exists ? <Button variant="danger" onClick={remove}><Trash2 className="h-4 w-4" /> Delete</Button> : <span />}
            <Button variant="accent" onClick={save}>{exists ? 'Save changes' : 'Bless this pairing'}</Button>
          </div>
        </div>
      </div>

      {device ? <DeviceModal pairing={p} bg={bgEffect(bg)} text={txt} onClose={() => setDevice(false)} /> : null}
    </div>
  );
}

function DeviceModal({
  pairing: p,
  bg,
  text,
  onClose,
}: {
  pairing: Pairing;
  bg: ReturnType<typeof bgEffect>;
  text: ReturnType<typeof textEffect>;
  onClose: () => void;
}) {
  const [playKey, setPlayKey] = useState(0);
  return (
    <Modal open onClose={onClose} eyebrow="Preview" title="On devices" wide footer={<div className="flex justify-end"><Button onClick={() => setPlayKey((k) => k + 1)}><Play className="h-4 w-4" /> Replay both</Button></div>}>
      <div className="flex items-start justify-center gap-8">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted"><Monitor className="h-4 w-4" /> Desktop</div>
          <div className="relative aspect-video w-[460px] overflow-hidden rounded-xl border border-line bg-black">
            <EffectStage background={bg} text={text} pos={p.pos} replayKey={`d:${playKey}`} className="absolute inset-0" />
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted"><Smartphone className="h-4 w-4" /> Mobile</div>
          <div className="relative aspect-[9/16] w-[200px] overflow-hidden rounded-xl border border-line bg-black">
            <EffectStage background={bg} text={text} pos={p.pos} replayKey={`m:${playKey}`} className="absolute inset-0" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
