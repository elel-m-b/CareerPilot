import type { DashboardStats, Resume, ResumeAnalysis } from "@/api/types";
import { countSeverities, issuesFromAnalysis } from "@/lib/cv/report";
import type { IssueSeverity } from "@/lib/types";

/**
 * Dashboard data shaping.
 *
 * The backend returns the analysis history newest-first, but the dashboard
 * must never present a scan as "latest" because of the order an array happened
 * to arrive in. Everything here derives from the API payloads only — no
 * placeholder values — and keeps the distinction the API makes between "no
 * scans yet" and "a scan that scored 0".
 */

export type DashboardSummary = {
  /** Every scan, newest first. */
  analyses: ResumeAnalysis[];
  /** The most recent scan across all CVs, or `null` before the first scan. */
  latest: ResumeAnalysis | null;
  /** The previous scan of the same CV, used for the dimension deltas. */
  previous: ResumeAnalysis | null;
  /** The CV the latest scan belongs to, falling back to the newest upload. */
  currentResume: Resume | null;
  /** All scans of `latest`'s CV, newest first. */
  currentAnalyses: ResumeAnalysis[];
  totalResumes: number;
  totalAnalyses: number;
  /** `null` when nothing has been scanned yet — not `0`. */
  averageScore: number | null;
  /** `null` when nothing has been scanned yet — not `0`. */
  bestScore: number | null;
  severityCounts: Record<IssueSeverity, number>;
};

function analysedAt(analysis: ResumeAnalysis): number {
  const timestamp = Date.parse(analysis.analyzedAt);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

/** Newest scan first, with the id as the tie-breaker the backend also uses. */
export function sortAnalysesNewestFirst(analyses: ResumeAnalysis[]): ResumeAnalysis[] {
  return [...analyses].sort(
    (first, second) => analysedAt(second) - analysedAt(first) || second.id - first.id,
  );
}

export function summariseDashboard({
  stats,
  resumes,
  analyses,
}: {
  stats?: DashboardStats;
  resumes?: Resume[];
  analyses?: ResumeAnalysis[];
}): DashboardSummary {
  const resumeRows = resumes ?? [];
  const ordered = sortAnalysesNewestFirst(analyses ?? []);
  const latest = ordered[0] ?? null;

  const currentAnalyses = latest
    ? ordered.filter((analysis) => analysis.resumeId === latest.resumeId)
    : [];
  const previous = currentAnalyses[1] ?? null;

  const currentResume =
    resumeRows.find((resume) => resume.id === latest?.resumeId) ?? resumeRows[0] ?? null;

  const totalAnalyses = stats?.totalAnalyses ?? ordered.length;
  const totalResumes = stats?.totalResumes ?? resumeRows.length;
  const hasScans = totalAnalyses > 0 || ordered.length > 0;

  const computedAverage = ordered.length
    ? ordered.reduce((total, analysis) => total + analysis.overallScore, 0) / ordered.length
    : null;
  const computedBest = ordered.length
    ? Math.max(...ordered.map((analysis) => analysis.overallScore))
    : null;

  return {
    analyses: ordered,
    latest,
    previous,
    currentResume,
    currentAnalyses,
    totalResumes,
    totalAnalyses,
    averageScore: hasScans ? (stats?.averageScore ?? computedAverage) : null,
    bestScore: hasScans ? (stats?.bestScore ?? computedBest) : null,
    severityCounts: countSeverities(latest ? issuesFromAnalysis(latest) : []),
  };
}
