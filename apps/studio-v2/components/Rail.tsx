'use client';

import { useState } from 'react';
import {
  Image as ImageIcon,
  Type,
  Layers,
  SlidersHorizontal,
  Clapperboard,
  Sparkles,
  Sun,
  Moon,
  RotateCcw,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
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
  {
    label: 'Intelligence',
    items: [{ view: 'zoltar', label: 'Zoltar', icon: <Sparkles className="h-[17px] w-[17px]" /> }],
  },
];

const COLLAPSE_KEY = 'studio:rail:collapsed';

export function Rail({ view, setView }: { view: View; setView: (v: View) => void }) {
  const { theme, toggleTheme, resetAll } = useStudio();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  });
  const activeBase: View = view === 'designer' ? 'pairings' : view;

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        // ignore storage failures; collapse still works for the session
      }
      return next;
    });

  const reset = () => {
    if (window.confirm('Reset the pantry to the full default set? This replaces all backgrounds, effects, pairings, and rules.')) {
      resetAll();
    }
  };

  // Shared button shape for nav + footer controls, adapting to the collapsed rail.
  const rowClass = (active: boolean) =>
    cn(
      'mb-0.5 flex w-full items-center rounded-[10px] py-2.5 text-left text-[13.5px] transition-colors cursor-pointer',
      collapsed ? 'justify-center px-0' : 'gap-3 px-3',
      active ? 'bg-paper/[0.07] text-paper' : 'text-muted hover:bg-paper/[0.04] hover:text-paper',
    );

  return (
    <aside
      className={cn(
        'flex flex-none flex-col border-r border-line bg-ink2 transition-[width] duration-200',
        collapsed ? 'w-[60px]' : 'w-[228px]',
      )}
    >
      <div className={cn('flex items-center pb-5 pt-6', collapsed ? 'flex-col gap-3 px-0' : 'gap-2.5 px-6')}>
        <span className="h-7 w-7 flex-none rounded-md bg-grad" />
        {!collapsed && (
          <div className="flex-1 leading-tight">
            <div className="font-display text-[17px] text-paper">Pause Harbor</div>
            <div className="text-[11px] uppercase tracking-[0.26em] text-muted">Studio</div>
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand menu' : 'Collapse menu'}
          aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
          className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-muted transition-colors hover:text-paper cursor-pointer"
        >
          {collapsed ? <ChevronsRight className="h-[17px] w-[17px]" /> : <ChevronsLeft className="h-[17px] w-[17px]" />}
        </button>
      </div>

      <nav className={cn('flex-1', collapsed ? 'px-2' : 'px-3')}>
        {GROUPS.map((g) => (
          <div key={g.label} className="mb-5">
            {!collapsed && (
              <div className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.24em] text-muted2">{g.label}</div>
            )}
            {g.items.map((it) => {
              const active = activeBase === it.view;
              return (
                <button
                  key={it.view}
                  onClick={() => setView(it.view)}
                  title={collapsed ? it.label : undefined}
                  className={rowClass(active)}
                >
                  <span className={active ? 'text-silver' : 'text-muted'}>{it.icon}</span>
                  {!collapsed && it.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={cn('border-t border-line', collapsed ? 'p-2' : 'p-3')}>
        <button onClick={toggleTheme} title={collapsed ? (theme === 'dark' ? 'Light' : 'Dark') : undefined} className={rowClass(false)}>
          {theme === 'dark' ? <Sun className="h-[17px] w-[17px]" /> : <Moon className="h-[17px] w-[17px]" />}
          {!collapsed && (theme === 'dark' ? 'Light' : 'Dark')}
        </button>
        <button onClick={reset} title={collapsed ? 'Reset pantry' : undefined} className={rowClass(false)}>
          <RotateCcw className="h-[17px] w-[17px]" />
          {!collapsed && 'Reset pantry'}
        </button>
      </div>
    </aside>
  );
}
