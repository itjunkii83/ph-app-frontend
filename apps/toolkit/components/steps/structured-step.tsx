"use client";

import { Input } from "@/components/ui/input";
import { StepShell } from "@/components/steps/step-shell";
import type { ModuleOf } from "@/lib/types";
import { useModuleState } from "@/lib/use-module-state";

export function StructuredStep({
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
    <StepShell
      kicker={module.sourceTag}
      title={module.title}
      subtitle={intro}
    >
      <div className="rounded-2xl border border-line bg-panel p-5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-4 text-lg leading-relaxed">
          {fields.map((field) => {
            const text = value[field.key] ?? "";
            const widthCh = Math.max(text.length, field.placeholder.length) + 2;
            return (
              <span key={field.key} className="flex items-baseline gap-2">
                <span className="text-base text-muted-foreground">
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
                  className="h-8 w-auto min-w-0 max-w-full rounded-none border-0 border-b border-input bg-transparent px-1 text-lg text-paper focus-visible:border-silver focus-visible:ring-0 md:text-lg dark:bg-transparent"
                  style={{ width: `${widthCh}ch` }}
                />
              </span>
            );
          })}
          <span className="text-base text-muted-foreground">.</span>
        </div>
      </div>
    </StepShell>
  );
}
