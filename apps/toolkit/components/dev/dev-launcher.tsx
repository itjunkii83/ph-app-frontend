"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { DEFAULT_ANSWERS } from "@/components/onboarding/constants";
import { useStore } from "@/lib/data/store-provider";
import { useOnboarding } from "@/lib/use-onboarding";

// Dev-only entry points for iterating on the flow. Mounted only in development
// (see app/layout.tsx), so it never ships to production. Unobtrusive: a small
// pill bottom-right that opens a short menu.
export function DevLauncher() {
  const router = useRouter();
  const { signOutUser } = useAuth();
  const store = useStore();
  const { setValue: setAnswers } = useOnboarding();
  const [open, setOpen] = useState(false);

  const itemClass =
    "w-full whitespace-nowrap rounded-lg px-3 py-1.5 text-left text-pewter transition hover:bg-ink-2 hover:text-paper";

  function startFresh() {
    setAnswers(DEFAULT_ANSWERS);
    router.push("/onboarding");
    setOpen(false);
  }

  function editOnboarding() {
    router.push("/onboarding");
    setOpen(false);
  }

  async function resetData() {
    await store.reset();
    setOpen(false);
    // Full reload so every hook re-initializes from the now-empty store.
    window.location.assign("/");
  }

  return (
    <div className="fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-2 font-body">
      {open && (
        <div className="flex flex-col gap-1 rounded-xl border border-line bg-panel p-2 text-sm shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <button type="button" className={itemClass} onClick={startFresh}>
            Onboarding (fresh)
          </button>
          <button type="button" className={itemClass} onClick={editOnboarding}>
            Edit onboarding
          </button>
          <button
            type="button"
            className={itemClass}
            onClick={() => void signOutUser()}
          >
            Sign out
          </button>
          <button type="button" className={itemClass} onClick={resetData}>
            Reset my data
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-line bg-panel px-3 py-1.5 text-[11px] tracking-[0.18em] text-pewter uppercase transition hover:text-paper"
      >
        Dev
      </button>
    </div>
  );
}
