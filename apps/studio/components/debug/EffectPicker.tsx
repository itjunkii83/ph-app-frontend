'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { getAllEffects } from '@/components/effects/registry';
import { EffectCategory } from '@/types/effects';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';

interface EffectPickerProps {
  onSelect: (effectType: string) => void;
}

const perfVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  low: 'secondary',
  medium: 'default',
  high: 'destructive',
};

const categoryOrder: EffectCategory[] = [
  'background',
  'image',
  'ambient',
  'text',
  'shape',
  'particle',
  'filter',
  'media',
  'custom',
];

export function EffectPicker({ onSelect }: EffectPickerProps) {
  const [open, setOpen] = useState(false);

  const effects = getAllEffects();
  const grouped = new Map<EffectCategory, typeof effects>();
  for (const effect of effects) {
    const list = grouped.get(effect.category) || [];
    list.push(effect);
    grouped.set(effect.category, list);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="w-full mb-3" size="sm">
          <Plus className="h-4 w-4" />
          Add Layer
        </Button>
      </PopoverTrigger>
      <PopoverContent className="dark w-[300px] p-0 z-250" align="start">
        <Command>
          <CommandInput placeholder="Search effects..." />
          <CommandList>
            <CommandEmpty>No effects found.</CommandEmpty>
            {categoryOrder.map((cat) => {
              const items = grouped.get(cat);
              if (!items?.length) return null;
              return (
                <CommandGroup key={cat} heading={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                  {items.map((effect) => (
                    <CommandItem
                      key={effect.id}
                      value={effect.name}
                      onSelect={() => {
                        onSelect(effect.id);
                        setOpen(false);
                      }}
                      className="flex items-center justify-between"
                    >
                      <span>{effect.name}</span>
                      <Badge
                        variant={perfVariant[effect.performanceCost] || 'secondary'}
                        className="text-[10px] px-1.5 py-0 h-4 ml-2"
                      >
                        {effect.performanceCost}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
