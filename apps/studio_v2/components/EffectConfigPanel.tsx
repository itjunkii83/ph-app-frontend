'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getEffect, registerEffects, type ConfigFieldSchema } from '@harbor/player';
import { cn } from '@/lib/utils';
import { Select, Slider, TextArea, TextInput, Toggle } from './ui';
import { MediaPicker } from './MediaPicker';

// Ensure the registry is populated before we read an effect's schema.
registerEffects();

type ConfigValue = unknown;

// A single config control, chosen by the schema field type. Ported from the
// donor's EffectConfigurator logic onto studio_v2's own primitives (no shadcn).
function FieldControl({
  schema,
  value,
  onChange,
  fonts,
}: {
  schema: ConfigFieldSchema;
  value: ConfigValue;
  onChange: (v: ConfigValue) => void;
  fonts: string[];
}) {
  const label = <span className="mb-[7px] block text-xs text-muted">{schema.label}</span>;

  switch (schema.type) {
    case 'string':
      return (
        <label className="mb-4 block">
          {label}
          <TextArea rows={2} value={String(value ?? schema.default ?? '')} onChange={(e) => onChange(e.target.value)} />
        </label>
      );

    case 'number':
    case 'range': {
      const num = typeof value === 'number' ? value : (schema.default as number) ?? 0;
      return (
        <label className="mb-4 block">
          <span className="mb-[7px] flex items-baseline justify-between text-xs text-muted">
            <span>{schema.label}</span>
            <span className="tabular-nums text-muted2">{num}</span>
          </span>
          <input
            type="range"
            min={schema.min ?? 0}
            max={schema.max ?? 100}
            step={schema.step ?? 1}
            value={num}
            onChange={(e) => onChange(Number(e.target.value))}
            className="ph-range w-full"
          />
        </label>
      );
    }

    case 'boolean':
      return (
        <div className="mb-4">
          <Toggle on={Boolean(value ?? schema.default ?? false)} onClick={() => onChange(!(value ?? schema.default ?? false))} label={schema.label} />
        </div>
      );

    case 'color': {
      const col = String(value ?? schema.default ?? '#ffffff');
      return (
        <label className="mb-4 block">
          {label}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={col}
              onChange={(e) => onChange(e.target.value)}
              className="h-9 w-9 flex-none cursor-pointer rounded-md border border-line bg-transparent p-0.5"
            />
            <TextInput value={col} onChange={(e) => onChange(e.target.value)} />
          </div>
        </label>
      );
    }

    case 'select':
      return (
        <label className="mb-4 block">
          {label}
          <Select
            value={String(value ?? schema.default ?? '')}
            onChange={onChange}
            options={(schema.options ?? []).map((o) => ({ value: String(o.value), label: o.label }))}
          />
        </label>
      );

    case 'image':
      return (
        <label className="mb-4 block">
          {label}
          <MediaPicker value={String(value ?? schema.default ?? '')} onChange={onChange} />
        </label>
      );

    case 'font': {
      const current = String(value ?? schema.default ?? '');
      if (fonts.length > 0) {
        const opts = (current && !fonts.includes(current) ? [current, ...fonts] : fonts).map((f) => ({ value: f, label: f }));
        return (
          <label className="mb-4 block">
            {label}
            <Select value={current} onChange={onChange} options={opts} />
          </label>
        );
      }
      return (
        <label className="mb-4 block">
          {label}
          <TextInput value={current} onChange={(e) => onChange(e.target.value)} />
        </label>
      );
    }

    default:
      return null;
  }
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-3 border-t border-line pt-3">
      <button onClick={() => setOpen((o) => !o)} className="mb-2 flex w-full items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-paper cursor-pointer">
        <ChevronDown className={cn('h-3 w-3 transition-transform', open ? '' : '-rotate-90')} />
        {title}
      </button>
      {open ? <div>{children}</div> : null}
    </div>
  );
}

// Renders config controls generated from an effect's configSchema. The
// `exclude` keys are fields set elsewhere (e.g. text treatment lives on the
// pairing, not on the text-effect atom).
export function EffectConfigPanel({
  effectType,
  config,
  onChange,
  exclude,
}: {
  effectType: string;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  exclude?: string[];
}) {
  const [fonts, setFonts] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/fonts')
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Array<{ family?: string; isActive?: boolean }>) => {
        setFonts(list.filter((f) => f.isActive !== false && f.family).map((f) => f.family as string));
      })
      .catch(() => {});
  }, []);

  const effect = getEffect(effectType);
  if (!effect) return <p className="text-[12.5px] text-muted2">Unknown effect: {effectType}</p>;

  const entries = Object.entries(effect.configSchema).filter(([key]) => !exclude?.includes(key));
  const ungrouped = entries.filter(([, s]) => !s.group);
  const groupOrder: string[] = [];
  const groups: Record<string, [string, ConfigFieldSchema][]> = {};
  for (const [key, s] of entries) {
    if (!s.group) continue;
    if (!groups[s.group]) {
      groups[s.group] = [];
      groupOrder.push(s.group);
    }
    groups[s.group].push([key, s]);
  }

  const renderField = ([key, schema]: [string, ConfigFieldSchema]) => (
    <FieldControl
      key={key}
      schema={schema}
      value={config[key]}
      onChange={(val) => onChange({ ...config, [key]: val })}
      fonts={fonts}
    />
  );

  return (
    <div>
      {ungrouped.map(renderField)}
      {groupOrder.map((name) => (
        <Group key={name} title={name}>
          {groups[name].map(renderField)}
        </Group>
      ))}
    </div>
  );
}

// Fields set on the pairing/beat (content + treatment), so they are hidden when
// editing a text-effect atom (which only carries animation options).
export const TEXT_TREATMENT_FIELDS = [
  'text',
  'fontFamily',
  'fontSize',
  'color',
  'textAlign',
  'attribution',
  'fitToBox',
  'minFontSize',
  'duration',
];
