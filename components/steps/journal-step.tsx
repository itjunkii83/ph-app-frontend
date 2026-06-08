"use client";

import { Textarea } from "@/components/ui/textarea";
import { StepShell } from "@/components/steps/step-shell";
import type { ModuleOf } from "@/lib/types";
import { useModuleState } from "@/lib/use-module-state";

export function JournalStep({ module }: { module: ModuleOf<"journal"> }) {
  const { prompt, prefix, placeholder, rows } = module.config;
  const { value, setValue } = useModuleState<{ text: string }>(module.id, {
    text: "",
  });

  return (
    <StepShell
      kicker={module.sourceTag}
      title={module.title}
      subtitle={prompt}
    >
      <p className="font-display text-xl text-silver">{prefix}</p>
      <Textarea
        value={value.text}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => setValue({ text: e.target.value })}
        className="mt-3 rounded-2xl border-line bg-panel p-4 text-base dark:bg-panel"
      />
    </StepShell>
  );
}
