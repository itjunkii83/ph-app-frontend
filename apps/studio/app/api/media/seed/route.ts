import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { adminStorage } from "@/lib/firebase/admin";

// One-time migration: upload the bundled public/effects images into Firebase
// Storage so the existing presentation can reference them by absolute (cross-app)
// URLs instead of /effects/* public paths.

export const runtime = "nodejs";

const BUCKET = "humanos-8eeb8.firebasestorage.app";
const MEDIA_PREFIX = "presentations/media/";

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
      const buffer = fs.readFileSync(path.join(dir, name));
      const fullPath = MEDIA_PREFIX + name;
      const token = randomUUID();
      await bucket.file(fullPath).save(buffer, {
        metadata: {
          contentType,
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });
      images.push({
        name,
        url: `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(
          fullPath,
        )}?alt=media&token=${token}`,
      });
    }
    return NextResponse.json({ images });
  } catch (err) {
    return NextResponse.json({ images: [], error: String(err) }, { status: 500 });
  }
}
