// One-shot media migration. Uploads the bundled public/effects images to Firebase
// Storage (with download tokens) and rewrites every presentation's image-layer
// `src` from a /effects/* public path to the absolute Storage URL, so the toolkit
// can load them cross-app. Safe to re-run. Uses the studio service account.
//
// Run from the repo root: node apps/studio/scripts/migrate-media.cjs

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const BUCKET = "humanos-8eeb8.firebasestorage.app";
const MEDIA_PREFIX = "presentations/media/";
const STUDIO_DIR = path.join(__dirname, "..");

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

const serviceAccount = require(path.join(STUDIO_DIR, "service-account.json"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: BUCKET,
});
const db = admin.firestore();
const bucket = admin.storage().bucket(BUCKET);

function downloadUrl(fullPath, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(
    fullPath,
  )}?alt=media&token=${token}`;
}

async function uploadEffects() {
  const dir = path.join(STUDIO_DIR, "public", "effects");
  const map = {}; // basename -> Storage URL
  if (!fs.existsSync(dir)) {
    console.log(`No directory ${dir}; nothing to upload.`);
    return map;
  }
  for (const name of fs.readdirSync(dir)) {
    const ext = path.extname(name).toLowerCase();
    const contentType = CONTENT_TYPES[ext];
    if (!contentType) continue;
    const fullPath = MEDIA_PREFIX + name;
    const token = crypto.randomUUID();
    await bucket.file(fullPath).save(fs.readFileSync(path.join(dir, name)), {
      metadata: { contentType, metadata: { firebaseStorageDownloadTokens: token } },
    });
    map[name] = downloadUrl(fullPath, token);
    console.log(`  uploaded ${name}`);
  }
  return map;
}

function rewriteLayers(layers, map) {
  let changed = 0;
  for (const layer of layers || []) {
    const src = layer && layer.config && layer.config.src;
    if (typeof src === "string" && src && !/^https?:\/\//i.test(src)) {
      const base = src.split("/").pop();
      if (base && map[base]) {
        layer.config.src = map[base];
        changed++;
      }
    }
  }
  return changed;
}

async function rewritePresentations(map) {
  const snap = await db.collection("presentations").get();
  if (snap.empty) {
    console.log("No presentations found.");
    return;
  }
  for (const doc of snap.docs) {
    const data = doc.data();
    let changed = 0;
    for (const section of data.sections || []) {
      changed += rewriteLayers(section.stageLayers, map);
      for (const slide of section.slides || []) changed += rewriteLayers(slide.layers, map);
    }
    for (const slide of data.slides || []) changed += rewriteLayers(slide.layers, map);

    if (changed > 0) {
      const update = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
      if (data.sections) update.sections = data.sections;
      if (data.slides) update.slides = data.slides;
      await doc.ref.update(update);
      console.log(`  presentation ${doc.id}: rewrote ${changed} image src to Storage`);
    } else {
      console.log(`  presentation ${doc.id}: no /effects image src to rewrite`);
    }
  }
}

(async () => {
  console.log("Uploading bundled images to Storage...");
  const map = await uploadEffects();
  const names = Object.keys(map);
  if (names.length === 0) {
    console.log("No images uploaded; done.");
    process.exit(0);
  }
  console.log(`Uploaded ${names.length} image(s). Rewriting presentations...`);
  await rewritePresentations(map);
  console.log("Migration complete.");
  process.exit(0);
})().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
