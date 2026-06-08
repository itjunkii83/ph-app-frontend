import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Presentation } from "@harbor/player";

// Read-only access to the studio-authored `presentations` collection via the
// client SDK (both apps share the humanos-8eeb8 project). Writes stay
// studio/admin-only; see firestore.rules for the authenticated read rule.

export async function getPresentation(id: string): Promise<Presentation | null> {
  const snap = await getDoc(doc(db, "presentations", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Presentation;
}

function toMillis(ts: unknown): number {
  if (ts && typeof (ts as { toMillis?: () => number }).toMillis === "function") {
    return (ts as { toMillis: () => number }).toMillis();
  }
  return 0;
}

// Dev/prototype convenience: when no presentationId is pinned in the config, load
// the most recently updated presentation so the moment shows the latest studio
// work without a manual id paste. In production the config carries the id.
export async function getLatestPresentation(): Promise<Presentation | null> {
  const snap = await getDocs(collection(db, "presentations"));
  if (snap.empty) return null;
  const docs = snap.docs.map(
    (d) =>
      ({ id: d.id, ...d.data() }) as Presentation & {
        updatedAt?: unknown;
        createdAt?: unknown;
      },
  );
  docs.sort(
    (a, b) =>
      toMillis(b.updatedAt ?? b.createdAt) - toMillis(a.updatedAt ?? a.createdAt),
  );
  return docs[0];
}
