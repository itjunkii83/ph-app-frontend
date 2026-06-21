import type { Film, Pantry, Taste } from './types';
import { filmToPresentation, type Timing } from './toPresentation';
import { authedFetch } from './firebase/authedFetch';

// Persistence for the shared studio curation (the pantry doc) and the debug
// publish action. Both go through the admin API routes, keeping writes
// service-account-only.

export async function loadStudio(): Promise<{ pantry?: Pantry; taste?: Taste } | null> {
  try {
    const res = await fetch('/api/studio');
    if (!res.ok) return null;
    const data = await res.json();
    if (!data) return null;
    const pantry: Pantry = {
      backgrounds: data.backgrounds ?? [],
      textEffects: data.textEffects ?? [],
      pairings: data.pairings ?? [],
      rules: data.rules ?? [],
    };
    return { pantry, taste: data.taste ?? undefined };
  } catch {
    return null;
  }
}

export async function saveStudio(pantry: Pantry, taste: Taste): Promise<void> {
  try {
    await authedFetch('/api/studio', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pantry, taste }),
    });
  } catch {
    /* optimistic: ignore transient write errors */
  }
}

// Publish a debug sample to the presentations collection so /play can show it.
// The title is prefixed and a sample flag is set so fixtures never blur with real
// content. This is a debug fixture, not the product's film assembly.
export async function publishSample(film: Film, pantry: Pantry, timing: Timing = 'realistic'): Promise<{ id: string } | null> {
  const pres = filmToPresentation(film, pantry, { title: `sample: ${film.ctx.goal}`, timing });
  try {
    const res = await authedFetch('/api/presentations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: pres.title,
        description: 'Debug sample published from the studio preview bench.',
        sections: pres.sections,
        settings: pres.settings,
        fonts: pres.fonts,
        sample: true,
      }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
