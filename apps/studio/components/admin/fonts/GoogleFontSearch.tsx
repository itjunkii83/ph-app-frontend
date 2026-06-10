'use client';

import React, { useState, useRef, useCallback } from 'react';

interface GoogleFontResult {
  family: string;
  category: string;
  variants: string[];
}

interface GoogleFontSearchProps {
  onResults: (results: GoogleFontResult[]) => void;
}

export function GoogleFontSearch({ onResults }: GoogleFontSearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    (q: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      if (!q.trim()) {
        onResults([]);
        return;
      }

      timerRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/fonts/google?q=${encodeURIComponent(q)}`);
          if (res.ok) {
            const data = await res.json();
            onResults(data);
          }
        } catch {
          onResults([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [onResults]
  );

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            search(e.target.value);
          }}
          placeholder="Search Google Fonts..."
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: '10px',
            fontSize: '14px',
            background: '#fff',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
        {loading && (
          <span
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '12px',
              color: '#86868b',
            }}
          >
            Searching...
          </span>
        )}
      </div>
    </div>
  );
}
