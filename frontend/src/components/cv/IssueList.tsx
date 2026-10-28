import type { AtsIssue } from "@/lib/types";
import { CountUp, VIEWPORT, fadeUp, staggerContainer } from "@/lib/motion";
import { SEVERITY_CLASS, SEVERITY_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/** Every finding shows severity, explanation and a concrete recommendation. */
export function IssueList({
  issues,
  className,
  emptyLabel = "No findings in this category.",
}: {
  issues: AtsIssue[];
  className?: string;
  emptyLabel?: string;
}) {
  if (issues.length === 0) {
    return <p className={cn("py-6 text-sm text-muted-foreground", className)}>{emptyLabel}</p>;
  }

  return (
    <motion.ul
      variants={staggerContainer(0.04)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      className={cn("divide-y divide-border/70", className)}
    >
      {issues.map((issue) => (
        <motion.li key={issue.id} variants={fadeUp} className="py-5 first:pt-0 last:pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <span
              className={cn(
                "inline-flex w-fit shrink-0 items-center rounded-[3px] border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em]",
                SEVERITY_CLASS[issue.severity],
              )}
            >
              {SEVERITY_LABEL[issue.severity]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{issue.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {issue.explanation}
              </p>
              {issue.recommendation && (
                <div className="mt-3 border-l-2 border-foreground/25 pl-3">
                  <p className="text-sm leading-relaxed text-foreground">
                    <span className="font-medium">Do this: </span>
                    {issue.recommendation}
                  </p>
                </div>
              )}
              <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {issue.dimension.replace(/_/g, " ")}
              </p>
            </div>
          </div>
        </motion.li>
      ))}
    </motion.ul>
  );
}

export function SeveritySummary({
  counts,
}: {
  counts: { critical: number; warning: number; info: number };
}) {
  const items: { key: keyof typeof counts; label: string; className: string }[] = [
    { key: "critical", label: "Critical", className: "text-critical" },
    { key: "warning", label: "Warnings", className: "text-warning" },
    { key: "info", label: "Suggestions", className: "text-muted-foreground" },
  ];

  return (
    <motion.dl
      variants={staggerContainer(0.06)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      className="grid grid-cols-3 divide-x divide-border/70 border-y border-border/70"
    >
      {items.map((item) => (
        <motion.div key={item.key} variants={fadeUp} className="px-4 py-3">
          <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {item.label}
          </dt>
          <dd className={cn("mt-1 text-xl font-medium tabular-nums", item.className)}>
            <CountUp to={counts[item.key]} duration={0.8} />
          </dd>
        </motion.div>
      ))}
    </motion.dl>
  );
}
