'use client';

import type { Card } from '@/lib/zoltar/types';
import type { CardMutate } from './shared';
import { SingleChoiceCard } from './SingleChoice';
import { MultiChoiceCard } from './MultiChoice';
import { ScaleCard } from './Scale';
import { DimensionGridCard } from './DimensionGrid';
import { ConfirmStatementCard } from './ConfirmStatement';
import { WeekDraftCard } from './WeekDraft';

export function CardRenderer({
  card,
  onSubmit,
  disabled,
}: {
  card: Card;
  onSubmit: (compactText: string, mutate?: CardMutate) => void;
  disabled?: boolean;
}) {
  switch (card.type) {
    case 'single_choice':
      return <SingleChoiceCard card={card} onSubmit={onSubmit} disabled={disabled} />;
    case 'multi_choice':
      return <MultiChoiceCard card={card} onSubmit={onSubmit} disabled={disabled} />;
    case 'scale':
      return <ScaleCard card={card} onSubmit={onSubmit} disabled={disabled} />;
    case 'dimension_grid':
      return <DimensionGridCard card={card} onSubmit={onSubmit} disabled={disabled} />;
    case 'confirm_statement':
      return <ConfirmStatementCard card={card} onSubmit={onSubmit} disabled={disabled} />;
    case 'week_draft':
      return <WeekDraftCard card={card} onSubmit={onSubmit} disabled={disabled} />;
    default:
      return null;
  }
}
