import raw from "@/data/dashboard-config.json";
import type { DashboardConfig } from "@/lib/types";

// The JSON import widens literal fields (module type, mood) to plain strings,
// so a cast is the pragmatic way to recover the discriminated union.
export const config = raw as unknown as DashboardConfig;

// What the UI receives. profile.freeText is context for the assembly model
// only; blanking it here keeps it out of the serialized client payload, not
// just out of the rendered markup.
export const uiConfig: DashboardConfig = {
  ...config,
  profile: { ...config.profile, freeText: "" },
};
