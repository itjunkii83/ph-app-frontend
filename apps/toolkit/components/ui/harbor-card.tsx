import { cn } from "@/lib/utils";

interface HarborCardProps {
  title?: string;
  sourceTag?: string;
  accentBar?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function HarborCard({
  title,
  sourceTag,
  accentBar = false,
  className,
  children,
}: HarborCardProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-line bg-panel",
        className,
      )}
    >
      {accentBar && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: "var(--accent-gradient)" }}
        />
      )}
      <div className="p-5 sm:p-6">
        {(title || sourceTag) && (
          <header className="mb-4 flex items-baseline justify-between gap-3">
            {title && (
              <h2 className="font-display text-lg text-paper">{title}</h2>
            )}
            {sourceTag && (
              <span className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-pewter">
                {sourceTag}
              </span>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
