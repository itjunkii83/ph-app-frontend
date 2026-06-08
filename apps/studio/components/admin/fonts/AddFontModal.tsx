'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleFontSearch } from './GoogleFontSearch';

interface AddFontModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

interface FontResult {
  family: string;
  category: string;
  variants: string[];
}

const WEIGHT_MAP: Record<string, number> = {
  '100': 100, '100italic': 100,
  '200': 200, '200italic': 200,
  '300': 300, '300italic': 300,
  'regular': 400, 'italic': 400,
  '500': 500, '500italic': 500,
  '600': 600, '600italic': 600,
  '700': 700, '700italic': 700,
  '800': 800, '800italic': 800,
  '900': 900, '900italic': 900,
};

const COMMON_WEIGHTS = [300, 400, 500, 600, 700, 800];

export function AddFontModal({ open, onClose, onAdded }: AddFontModalProps) {
  const [results, setResults] = useState<FontResult[]>([]);
  const [selected, setSelected] = useState<FontResult | null>(null);
  const [weights, setWeights] = useState<number[]>([400, 700]);
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog');
  const [saving, setSaving] = useState(false);

  const handleResults = useCallback((r: FontResult[]) => {
    setResults(r);
    setSelected(null);
  }, []);

  useEffect(() => {
    if (selected) {
      // Load the font for preview
      const family = selected.family.replace(/ /g, '+');
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${family}:wght@${COMMON_WEIGHTS.join(';')}&display=swap`;
      link.id = `preview-font-${selected.family}`;
      const existing = document.getElementById(link.id);
      if (!existing) document.head.appendChild(link);
    }
  }, [selected]);

  const handleSelectFont = (font: FontResult) => {
    setSelected(font);
    const available = font.variants
      .map((v) => WEIGHT_MAP[v])
      .filter((w): w is number => w !== undefined);
    const unique = [...new Set(available)];
    setWeights(unique.length > 0 ? unique : [400]);
  };

  const toggleWeight = (w: number) => {
    setWeights((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w].sort((a, b) => a - b)
    );
  };

  const handleAdd = async () => {
    if (!selected || weights.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/fonts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family: selected.family,
          source: 'google',
          weights,
          styles: ['normal'],
          category: selected.category,
          displayName: selected.family,
        }),
      });
      if (res.ok) {
        onAdded();
        onClose();
        setSelected(null);
        setResults([]);
      }
    } catch (err) {
      console.error('Failed to add font', err);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '560px',
          maxHeight: '80vh',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Add Google Font</h2>
          <button
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              border: 'none',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.06)',
              color: '#86868b',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            &#10005;
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          <GoogleFontSearch onResults={handleResults} />

          {/* Results list */}
          {results.length > 0 && !selected && (
            <div
              style={{
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: '10px',
                maxHeight: '240px',
                overflowY: 'auto',
              }}
            >
              {results.map((font) => (
                <button
                  key={font.family}
                  onClick={() => handleSelectFont(font)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: 'none',
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#1d1d1f',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>{font.family}</div>
                  <div style={{ fontSize: '11px', color: '#86868b' }}>{font.category}</div>
                </button>
              ))}
            </div>
          )}

          {/* Selected font config */}
          {selected && (
            <div>
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(0,122,255,0.06)',
                  borderRadius: '10px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                  {selected.family}
                </div>
                <div style={{ fontSize: '12px', color: '#86868b' }}>{selected.category}</div>
              </div>

              {/* Preview */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#86868b', display: 'block', marginBottom: '4px' }}>
                  Preview
                </label>
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '8px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
                <div
                  style={{
                    fontFamily: `"${selected.family}", sans-serif`,
                    fontSize: '24px',
                    padding: '16px',
                    background: '#fafafa',
                    borderRadius: '8px',
                    lineHeight: 1.4,
                  }}
                >
                  {previewText}
                </div>
              </div>

              {/* Weight selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#86868b', display: 'block', marginBottom: '8px' }}>
                  Weights
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {COMMON_WEIGHTS.map((w) => (
                    <button
                      key={w}
                      onClick={() => toggleWeight(w)}
                      style={{
                        padding: '6px 12px',
                        border: weights.includes(w)
                          ? '1px solid #007AFF'
                          : '1px solid rgba(0,0,0,0.12)',
                        borderRadius: '6px',
                        background: weights.includes(w) ? 'rgba(0,122,255,0.1)' : 'transparent',
                        color: weights.includes(w) ? '#007AFF' : '#1d1d1f',
                        fontSize: '13px',
                        fontWeight: weights.includes(w) ? 600 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setSelected(null);
                    setResults([]);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: 'none',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.06)',
                    color: '#1d1d1f',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving || weights.length === 0}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: 'none',
                    borderRadius: '10px',
                    background: saving ? '#86868b' : '#007AFF',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: saving ? 'default' : 'pointer',
                  }}
                >
                  {saving ? 'Adding...' : 'Add Font'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
