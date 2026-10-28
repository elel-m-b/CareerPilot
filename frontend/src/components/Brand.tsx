import { cn } from "@/lib/utils";

/** Monogram wordmark: a solid block plus the product name, no artwork needed. */
export function Brand({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="grid size-6 shrink-0 place-items-center rounded-[3px] bg-foreground text-[10px] font-semibold tracking-tight text-background"
      >
        CP
      </span>
      {!compact && (
        <span className="text-[15px] font-medium tracking-[-0.01em] text-foreground">
          CareerPilot
        </span>
      )}
    </span>
  );
}

export function BrandLink({ to = "/" }: { to?: string }) {
  return (
    <a href={to} className="inline-flex items-center" aria-label="CareerPilot home">
      <Brand />
    </a>
  );
}
