'use client';

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getTextStats } from '@/lib/duration';

interface TextContentEditorProps {
  text: string;
  onChange: (text: string) => void;
}

export function TextContentEditor({ text, onChange }: TextContentEditorProps) {
  const stats = getTextStats(text);

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Text Content
      </Label>
      <Textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="resize-y text-sm"
        placeholder="Enter text content..."
      />
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>{stats.characters} chars</span>
        <span>{stats.words} words</span>
        <span>~{stats.readingTimeFormatted} read</span>
      </div>
    </div>
  );
}
