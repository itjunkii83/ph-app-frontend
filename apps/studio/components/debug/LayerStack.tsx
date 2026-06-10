'use client';

import React, { useId } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Layer } from '@/types/presentation';
import { SortableLayerItem } from './SortableLayerItem';

interface LayerStackProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelect: (id: string) => void;
  onReorderLayers: (orderedIds: string[]) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export function LayerStack({
  layers,
  selectedLayerId,
  onSelect,
  onReorderLayers,
  onDelete,
  onToggleVisibility,
}: LayerStackProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort by descending zIndex (top layer first in the visual list)
  const sorted = [...layers].sort((a, b) => b.zIndex - a.zIndex);
  const sortedIds = sorted.map((l) => l.id);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedIds.indexOf(active.id as string);
    const newIndex = sortedIds.indexOf(over.id as string);
    const newOrder = arrayMove(sortedIds, oldIndex, newIndex);
    onReorderLayers(newOrder);
  }

  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Layers
      </h4>

      <DndContext
        id={useId()}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-0.5">
            {sorted.map((layer) => (
              <SortableLayerItem
                key={layer.id}
                layer={layer}
                isSelected={layer.id === selectedLayerId}
                onSelect={onSelect}
                onToggleVisibility={onToggleVisibility}
                onDelete={onDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {layers.length === 0 && (
        <div className="text-muted-foreground text-xs text-center py-2">
          No layers — add one above
        </div>
      )}
    </div>
  );
}
