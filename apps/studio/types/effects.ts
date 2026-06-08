import React from 'react';

export type EffectCategory =
  | 'background'
  | 'text'
  | 'shape'
  | 'particle'
  | 'filter'
  | 'media'
  | 'ambient'
  | 'image'
  | 'custom';

export type RenderTechnology =
  | 'css'
  | 'canvas'
  | 'webgl'
  | 'svg'
  | 'html';

export type ConfigFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'color'
  | 'select'
  | 'image'
  | 'font'
  | 'range';

export interface ConfigFieldSchema {
  type: ConfigFieldType;
  label: string;
  default: any;
  options?: { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
}

export type ConfigSchema = Record<string, ConfigFieldSchema>;

export type ContentInputType = 'none' | 'text' | 'image';

export type DurationMode =
  | { type: 'fixed'; ms: number }
  | { type: 'auto' }
  | { type: 'indefinite' };

export interface EffectProps {
  config: Record<string, any>;
  isActive: boolean;
  onComplete?: () => void;
  durationMs?: number;
}

export interface EffectDefinition {
  id: string;
  name: string;
  category: EffectCategory;
  technology: RenderTechnology;
  contentInput: ContentInputType;
  configSchema: ConfigSchema;
  component: React.ComponentType<EffectProps>;
  duration: DurationMode;
  performanceCost: 'low' | 'medium' | 'high';
  description?: string;
}
