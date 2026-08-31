import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireUser, unauthorized } from '@/lib/apiAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection('fonts').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Font not found' }, { status: 404 });
    }
    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching font:', error);
    return NextResponse.json({ error: 'Failed to fetch font' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireUser(request))) return unauthorized();
    const { id } = await params;
    const body = await request.json();
    await adminDb.collection('fonts').doc(id).update(body);
    return NextResponse.json({ id, ...body });
  } catch (error) {
    console.error('Error updating font:', error);
    return NextResponse.json({ error: 'Failed to update font' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireUser(request))) return unauthorized();
    const { id } = await params;
    await adminDb.collection('fonts').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting font:', error);
    return NextResponse.json({ error: 'Failed to delete font' }, { status: 500 });
  }
}
