'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ManagedFont } from '@/types/fonts';
import { FontCard } from './FontCard';

interface FontListProps {
  refreshKey: number;
}

export function FontList({ refreshKey }: FontListProps) {
  const [fonts, setFonts] = useState<(ManagedFont & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFonts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fonts');
      if (res.ok) {
        const data = await res.json();
        setFonts(data);
      }
    } catch (err) {
      console.error('Failed to fetch fonts', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFonts();
  }, [fetchFonts, refreshKey]);

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/fonts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: active }),
      });
      setFonts((prev) =>
        prev.map((f) => (f.id === id ? { ...f, isActive: active } : f))
      );
    } catch (err) {
      console.error('Failed to toggle font', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this font?')) return;
    try {
      await fetch(`/api/fonts/${id}`, { method: 'DELETE' });
      setFonts((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error('Failed to delete font', err);
    }
  };

  if (loading) {
    return (
      <div style={{ color: '#86868b', fontSize: '14px', padding: '40px 0', textAlign: 'center' }}>
        Loading fonts...
      </div>
    );
  }

  if (fonts.length === 0) {
    return (
      <div style={{ color: '#86868b', fontSize: '14px', padding: '40px 0', textAlign: 'center' }}>
        No fonts added yet. Click &ldquo;Add Font&rdquo; to get started.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
        gap: '16px',
      }}
    >
      {fonts.map((font) => (
        <FontCard
          key={font.id}
          font={font}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
