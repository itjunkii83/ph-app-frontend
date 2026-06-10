"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { SignIn } from "@/components/auth/sign-in";

// Gates the whole app: a brief splash while auth resolves, the Google sign in
// when there is no user, otherwise the app. Everything below this point can
// assume an authenticated user, so all persisted data pins to a uid.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-[11px] uppercase tracking-[0.26em] text-pewter">
          Pause Harbor
        </p>
      </main>
    );
  }

  if (!user) return <SignIn />;

  return <>{children}</>;
}
