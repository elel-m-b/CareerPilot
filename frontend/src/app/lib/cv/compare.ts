import type { AnalysisRecommendation, ResumeAnalysis } from "../../core/api/api.types";
import type { IssueSeverity } from "../types";
import { ATS_DIMENSIONS, severityFromPriority } from "./report";

/**
 * Scan comparison.
 *
 * The API stores every analysis of a CV, so the report can already show how a
 * single scan differs from the one before it. This module answers the wider
 * question — "did my edit actually help?" — for any two scans of the same CV:
 * overall movement, per-dimension movement, and which findings appeared or
 * were resolved. Everything is derived from the two stored analyses; nothing is
 * inferred from text the backend did not return.
 */

export type DimensionComparison = {
  key: string;
  label: string;
  weight: number;
  before: number;
  after: number;
  /** Positive means the newer scan scored higher. */
  delta: number;
};

export type FindingChange = {
  /** Stable identity across scans: category + message, not the scan-local id. */
  key: string;
  title: string;
  message: string;
  severity: IssueSeverity;
  category: string;
};

export type ScanComparison = {
  /** The older scan, the baseline of the comparison. */
  before: ResumeAnalysis;
  /** The newer scan. */
  after: ResumeAnalysis;
  overallDelta: number;
  dimensions: DimensionComparison[];
  improved: DimensionComparison[];
  regressed: DimensionComparison[];
  unchanged: DimensionComparison[];
  /** Findings present in `after` that `before` did not raise. */
  appeared: FindingChange[];
  /** Findings raised by `before` that `after` no longer raises. */
  resolved: FindingChange[];
  /** Findings raised by both scans. */
  stillOpen: FindingChange[];
};

/** Scan-local ids differ between analyses, so findings are matched by content. */
function findingKey(recommendation: AnalysisRecommendation): string {
  return `${recommendation.category.trim().toLowerCase()}::${recommendation.message
    .trim()
    .toLowerCase()}`;
}

function toFinding(recommendation: AnalysisRecommendation): FindingChange {
  return {
    key: findingKey(recommendation),
    title: recommendation.category,
    message: recommendation.message,
    severity: severityFromPriority(recommendation.priority),
    category: recommendation.category,
  };
}

/**
 * Compare two scans of the same CV.
 *
 * The order of the arguments is positional: `before` is the baseline and
 * `after` is the newer scan. The caller is responsible for passing two scans of
 * the same CV; the compare screen only offers that choice.
 */
export function compareAnalyses(
  before: ResumeAnalysis,
  after: ResumeAnalysis,
): ScanComparison {
  const dimensions: DimensionComparison[] = ATS_DIMENSIONS.map((dimension) => {
    const beforeScore = dimension.score(before);
    const afterScore = dimension.score(after);
    return {
      key: dimension.key,
      label: dimension.label,
      weight: dimension.weight,
      before: beforeScore,
      after: afterScore,
      delta: afterScore - beforeScore,
    };
  });

  const beforeFindings = new Map(
    before.recommendations.map((recommendation) => [
      findingKey(recommendation),
      toFinding(recommendation),
    ]),
  );
  const afterFindings = new Map(
    after.recommendations.map((recommendation) => [
      findingKey(recommendation),
      toFinding(recommendation),
    ]),
  );

  const appeared = [...afterFindings.entries()]
    .filter(([key]) => !beforeFindings.has(key))
    .map(([, finding]) => finding);
  const resolved = [...beforeFindings.entries()]
    .filter(([key]) => !afterFindings.has(key))
    .map(([, finding]) => finding);
  const stillOpen = [...afterFindings.entries()]
    .filter(([key]) => beforeFindings.has(key))
    .map(([, finding]) => finding);

  return {
    before,
    after,
    overallDelta: after.overallScore - before.overallScore,
    dimensions,
    improved: dimensions.filter((dimension) => dimension.delta > 0),
    regressed: dimensions.filter((dimension) => dimension.delta < 0),
    unchanged: dimensions.filter((dimension) => dimension.delta === 0),
    appeared,
    resolved,
    stillOpen,
  };
}

/**
 * Pick the default pair for the compare screen: the newest scan as `after` and
 * the scan before it as `before`. Returns `null` until two scans exist.
 */
export function defaultComparisonPair(
  analysesNewestFirst: ResumeAnalysis[],
): { before: ResumeAnalysis; after: ResumeAnalysis } | null {
  if (analysesNewestFirst.length < 2) return null;
  return { after: analysesNewestFirst[0], before: analysesNewestFirst[1] };
}

/** One-line summary of the movement, used in the page header. */
export function describeOverallDelta(delta: number): string {
  if (delta > 0) return `Up ${delta} point${delta === 1 ? "" : "s"}`;
  if (delta < 0) return `Down ${Math.abs(delta)} point${Math.abs(delta) === 1 ? "" : "s"}`;
  return "No change";
}
