'use client';

import { useState } from 'react';
import { Button, TextInput } from '@/components/ui';
import { cn } from '@/lib/utils';
import { resolveConfirmStatement, type ConfirmDecision } from '@/lib/zoltar/apply';
import { type CardProps, type Of, clean } from './shared';

type ItemState = { id: string; text: string; original: string; action: 'approve' | 'reject' };

export function ConfirmStatementCard({ card, onSubmit, disabled }: CardProps<Of<'confirm_statement'>>) {
  const [items, setItems] = useState<ItemState[]>(() =>
    card.items.map((i) => ({ id: i.id, text: i.text, original: i.text, action: 'approve' })),
  );
  const update = (id: string, patch: Partial<ItemState>) =>
    setItems((list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const submit = () => {
    const decisions: ConfirmDecision[] = items.map((it) => ({
      id: it.id,
      action: it.action,
      text: it.action === 'approve' ? it.text : undefined,
    }));
    const parts = items.map((it) => {
      if (it.action === 'reject') return `rejected: "${clean(it.original)}"`;
      if (it.text.trim() !== it.original.trim()) return `edited: "${clean(it.original)}" -> "${clean(it.text)}"`;
      return `approved: "${clean(it.text)}"`;
    });
    onSubmit(`[confirm_statement:${card.kind}] ${parts.join('; ')}`, (m) => resolveConfirmStatement(m, card.kind, decisions));
  };

  return (
    <div className="flex flex-col gap-3">
      {card.items.map((i, idx) => {
        const it = items[idx];
        const rejected = it.action === 'reject';
        return (
          <div key={i.id} className={cn('rounded-[10px] border p-3', rejected ? 'border-line opacity-50' : 'border-line2')}>
            <TextInput value={it.text} disabled={disabled || rejected} onChange={(e) => update(i.id, { text: e.target.value })} />
            {i.why ? <div className="mt-1.5 text-[12px] text-muted">{i.why}</div> : null}
            <div className="mt-2 flex gap-2">
              <Button sm variant={rejected ? 'ghost' : 'accent'} disabled={disabled} onClick={() => update(i.id, { action: 'approve' })}>
                Keep
              </Button>
              <Button sm variant={rejected ? 'danger' : 'ghost'} disabled={disabled} onClick={() => update(i.id, { action: 'reject' })}>
                Reject
              </Button>
            </div>
          </div>
        );
      })}
      <div>
        <Button sm variant="accent" disabled={disabled} onClick={submit}>
          Confirm
        </Button>
      </div>
    </div>
  );
}
