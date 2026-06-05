import raw from "@/data/dashboard-config.json";
import type { DashboardConfig } from "@/lib/types";

// The JSON import widens literal fields (module type, mood) to plain strings,
// so a cast is the pragmatic way to recover the discriminated union.
export const config = raw as unknown as DashboardConfig;
