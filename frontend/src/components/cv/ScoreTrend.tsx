import { CountUp, EASE, VIEWPORT } from "@/lib/motion";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type Point = { id: string; score: number; createdAt: number };

/** Dependency-free trend line: last N scans of the current CV version. */
export function ScoreTrend({
  points,
  className,
  height = 96,
}: {
  points: Point[];
  className?: string;
  height?: number;
}) {
  if (points.length === 0) {
    return (
      <p className={cn("py-6 text-sm text-muted-foreground", className)}>
        No scans yet. Run a scan to start tracking your score.
      </p>
    );
  }

  if (points.length === 1) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <p className="text-3xl font-medium tabular-nums text-foreground">
          <CountUp to={points[0].score} duration={1.1} />%
        </p>
        <p className="text-xs text-muted-foreground">
          First scan recorded {formatDate(points[0].createdAt)}. Rescan after editing your CV to
          follow the progression.
        </p>
      </div>
    );
  }

  const width = 320;
  const padding = 6;
  const scores = points.map((point) => point.score);
  const min = Math.max(0, Math.min(...scores) - 6);
  const max = Math.min(100, Math.max(...scores) + 6);
  const span = Math.max(1, max - min);

  const coordinates = points.map((point, index) => {
    const x = padding + (index / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((point.score - min) / span) * (height - padding * 2);
    return { x, y, point };
  });

  const path = coordinates.map(({ x, y }) => `${x},${y}`).join(" ");
  const last = coordinates[coordinates.length - 1];
  const first = points[0].score;
  const current = points[points.length - 1].score;
  const delta = current - first;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-medium tabular-nums text-foreground">
          <CountUp to={current} duration={1.1} />%
        </span>
        <span className={cn("text-xs", delta >= 0 ? "text-success" : "text-critical")}>
          {delta >= 0 ? "+" : ""}
          {delta} since first scan
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-24 w-full text-foreground"
        preserveAspectRatio="none"
        role="img"
        aria-label={`ATS score history across ${points.length} scans`}
      >
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          className="stroke-border"
          strokeWidth="1"
        />
        <motion.polyline
          points={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: 1.1, ease: EASE }}
        />
        <motion.circle
          cx={last.x}
          cy={last.y}
          fill="currentColor"
          initial={{ r: 0, opacity: 0 }}
          whileInView={{ r: 3, opacity: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.4, delay: 0.85, ease: EASE }}
        />
      </svg>
      <p className="text-xs text-muted-foreground">
        {points.length} scans · last on {formatDate(points[points.length - 1].createdAt)}
      </p>
    </div>
  );
}
