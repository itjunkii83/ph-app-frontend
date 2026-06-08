export const SPEED_MULTIPLIERS = {
  slow: 1.5,
  medium: 1.0,
  fast: 0.6,
} as const;

export type SpeedOption = keyof typeof SPEED_MULTIPLIERS;
