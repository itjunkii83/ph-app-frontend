"use client";

import { Input } from "@/components/ui/input";
import { StepShell } from "@/components/steps/step-shell";
import type { ModuleOf } from "@/lib/types";
import { useModuleState } from "@/lib/use-module-state";

interface ListItem {
  text: string;
}

const emptyItem: ListItem = { text: "" };

export function ListStep({ module }: { module: ModuleOf<"list"> }) {
  const { prompt, itemCount, placeholder } = module.config;
  const { value, setValue } = useModuleState<{ items: ListItem[] }>(module.id, {
    items: Array.from({ length: itemCount }, () => emptyItem),
  });

  function updateItem(index: number, patch: Partial<ListItem>) {
    setValue((prev) => {
      const items = Array.from(
        { length: itemCount },
        (_, i) => prev.items[i] ?? emptyItem,
      );
      items[index] = { ...items[index], ...patch };
      return { items };
    });
  }

  return (
    <StepShell
      kicker={module.sourceTag}
      title={module.title}
      subtitle={prompt}
    >
      <div className="flex flex-col gap-3">
        {Array.from({ length: itemCount }, (_, i) => {
          const item = value.items[i] ?? emptyItem;
          return (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-3.5"
            >
              <Input
                value={item.text}
                placeholder={placeholder}
                onChange={(e) => updateItem(i, { text: e.target.value })}
                className="border-0 bg-transparent focus-visible:ring-0 dark:bg-transparent"
              />
            </div>
          );
        })}
      </div>
    </StepShell>
  );
}
