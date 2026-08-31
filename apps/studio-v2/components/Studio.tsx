'use client';

import { useCallback, useEffect, useState } from 'react';
import { registerEffects, ManagedFontsProvider, type ManagedFont } from '@harbor/player';
import type { View } from '@/lib/types';
import { StudioProvider, useStudio } from '@/lib/store';
import { AuthGate } from './AuthGate';
import { Rail } from './Rail';
import { BackgroundsView } from './Backgrounds';
import { TextEffectsView } from './TextEffects';
import { PairingsView } from './Pairings';
import { TasteRulesView } from './TasteRules';
import { PreviewBench } from './Preview';
import { ZoltarView } from './zoltar/ZoltarView';

// The studio reads the player's effect registry; register before first render.
registerEffects();

// Managed fonts reach effects (deep in the tree) through context, not a prop. The
// editor previews load real families from the studio's /api/fonts result.
function StudioFonts({ children }: { children: React.ReactNode }) {
  const [fonts, setFonts] = useState<ManagedFont[]>([]);
  useEffect(() => {
    fetch('/api/fonts')
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => setFonts((Array.isArray(list) ? list : []) as ManagedFont[]))
      .catch(() => {});
  }, []);
  return <ManagedFontsProvider fonts={fonts}>{children}</ManagedFontsProvider>;
}

// Gates the editor on the async pantry load so it never flashes seed over real
// Firestore data.
function MainArea({ view }: { view: View }) {
  const { loading } = useStudio();
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-[13px] text-muted">Loading the pantry...</div>
    );
  }
  return <Surface view={view} />;
}

function Surface({ view }: { view: View }) {
  switch (view) {
    case 'effects':
      return <TextEffectsView />;
    case 'pairings':
    case 'designer':
      return <PairingsView />;
    case 'rules':
      return <TasteRulesView />;
    case 'preview':
      return <PreviewBench />;
    case 'zoltar':
      return <ZoltarView />;
    case 'backgrounds':
    default:
      return <BackgroundsView />;
  }
}

function StudioShell({ initialView }: { initialView: View }) {
  const [view, setView] = useState<View>(initialView);

  // Keep the URL in step with the active view (shallow, no remount) so a refresh
  // lands on the same view. backgrounds is the root path, others are /<view>.
  const navigate = useCallback((v: View) => {
    setView(v);
    try {
      window.history.replaceState(null, '', v === 'backgrounds' ? '/' : `/${v}`);
    } catch {
      // ignore: view still switches even if the URL cannot be updated
    }
  }, []);

  return (
    <StudioProvider>
      <StudioFonts>
        <div className="flex h-screen overflow-hidden">
          <Rail view={view} setView={navigate} />
          {view === 'zoltar' ? (
            // Zoltar needs the full width and owns its own scroll regions, so it
            // skips the centered 1180px cap the other views render inside.
            <main className="flex-1 min-h-0 flex">
              <MainArea view={view} />
            </main>
          ) : (
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-[1180px] px-10 py-9">
                <MainArea view={view} />
              </div>
            </main>
          )}
        </div>
      </StudioFonts>
    </StudioProvider>
  );
}

export function Studio({ initialView = 'backgrounds' }: { initialView?: View }) {
  // AuthGate is outside the provider so the pantry only loads once signed in
  // (the store's hydrate fetch then carries the user's token). initialView comes
  // from the route so a refresh on /zoltar (etc.) reopens that view.
  return (
    <AuthGate>
      <StudioShell initialView={initialView} />
    </AuthGate>
  );
}
