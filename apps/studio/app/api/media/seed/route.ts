import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { adminStorage } from "@/lib/firebase/admin";

// One-time convenience: upload the bundled public/effects images into Storage
// under presentations/media/ and return their relative keys (no tokens).

export const runtime = "nodejs";

const BUCKET = "humanos-8eeb8.firebasestorage.app";
const MEDIA_PREFIX = "presentations/media/";
const CACHE_CONTROL = "public, max-age=31536000";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

export async function POST() {
  try {
    const dir = path.join(process.cwd(), "public", "effects");
    const names = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    const bucket = adminStorage.bucket(BUCKET);
    const images = [];
    for (const name of names) {
      const ext = path.extname(name).toLowerCase();
      const contentType = CONTENT_TYPES[ext];
      if (!contentType) continue;
      const key = MEDIA_PREFIX + name;
      await bucket
        .file(key)
        .save(fs.readFileSync(path.join(dir, name)), {
          metadata: { contentType, cacheControl: CACHE_CONTROL },
        });
      images.push({ name, key });
    }
    return NextResponse.json({ images });
  } catch (err) {
    return NextResponse.json({ images: [], error: String(err) }, { status: 500 });
  }
}
