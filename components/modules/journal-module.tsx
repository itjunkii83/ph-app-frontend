"use client";

import { Textarea } from "@/components/ui/textarea";
import { HarborCard } from "@/components/ui/harbor-card";
import type { ModuleOf } from "@/lib/types";
import { useModuleState } from "@/lib/use-module-state";

export function JournalModule({ module }: { module: ModuleOf<"journal"> }) {
  const { prompt, prefix, placeholder, rows } = module.config;
  const { value, setValue } = useModuleState<{ text: string }>(module.id, {
    text: "",
  });

  return (
    <HarborCard title={module.title} sourceTag={module.sourceTag}>
      <p className="text-sm text-muted-foreground">{prompt}</p>
      <p className="mt-4 font-display text-lg text-silver">{prefix}</p>
      <Textarea
        value={value.text}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => setValue({ text: e.target.value })}
        className="mt-2"
      />
    </HarborCard>
  );
}
