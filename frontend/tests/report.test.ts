import { describe, expect, it } from "vitest";
import type { ResumeAnalysis } from "@/api/types";
import {
  countSeverities,
  dimensionsFromAnalysis,
  issuesFromAnalysis,
  severityFromPriority,
  trendFromAnalyses,
} from "@/lib/cv/report";
import { MAX_CV_BYTES, formatBytes, validateCvFile } from "@/lib/cv/validation";

const analysis: ResumeAnalysis = {
  id: 7,
  resumeId: 3,
  originalFilename: "cv.pdf",
  overallScore: 78,
  atsScore: 80,
  contentScore: 70,
  structureScore: 90,
  skillsScore: 85,
  experienceScore: 75,
  educationScore: 95,
  projectsScore: 60,
  analyzedAt: "2026-10-01T10:00:00",
  sections: [
    {
      id: 1,
      sectionType: "ATS_COMPATIBILITY",
      score: 80,
      feedback: "Good ATS compatibility.",
    },
  ],
  recommendations: [
    {
      id: 11,
      category: "Contact Info",
      priority: "Critical",
      message: "Add complete contact information.",
    },
    {
      id: 12,
      category: "Achievements",
      priority: "Important",
      message: "Add measurable achievements.",
    },
    {
      id: 13,
      category: "Projects",
      priority: "Suggested",
      message: "Add a projects section.",
    },
  ],
};

describe("dimensionsFromAnalysis", () => {
  const dimensions = dimensionsFromAnalysis(analysis);

  it("exposes the seven weighted dimensions in report order", () => {
    expect(dimensions.map((dimension) => dimension.key)).toEqual([
      "ats",
      "content",
      "skills",
      "experience",
      "education",
      "projects",
      "structure",
    ]);
  });

  it("uses the weights of the deterministic analyzer, totalling 100", () => {
    expect(dimensions.reduce((total, dimension) => total + dimension.weight, 0)).toBe(100);
  });

  it("carries the backend score and feedback without inventing values", () => {
    expect(dimensions[0]).toMatchObject({
      score: 80,
      summary: "Good ATS compatibility.",
    });
    expect(dimensions[1].score).toBe(70);
    expect(dimensions[1].summary).toBe("No feedback was recorded for this dimension.");
  });
});

describe("issuesFromAnalysis", () => {
  it("maps priorities onto report severities", () => {
    expect(severityFromPriority("Critical")).toBe("critical");
    expect(severityFromPriority("Important")).toBe("warning");
    expect(severityFromPriority("Suggested")).toBe("info");
    expect(severityFromPriority("anything else")).toBe("info");
  });

  it("turns every stored recommendation into one finding", () => {
    const issues = issuesFromAnalysis(analysis);
    expect(issues).toHaveLength(3);
    expect(issues[0]).toMatchObject({
      id: "recommendation-11",
      severity: "critical",
      title: "Contact Info",
      explanation: "Add complete contact information.",
    });
    expect(countSeverities(issues)).toEqual({ critical: 1, warning: 1, info: 1 });
  });
});

describe("trendFromAnalyses", () => {
  it("orders scans oldest first for the trend line", () => {
    const trend = trendFromAnalyses([
      { ...analysis, id: 2, overallScore: 82, analyzedAt: "2026-10-02T10:00:00" },
      { ...analysis, id: 1, overallScore: 71, analyzedAt: "2026-10-01T10:00:00" },
    ]);
    expect(trend.map((point) => point.score)).toEqual([71, 82]);
    expect(trend.map((point) => point.id)).toEqual(["1", "2"]);
  });
});

describe("validateCvFile", () => {
  it("accepts a PDF or DOCX inside the size limit", () => {
    expect(validateCvFile({ name: "cv.pdf", size: 1024 })).toEqual({ ok: true, kind: "pdf" });
    expect(validateCvFile({ name: "CV.DOCX", size: MAX_CV_BYTES })).toEqual({
      ok: true,
      kind: "docx",
    });
  });

  it("rejects formats the backend cannot parse", () => {
    const result = validateCvFile({ name: "cv.txt", size: 1024 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("Only PDF and DOCX");
  });

  it("rejects files over the 10 MB multipart limit", () => {
    const result = validateCvFile({ name: "cv.pdf", size: MAX_CV_BYTES + 1 });
    expect(result.ok).toBe(false);
  });

  it("rejects an empty file", () => {
    const result = validateCvFile({ name: "cv.pdf", size: 0 });
    expect(result.ok).toBe(false);
  });

  it("formats byte sizes for the upload dialog", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(MAX_CV_BYTES)).toBe("10 MB");
  });
});
