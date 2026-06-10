'use client';

import React from 'react';
import Link from 'next/link';

const sections = [
  {
    href: '/admin/fonts',
    label: 'Fonts',
    description: 'Search, add, and manage Google Fonts for your presentations.',
  },
  {
    href: '/admin/presentations',
    label: 'Presentations',
    description: 'Create, edit, and manage saved presentations.',
  },
  {
    href: '/sandbox',
    label: 'Sandbox',
    description: 'Build and preview slides with the live editor.',
  },
];

export default function AdminPage() {
  return (
    <div>
      <h1
        style={{
          margin: '0 0 8px',
          fontSize: '28px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: '#1d1d1f',
        }}
      >
        Admin
      </h1>
      <p style={{ margin: '0 0 32px', fontSize: '15px', color: '#86868b' }}>
        Manage your Wisdom presentation engine.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            style={{
              display: 'block',
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.06)',
              textDecoration: 'none',
              transition: 'box-shadow 0.15s, transform 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontSize: '17px', fontWeight: 600, color: '#1d1d1f', marginBottom: '6px' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '13px', color: '#86868b', lineHeight: 1.5 }}>
              {s.description}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
