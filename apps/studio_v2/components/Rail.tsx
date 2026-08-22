'use client';

import { Image as ImageIcon, Type, Layers, SlidersHorizontal, Clapperboard, Sun, Moon, RotateCcw } from 'lucide-react';
import type { View } from '@/lib/types';
import { useStudio } from '@/lib/store';
import { cn } from '@/lib/utils';

const GROUPS: { label: string; items: { view: View; label: string; icon: React.ReactNode }[] }[] = [
  {
    label: 'Pantry',
    items: [
      { view: 'backgrounds', label: 'Backgrounds', icon: <ImageIcon className="h-[17px] w-[17px]" /> },
      { view: 'effects', label: 'Text effects', icon: <Type className="h-[17px] w-[17px]" /> },
    ],
  },
  {
    label: 'Taste',
    items: [
      { view: 'pairings', label: 'Pairings', icon: <Layers className="h-[17px] w-[17px]" /> },
      { view: 'rules', label: 'Taste rules', icon: <SlidersHorizontal className="h-[17px] w-[17px]" /> },
    ],
  },
  {
    label: 'Compose',
    items: [{ view: 'preview', label: 'Preview bench', icon: <Clapperboard className="h-[17px] w-[17px]" /> }],
  },
];

export function Rail({ view, setView }: { view: View; setView: (v: View) => void }) {
  const { theme, toggleTheme, resetAll } = useStudio();
  const activeBase: View = view === 'designer' ? 'pairings' : view;

  const reset = () => {
    if (window.confirm('Reset the pantry to the full default set? This replaces all backgrounds, effects, pairings, and rules.')) {
      resetAll();
    }
  };

  return (
    <aside className="flex w-[228px] flex-none flex-col border-r border-line bg-ink2">
      <div className="flex items-center gap-2.5 px-6 pb-5 pt-6">
        <span className="h-7 w-7 flex-none rounded-md bg-grad" />
        <div className="leading-tight">
          <div className="font-display text-[17px] text-paper">Pause Harbor</div>
          <div className="text-[11px] uppercase tracking-[0.26em] text-muted">Studio</div>
        </div>
      </div>

      <nav className="flex-1 px-3">
        {GROUPS.map((g) => (
          <div key={g.label} className="mb-5">
            <div className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.24em] text-muted2">{g.label}</div>
            {g.items.map((it) => {
              const active = activeBase === it.view;
              return (
                <button
                  key={it.view}
                  onClick={() => setView(it.view)}
                  className={cn(
                    'mb-0.5 flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[13.5px] transition-colors cursor-pointer',
                    active ? 'bg-paper/[0.07] text-paper' : 'text-muted hover:bg-paper/[0.04] hover:text-paper',
                  )}
                >
                  <span className={active ? 'text-silver' : 'text-muted'}>{it.icon}</span>
                  {it.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] text-muted transition-colors hover:bg-paper/[0.04] hover:text-paper cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="h-[17px] w-[17px]" /> : <Moon className="h-[17px] w-[17px]" />}
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
        <button
          onClick={reset}
          className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] text-muted transition-colors hover:bg-paper/[0.04] hover:text-paper cursor-pointer"
        >
          <RotateCcw className="h-[17px] w-[17px]" />
          Reset pantry
        </button>
      </div>
    </aside>
  );
}
