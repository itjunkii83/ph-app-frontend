'use client';

import { useEffect, useMemo, useState } from 'react';
import { Play, Pause, RefreshCw, Shuffle, RotateCcw } from 'lucide-react';
import type { Film } from '@/lib/types';
import { useStudio } from '@/lib/store';
import { generateFilm, beatFromPairing, beatDuration } from '@/lib/generate';
import { FilmSurface, FilmText } from './Film';
import { Button, Eyebrow, Pill, Select, TextInput } from './ui';

export function PreviewBench() {
  const { pantry, taste, bgById, fxById } = useStudio();
  const [film, setFilm] = useState<Film | null>(null);
  const [token, setToken] = useState(0);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [sel, setSel] = useState<number | null>(null);

  const regen = () => {
    setFilm(generateFilm(pantry, taste));
    setToken((x) => x + 1);
    setT(0);
    setSel(null);
    setPlaying(true);
  };

  // generate on first mount
  useEffect(() => { setFilm(generateFilm(pantry, taste)); }, []); // eslint-disable-line

  const beats = film?.beats ?? [];
  const total = film?.total ?? 0;

  const bounds = useMemo(() => {
    let acc = 0;
    return beats.map((b) => { const start = acc; acc += b.dur; return { start, end: acc }; });
  }, [beats]);

  const idx = bounds.findIndex((b) => t < b.end);
  const cur = idx === -1 ? Math.max(0, beats.length - 1) : idx;
  const beat = beats[cur];

  useEffect(() => {
    if (!playing || !total) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setT((prev) => (prev + dt >= total ? 0 : prev + dt));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, total]);

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

  const reword = (i: number, text: string) => updateBeat(i, { text, dur: beatDuration(text) });

  const segments = useMemo(() => {
    const segs: { bgId: string; dur: number }[] = [];
    beats.forEach((b) => {
      const last = segs[segs.length - 1];
      if (last && last.bgId === b.bgId) last.dur += b.dur;
      else segs.push({ bgId: b.bgId, dur: b.dur });
    });
    return segs;
  }, [beats]);

  if (!film || !beat) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="mb-4 text-[13.5px] text-muted">Bless at least one pairing and the bench can compose a film.</p>
        <Button variant="accent" onClick={regen}><RefreshCw className="h-4 w-4" /> Try compose</Button>
      </div>
    );
  }

  const bg = bgById(beat.bgId);
  const fx = fxById(beat.fxId);
  const ctx = film.ctx;

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <Eyebrow className="mb-2">Compose</Eyebrow>
          <h1 className="font-display text-[34px] leading-none text-paper">Preview bench</h1>
        </div>
        <Button variant="accent" onClick={regen}><RefreshCw className="h-4 w-4" /> Regenerate</Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-panel px-4 py-3 text-[12.5px] text-muted">
        <span className="text-silver">Composing for:</span>
        <Pill>{ctx.mood}</Pill>
        <Pill soft>{ctx.goal}</Pill>
        <span className="text-muted2">{ctx.why}</span>
      </div>

      <FilmSurface bg={bg?.bg} className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line">
        <FilmText key={`${token}-${cur}`} text={beat.text} attr={beat.attr} anim={fx?.anim ?? 'rise'} font={beat.font} color={beat.color} cap={beat.cap} pos={beat.pos} />
        <button onClick={() => setPlaying((p) => !p)} className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3.5 py-2 text-[12px] text-white/85 backdrop-blur hover:text-white cursor-pointer">
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/45 px-3 py-1.5 text-[11px] text-filmmuted backdrop-blur">Beat {cur + 1} of {beats.length}</span>
      </FilmSurface>

      {/* timeline */}
      <div className="mt-5 select-none rounded-xl border border-line bg-panel p-4">
        <div className="relative">
          <div className="mb-1.5 text-[10.5px] uppercase tracking-[0.2em] text-muted2">Backdrop</div>
          <div className="flex gap-1">
            {segments.map((s, i) => (
              <div key={i} className="flex h-9 items-center justify-center overflow-hidden rounded-md border border-line text-[11px] text-filmmuted" style={{ width: `${(s.dur / total) * 100}%`, background: bgById(s.bgId)?.bg }}>
                <span className="truncate px-2">{bgById(s.bgId)?.name}</span>
              </div>
            ))}
          </div>

          <div className="mb-1.5 mt-3 text-[10.5px] uppercase tracking-[0.2em] text-muted2">Beats</div>
          <div className="flex gap-1">
            {beats.map((b, i) => (
              <button
                key={i}
                onClick={() => { setT(bounds[i].start + 0.001); setSel(i); setPlaying(false); }}
                className={`h-12 overflow-hidden rounded-md border px-2 text-left transition-colors cursor-pointer ${sel === i ? 'border-pewter bg-paper/[0.06]' : cur === i ? 'border-line2 bg-paper/[0.03]' : 'border-line hover:border-line2'}`}
                style={{ width: `${(b.dur / total) * 100}%` }}
              >
                <div className="truncate text-[11.5px] text-paper">{b.text}</div>
                <div className="truncate text-[10px] text-muted2">{fxById(b.fxId)?.name}</div>
              </button>
            ))}
          </div>

          {/* playhead */}
          <div className="pointer-events-none absolute -bottom-1 top-5 w-px bg-silver" style={{ left: `${(t / total) * 100}%` }}>
            <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-silver" />
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
