export interface ManagedFont {
  family: string;
  source: 'google' | 'custom' | 'system';
  weights: number[];
  styles: ('normal' | 'italic')[];
  url?: string;
  loaded?: boolean;
  id?: string;
  category?: string;
  displayName?: string;
  isActive?: boolean;
  addedAt?: any;
}
