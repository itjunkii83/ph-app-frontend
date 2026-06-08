'use client';

import React, { useEffect } from 'react';
import { ManagedFont } from '@/types/fonts';
import { loadFont } from '@/lib/fonts/loader';

interface FontCardProps {
  font: ManagedFont & { id: string };
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}

export function FontCard({ font, onToggle, onDelete }: FontCardProps) {
  useEffect(() => {
    loadFont(font);
  }, [font.family]);

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid rgba(0,0,0,0.06)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        opacity: font.isActive === false ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
        }}
      >
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#1d1d1f' }}>
            {font.displayName || font.family}
          </div>
          {font.category && (
            <div style={{ fontSize: '11px', color: '#86868b', marginTop: '2px' }}>
              {font.category}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => onToggle(font.id, !font.isActive)}
            style={{
              padding: '4px 10px',
              border: 'none',
              borderRadius: '6px',
              background: font.isActive !== false ? 'rgba(52,199,89,0.12)' : 'rgba(0,0,0,0.06)',
              color: font.isActive !== false ? '#34c759' : '#86868b',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {font.isActive !== false ? 'Active' : 'Inactive'}
          </button>
          <button
            onClick={() => onDelete(font.id)}
            style={{
              padding: '4px 8px',
              border: 'none',
              borderRadius: '6px',
              background: 'rgba(255,59,48,0.08)',
              color: '#ff3b30',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Specimen */}
      <div
        style={{
          fontFamily: `"${font.family}", sans-serif`,
          fontSize: '28px',
          lineHeight: 1.3,
          color: '#1d1d1f',
          marginBottom: '12px',
          minHeight: '40px',
        }}
      >
        The quick brown fox jumps over the lazy dog
      </div>

      {/* Weight badges */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {font.weights.map((w) => (
          <span
            key={w}
            style={{
              padding: '2px 8px',
              background: 'rgba(0,0,0,0.04)',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#86868b',
              fontWeight: 500,
            }}
          >
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}
