import { CountUp, EASE, VIEWPORT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { TONE_TEXT, scoreTone } from "@/lib/format";
import { motion } from "framer-motion";

/** Minimal ring gauge: one stroke, tabular numerals, no gradients. */
export function ScoreDial({
  score,
  grade,
  band,
  caption,
  size = 132,
  className,
}: {
  score: number;
  grade?: string;
  band?: string;
  caption?: string;
  size?: number;
  className?: string;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clampedScore / 100);
  const tone = scoreTone(clampedScore);

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 128 128" className={cn("size-full -rotate-90", TONE_TEXT[tone])} aria-hidden>
          <circle cx="64" cy="64" r={radius} fill="none" strokeWidth="5" className="stroke-border" />
          <motion.circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            stroke="currentColor"
            strokeDasharray={circumference}
            // Draws in from empty on first view, then animates to any new score.
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={VIEWPORT}
            transition={{ duration: 1.1, ease: EASE }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-3xl font-medium tabular-nums tracking-tight text-foreground">
            <CountUp to={clampedScore} duration={1.1} />
            <span className="text-base text-muted-foreground">%</span>
          </span>
        </div>
      </div>
      {(grade || band || caption) && (
        <div className="min-w-0">
          {grade && (
            <p className="flex items-baseline gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Grade
              <span className="text-lg font-medium tracking-normal text-foreground">{grade}</span>
            </p>
          )}
          {band && <p className="mt-1 text-sm font-medium text-foreground">{band}</p>}
          {caption && (
            <p className="mt-1 max-w-[22ch] text-xs leading-relaxed text-muted-foreground">
              {caption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
