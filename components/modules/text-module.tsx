"use client";

import { Textarea } from "@/components/ui/textarea";
import { HarborCard } from "@/components/ui/harbor-card";
import type { ModuleOf } from "@/lib/types";
import { useModuleState } from "@/lib/use-module-state";

export function TextModule({ module }: { module: ModuleOf<"text"> }) {
  const { prompt, placeholder, rows } = module.config;
  const { value, setValue } = useModuleState<{ text: string }>(module.id, {
    text: "",
  });

  return (
    <HarborCard title={module.title} sourceTag={module.sourceTag}>
      <p className="text-sm text-muted-foreground">{prompt}</p>
      <Textarea
        value={value.text}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => setValue({ text: e.target.value })}
        className="mt-4"
      />
    </HarborCard>
  );
}
