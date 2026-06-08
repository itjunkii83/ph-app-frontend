'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface PresentationSummary {
  id: string;
  title: string;
  slideCount: number;
  updatedAt: string | null;
}

export default function PresentationsPage() {
  const [presentations, setPresentations] = useState<PresentationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPresentations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/presentations');
      if (res.ok) {
        setPresentations(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch presentations', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPresentations();
  }, [fetchPresentations]);

  const handleCreate = async () => {
    const title = prompt('Presentation title:');
    if (!title) return;

    try {
      const res = await fetch('/api/presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        fetchPresentations();
      }
    } catch (err) {
      console.error('Failed to create presentation', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this presentation?')) return;
    try {
      await fetch(`/api/presentations/${id}`, { method: 'DELETE' });
      setPresentations((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete presentation', err);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#1d1d1f',
          }}
        >
          Presentations
        </h1>
        <button
          onClick={handleCreate}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '10px',
            background: '#007AFF',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#0066d6')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#007AFF')}
        >
          New Presentation
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#86868b', fontSize: '14px', padding: '40px 0', textAlign: 'center' }}>
          Loading presentations...
        </div>
      ) : presentations.length === 0 ? (
        <div style={{ color: '#86868b', fontSize: '14px', padding: '40px 0', textAlign: 'center' }}>
          No presentations yet. Click &ldquo;New Presentation&rdquo; to create one.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {presentations.map((p) => (
            <div
              key={p.id}
              style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.06)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px',
                }}
              >
                <Link
                  href={`/admin/presentations/${p.id}`}
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1d1d1f',
                    textDecoration: 'none',
                  }}
                >
                  {p.title}
                </Link>
                <button
                  onClick={() => handleDelete(p.id)}
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
              <div style={{ fontSize: '12px', color: '#86868b' }}>
                {p.slideCount} slide{p.slideCount !== 1 ? 's' : ''}
                {p.updatedAt && ` \u00b7 ${formatDate(p.updatedAt)}`}
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <Link
                  href={`/admin/presentations/${p.id}`}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.04)',
                    color: '#1d1d1f',
                    fontSize: '13px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    textAlign: 'center',
                    transition: 'background 0.15s',
                  }}
                >
                  Edit
                </Link>
                <Link
                  href={`/sandbox?id=${p.id}`}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'rgba(0,122,255,0.08)',
                    color: '#007AFF',
                    fontSize: '13px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    textAlign: 'center',
                    transition: 'background 0.15s',
                  }}
                >
                  Open in Sandbox
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
