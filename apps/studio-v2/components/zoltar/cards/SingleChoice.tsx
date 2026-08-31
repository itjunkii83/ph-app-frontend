'use client';

import { Button } from '@/components/ui';
import { type CardProps, type Of, clean } from './shared';

export function SingleChoiceCard({ card, onSubmit, disabled }: CardProps<Of<'single_choice'>>) {
  return (
    <div className="flex flex-wrap gap-2">
      {card.options.map((o) => (
        <Button
          key={o.id}
          sm
          disabled={disabled}
          onClick={() => onSubmit(`[single_choice] Q: "${clean(card.prompt)}" A: "${clean(o.label)}"`)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}
