'use client';

import { useState } from 'react';
import { GlassSettings, DEFAULT_GLASS_SETTINGS } from './WebGLLiquidGlass';

interface SliderConfig {
  key: keyof Omit<GlassSettings, 'centerWarp'>;
  label: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderConfig[] = [
  { key: 'edgeIntensity', label: 'Edge Intensity', min: 0, max: 0.1, step: 0.001 },
  { key: 'rimIntensity', label: 'Rim Intensity', min: 0, max: 0.2, step: 0.001 },
  { key: 'baseIntensity', label: 'Base Intensity', min: 0, max: 0.05, step: 0.001 },
  { key: 'edgeDistance', label: 'Edge Distance', min: 0.05, max: 0.5, step: 0.01 },
  { key: 'rimDistance', label: 'Rim Distance', min: 0.1, max: 2.0, step: 0.05 },
  { key: 'baseDistance', label: 'Base Distance', min: 0.05, max: 0.3, step: 0.01 },
  { key: 'cornerBoost', label: 'Corner Boost', min: 0, max: 0.1, step: 0.001 },
  { key: 'rippleEffect', label: 'Ripple Effect', min: 0, max: 0.5, step: 0.01 },
  { key: 'blurRadius', label: 'Blur Radius', min: 1, max: 15, step: 0.5 },
  { key: 'tintOpacity', label: 'Tint Opacity', min: 0, max: 1.0, step: 0.01 },
];

function randomizeSettings(): GlassSettings {
  return {
    edgeIntensity: 0.005 + Math.random() * 0.025,
    rimIntensity: 0.02 + Math.random() * 0.13,
    baseIntensity: 0.005 + Math.random() * 0.025,
    edgeDistance: 0.1 + Math.random() * 0.3,
    rimDistance: 0.3 + Math.random() * 1.2,
    baseDistance: 0.08 + Math.random() * 0.17,
    cornerBoost: 0.01 + Math.random() * 0.05,
    rippleEffect: 0.05 + Math.random() * 0.25,
    blurRadius: 2 + Math.random() * 10,
    tintOpacity: 0.1 + Math.random() * 0.7,
    centerWarp: Math.random() < 0.3,
  };
}

export interface DimensionSettings {
  width: number;
  height: number;
  borderRadius: number;
}

interface GlassControlPanelProps {
  settings: GlassSettings;
  onChange: (settings: GlassSettings) => void;
  dimensions: DimensionSettings;
  onDimensionsChange: (dimensions: DimensionSettings) => void;
  bouncing: boolean;
  onBounceToggle: () => void;
}

const btnBase: React.CSSProperties = {
  flex: 1,
  padding: '10px 16px',
  border: 'none',
  borderRadius: '10px',
  background: 'rgba(0,0,0,0.06)',
  color: '#1d1d1f',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background 0.15s',
};

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const decimals = step < 0.01 ? 3 : step < 0.1 ? 2 : step < 1 ? 1 : 0;
  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '4px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#1d1d1f' }}>{label}</span>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 400,
            color: '#86868b',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value.toFixed(decimals)}{unit ?? ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#007AFF' }}
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: '#86868b',
        marginTop: '20px',
        marginBottom: '12px',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        paddingTop: '16px',
      }}
    >
      {children}
    </div>
  );
}

export default function GlassControlPanel({
  settings,
  onChange,
  dimensions,
  onDimensionsChange,
  bouncing,
  onBounceToggle,
}: GlassControlPanelProps) {
  const [minimized, setMinimized] = useState(true);

  const updateSetting = (key: string, value: number | boolean) => {
    onChange({ ...settings, [key]: value });
  };

  const updateDimension = (key: keyof DimensionSettings, value: number) => {
    onDimensionsChange({ ...dimensions, [key]: value });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '320px',
        maxHeight: minimized ? 'auto' : 'calc(100vh - 40px)',
        overflowY: minimized ? 'hidden' : 'auto',
        zIndex: 200,
        background: 'rgba(245, 245, 247, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: minimized ? '16px 24px' : '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 0 0 0.5px rgba(255,255,255,0.5)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        color: '#1d1d1f',
        transition: 'padding 0.2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: minimized ? 0 : '20px',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '17px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            flex: 1,
            textAlign: 'center',
            paddingLeft: '28px',
          }}
        >
          Liquid Glass Controls
        </h3>
        <button
          onClick={() => setMinimized(!minimized)}
          style={{
            width: '28px',
            height: '28px',
            border: 'none',
            borderRadius: '8px',
            background: 'rgba(0,0,0,0.06)',
            color: '#86868b',
            fontSize: '16px',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
          title={minimized ? 'Expand controls' : 'Minimize controls'}
        >
          {minimized ? '+' : '\u2013'}
        </button>
      </div>

      {!minimized && (
        <>
      {/* Dimension controls */}
      <SectionLabel>Dimensions</SectionLabel>
      <Slider
        label="Width"
        value={dimensions.width}
        min={200}
        max={1600}
        step={10}
        unit="px"
        onChange={(v) => updateDimension('width', v)}
      />
      <Slider
        label="Height"
        value={dimensions.height}
        min={150}
        max={1200}
        step={10}
        unit="px"
        onChange={(v) => updateDimension('height', v)}
      />
      <Slider
        label="Border Radius"
        value={dimensions.borderRadius}
        min={0}
        max={200}
        step={1}
        unit="px"
        onChange={(v) => updateDimension('borderRadius', v)}
      />

      {/* Animation */}
      <SectionLabel>Animation</SectionLabel>
      <button
        onClick={onBounceToggle}
        style={{
          ...btnBase,
          width: '100%',
          background: bouncing ? '#007AFF' : 'rgba(0,0,0,0.06)',
          color: bouncing ? '#fff' : '#1d1d1f',
        }}
        onMouseEnter={(e) => {
          if (!bouncing) e.currentTarget.style.background = 'rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          if (!bouncing) e.currentTarget.style.background = 'rgba(0,0,0,0.06)';
        }}
      >
        {bouncing ? 'Stop Bouncing' : 'Start Bouncing'}
      </button>

      {/* Glass effect sliders */}
      <SectionLabel>Glass Effect</SectionLabel>
      {SLIDERS.map(({ key, label, min, max, step }) => (
        <Slider
          key={key}
          label={label}
          value={settings[key]}
          min={min}
          max={max}
          step={step}
          onChange={(v) => updateSetting(key, v)}
        />
      ))}

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={settings.centerWarp}
          onChange={(e) => updateSetting('centerWarp', e.target.checked)}
          style={{ width: '16px', height: '16px', accentColor: '#007AFF' }}
        />
        Enable Center Warp
      </label>

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button
          onClick={() => onChange(randomizeSettings())}
          style={btnBase}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
        >
          Randomize
        </button>
        <button
          onClick={() => onChange({ ...DEFAULT_GLASS_SETTINGS })}
          style={btnBase}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
        >
          Reset
        </button>
      </div>
        </>
      )}
    </div>
  );
}
