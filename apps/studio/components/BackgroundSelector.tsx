'use client';

import { useState, useEffect } from 'react';

interface BackgroundSelectorProps {
  currentImage: string;
  onImageChange: (imagePath: string) => void;
}

function displayName(imagePath: string): string {
  const filename = imagePath.split('/').pop() ?? imagePath;
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  return nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BackgroundSelector({
  currentImage,
  onImageChange,
}: BackgroundSelectorProps) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImages() {
      try {
        const res = await fetch('/api/images');
        const data = await res.json();
        setImages(data.images ?? []);
      } catch {
        setImages([]);
      } finally {
        setLoading(false);
      }
    }
    fetchImages();
  }, []);

  if (loading || images.length <= 1) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 200,
        background: 'rgba(245, 245, 247, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow:
          '0 8px 32px rgba(0,0,0,0.12), inset 0 0 0 0.5px rgba(255,255,255,0.5)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        color: '#1d1d1f',
      }}
    >
      <label
        style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: '#86868b',
          marginBottom: '6px',
        }}
      >
        Background
      </label>
      <select
        value={currentImage}
        onChange={(e) => onImageChange(e.target.value)}
        style={{
          width: '100%',
          minWidth: '160px',
          padding: '8px 12px',
          border: 'none',
          borderRadius: '8px',
          background: 'rgba(0,0,0,0.06)',
          color: '#1d1d1f',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {images.map((img) => (
          <option key={img} value={img}>
            {displayName(img)}
          </option>
        ))}
      </select>
    </div>
  );
}
