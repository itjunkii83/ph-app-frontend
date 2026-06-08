import { doc, getDoc } from "firebase/firestore";
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
