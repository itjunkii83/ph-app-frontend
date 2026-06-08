import { cn } from "@/lib/utils";

interface StepShellProps {
  kicker: string;
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

// Shared layout for a focused step: kicker, title in Fraunces, prompt, then
// the interaction. One step, nothing else.
export function StepShell({
  kicker,
  title,
  subtitle,
  className,
  children,
}: StepShellProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <p className="text-[11px] uppercase tracking-[0.18em] text-pewter">
        {kicker}
      </p>
      <h2 className="mt-3 font-display text-3xl leading-tight text-paper">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      )}
      {children && <div className="mt-7">{children}</div>}
    </div>
  );
}
