'use client';

import React from 'react';
import { cqFontSize, useBaseCanvas } from '../../../lib/responsive';

// A small muted attribution line rendered beneath a text effect's line (the one
// named attribution allowed alongside a quote). Returns null when empty so the
// effect markup is unchanged for the common no-attribution case. The effect's
// wrapper must be a centered flex column for this to sit under the line.

export function Attribution({ text, color }: { text?: string; color: string }) {
  const base = useBaseCanvas();
  if (!text) return null;
  return (
    <div
      style={{
        marginTop: '0.9em',
        fontSize: cqFontSize(24, base),
        color,
        opacity: 0.62,
        letterSpacing: '0.04em',
        textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
}
