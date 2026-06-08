import { ConfigFieldSchema } from '@/types/effects';

export const kenBurnsConfigField: Record<string, ConfigFieldSchema> = {
  kenBurns: {
    type: 'select',
    label: 'Ken Burns Zoom',
    default: 'none',
    options: [
      { label: 'None', value: 'none' },
      { label: 'Zoom In', value: 'in' },
      { label: 'Zoom Out', value: 'out' },
    ],
  },
};

export type KenBurnsDirection = 'none' | 'in' | 'out';
