// Media migration to the relative-key model. Re-uploads the bundled public/effects
// images tokenlessly (clearing any stale download tokens) and rewrites every
// presentation's image `config.src` and `settings.audioUrl` to a canonical
// relative key under presentations/media/. Safe to re-run. Uses the studio
// service account.
//
// Run from the repo root: node apps/studio/scripts/migrate-media.cjs

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const BUCKET = "humanos-8eeb8.firebasestorage.app";
const MEDIA_PREFIX = "presentations/media/";
const STUDIO_DIR = path.join(__dirname, "..");
// Long, public cache so the browser caches media (Firebase serves
// `private, max-age=0` by default, which defeats preloading).
const CACHE_CONTROL = "public, max-age=31536000";

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

// Re-upload bundled images WITHOUT a download token (also clears any stale token).
async function uploadEffects() {
  const dir = path.join(STUDIO_DIR, "public", "effects");
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const ext = path.extname(name).toLowerCase();
    const contentType = CONTENT_TYPES[ext];
    if (!contentType) continue;
    await bucket
      .file(MEDIA_PREFIX + name)
      .save(fs.readFileSync(path.join(dir, name)), {
        metadata: { contentType, cacheControl: CACHE_CONTROL },
      });
    console.log(`  uploaded ${name} (tokenless)`);
  }
}

// Convert any stored src/audioUrl value to a canonical relative key.
function toKey(value) {
  if (typeof value !== "string" || !value) return null;
  if (value.startsWith(MEDIA_PREFIX)) return value; // already a key
  const m = value.match(/\/o\/([^?]+)/); // Firebase download URL -> object path
  if (m) return decodeURIComponent(m[1]);
  const base = value.split("/").pop(); // /effects/x or bare filename
  return base ? MEDIA_PREFIX + base : null;
}

function rewriteLayers(layers) {
  let changed = 0;
  for (const layer of layers || []) {
    const src = layer && layer.config && layer.config.src;
    const key = toKey(src);
    if (key && key !== src) {
      layer.config.src = key;
      changed++;
    }
  }
  return changed;
}

async function rewritePresentations() {
  const snap = await db.collection("presentations").get();
  if (snap.empty) {
    console.log("  no presentations found.");
    return;
  }
  for (const doc of snap.docs) {
    const data = doc.data();
    let changed = 0;
    for (const s of data.sections || []) {
      changed += rewriteLayers(s.stageLayers);
      for (const sl of s.slides || []) changed += rewriteLayers(sl.layers);
    }
    for (const sl of data.slides || []) changed += rewriteLayers(sl.layers);
    if (data.settings && typeof data.settings.audioUrl === "string") {
      const k = toKey(data.settings.audioUrl);
      if (k && k !== data.settings.audioUrl) {
        data.settings.audioUrl = k;
        changed++;
      }
    }
    if (changed > 0) {
      const update = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
      if (data.sections) update.sections = data.sections;
      if (data.slides) update.slides = data.slides;
      if (data.settings) update.settings = data.settings;
      await doc.ref.update(update);
      console.log(`  ${doc.id}: rewrote ${changed} src/audioUrl to relative keys`);
    } else {
      console.log(`  ${doc.id}: already key-based`);
    }
  }
}

(async () => {
  console.log("Re-uploading bundled images (tokenless)...");
  await uploadEffects();
  console.log("Rewriting presentations to relative keys...");
  await rewritePresentations();
  console.log("Done.");
  process.exit(0);
})().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
