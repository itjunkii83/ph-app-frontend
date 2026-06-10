'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Layer } from '@/types/presentation';
import { getEffect } from '@/components/effects/registry';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SortableLayerItemProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SortableLayerItem({
  layer,
  isSelected,
  onSelect,
  onToggleVisibility,
  onDelete,
}: SortableLayerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: layer.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const effect = getEffect(layer.effectType);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 rounded-md px-1 py-1.5 cursor-pointer transition-colors ${
        isDragging ? 'opacity-50 z-50' : ''
      } ${
        isSelected
          ? 'bg-accent border border-ring'
          : 'border border-transparent hover:bg-accent/50'
      }`}
      onClick={() => onSelect(layer.id)}
    >
      <button
        className="cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(layer.id);
            }}
          >
            {layer.visible ? (
              <Eye className="h-3.5 w-3.5 text-primary" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="dark z-250">
          {layer.visible ? 'Hide layer' : 'Show layer'}
        </TooltipContent>
      </Tooltip>

      <span
        className={`flex-1 text-sm truncate ${
          layer.visible ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        {effect?.name || layer.effectType}
      </span>

      {!layer.locked && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(layer.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="dark z-250">
            Delete layer
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
