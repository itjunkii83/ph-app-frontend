"use client";

import { useState } from "react";
import { HarborCard } from "@/components/ui/harbor-card";
import { useAuth } from "@/components/auth/auth-provider";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.82-.07-1.6-.21-2.36H12v4.46h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.73z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.27a12 12 0 0 0 0 10.74l4-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.17 15.23 0 12 0A12 12 0 0 0 1.27 6.63l4 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

export function SignIn() {
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError("That did not go through. Please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <HarborCard
        accentBar
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center text-center">
          <p className="text-[11px] uppercase tracking-[0.26em] text-silver">
            Pause Harbor
          </p>
          <h1 className="mt-4 font-display text-3xl leading-tight text-paper">
            Still water.
            <br />
            Then you set out.
          </h1>
          <p className="mt-4 max-w-[28ch] text-sm text-muted-foreground">
            Sign in to keep your mornings, your streak, and your harbor in one
            place.
          </p>

          <button
            type="button"
            onClick={handleSignIn}
            disabled={busy}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-line-2 bg-paper px-4 py-3.5 font-body text-sm font-semibold text-ink transition hover:brightness-[1.03] disabled:opacity-50"
          >
            <GoogleMark />
            {busy ? "Opening Google..." : "Continue with Google"}
          </button>

          {error && (
            <p className="mt-4 text-xs text-muted-2" role="alert">
              {error}
            </p>
          )}

          <p className="mt-6 text-[12px] text-muted-2">
            No password to remember. Just your Google account.
          </p>
        </div>
      </HarborCard>
    </main>
  );
}
