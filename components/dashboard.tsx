import type { DashboardConfig } from "@/lib/types";
import { ModuleRenderer } from "@/components/module-renderer";

export function Dashboard({ config }: { config: DashboardConfig }) {
  const { workspace, profile, modules } = config;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pb-20 pt-10 sm:px-0">
      <header className="px-1 pb-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-silver">
          {workspace.name}
        </p>
        <h1 className="text-accent-gradient mt-2 font-display text-4xl">
          {workspace.greeting}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{profile.goalText}</p>
      </header>
      {modules.map((module) => (
        <ModuleRenderer key={module.id} module={module} />
      ))}
    </main>
  );
}
