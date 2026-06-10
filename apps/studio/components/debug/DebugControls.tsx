'use client';

import React, { useState, useEffect } from 'react';
import { PanelRightClose, PanelRightOpen, Save, FolderOpen, Download, RotateCcw } from 'lucide-react';
import { Layer } from '@/types/presentation';
import { EffectPicker } from './EffectPicker';
import { LayerStack } from './LayerStack';
import { EffectConfigurator } from './EffectConfigurator';
import { PerformancePanel } from './PerformancePanel';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TooltipProvider } from '@/components/ui/tooltip';

interface DebugControlsProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onAddLayer: (effectType: string) => void;
  onRemoveLayer: (id: string) => void;
  onUpdateLayerConfig: (id: string, config: Record<string, any>) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onReorderLayers: (orderedIds: string[]) => void;
  onToggleVisibility: (id: string) => void;
  presentationId?: string | null;
  onSave?: () => void;
  onLoad?: (id: string) => void;
  onReplay?: () => void;
}

export function DebugControls({
  layers,
  selectedLayerId,
  onSelectLayer,
  onAddLayer,
  onRemoveLayer,
  onUpdateLayerConfig,
  onUpdateLayer,
  onReorderLayers,
  onToggleVisibility,
  presentationId,
  onSave,
  onLoad,
  onReplay,
}: DebugControlsProps) {
  const [minimized, setMinimized] = useState(false);
  const [presentations, setPresentations] = useState<any[]>([]);
  const [loadOpen, setLoadOpen] = useState(false);
  const [activeFonts, setActiveFonts] = useState<{ family: string }[]>([]);

  useEffect(() => {
    fetch('/api/fonts')
      .then((r) => (r.ok ? r.json() : []))
      .then((fonts: any[]) => {
        setActiveFonts(fonts.filter((f: any) => f.isActive !== false));
      })
      .catch(() => {});
  }, []);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

  const handleExportJSON = () => {
    const data = {
      layers,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slide-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadOpen = async (open: boolean) => {
    setLoadOpen(open);
    if (open && onLoad) {
      try {
        const res = await fetch('/api/presentations');
        if (res.ok) {
          const data = await res.json();
          setPresentations(data);
        }
      } catch (e) {
        console.error('Failed to fetch presentations', e);
      }
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={`dark h-screen shrink-0 flex flex-col transition-all duration-200 border-l border-border bg-background text-foreground ${
          minimized ? 'w-12' : 'w-[360px]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center shrink-0 border-b border-border ${
            minimized ? 'justify-center px-2 py-4' : 'justify-between px-5 py-4'
          }`}
        >
          {!minimized && (
            <h3 className="text-sm font-semibold tracking-tight">
              Debug Controls
            </h3>
          )}
          <div className="flex items-center gap-1">
            {!minimized && onReplay && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onReplay}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setMinimized(!minimized)}
            >
              {minimized ? (
                <PanelRightOpen className="h-4 w-4" />
              ) : (
                <PanelRightClose className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Body */}
        {!minimized && (
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-4">
              <EffectPicker onSelect={onAddLayer} />

              <LayerStack
                layers={layers}
                selectedLayerId={selectedLayerId}
                onSelect={onSelectLayer}
                onReorderLayers={onReorderLayers}
                onDelete={onRemoveLayer}
                onToggleVisibility={onToggleVisibility}
              />

              {selectedLayer && (
                <EffectConfigurator
                  effectType={selectedLayer.effectType}
                  config={selectedLayer.config}
                  onChange={(newConfig) => onUpdateLayerConfig(selectedLayer.id, newConfig)}
                  layer={selectedLayer}
                  onLayerChange={(updates) => onUpdateLayer(selectedLayer.id, updates)}
                  fonts={activeFonts}
                />
              )}

              <Separator />

              <PerformancePanel layers={layers} />

              <Separator />

              {/* Actions */}
              <div className="space-y-2">
                {onSave && (
                  <Button
                    className="w-full"
                    size="sm"
                    variant="default"
                    onClick={onSave}
                  >
                    <Save className="h-4 w-4" />
                    {presentationId ? 'Save' : 'Save As New'}
                  </Button>
                )}

                {onLoad && (
                  <Popover open={loadOpen} onOpenChange={handleLoadOpen}>
                    <PopoverTrigger asChild>
                      <Button className="w-full" size="sm" variant="secondary">
                        <FolderOpen className="h-4 w-4" />
                        Load Presentation
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="dark w-[300px] p-1 z-250" align="end" side="top">
                      {presentations.length > 0 ? (
                        <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                          {presentations.map((p: any) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                onLoad(p.id);
                                setLoadOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              {p.title}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No presentations found
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                )}

                <Button
                  className="w-full"
                  size="sm"
                  variant="secondary"
                  onClick={handleExportJSON}
                >
                  <Download className="h-4 w-4" />
                  Export JSON
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </TooltipProvider>
  );
}
