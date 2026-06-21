'use client';

import React from 'react';
import { EffectProps, EffectDefinition, ConfigSchema } from '../../../types/effects';
import { useFonts } from '../../../hooks/useFonts';
import { useKenBurns } from '../../../hooks/useKenBurns';
import { kenBurnsConfigField, KenBurnsDirection } from '../../../lib/effects/kenBurnsConfig';
import { useBaseCanvas } from '../../../lib/responsive';
import { useFitToBox } from '../../../hooks/useFitToBox';
import { Attribution } from './Attribution';

const configSchema: ConfigSchema = {
  text: {
    type: 'string',
    label: 'Text',
    default: '',
  },
  fontFamily: {
    type: 'font',
    label: 'Font Family',
    default: 'Lato',
  },
  fontSize: {
    type: 'number',
    label: 'Font Size',
    default: 48,
    min: 12,
    max: 200,
    step: 1,
  },
  fontWeight: {
    type: 'select',
    label: 'Font Weight',
    default: '400',
    options: [
      { label: 'Light (300)', value: '300' },
      { label: 'Regular (400)', value: '400' },
      { label: 'Medium (500)', value: '500' },
      { label: 'Semi Bold (600)', value: '600' },
      { label: 'Bold (700)', value: '700' },
      { label: 'Extra Bold (800)', value: '800' },
    ],
  },
  color: {
    type: 'color',
    label: 'Color',
    default: '#ffffff',
  },
  textAlign: {
    type: 'select',
    label: 'Text Align',
    default: 'center',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' },
    ],
  },
  lineHeight: {
    type: 'number',
    label: 'Line Height',
    default: 1.4,
    min: 0.8,
    max: 3,
    step: 0.1,
  },
  maxWidth: {
    type: 'number',
    label: 'Max Width (%)',
    default: 80,
    min: 20,
    max: 100,
    step: 5,
  },
  // When on, Font Size is treated as a maximum and a long line shrinks to fit.
  fitToBox: {
    type: 'boolean',
    label: 'Fit to box',
    default: false,
  },
  minFontSize: {
    type: 'number',
    label: 'Min Font Size',
    default: 16,
    min: 8,
    max: 120,
    step: 1,
  },
  attribution: {
    type: 'string',
    label: 'Attribution',
    default: '',
  },
  ...kenBurnsConfigField,
};

export function BasicText({ config, durationMs }: EffectProps) {
  const base = useBaseCanvas();
  const text = config.text || '';
  const fontFamily = config.fontFamily || 'Lato';

  useFonts([fontFamily]);
  const fontSize = config.fontSize ?? 48;
  const fontWeight = config.fontWeight || '400';
  const color = config.color || '#ffffff';
  const textAlign = (config.textAlign || 'center') as 'left' | 'center' | 'right';
  const lineHeight = config.lineHeight ?? 1.4;
  const maxWidth = config.maxWidth ?? 80;
  const fitToBox = config.fitToBox ?? false;
  const minFontSize = config.minFontSize ?? 16;
  const attribution = config.attribution || '';
  const kenBurns = (config.kenBurns || 'none') as KenBurnsDirection;

  const { zoomRef } = useKenBurns({ direction: kenBurns, durationMs });

  // The hook drives font-size imperatively (cqFontSize when off, a fitted px when
  // on), so fontSize is not set in the style below.
  const { textRef } = useFitToBox({
    enabled: fitToBox,
    text,
    maxFontSize: fontSize,
    minFontSize,
    base,
    widthRatio: maxWidth / 100,
    deps: [fontFamily, fontWeight, lineHeight, maxWidth],
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <div
        ref={zoomRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          ...(kenBurns !== 'none' ? { willChange: 'transform' } : {}),
        }}
      >
        <div
          ref={textRef}
          style={{
            fontFamily,
            fontWeight,
            color,
            textAlign,
            lineHeight,
            maxWidth: `${maxWidth}%`,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {text}
        </div>
        <Attribution text={attribution} color={color} />
      </div>
    </div>
  );
}

export const basicTextDefinition: EffectDefinition = {
  id: 'basic-text',
  name: 'Basic Text',
  category: 'text',
  technology: 'css',
  contentInput: 'text',
  configSchema,
  component: BasicText,
  duration: { type: 'auto' },
  performanceCost: 'low',
};
