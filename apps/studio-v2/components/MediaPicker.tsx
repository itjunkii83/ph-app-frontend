'use client';

import { useEffect, useRef, useState } from 'react';
import { resolveAssetUrl } from '@harbor/player';
import { cn } from '@/lib/utils';
import { authedFetch } from '@/lib/firebase/authedFetch';
import { TextInput } from './ui';

interface MediaItem {
  name: string;
  key: string;
}

const ASSET_BASE = process.env.NEXT_PUBLIC_STORAGE_BASE_URL ?? '';

// Storage-backed image picker. Lists media in Firebase Storage, uploads new
// images, and can import the bundled public/effects images. It stores the
// RELATIVE KEY (e.g. "presentations/media/bg.jpg"); thumbnails resolve the key
// against the base for display. No absolute tokenized URLs are written.
export function MediaPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    fetch('/api/media')
      .then((r) => (r.ok ? r.json() : { images: [] }))
      .then((d) => setItems(Array.isArray(d.images) ? d.images : []))
      .catch(() => {});
  }
  useEffect(load, []);

  async function upload(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await authedFetch('/api/media', { method: 'POST', body: fd });
      if (res.ok) {
        const item: MediaItem = await res.json();
        setItems((prev) => [item, ...prev.filter((i) => i.key !== item.key)]);
        onChange(item.key);
      }
    } finally {
      setBusy(false);
    }
  }

  async function importBundled() {
    setBusy(true);
    try {
      const res = await authedFetch('/api/media/seed', { method: 'POST' });
      if (res.ok) load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <TextInput
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Media key (presentations/media/...)"
      />
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              title={item.name}
              onClick={() => onChange(item.key)}
              className={cn(
                'h-9 w-12 overflow-hidden rounded-md border-2 bg-black p-0 cursor-pointer',
                value === item.key ? 'border-pewter' : 'border-line',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveAssetUrl(item.key, ASSET_BASE)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-md border border-line2 px-2.5 py-1 text-xs text-paper hover:border-pewter disabled:opacity-50 cursor-pointer"
        >
          {busy ? 'Working...' : 'Upload'}
        </button>
        <button
          type="button"
          onClick={importBundled}
          disabled={busy}
          className="rounded-md border border-line2 px-2.5 py-1 text-xs text-paper hover:border-pewter disabled:opacity-50 cursor-pointer"
        >
          Import bundled
        </button>
      </div>
    </div>
  );
}
