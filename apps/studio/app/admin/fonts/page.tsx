'use client';

import React, { useState } from 'react';
import { AddFontModal } from '@/components/admin/fonts/AddFontModal';
import { FontList } from '@/components/admin/fonts/FontList';

export default function FontsPage() {
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
          Font Management
        </h1>
        <button
          onClick={() => setShowModal(true)}
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
          Add Font
        </button>
      </div>

      <FontList refreshKey={refreshKey} />

      <AddFontModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onAdded={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
