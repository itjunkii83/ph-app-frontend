'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { type CardProps, type Of, clean } from './shared';

export function MultiChoiceCard({ card, onSubmit, disabled }: CardProps<Of<'multi_choice'>>) {
  const [sel, setSel] = useState<string[]>([]);
  const min = card.min ?? 1;
  const max = card.max ?? card.options.length;
  const toggle = (id: string) =>
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < max ? [...s, id] : s));
  const ok = sel.length >= min && sel.length <= max;

  const submit = () => {
    const labels = card.options.filter((o) => sel.includes(o.id)).map((o) => clean(o.label));
    onSubmit(`[multi_choice] Q: "${clean(card.prompt)}" A: "${labels.join(', ')}"`);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {card.options.map((o) => {
          const on = sel.includes(o.id);
          return (
            <button
              key={o.id}
              disabled={disabled}
              onClick={() => toggle(o.id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[12.5px] transition-colors cursor-pointer',
                on ? 'border-pewter bg-panel text-paper' : 'border-line2 text-muted hover:text-paper',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <div>
        <Button sm variant="accent" disabled={disabled || !ok} onClick={submit}>
          Submit
        </Button>
      </div>
    </div>
  );
}
