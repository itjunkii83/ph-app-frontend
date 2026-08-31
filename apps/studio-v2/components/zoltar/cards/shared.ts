import type { Card, UserModel } from '@/lib/zoltar/types';

export type CardMutate = (m: UserModel) => UserModel;

// Every card submits a compact, explicit user message the model can read back, and
// optionally a local mutation of the user model (for the cards that author state).
export interface CardProps<C extends Card> {
  card: C;
  onSubmit: (compactText: string, mutate?: CardMutate) => void;
  disabled?: boolean;
}

export type Of<T extends Card['type']> = Extract<Card, { type: T }>;

// Keep quotes from breaking the compact one-liners.
export function clean(s: string): string {
  return s.replace(/"/g, "'").trim();
}
