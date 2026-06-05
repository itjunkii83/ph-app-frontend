"use client";

import { Input } from "@/components/ui/input";
import { HarborCard } from "@/components/ui/harbor-card";
import type { ModuleOf } from "@/lib/types";
import { useModuleState } from "@/lib/use-module-state";

export function StructuredModule({
  module,
}: {
  module: ModuleOf<"structured">;
}) {
  const { intro, fields } = module.config;
  const { value, setValue } = useModuleState<Record<string, string>>(
    module.id,
    Object.fromEntries(fields.map((f) => [f.key, ""])),
  );

  return (
    <HarborCard title={module.title} sourceTag={module.sourceTag}>
      <p className="text-sm text-muted-foreground">{intro}</p>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-3 leading-relaxed">
        {fields.map((field) => {
          const text = value[field.key] ?? "";
          const widthCh =
            Math.max(text.length, field.placeholder.length) + 2;
          return (
            <span key={field.key} className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground">
                {field.label}
              </span>
              <Input
                value={text}
                placeholder={field.placeholder}
                onChange={(e) =>
                  setValue((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                className="h-7 w-auto min-w-0 max-w-full rounded-none border-0 border-b border-input bg-transparent px-1 text-paper focus-visible:border-silver focus-visible:ring-0 dark:bg-transparent"
                style={{ width: `${widthCh}ch` }}
              />
            </span>
          );
        })}
        <span className="text-sm text-muted-foreground">.</span>
      </div>
    </HarborCard>
  );
}
