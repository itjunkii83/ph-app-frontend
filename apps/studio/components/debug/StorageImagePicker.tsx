"use client";

import { useEffect, useRef, useState } from "react";
import { resolveAssetUrl } from "@harbor/player";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface MediaItem {
  name: string;
  key: string;
}

// Configured base URL for resolving relative keys into displayable URLs (the same
// base the player uses at render time).
const ASSET_BASE = process.env.NEXT_PUBLIC_STORAGE_BASE_URL ?? "";

// Storage-backed image picker: lists media in Firebase Storage, uploads new
// images, and can import the bundled public/effects images. It stores the
// RELATIVE KEY (e.g. "presentations/media/bg.jpg") on the layer; thumbnails
// resolve the key against the base for display. Keys are canonical — no absolute
// tokenized URLs are written into presentations.
export function StorageImagePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    fetch("/api/media")
      .then((r) => (r.ok ? r.json() : { images: [] }))
      .then((d) => setItems(Array.isArray(d.images) ? d.images : []))
      .catch(() => {});
  }
  useEffect(load, []);

  async function upload(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/media", { method: "POST", body: fd });
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
      const res = await fetch("/api/media/seed", { method: "POST" });
      if (res.ok) load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Media key (presentations/media/...)"
        className="text-sm h-9 mb-1"
      />
      {items.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              title={item.name}
              onClick={() => onChange(item.key)}
              className={`w-12 h-9 rounded-md overflow-hidden bg-black p-0 cursor-pointer border-2 ${
                value === item.key ? "border-primary" : "border-input"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveAssetUrl(item.key, ASSET_BASE)}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="text-xs rounded-md border border-input px-2 py-1 disabled:opacity-50"
        >
          {busy ? "Working..." : "Upload"}
        </button>
        <button
          type="button"
          onClick={importBundled}
          disabled={busy}
          className="text-xs rounded-md border border-input px-2 py-1 disabled:opacity-50"
        >
          Import bundled
        </button>
      </div>
    </div>
  );
}
