import { describe, expect, it } from "vitest";
import type { DashboardStats, Resume, ResumeAnalysis } from "@/api/types";
import { sortAnalysesNewestFirst, summariseDashboard } from "@/lib/cv/dashboard";

function analysis(overrides: Partial<ResumeAnalysis> = {}): ResumeAnalysis {
  return {
    id: 1,
    resumeId: 1,
    originalFilename: "cv.pdf",
    overallScore: 70,
    atsScore: 70,
    contentScore: 70,
    structureScore: 70,
    skillsScore: 70,
    experienceScore: 70,
    educationScore: 70,
    projectsScore: 70,
    analyzedAt: "2026-10-01T10:00:00",
    sections: [],
    recommendations: [],
    ...overrides,
  };
}

function resume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: 1,
    userId: 1,
    originalFilename: "cv.pdf",
    fileType: "application/pdf",
    fileSize: 1024,
    uploadedAt: "2026-10-01T09:00:00",
    latestScore: null,
    latestAnalysisId: null,
    ...overrides,
  };
}

describe("sortAnalysesNewestFirst", () => {
  it("orders by analysed time and falls back to the id for ties", () => {
    const ordered = sortAnalysesNewestFirst([
      analysis({ id: 2, analyzedAt: "2026-10-02T10:00:00" }),
      analysis({ id: 5, analyzedAt: "2026-10-02T10:00:00" }),
      analysis({ id: 9, analyzedAt: "2026-10-01T10:00:00" }),
    ]);

    expect(ordered.map((item) => item.id)).toEqual([5, 2, 9]);
  });

  it("does not mutate the array it receives", () => {
    const input = [
      analysis({ id: 1, analyzedAt: "2026-10-01T10:00:00" }),
      analysis({ id: 2, analyzedAt: "2026-10-02T10:00:00" }),
    ];

    sortAnalysesNewestFirst(input);

    expect(input.map((item) => item.id)).toEqual([1, 2]);
  });
});

describe("summariseDashboard", () => {
  const stats: DashboardStats = {
    totalResumes: 2,
    totalAnalyses: 3,
    averageScore: 76.7,
    bestScore: 91,
  };
  const resumes = [
    resume({ id: 1, originalFilename: "old.pdf" }),
    resume({ id: 2, originalFilename: "new.docx", fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
  ];
  const analyses = [
    analysis({ id: 3, resumeId: 1, overallScore: 91, analyzedAt: "2026-10-03T10:00:00" }),
    analysis({ id: 2, resumeId: 2, overallScore: 68, analyzedAt: "2026-10-02T10:00:00" }),
    analysis({ id: 1, resumeId: 2, overallScore: 61, analyzedAt: "2026-10-01T10:00:00" }),
  ];

  it("uses the newest scan across every CV, whatever order the API returned", () => {
    const summary = summariseDashboard({ stats, resumes, analyses: [...analyses].reverse() });

    expect(summary.latest?.id).toBe(3);
    expect(summary.latest?.overallScore).toBe(91);
    expect(summary.currentResume?.id).toBe(1);
    expect(summary.currentResume?.originalFilename).toBe("old.pdf");
  });

  it("takes the previous scan from the same CV, not from another document", () => {
    const summary = summariseDashboard({ stats, resumes, analyses });

    expect(summary.currentAnalyses.map((item) => item.id)).toEqual([3]);
    expect(summary.previous).toBeNull();

    const secondScan = analysis({
      id: 4,
      resumeId: 1,
      overallScore: 80,
      analyzedAt: "2026-10-04T10:00:00",
    });
    const withHistory = summariseDashboard({
      stats,
      resumes,
      analyses: [...analyses, secondScan],
    });

    expect(withHistory.previous?.id).toBe(3);
  });

  it("reports the backend totals instead of recounting the visible rows", () => {
    const summary = summariseDashboard({ stats, resumes: [], analyses });

    expect(summary.totalResumes).toBe(2);
    expect(summary.totalAnalyses).toBe(3);
    expect(summary.averageScore).toBe(76.7);
    expect(summary.bestScore).toBe(91);
  });

  it("distinguishes 'no scans yet' from a scan that scored zero", () => {
    const empty = summariseDashboard({
      stats: { totalResumes: 1, totalAnalyses: 0, averageScore: 0, bestScore: 0 },
      resumes: [resume()],
      analyses: [],
    });

    expect(empty.latest).toBeNull();
    expect(empty.averageScore).toBeNull();
    expect(empty.bestScore).toBeNull();
    expect(empty.currentResume?.id).toBe(1);

    const zero = summariseDashboard({
      stats: { totalResumes: 1, totalAnalyses: 1, averageScore: 0, bestScore: 0 },
      resumes: [resume()],
      analyses: [analysis({ overallScore: 0 })],
    });

    expect(zero.averageScore).toBe(0);
    expect(zero.bestScore).toBe(0);
  });

  it("counts findings of the latest scan by severity", () => {
    const summary = summariseDashboard({
      stats,
      resumes,
      analyses: [
        analysis({
          id: 3,
          resumeId: 1,
          recommendations: [
            { id: 1, category: "Contact Info", priority: "Critical", message: "Add contact details." },
            { id: 2, category: "Achievements", priority: "Important", message: "Add metrics." },
            { id: 3, category: "Projects", priority: "Suggested", message: "Add projects." },
          ],
        }),
      ],
    });

    expect(summary.severityCounts).toEqual({ critical: 1, warning: 1, info: 1 });
  });

  it("works without the stats payload by deriving totals from the history", () => {
    const summary = summariseDashboard({ resumes, analyses });

    expect(summary.totalResumes).toBe(resumes.length);
    expect(summary.totalAnalyses).toBe(analyses.length);
    expect(summary.averageScore).toBeCloseTo((91 + 68 + 61) / 3, 5);
    expect(summary.bestScore).toBe(91);
  });
});
