import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireUser, unauthorized } from '@/lib/apiAuth';
import admin from 'firebase-admin';

export const runtime = 'nodejs';

// The shared studio curation (pantry + taste) lives in a single Firestore doc.
// It is studio-wide config, not per-user data. Reads and writes go through this
// admin route (service-account writes), keeping the "no client writes" invariant,
// so no Firestore rule for a `studio` collection is needed.
const DOC = () => adminDb.collection('studio').doc('pantry');

export async function GET() {
  try {
    const snap = await DOC().get();
    // null tells the store to fall back to seed (first run).
    if (!snap.exists) return NextResponse.json(null);
    return NextResponse.json(snap.data());
  } catch (error) {
    console.error('Error reading studio config:', error);
    return NextResponse.json({ error: 'Failed to read studio config' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await requireUser(request))) return unauthorized();
    const body = await request.json();
    const data = {
      backgrounds: body.backgrounds ?? [],
      textEffects: body.textEffects ?? [],
      pairings: body.pairings ?? [],
      rules: body.rules ?? [],
      taste: body.taste ?? null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    // The store always sends the whole pantry, so a full set is correct.
    await DOC().set(data, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error writing studio config:', error);
    return NextResponse.json({ error: 'Failed to write studio config' }, { status: 500 });
  }
}
