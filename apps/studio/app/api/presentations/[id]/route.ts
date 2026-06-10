import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection('presentations').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
    }
    const data = doc.data()!;
    return NextResponse.json({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    });
  } catch (error) {
    console.error('Error fetching presentation:', error);
    return NextResponse.json({ error: 'Failed to fetch presentation' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Build updates object
    const updates: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Handle sections format (preferred)
    if (body.sections !== undefined) {
      updates.sections = body.sections;
      // Clear legacy slides when using sections
      updates.slides = [];
    }
    // Handle legacy slides format (convert to sections)
    else if (body.slides !== undefined && body.slides.length > 0) {
      // If client sends slides without sections, wrap in a section
      updates.sections = [{
        id: `section-${Date.now()}`,
        name: 'Main',
        stageLayers: [],
        slides: body.slides,
      }];
      updates.slides = [];
    }

    // Copy other fields
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.settings !== undefined) updates.settings = body.settings;
    if (body.fonts !== undefined) updates.fonts = body.fonts;

    await adminDb.collection('presentations').doc(id).update(updates);
    return NextResponse.json({ id, ...updates });
  } catch (error) {
    console.error('Error updating presentation:', error);
    return NextResponse.json({ error: 'Failed to update presentation' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await adminDb.collection('presentations').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting presentation:', error);
    return NextResponse.json({ error: 'Failed to delete presentation' }, { status: 500 });
  }
}
