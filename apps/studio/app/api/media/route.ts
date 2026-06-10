import { NextRequest, NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase/admin";

// Presentation media lives in Firebase Storage under presentations/media/ (the
// only public-read prefix). We store and return RELATIVE KEYS (object paths); the
// player resolves them against the configured base URL at render time. No tokens.

export const runtime = "nodejs";

const BUCKET = "humanos-8eeb8.firebasestorage.app";
const MEDIA_PREFIX = "presentations/media/";
// Long, public cache so the browser actually caches media (Firebase serves
// `private, max-age=0` by default, which defeats preloading). Media is stable per
// key; a changed asset gets a new key.
const CACHE_CONTROL = "public, max-age=31536000";

export async function GET() {
  try {
    const bucket = adminStorage.bucket(BUCKET);
    const [files] = await bucket.getFiles({ prefix: MEDIA_PREFIX });
    const images = files
      .filter((f) => !f.name.endsWith("/"))
      .map((f) => ({ name: f.name.slice(MEDIA_PREFIX.length), key: f.name }));
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
    const key = MEDIA_PREFIX + safeName; // canonical relative key
    const buffer = Buffer.from(await file.arrayBuffer());
    await adminStorage
      .bucket(BUCKET)
      .file(key)
      .save(buffer, {
        metadata: {
          contentType: file.type || "application/octet-stream",
          cacheControl: CACHE_CONTROL,
        },
      });
    return NextResponse.json({ name: safeName, key });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
