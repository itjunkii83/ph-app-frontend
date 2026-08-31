'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Shuffle, RotateCcw, UploadCloud } from 'lucide-react';
import { PresentationPlayer } from '@harbor/player';
import type { Film } from '@/lib/types';
import { useStudio } from '@/lib/store';
import { generateFilm, beatFromPairing, beatDuration } from '@/lib/generate';
import { filmToPresentation, bgSwatch, type Timing } from '@/lib/toPresentation';
import { publishSample } from '@/lib/studioStore';
import { cn } from '@/lib/utils';
import { Button, Eyebrow, Pill, Select, TextInput } from './ui';

// Configured Storage base URL for resolving relative media keys in real
// backgrounds. Gradients need nothing, but image backgrounds resolve through it.
const ASSET_BASE = process.env.NEXT_PUBLIC_STORAGE_BASE_URL ?? '';

export function PreviewBench() {
  const { pantry, taste, bgById, fxById } = useStudio();
  const [film, setFilm] = useState<Film | null>(null);
  // The token keys the player: a bump remounts it, replaying from the first beat
  // (used by regenerate, swap, reword, and looping on completion).
  const [token, setToken] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  // Quick (default): enter, hold 2s, exit, for fast review. Realistic: hold by
  // reading time (200 wpm).
  const [timing, setTiming] = useState<Timing>('quick');

  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);

  const regen = () => {
    setFilm(generateFilm(pantry, taste));
    setToken((x) => x + 1);
    setSel(null);
    setPublishMsg(null);
  };

  // Debug fixture: publish this sample to the presentations collection so /play
  // can show it. Tagged as a sample so it never blurs with real content.
  const publish = async () => {
    if (!film) return;
    setPublishing(true);
    setPublishMsg(null);
    const res = await publishSample(film, pantry, timing);
    setPublishing(false);
    setPublishMsg(res ? 'Published. Open /play in the toolkit to watch it.' : 'Publish failed. Check the server logs.');
  };

  // generate on first mount
  useEffect(() => { setFilm(generateFilm(pantry, taste)); }, []); // eslint-disable-line

  const beats = film?.beats ?? [];
  const total = film?.total ?? 0;

  // The real renderer drives the stage. The film is a debug sample: backgrounds
  // and text effects render exactly as they will on /play.
  const presentation = useMemo(
    () => (film && film.beats.length ? filmToPresentation(film, pantry, { title: 'Sample', timing }) : null),
    [film, pantry, timing],
  );

  const setMode = (m: Timing) => { setTiming(m); setToken((x) => x + 1); };

  const updateBeat = (i: number, patch: Partial<(typeof beats)[number]>) => {
    setFilm((f) => {
      if (!f) return f;
      const next = f.beats.slice();
      next[i] = { ...next[i], ...patch };
      return { ...f, beats: next, total: next.reduce((s, b) => s + b.dur, 0) };
    });
  };

  const swapPairing = (i: number, pairingId: string) => {
    const p = pantry.pairings.find((x) => x.id === pairingId);
    if (!p) return;
    const rebuilt = beatFromPairing(p, beats[i].text, beats[i].attr, beats[i].slot);
    updateBeat(i, rebuilt);
    setToken((x) => x + 1);
  };

  const reword = (i: number, text: string) => {
    updateBeat(i, { text, dur: beatDuration(text) });
    setToken((x) => x + 1);
  };

  const segments = useMemo(() => {
    const segs: { bgId: string; dur: number }[] = [];
    beats.forEach((b) => {
      const last = segs[segs.length - 1];
      if (last && last.bgId === b.bgId) last.dur += b.dur;
      else segs.push({ bgId: b.bgId, dur: b.dur });
    });
    return segs;
  }, [beats]);

  if (!film || !presentation) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="mb-4 text-[13.5px] text-muted">Bless at least one pairing and the bench can compose a film.</p>
        <Button variant="accent" onClick={regen}><RefreshCw className="h-4 w-4" /> Try compose</Button>
      </div>
    );
  }

  const ctx = film.ctx;

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <Eyebrow className="mb-2">Compose</Eyebrow>
          <h1 className="font-display text-[34px] leading-none text-paper">Preview bench</h1>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex gap-2.5">
            <Button onClick={publish} disabled={publishing}><UploadCloud className="h-4 w-4" /> {publishing ? 'Publishing...' : 'Publish sample'}</Button>
            <Button variant="accent" onClick={regen}><RefreshCw className="h-4 w-4" /> Regenerate</Button>
          </div>
          {publishMsg ? <span className="text-[11.5px] text-muted2">{publishMsg}</span> : null}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-panel px-4 py-3 text-[12.5px] text-muted">
        <span className="text-silver">Composing for:</span>
        <Pill>{ctx.mood}</Pill>
        <Pill soft>{ctx.goal}</Pill>
        <span className="text-muted2">{ctx.why}</span>
      </div>

      {/* Timing mode: quick review vs realistic reading pace. */}
      <div className="mb-3 flex items-center gap-3">
        <div className="inline-flex rounded-[10px] border border-line p-0.5">
          {(['quick', 'realistic'] as Timing[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'rounded-[8px] px-3.5 py-1.5 text-xs capitalize transition-colors cursor-pointer',
                timing === m ? 'bg-paper/[0.08] text-paper' : 'text-muted hover:text-paper',
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <span className="text-[11.5px] text-muted2">
          {timing === 'quick' ? 'Enter, hold 2s, exit. Fast review of effects and backgrounds.' : 'Holds each line by reading time (200 wpm).'}
        </span>
      </div>

      {/* The real player. A debug sample of the pantry, rendered exactly as it ships. */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-black">
        <PresentationPlayer
          key={token}
          presentation={presentation}
          assetBaseUrl={ASSET_BASE}
          onComplete={() => setToken((x) => x + 1)}
        />
      </div>

      {/* timeline (read-only display of the composition) */}
      <div className="mt-5 select-none rounded-xl border border-line bg-panel p-4">
        <div>
          <div className="mb-1.5 text-[10.5px] uppercase tracking-[0.2em] text-muted2">Backdrop</div>
          <div className="flex gap-1">
            {segments.map((s, i) => (
              <div key={i} className="flex h-9 items-center justify-center overflow-hidden rounded-md border border-line text-[11px] text-filmmuted" style={{ width: `${(s.dur / total) * 100}%`, background: bgSwatch(bgById(s.bgId)) }}>
                <span className="truncate px-2">{bgById(s.bgId)?.name}</span>
              </div>
            ))}
          </div>

          <div className="mb-1.5 mt-3 text-[10.5px] uppercase tracking-[0.2em] text-muted2">Beats</div>
          <div className="flex gap-1">
            {beats.map((b, i) => (
              <button
                key={i}
                onClick={() => setSel(i)}
                className={`h-12 overflow-hidden rounded-md border px-2 text-left transition-colors cursor-pointer ${sel === i ? 'border-pewter bg-paper/[0.06]' : 'border-line hover:border-line2'}`}
                style={{ width: `${(b.dur / total) * 100}%` }}
              >
                <div className="truncate text-[11.5px] text-paper">{b.text}</div>
                <div className="truncate text-[10px] text-muted2">{fxById(b.fxId)?.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* override panel */}
      {sel !== null && beats[sel] ? (
        <div className="mt-4 rounded-xl border border-line bg-panel p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-silver">Beat {sel + 1} override</span>
            <Pill soft>{beats[sel].slot}</Pill>
          </div>
          <div className="grid grid-cols-[1fr_1fr] gap-4">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs text-muted"><Shuffle className="h-3.5 w-3.5" /> Swap pairing</span>
              <Select
                value={beats[sel].pairingId}
                onChange={(v) => swapPairing(sel, v)}
                options={pantry.pairings.map((p) => ({ value: p.id, label: `${bgById(p.bgId)?.name ?? '?'} + ${fxById(p.fxId)?.name ?? '?'}` }))}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs text-muted"><RotateCcw className="h-3.5 w-3.5" /> Reword the line</span>
              <TextInput value={beats[sel].text} onChange={(e) => reword(sel, e.target.value)} />
            </label>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-center text-[12.5px] text-muted2">Tap a beat to swap its pairing or reword the line.</p>
      )}
    </div>
  );
}
