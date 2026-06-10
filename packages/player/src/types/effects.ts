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
  // Optional collapsible section the field belongs to in the config panel
  // (e.g. 'Sky', 'Water'). Fields without a group render flat, as before;
  // grouped fields are bucketed by insertion order. See EffectConfigurator.
  group?: string;
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
  // True when the effect drives a full enter -> hold -> exit lifecycle and calls
  // onComplete after its exit. The player advances a slide once its
  // self-completing effects finish, so their exit animations play in full. Effects
  // without this (static text, ambient backgrounds) rely on slide.duration.
  selfCompletes?: boolean;
}
