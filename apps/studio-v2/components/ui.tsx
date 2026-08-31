'use client';

import { useState } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('text-[11px] font-semibold uppercase tracking-[0.28em] text-silver', className)}>{children}</div>;
}

type BtnVariant = 'ghost' | 'accent' | 'danger';
export function Button({
  children, variant = 'ghost', sm, className, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; sm?: boolean }) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[9px] font-medium transition-colors cursor-pointer whitespace-nowrap',
        sm ? 'px-[11px] py-1.5 text-xs' : 'px-[15px] py-[9px] text-[13px]',
        variant === 'ghost' && 'border border-line2 text-paper hover:border-pewter hover:bg-paper/5',
        variant === 'accent' && 'bg-grad text-ink font-semibold hover:brightness-105',
        variant === 'danger' && 'border border-line2 text-paper hover:border-[#c8694a] hover:text-[#e0a08a]',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function IconButton({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cn(
        'flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-pewter hover:text-paper cursor-pointer',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-4 block">
      <span className="mb-[7px] block text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-[9px] border border-line bg-panel px-[11px] py-[9px] text-[13px] text-paper outline-none transition-colors focus:border-pewter',
        props.className,
      )}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full resize-y rounded-[9px] border border-line bg-panel px-[11px] py-[9px] text-[13px] leading-relaxed text-paper outline-none transition-colors focus:border-pewter',
        props.className,
      )}
    />
  );
}

export function Select({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none rounded-[9px] border border-line bg-panel px-[11px] py-[9px] pr-8 text-[13px] text-paper outline-none focus:border-pewter"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-panel text-paper">{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

export function Slider({ value, min, max, onChange }: {
  value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="ph-range w-full"
    />
  );
}

export function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="inline-flex select-none items-center gap-[11px] cursor-pointer">
      <span className={cn('relative h-[22px] w-[38px] flex-none rounded-xl transition-colors', on ? 'bg-grad' : 'bg-line2')}>
        <span className={cn('absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-transform', on ? 'translate-x-[18px]' : 'translate-x-0.5')} />
      </span>
      <span className="text-[13px] text-paper">{label}</span>
    </button>
  );
}

export function Pill({ children, soft }: { children: React.ReactNode; soft?: boolean }) {
  return (
    <span className={cn('rounded-full border px-[10px] py-[3px] text-[11px] whitespace-nowrap', soft ? 'border-line text-muted' : 'border-line2 text-silver')}>
      {children}
    </span>
  );
}

export function TagEditor({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const commit = () => {
    const v = draft.trim();
    if (v) onChange([...tags, v]);
    setDraft('');
    setAdding(false);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t, i) => (
        <span key={`${t}-${i}`} className="inline-flex items-center gap-1.5 rounded-full border border-line2 py-1 pl-[11px] pr-[9px] text-[11.5px] text-silver">
          {t}
          <X className="h-3 w-3 cursor-pointer opacity-50 hover:opacity-100" onClick={() => onChange(tags.filter((_, idx) => idx !== i))} />
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(''); setAdding(false); } }}
          onBlur={commit}
          placeholder="type and enter"
          className="w-28 rounded-full border border-pewter bg-panel px-[11px] py-1 text-[11.5px] text-paper outline-none"
        />
      ) : (
        <button onClick={() => setAdding(true)} className="rounded-full border border-dashed border-line2 px-[11px] py-1 text-[11.5px] text-muted hover:text-paper cursor-pointer">
          + add
        </button>
      )}
    </div>
  );
}

export function Modal({ open, onClose, title, eyebrow, children, footer, wide, xl, tall }: {
  open: boolean; onClose: () => void; title: string; eyebrow?: string;
  children: React.ReactNode; footer?: React.ReactNode; wide?: boolean;
  // `xl` spans nearly the full viewport for editors with a preview + settings +
  // meta three-column layout.
  xl?: boolean;
  // `tall` gives the modal a fixed height and an unscrolled body, so the content
  // can manage its own internal scroll regions (a fixed preview + scrolling knobs).
  tall?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(4,5,7,0.74)] p-7"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={cn('flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-ink2', xl ? 'max-w-[1500px]' : wide ? 'max-w-[960px]' : 'max-w-[520px]', tall ? 'h-[88vh]' : 'max-h-[92vh]')}>
        <div className="flex flex-none items-start justify-between border-b border-line px-6 py-5">
          <div>
            {eyebrow ? <Eyebrow className="mb-1.5">{eyebrow}</Eyebrow> : null}
            <h2 className="font-display text-2xl font-normal text-paper">{title}</h2>
          </div>
          <X className="h-5 w-5 flex-none cursor-pointer text-muted hover:text-paper" onClick={onClose} />
        </div>
        <div className={cn('flex-1 px-6 py-5', tall ? 'min-h-0 overflow-hidden' : 'overflow-y-auto')}>{children}</div>
        {footer ? <div className="flex-none border-t border-line px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
