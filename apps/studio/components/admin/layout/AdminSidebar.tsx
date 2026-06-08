'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin/fonts', label: 'Fonts' },
  { href: '/admin/presentations', label: 'Presentations' },
  { href: '/sandbox', label: 'Sandbox' },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <header
      style={{
        background: '#1d1d1f',
        padding: '0 24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '32px',
        height: '52px',
      }}
    >
      <Link
        href="/admin"
        style={{
          fontSize: '17px',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '-0.02em',
          textDecoration: 'none',
          marginRight: '8px',
        }}
      >
        Wisdom
      </Link>

      <nav style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                textDecoration: 'none',
                transition: 'background 0.15s',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
