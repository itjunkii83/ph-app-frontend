"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useOnboarding } from "@/lib/use-onboarding";

// A signed in user who has not finished onboarding is sent there once. Gated on
// hydration so a returning, completed user never flashes onto the flow. Once
// completed (or already on /onboarding), this does nothing.
export function FirstRunRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { value, hydrated } = useOnboarding();

  useEffect(() => {
    if (!hydrated) return;
    if (value.completed) return;
    if (pathname === "/onboarding") return;
    router.replace("/onboarding");
  }, [hydrated, value.completed, pathname, router]);

  return null;
}
