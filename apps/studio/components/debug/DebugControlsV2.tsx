'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PanelRightClose, PanelRightOpen, Save, FolderOpen, Download, Layers, Image as ImageIcon } from 'lucide-react';
import { Layer } from '@/types/presentation';
import { EffectPicker } from './EffectPicker';
import { LayerStack } from './LayerStack';
import { EffectConfigurator } from './EffectConfigurator';
import { PerformancePanel } from './PerformancePanel';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type LayerTarget = 'slide' | 'stage';

interface DebugControlsV2Props {
  // Layers
  stageLayers: Layer[];
  slideLayers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onAddLayer: (effectType: string, target: LayerTarget) => void;
  onRemoveLayer: (id: string) => void;
  onUpdateLayerConfig: (id: string, config: Record<string, any>) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onReorderLayers: (orderedIds: string[], target: LayerTarget) => void;
  onToggleVisibility: (id: string) => void;

  // Persistence
  presentationId?: string | null;
  onSave?: () => void;
  onLoad?: (id: string) => void;

  // Context
  currentSectionName?: string;
  currentSlideIndex?: number;
  currentSectionIndex?: number;
}

export function DebugControlsV2({
  stageLayers,
  slideLayers,
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
  currentSectionName,
  currentSlideIndex,
  currentSectionIndex,
}: DebugControlsV2Props) {
  const [minimized, setMinimized] = useState(false);
  const [presentations, setPresentations] = useState<any[]>([]);
  const [loadOpen, setLoadOpen] = useState(false);
  const [activeFonts, setActiveFonts] = useState<{ family: string }[]>([]);
  const [layerTarget, setLayerTarget] = useState<LayerTarget>('slide');

  // Reset tab to "slide" when slide or section changes
  const prevSlideRef = useRef(currentSlideIndex);
  const prevSectionRef = useRef(currentSectionIndex);
  useEffect(() => {
    if (prevSlideRef.current !== currentSlideIndex || prevSectionRef.current !== currentSectionIndex) {
      prevSlideRef.current = currentSlideIndex;
      prevSectionRef.current = currentSectionIndex;
      setLayerTarget('slide');
    }
  });

  useEffect(() => {
    fetch('/api/fonts')
      .then((r) => (r.ok ? r.json() : []))
      .then((fonts: any[]) => {
        setActiveFonts(fonts.filter((f: any) => f.isActive !== false));
      })
      .catch(() => {});
  }, []);

  const allLayers = [...stageLayers, ...slideLayers];
  const selectedLayer = allLayers.find((l) => l.id === selectedLayerId) || null;

  const handleExportJSON = () => {
    const data = {
      stageLayers,
      slideLayers,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `layers-config-${Date.now()}.json`;
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
        className={`dark h-full shrink-0 flex flex-col transition-all duration-200 border-l border-border bg-background text-foreground ${
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

        {/* Body */}
        {!minimized && (
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-4">
              {/* Layer Target Tabs */}
              <Tabs value={layerTarget} onValueChange={(v) => {
                const target = v as LayerTarget;
                setLayerTarget(target);
                const layers = target === 'stage' ? stageLayers : slideLayers;
                onSelectLayer(layers.length > 0 ? layers[0].id : null);
              }}>
                <TabsList className="w-full">
                  <TabsTrigger value="slide" className="flex-1 gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    Slide
                  </TabsTrigger>
                  <TabsTrigger value="stage" className="flex-1 gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Stage
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="slide" className="mt-3 space-y-3">
                  <EffectPicker onSelect={(effectType) => onAddLayer(effectType, 'slide')} />
                  <LayerStack
                    layers={slideLayers}
                    selectedLayerId={selectedLayerId}
                    onSelect={onSelectLayer}
                    onReorderLayers={(ids) => onReorderLayers(ids, 'slide')}
                    onDelete={onRemoveLayer}
                    onToggleVisibility={onToggleVisibility}
                  />
                  {slideLayers.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      Slide layers animate per slide
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="stage" className="mt-3 space-y-3">
                  {currentSectionName && (
                    <div className="text-xs text-muted-foreground mb-2 px-1 py-1 bg-muted/50 rounded">
                      Stage layers for: <span className="font-medium text-foreground">{currentSectionName}</span>
                    </div>
                  )}
                  <EffectPicker onSelect={(effectType) => onAddLayer(effectType, 'stage')} />
                  <LayerStack
                    layers={stageLayers}
                    selectedLayerId={selectedLayerId}
                    onSelect={onSelectLayer}
                    onReorderLayers={(ids) => onReorderLayers(ids, 'stage')}
                    onDelete={onRemoveLayer}
                    onToggleVisibility={onToggleVisibility}
                  />
                  {stageLayers.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      Stage layers persist across all slides in this section
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Effect Configurator */}
              {selectedLayer && (
                <>
                  <Separator />
                  <EffectConfigurator
                    effectType={selectedLayer.effectType}
                    config={selectedLayer.config}
                    onChange={(newConfig) => onUpdateLayerConfig(selectedLayer.id, newConfig)}
                    layer={selectedLayer}
                    onLayerChange={(updates) => onUpdateLayer(selectedLayer.id, updates)}
                    fonts={activeFonts}
                  />
                </>
              )}

              <Separator />

              <PerformancePanel layers={allLayers} />

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
