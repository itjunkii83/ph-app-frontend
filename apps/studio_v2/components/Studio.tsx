'use client';

import { useState } from 'react';
import type { View } from '@/lib/types';
import { StudioProvider } from '@/lib/store';
import { Rail } from './Rail';
import { BackgroundsView } from './Backgrounds';
import { TextEffectsView } from './TextEffects';
import { PairingsView } from './Pairings';
import { TasteRulesView } from './TasteRules';
import { PreviewBench } from './Preview';

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
    case 'backgrounds':
    default:
      return <BackgroundsView />;
  }
}

export function Studio() {
  const [view, setView] = useState<View>('backgrounds');
  return (
    <StudioProvider>
      <div className="flex h-screen overflow-hidden">
        <Rail view={view} setView={setView} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1180px] px-10 py-9">
            <Surface view={view} />
          </div>
        </main>
      </div>
    </StudioProvider>
  );
}
