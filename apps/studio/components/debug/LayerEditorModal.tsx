'use client';

import React from 'react';
import { Layer } from '@/types/presentation';
import { getEffect } from '@/components/effects/registry';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TextContentEditor } from './TextContentEditor';
import { EffectConfigurator } from './EffectConfigurator';

interface LayerEditorModalProps {
  layer: Layer | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedLayer: Layer) => void;
  onSave: () => void;
  onCancel: () => void;
  fonts?: { family: string }[];
}

export function LayerEditorModal({
  layer,
  isOpen,
  onClose,
  onUpdate,
  onSave,
  onCancel,
  fonts,
}: LayerEditorModalProps) {
  if (!layer) return null;

  const effect = getEffect(layer.effectType);
  const hasText = layer.effectType === 'basic-text' || layer.config?.text !== undefined;

  const handleTextChange = (text: string) => {
    onUpdate({ ...layer, config: { ...layer.config, text } });
  };

  const handleConfigChange = (config: Record<string, any>) => {
    onUpdate({ ...layer, config });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogPortal>
        <DialogOverlay className="z-240" />
        <DialogPrimitive.Content
          className="dark fixed left-[50%] top-[50%] z-250 w-full max-w-lg max-h-[85vh] translate-x-[-50%] translate-y-[-50%] border bg-background text-foreground p-0 shadow-lg rounded-lg flex flex-col duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle className="text-lg font-semibold leading-none tracking-tight">
              Edit {effect?.name || layer.effectType}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Configure layer content and properties
            </DialogDescription>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4 space-y-4">
            {/* Text editor for text layers */}
            {hasText && (
              <>
                <TextContentEditor
                  text={layer.config?.text ?? ''}
                  onChange={handleTextChange}
                />
                <Separator />
              </>
            )}

            {/* Effect config (excluding text for text layers) */}
            <EffectConfigurator
              effectType={layer.effectType}
              config={layer.config}
              onChange={handleConfigChange}
              excludeFields={hasText ? ['text'] : undefined}
              fonts={fonts}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={onSave}>
              Save
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
