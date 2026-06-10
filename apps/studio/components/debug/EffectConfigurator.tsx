'use client';

import React, { useState, useEffect } from 'react';
import { getEffect } from '@/components/effects/registry';
import { Layer } from '@/types/presentation';
import { ConfigFieldSchema } from '@/types/effects';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { StorageImagePicker } from '@/components/debug/StorageImagePicker';

interface EffectConfiguratorProps {
  effectType: string;
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  layer?: Layer;
  onLayerChange?: (updates: Partial<Layer>) => void;
  excludeFields?: string[];
  fonts?: { family: string }[];
}

const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
];

function FieldControl({
  fieldKey,
  schema,
  value,
  onChange,
  activeFonts,
}: {
  fieldKey: string;
  schema: ConfigFieldSchema;
  value: any;
  onChange: (value: any) => void;
  activeFonts?: { family: string }[];
}) {
  switch (schema.type) {
    case 'string':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{schema.label}</Label>
          <Textarea
            value={value ?? schema.default ?? ''}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="resize-y text-sm"
          />
        </div>
      );

    case 'number':
    case 'range':
      return (
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <Label className="text-xs">{schema.label}</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {typeof value === 'number' ? value : schema.default}
            </span>
          </div>
          <Slider
            min={schema.min ?? 0}
            max={schema.max ?? 100}
            step={schema.step ?? 1}
            value={[value ?? schema.default ?? 0]}
            onValueChange={([val]) => onChange(val)}
          />
        </div>
      );

    case 'boolean':
      return (
        <div className="flex items-center justify-between">
          <Label className="text-xs">{schema.label}</Label>
          <Switch
            checked={value ?? schema.default ?? false}
            onCheckedChange={onChange}
          />
        </div>
      );

    case 'color':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{schema.label}</Label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={value ?? schema.default ?? '#ffffff'}
              onChange={(e) => onChange(e.target.value)}
              className="w-9 h-9 rounded-md border border-input cursor-pointer p-0.5 bg-transparent"
            />
            <Input
              value={value ?? schema.default ?? '#ffffff'}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 text-sm h-9"
            />
          </div>
        </div>
      );

    case 'select':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{schema.label}</Label>
          <Select
            value={value ?? schema.default ?? ''}
            onValueChange={onChange}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="dark z-250">
              {schema.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'image':
      return (
        <StorageImagePicker
          label={schema.label}
          value={value ?? schema.default ?? ''}
          onChange={onChange}
        />
      );

    case 'font':
      if (activeFonts && activeFonts.length > 0) {
        const currentValue = value ?? schema.default ?? '';
        const fontsWithCurrent = currentValue && !activeFonts.some((f) => f.family === currentValue)
          ? [{ family: currentValue }, ...activeFonts]
          : activeFonts;
        return (
          <div className="space-y-1.5">
            <Label className="text-xs">{schema.label}</Label>
            <Select
              value={currentValue}
              onValueChange={onChange}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent className="dark z-250">
                {fontsWithCurrent.map((f) => (
                  <SelectItem key={f.family} value={f.family}>
                    {f.family}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{schema.label}</Label>
          <Input
            value={value ?? schema.default ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="text-sm h-9"
          />
        </div>
      );

    default:
      return null;
  }
}

// A collapsible, labeled section of config fields (e.g. "Sky", "Water"). Effects
// opt in by setting `group` on their schema fields; ungrouped effects never
// render one of these.
function ConfigGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="space-y-3 border-t border-border/40 pt-3"
    >
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground">
          <ChevronDown
            className={`h-3 w-3 transition-transform ${open ? '' : '-rotate-90'}`}
          />
          {title}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function EffectConfigurator({
  effectType,
  config,
  onChange,
  layer,
  onLayerChange,
  excludeFields,
  fonts: fontsProp,
}: EffectConfiguratorProps) {
  const effect = getEffect(effectType);
  const [fetchedFonts, setFetchedFonts] = useState<{ family: string }[]>([]);

  useEffect(() => {
    if (fontsProp) return; // Skip fetch if fonts provided externally
    fetch('/api/fonts')
      .then((r) => (r.ok ? r.json() : []))
      .then((fonts: any[]) => {
        setFetchedFonts(fonts.filter((f: any) => f.isActive !== false));
      })
      .catch(() => {});
  }, [fontsProp]);

  const activeFonts = fontsProp || fetchedFonts;

  if (!effect) return null;

  const schema = effect.configSchema;

  // Split fields into a flat ungrouped list (rendered first, as before) and
  // collapsible groups, bucketed by `group` in schema-insertion order.
  const entries = Object.entries(schema).filter(
    ([key]) => !excludeFields?.includes(key),
  );
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

  const renderField = ([key, fieldSchema]: [string, ConfigFieldSchema]) => (
    <FieldControl
      key={key}
      fieldKey={key}
      schema={fieldSchema}
      value={config[key]}
      onChange={(val) => onChange({ ...config, [key]: val })}
      activeFonts={fieldSchema.type === 'font' ? activeFonts : undefined}
    />
  );

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {effect.name} Settings
      </h4>

      {ungrouped.map(renderField)}

      {groupOrder.map((groupName) => (
        <ConfigGroup key={groupName} title={groupName}>
          {groups[groupName].map(renderField)}
        </ConfigGroup>
      ))}

      {layer && onLayerChange && (
        <>
          <Separator />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Layer Properties
          </h4>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label className="text-xs">Opacity</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {(layer.opacity * 100).toFixed(0)}%
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[layer.opacity]}
              onValueChange={([val]) => onLayerChange({ opacity: val })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Blend Mode</Label>
            <Select
              value={layer.blendMode}
              onValueChange={(val) => onLayerChange({ blendMode: val })}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark z-250">
                {BLEND_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Z-Index</Label>
            <Input
              type="number"
              value={layer.zIndex}
              onChange={(e) => onLayerChange({ zIndex: parseInt(e.target.value) || 0 })}
              className="text-sm h-9"
            />
          </div>
        </>
      )}
    </div>
  );
}
