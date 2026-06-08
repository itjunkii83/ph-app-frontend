import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { adminStorage } from "@/lib/firebase/admin";

// Presentation media lives in Firebase Storage so the toolkit can load it
// cross-app. We return Firebase download URLs (with a token) that resolve in an
// <img> / CSS background without auth, which is what playback needs.

export const runtime = "nodejs";

const BUCKET = "humanos-8eeb8.firebasestorage.app";
const MEDIA_PREFIX = "presentations/media/";

function downloadUrl(fullPath: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(
    fullPath,
  )}?alt=media&token=${token}`;
}

// Ensure the object has a download token, generating one if needed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureToken(file: any): Promise<string> {
  const [meta] = await file.getMetadata();
  const existing = (meta?.metadata?.firebaseStorageDownloadTokens as string | undefined)?.split(
    ",",
  )[0];
  if (existing) return existing;
  const token = randomUUID();
  await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
  return token;
}

export async function GET() {
  try {
    const bucket = adminStorage.bucket(BUCKET);
    const [files] = await bucket.getFiles({ prefix: MEDIA_PREFIX });
    const images = [];
    for (const file of files) {
      if (file.name.endsWith("/")) continue;
      const token = await ensureToken(file);
      images.push({
        name: file.name.slice(MEDIA_PREFIX.length),
        url: downloadUrl(file.name, token),
      });
    }
    return NextResponse.json({ images });
  } catch (err) {
    return NextResponse.json({ images: [], error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fullPath = MEDIA_PREFIX + safeName;
    const buffer = Buffer.from(await file.arrayBuffer());
    const token = randomUUID();
    await adminStorage
      .bucket(BUCKET)
      .file(fullPath)
      .save(buffer, {
        metadata: {
          contentType: file.type || "application/octet-stream",
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });
    return NextResponse.json({ name: safeName, url: downloadUrl(fullPath, token) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
