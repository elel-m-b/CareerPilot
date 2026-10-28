import { CountUp, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Card-like surface: hairline border, small-caps header, generous padding.
 *
 * Rendered as a motion element with `fadeUp` variants, so a page can drop panels
 * into a `staggerContainer` and have them arrive in sequence. Outside a stagger
 * parent the variants are inert and the panel renders as a plain surface, with
 * only the hover border transition applied.
 */
export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
  id,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Anchor for in-page navigation, e.g. scrolling the user to a field. */
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      variants={fadeUp}
      className={cn(
        "rounded-md border border-border bg-card transition-colors duration-300 hover:border-foreground/20",
        className,
      )}
    >
      <header className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-border/80 px-6 py-3">
        <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{title}</h2>
        {action}
      </header>
      <div className={cn("px-6 py-5", bodyClassName)}>{children}</div>
    </motion.section>
  );
}

/**
 * Compact metric tile used in dashboard stat rows. Numeric values count up, so
 * the dashboard reads as live data rather than a static screenshot.
 */
export function StatTile({
  label,
  value,
  unit,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col gap-2 rounded-md border border-border bg-card px-6 py-5 transition-colors duration-300 hover:border-foreground/25"
    >
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className={cn("text-3xl font-medium tabular-nums tracking-[-0.02em] text-foreground", tone)}>
        {typeof value === "number" ? <CountUp to={value} /> : value}
        {unit && <span className="text-base text-muted-foreground">{unit}</span>}
      </p>
      {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </motion.div>
  );
}
