"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { HarborCard } from "@/components/ui/harbor-card";
import type { ModuleOf } from "@/lib/types";
import { useModuleState } from "@/lib/use-module-state";
import { cn } from "@/lib/utils";

interface ListItem {
  text: string;
  checked: boolean;
}

const emptyItem: ListItem = { text: "", checked: false };

export function ListModule({ module }: { module: ModuleOf<"list"> }) {
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
    <HarborCard title={module.title} sourceTag={module.sourceTag}>
      <p className="text-sm text-muted-foreground">{prompt}</p>
      <div className="mt-4 flex flex-col gap-2.5">
        {Array.from({ length: itemCount }, (_, i) => {
          const item = value.items[i] ?? emptyItem;
          return (
            <div key={i} className="flex items-center gap-3">
              <Checkbox
                checked={item.checked}
                onCheckedChange={(checked) =>
                  updateItem(i, { checked: checked === true })
                }
              />
              <Input
                value={item.text}
                placeholder={placeholder}
                onChange={(e) => updateItem(i, { text: e.target.value })}
                className={cn(
                  item.checked && "text-muted-foreground line-through",
                )}
              />
            </div>
          );
        })}
      </div>
    </HarborCard>
  );
}
