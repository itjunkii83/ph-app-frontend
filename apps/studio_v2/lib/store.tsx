'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Background, Pairing, Pantry, Taste, TextEffect, Theme } from './types';
import { SEED_PANTRY, SEED_TASTE } from './seed';

const STORE_KEY = 'ph-studio-v2';
const THEME_KEY = 'ph-studio-v2-theme';

interface PersistShape {
  pantry: Pantry;
  taste: Taste;
}

interface StudioCtx {
  pantry: Pantry;
  taste: Taste;
  theme: Theme;
  bgById: (id: string) => Background | undefined;
  fxById: (id: string) => TextEffect | undefined;
  upsertBackground: (bg: Background) => void;
  deleteBackground: (id: string) => void;
  upsertEffect: (fx: TextEffect) => void;
  deleteEffect: (id: string) => void;
  upsertPairing: (p: Pairing) => void;
  deletePairing: (id: string) => void;
  setRule: (i: number, text: string) => void;
  addRule: () => void;
  deleteRule: (i: number) => void;
  setTaste: (patch: Partial<Taste>) => void;
  toggleTheme: () => void;
  resetAll: () => void;
}

const Ctx = createContext<StudioCtx | null>(null);

function upsert<T extends { id: string }>(arr: T[], item: T): T[] {
  const i = arr.findIndex((x) => x.id === item.id);
  if (i === -1) return [...arr, item];
  const next = arr.slice();
  next[i] = item;
  return next;
}

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [pantry, setPantry] = useState<Pantry>(SEED_PANTRY);
  const [taste, setTasteState] = useState<Taste>(SEED_TASTE);
  const [theme, setTheme] = useState<Theme>('dark');
  const hydrated = useRef(false);

  // hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistShape;
        if (parsed.pantry) setPantry(parsed.pantry);
        if (parsed.taste) setTasteState(parsed.taste);
      }
      const t = (localStorage.getItem(THEME_KEY) as Theme) || 'dark';
      setTheme(t);
      document.documentElement.dataset.theme = t;
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, []);

  // persist
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ pantry, taste }));
    } catch {
      /* ignore */
    }
  }, [pantry, taste]);

  const bgById = useCallback((id: string) => pantry.backgrounds.find((b) => b.id === id), [pantry.backgrounds]);
  const fxById = useCallback((id: string) => pantry.textEffects.find((f) => f.id === id), [pantry.textEffects]);

  const upsertBackground = useCallback((bg: Background) => setPantry((p) => ({ ...p, backgrounds: upsert(p.backgrounds, bg) })), []);
  const deleteBackground = useCallback((id: string) => setPantry((p) => ({ ...p, backgrounds: p.backgrounds.filter((b) => b.id !== id) })), []);
  const upsertEffect = useCallback((fx: TextEffect) => setPantry((p) => ({ ...p, textEffects: upsert(p.textEffects, fx) })), []);
  const deleteEffect = useCallback((id: string) => setPantry((p) => ({ ...p, textEffects: p.textEffects.filter((f) => f.id !== id) })), []);
  const upsertPairing = useCallback((pp: Pairing) => setPantry((p) => ({ ...p, pairings: upsert(p.pairings, pp) })), []);
  const deletePairing = useCallback((id: string) => setPantry((p) => ({ ...p, pairings: p.pairings.filter((x) => x.id !== id) })), []);

  const setRule = useCallback((i: number, text: string) => setPantry((p) => {
    const rules = p.rules.slice();
    rules[i] = text;
    return { ...p, rules };
  }), []);
  const addRule = useCallback(() => setPantry((p) => ({ ...p, rules: [...p.rules, 'New principle.'] })), []);
  const deleteRule = useCallback((i: number) => setPantry((p) => ({ ...p, rules: p.rules.filter((_, idx) => idx !== i) })), []);

  const setTaste = useCallback((patch: Partial<Taste>) => setTasteState((t) => ({ ...t, ...patch })), []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setPantry(SEED_PANTRY);
    setTasteState(SEED_TASTE);
  }, []);

  const value = useMemo<StudioCtx>(() => ({
    pantry, taste, theme, bgById, fxById,
    upsertBackground, deleteBackground, upsertEffect, deleteEffect,
    upsertPairing, deletePairing, setRule, addRule, deleteRule, setTaste, toggleTheme, resetAll,
  }), [pantry, taste, theme, bgById, fxById, upsertBackground, deleteBackground, upsertEffect, deleteEffect, upsertPairing, deletePairing, setRule, addRule, deleteRule, setTaste, toggleTheme, resetAll]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudio(): StudioCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStudio must be used within StudioProvider');
  return ctx;
}
