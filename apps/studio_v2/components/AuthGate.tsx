'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

// Gate the studio on Google sign-in. Team access, not end-user accounts. No email
// allowlist (solo owner, not deployed). To restrict to an owner on a public
// deploy, enable the commented OWNER_EMAIL check below (and the matching one in
// lib/apiAuth.ts).
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); }), []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch {
      /* user cancelled the popup */
    }
  };

  if (!ready) {
    return <div className="flex h-screen items-center justify-center text-[13px] text-muted">Checking sign-in...</div>;
  }

  // const OWNER_EMAIL = 'itjunkii@gmail.com'; // enable on public deploy
  const allowed = !!user; // && user.email === OWNER_EMAIL;

  if (!allowed) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6">
        <div className="text-center">
          <div className="font-display text-[30px] text-paper">Pause Harbor Studio</div>
          <p className="mt-2 text-[13px] text-muted">Sign in to edit the pantry.</p>
        </div>
        <button
          onClick={signIn}
          className="rounded-[9px] bg-grad px-5 py-2.5 text-[13px] font-semibold text-ink transition hover:brightness-105 cursor-pointer"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
