import { ApiError } from "@/api/client";
import type { ResumeAnalysis } from "@/api/types";
import type { AtsDimension, AtsIssue, IssueSeverity } from "@/lib/types";

/**
 * Presentation helpers that translate the backend's seven-dimension analysis
 * into the report components without inventing any data.
 *
 * Weights are the ones the backend applies in `DeterministicAnalyzer`; they are
 * repeated here only as labels so the report can explain the overall score.
 */

const DIMENSIONS: {
  key: string;
  label: string;
  weight: number;
  sectionType: string;
  score: (analysis: ResumeAnalysis) => number;
}[] = [
  {
    key: "ats",
    label: "ATS compatibility",
    weight: 20,
    sectionType: "ATS_COMPATIBILITY",
    score: (analysis) => analysis.atsScore,
  },
  {
    key: "content",
    label: "Content quality",
    weight: 20,
    sectionType: "CONTENT_QUALITY",
    score: (analysis) => analysis.contentScore,
  },
  {
    key: "skills",
    label: "Skills coverage",
    weight: 15,
    sectionType: "SKILLS",
    score: (analysis) => analysis.skillsScore,
  },
  {
    key: "experience",
    label: "Experience",
    weight: 20,
    sectionType: "EXPERIENCE",
    score: (analysis) => analysis.experienceScore,
  },
  {
    key: "education",
    label: "Education",
    weight: 10,
    sectionType: "EDUCATION",
    score: (analysis) => analysis.educationScore,
  },
  {
    key: "projects",
    label: "Projects",
    weight: 10,
    sectionType: "PROJECTS",
    score: (analysis) => analysis.projectsScore,
  },
  {
    key: "structure",
    label: "Structure",
    weight: 5,
    sectionType: "STRUCTURE",
    score: (analysis) => analysis.structureScore,
  },
];

/** Dimensions in display order, with the backend's feedback as the summary. */
export function dimensionsFromAnalysis(analysis: ResumeAnalysis): AtsDimension[] {
  return DIMENSIONS.map((dimension) => {
    const section = analysis.sections.find((item) => item.sectionType === dimension.sectionType);
    return {
      key: dimension.key,
      label: dimension.label,
      weight: dimension.weight,
      score: dimension.score(analysis),
      summary: section?.feedback ?? "No feedback was recorded for this dimension.",
    };
  });
}

/** Backend priorities map onto the report's three severities. */
export function severityFromPriority(priority: string): IssueSeverity {
  switch (priority.toLowerCase()) {
    case "critical":
      return "critical";
    case "important":
      return "warning";
    default:
      return "info";
  }
}

/**
 * Each stored recommendation becomes one finding.
 *
 * The backend keeps a single actionable message per recommendation, so it is
 * shown as the explanation and no separate "do this" line is fabricated.
 */
export function issuesFromAnalysis(analysis: ResumeAnalysis): AtsIssue[] {
  return analysis.recommendations.map((recommendation) => ({
    id: `recommendation-${recommendation.id}`,
    severity: severityFromPriority(recommendation.priority),
    title: recommendation.category,
    explanation: recommendation.message,
    recommendation: "",
    dimension: recommendation.category.toLowerCase().replace(/\s+/g, "_"),
  }));
}

/** Severity counts used by the report header. */
export function countSeverities(issues: AtsIssue[]): {
  critical: number;
  warning: number;
  info: number;
} {
  return issues.reduce(
    (counts, issue) => {
      counts[issue.severity] += 1;
      return counts;
    },
    { critical: 0, warning: 0, info: 0 },
  );
}

/** Trend points for `ScoreTrend`, oldest first. */
export function trendFromAnalyses(analyses: ResumeAnalysis[]): {
  id: string;
  score: number;
  createdAt: number;
}[] {
  return [...analyses]
    .sort((a, b) => Date.parse(a.analyzedAt) - Date.parse(b.analyzedAt))
    .map((analysis) => ({
      id: String(analysis.id),
      score: analysis.overallScore,
      createdAt: Date.parse(analysis.analyzedAt),
    }));
}

/** Human-readable error for a failed request. */
export function describeError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
