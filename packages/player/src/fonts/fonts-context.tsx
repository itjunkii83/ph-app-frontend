"use client";

import * as React from "react";
import { ManagedFont } from "../types/fonts";

// Managed-font metadata reaches effects through context, NOT a player prop:
// useFonts is called inside individual effects (deep in the tree), so a prop on
// the player could never reach it. The toolkit wraps nothing (the per-family
// Google fallback covers it); the studio wraps its editor in ManagedFontsProvider
// with its /api/fonts result. With no provider, the context defaults to [] and
// families load straight from Google Fonts.
const ManagedFontsContext = React.createContext<ManagedFont[]>([]);

export function ManagedFontsProvider({
  fonts,
  children,
}: {
  fonts: ManagedFont[];
  children: React.ReactNode;
}) {
  return (
    <ManagedFontsContext.Provider value={fonts}>
      {children}
    </ManagedFontsContext.Provider>
  );
}

export function useManagedFonts(): ManagedFont[] {
  return React.useContext(ManagedFontsContext);
}
