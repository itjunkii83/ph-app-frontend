import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('fonts').get();
    const fonts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json(fonts);
  } catch (error) {
    console.error('Error fetching fonts:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.family || !body.weights || !Array.isArray(body.weights)) {
      return NextResponse.json(
        { error: 'family and weights are required' },
        { status: 400 }
      );
    }

    const fontData = {
      family: body.family,
      source: body.source || 'google',
      weights: body.weights,
      styles: body.styles || ['normal'],
      category: body.category || '',
      displayName: body.displayName || body.family,
      isActive: true,
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('fonts').add(fontData);
    return NextResponse.json({ id: docRef.id, ...fontData }, { status: 201 });
  } catch (error) {
    console.error('Error adding font:', error);
    return NextResponse.json({ error: 'Failed to add font' }, { status: 500 });
  }
}
