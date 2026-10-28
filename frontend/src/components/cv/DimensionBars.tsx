import type { AtsDimension } from "@/lib/types";
import { EASE, VIEWPORT, fadeUp, staggerContainer } from "@/lib/motion";
import { TONE_BG, formatDelta, scoreTone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/** One row per ATS dimension: label, weight, bar and score. */
export function DimensionBars({
  dimensions,
  deltas,
  className,
}: {
  dimensions: AtsDimension[];
  deltas?: Record<string, number>;
  className?: string;
}) {
  return (
    <motion.ul
      variants={staggerContainer(0.05)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      className={cn("divide-y divide-border/70", className)}
    >
      {dimensions.map((dimension, index) => {
        const tone = scoreTone(dimension.score);
        const delta = deltas?.[dimension.key];
        return (
          <motion.li
            key={dimension.key}
            variants={fadeUp}
            className="rounded-[3px] py-3.5 transition-colors duration-300 first:pt-0 last:pb-0 hover:bg-secondary/50"
          >
            <div className="flex items-baseline justify-between gap-4">
              <p className="min-w-0 truncate text-sm font-medium text-foreground">
                {dimension.label}
              </p>
              <p className="shrink-0 text-sm tabular-nums text-foreground">
                {dimension.score}%
                {delta !== undefined && delta !== 0 && (
                  <span
                    className={cn(
                      "ml-2 text-xs",
                      delta > 0 ? "text-success" : "text-critical",
                    )}
                  >
                    {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}
                  </span>
                )}
              </p>
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className={cn("h-full rounded-full", TONE_BG[tone])}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${dimension.score}%` }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.7, delay: 0.15 + index * 0.05, ease: EASE }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                {dimension.weight}%
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{dimension.summary}</p>
            {delta !== undefined && delta !== 0 && (
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {formatDelta(delta)} since the previous scan
              </p>
            )}
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

export const DIMENSION_ORDER_KEYS = [
  "contact",
  "formatting",
  "structure",
  "keywords",
  "skills",
  "experience",
  "education",
  "projects",
  "readability",
  "impact",
] as const;
