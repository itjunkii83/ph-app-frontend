'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

// Side-effect import: registers all effects
import '@/components/effects';
import { getEffect, getAllEffects } from '@/components/effects/registry';

import { EffectConfigurator } from '@/components/debug/EffectConfigurator';
import { EffectPicker } from '@/components/debug/EffectPicker';
import { Slide, Layer, Presentation } from '@/types/presentation';

let layerCounter = 200;

export default function PresentationEditPage() {
  const params = useParams();
  const id = params.id as string;

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/presentations/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPresentation(data);
          if (data.slides?.[0]?.layers) {
            setLayers(data.slides[0].layers);
          }
        }
      } catch (err) {
        console.error('Failed to load presentation', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAddLayer = useCallback(
    (effectType: string) => {
      const effect = getEffect(effectType);
      if (!effect) return;

      const config: Record<string, any> = {};
      for (const [key, schema] of Object.entries(effect.configSchema)) {
        config[key] = schema.default;
      }

      const maxZ = layers.reduce((max, l) => Math.max(max, l.zIndex), 0);
      const newLayer: Layer = {
        id: `layer-${Date.now()}-${++layerCounter}`,
        effectType,
        config,
        position: { x: 0, y: 0, unit: '%' },
        size: { width: 100, height: 100, unit: '%' },
        opacity: 1,
        blendMode: 'normal',
        zIndex: maxZ + 1,
        visible: true,
        locked: false,
      };

      setLayers((prev) => [...prev, newLayer]);
      setSelectedLayerId(newLayer.id);
    },
    [layers]
  );

  const handleRemoveLayer = useCallback((layerId: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== layerId));
    setSelectedLayerId((prev) => (prev === layerId ? null : prev));
  }, []);

  const handleUpdateLayerConfig = useCallback((layerId: string, config: Record<string, any>) => {
    setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, config } : l)));
  }, []);

  const handleUpdateLayer = useCallback((layerId: string, updates: Partial<Layer>) => {
    setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, ...updates } : l)));
  }, []);

  const handleToggleVisibility = useCallback((layerId: string) => {
    setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)));
  }, []);

  const handleSave = useCallback(async () => {
    const slide: Slide = {
      id: presentation?.slides?.[0]?.id || 'slide-1',
      layers,
      duration: 5000,
    };

    try {
      await fetch(`/api/presentations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: [slide] }),
      });
    } catch (err) {
      console.error('Save failed', err);
    }
  }, [id, layers, presentation]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#86868b', fontSize: '14px' }}>
        Loading presentation...
      </div>
    );
  }

  if (!presentation) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ff3b30', fontSize: '14px' }}>
        Presentation not found
      </div>
    );
  }

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#1d1d1f',
          }}
        >
          {presentation.title}
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Scaled preview */}
        <div
          style={{
            flex: 1,
            background: '#000',
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative',
            aspectRatio: '16/9',
          }}
        >
          <div
            style={{
              width: '1920px',
              height: '1080px',
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
            ref={(el) => {
              if (el && el.parentElement) {
                const scale = el.parentElement.clientWidth / 1920;
                el.style.transform = `scale(${scale})`;
              }
            }}
          >
            <div
              style={{
                width: '1920px',
                height: '1080px',
                position: 'relative',
                overflow: 'hidden',
                background: '#000',
              }}
            >
              {[...layers]
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((layer) => {
                  if (!layer.visible) return null;
                  const EffectComponent = getEffect(layer.effectType)?.component;
                  if (!EffectComponent) return null;
                  return (
                    <div
                      key={layer.id}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: layer.opacity,
                        mixBlendMode: layer.blendMode as any,
                        zIndex: layer.zIndex,
                      }}
                    >
                      <EffectComponent config={layer.config} isActive={true} />
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Controls panel */}
        <div
          style={{
            width: '360px',
            background: 'rgba(245,245,247,0.85)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            padding: '16px 20px',
            maxHeight: 'calc(100vh - 180px)',
            overflowY: 'auto',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleSave}
            style={{
              width: '100%',
              padding: '10px 16px',
              border: 'none',
              borderRadius: '10px',
              background: '#34c759',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '12px',
            }}
          >
            Save Changes
          </button>

          <EffectPicker onSelect={handleAddLayer} />

          {/* Layer list */}
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#86868b',
              marginBottom: '8px',
            }}
          >
            Layers
          </div>
          {layers
            .slice()
            .sort((a, b) => b.zIndex - a.zIndex)
            .map((layer) => {
              const effect = getEffect(layer.effectType);
              const isSelected = layer.id === selectedLayerId;
              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    background: isSelected ? 'rgba(0,122,255,0.12)' : 'transparent',
                    border: isSelected
                      ? '1px solid rgba(0,122,255,0.3)'
                      : '1px solid transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: layer.visible ? '#1d1d1f' : '#86868b' }}>
                    {effect?.name || layer.effectType}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisibility(layer.id);
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: layer.visible ? '#007AFF' : '#c7c7cc',
                      }}
                    >
                      {layer.visible ? '\u25C9' : '\u25CB'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveLayer(layer.id);
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: '#ff3b30',
                      }}
                    >
                      &#10005;
                    </button>
                  </div>
                </div>
              );
            })}

          {/* Configurator for selected layer */}
          {selectedLayer && (
            <EffectConfigurator
              effectType={selectedLayer.effectType}
              config={selectedLayer.config}
              onChange={(config) => handleUpdateLayerConfig(selectedLayer.id, config)}
              layer={selectedLayer}
              onLayerChange={(updates) => handleUpdateLayer(selectedLayer.id, updates)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
