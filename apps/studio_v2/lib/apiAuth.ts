import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from './firebase/admin';

// Verify the caller is signed in (a valid Firebase ID token in the Authorization
// header). Used to gate the studio's write routes so unauthenticated calls are
// blocked. No email allowlist (solo owner, not deployed). To restrict to an owner
// on a public deploy, enable the commented email check below.
export async function requireUser(request: NextRequest): Promise<{ uid: string } | null> {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    // Enable on public deploy to restrict writes to the owner:
    // if (decoded.email !== 'itjunkii@gmail.com') return null;
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
