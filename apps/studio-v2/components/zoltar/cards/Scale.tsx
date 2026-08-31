'use client';

import { useState } from 'react';
import { Button, Slider } from '@/components/ui';
import { type CardProps, type Of, clean } from './shared';

export function ScaleCard({ card, onSubmit, disabled }: CardProps<Of<'scale'>>) {
  const [val, setVal] = useState(Math.round((card.min + card.max) / 2));
  const submit = () =>
    onSubmit(
      `[scale] Q: "${clean(card.prompt)}" A: ${val} (scale ${card.min}=${clean(card.min_label)} .. ${card.max}=${clean(card.max_label)})`,
    );
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-[12px] text-muted">
        <span>{card.min_label}</span>
        <span className="font-display text-[16px] text-paper">{val}</span>
        <span>{card.max_label}</span>
      </div>
      <Slider value={val} min={card.min} max={card.max} onChange={setVal} />
      <div>
        <Button sm variant="accent" disabled={disabled} onClick={submit}>
          Submit
        </Button>
      </div>
    </div>
  );
}
