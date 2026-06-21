import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireUser, unauthorized } from '@/lib/apiAuth';
import admin from 'firebase-admin';

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('presentations')
      .orderBy('updatedAt', 'desc')
      .get();

    const presentations = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Calculate slide count from sections or legacy slides
      let slideCount = 0;
      if (data.sections?.length) {
        slideCount = data.sections.reduce((sum: number, s: any) => sum + (s.slides?.length || 0), 0);
      } else {
        slideCount = data.slides?.length || 0;
      }
      return {
        id: doc.id,
        title: data.title,
        slideCount,
        sectionCount: data.sections?.length || 0,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json(presentations);
  } catch (error) {
    console.error('Error fetching presentations:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireUser(request))) return unauthorized();
    const body = await request.json();

    const title = body.title || 'Untitled';
    const now = admin.firestore.FieldValue.serverTimestamp();

    // Support both sections format and legacy slides format
    const defaultSection = {
      id: `section-${Date.now()}`,
      name: 'Main',
      stageLayers: [],
      slides: [
        {
          id: `slide-${Date.now()}`,
          layers: [],
          duration: 5000,
        },
      ],
    };

    const presentation = {
      title,
      description: body.description || '',
      // Prefer sections format, but support legacy slides
      sections: body.sections || (body.slides ? [{
        id: `section-${Date.now()}`,
        name: 'Main',
        stageLayers: [],
        slides: body.slides,
      }] : [defaultSection]),
      slides: [], // Keep empty for backward compat, sections is authoritative
      settings: body.settings || {
        defaultTransition: { type: 'fade', duration: 500, easing: 'ease' },
        autoPlay: false,
        loop: false,
        baseWidth: 1920,
        baseHeight: 1080,
      },
      fonts: body.fonts || [],
      // Debug fixtures published from the studio preview bench are flagged so they
      // never blur with real content in the collection.
      sample: body.sample === true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection('presentations').add(presentation);
    return NextResponse.json({ id: docRef.id, ...presentation }, { status: 201 });
  } catch (error) {
    console.error('Error creating presentation:', error);
    return NextResponse.json({ error: 'Failed to create presentation' }, { status: 500 });
  }
}
