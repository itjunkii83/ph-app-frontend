import {
  COMMITMENT_POINTS,
  KEYSTONE_POINTS,
  MOMENT_AS_STEP_ZERO,
  REP_POINTS,
} from "@/lib/constants";
import type { DashboardConfig, Module, ModuleOf } from "@/lib/types";

// Lanes decide where a module surfaces. Practice reps run inside the focused
// session, and the motivation moment opens it as step zero. Commitments live
// on Harbor and are checked off through the day.

export function getSessionSteps(config: DashboardConfig): Module[] {
  const practice = config.modules.filter((m) => m.lane === "practice");
  if (!MOMENT_AS_STEP_ZERO) return practice;
  const moment = config.modules.filter((m) => m.type === "motivation");
  return [...moment, ...practice];
}

export function getReps(steps: Module[]): Module[] {
  return steps.filter((m) => m.type !== "motivation");
}

export function getCommitments(
  config: DashboardConfig,
): ModuleOf<"commitment">[] {
  return config.modules.filter(
    (m): m is ModuleOf<"commitment"> => m.type === "commitment",
  );
}

export function getKeystone(
  config: DashboardConfig,
): ModuleOf<"commitment"> | undefined {
  return getCommitments(config).find((c) => c.config.keystone);
}

export function stepPoints(module: Module): number {
  if (module.type === "motivation") return 0;
  return REP_POINTS;
}

export function commitmentPoints(module: ModuleOf<"commitment">): number {
  return module.config.keystone ? KEYSTONE_POINTS : COMMITMENT_POINTS;
}

export function getMotivation(
  config: DashboardConfig,
): ModuleOf<"motivation"> | undefined {
  return config.modules.find(
    (m): m is ModuleOf<"motivation"> => m.type === "motivation",
  );
}

export function getStructured(
  config: DashboardConfig,
): ModuleOf<"structured"> | undefined {
  return config.modules.find(
    (m): m is ModuleOf<"structured"> => m.type === "structured",
  );
}
