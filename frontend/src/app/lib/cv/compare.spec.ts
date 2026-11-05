import { describe, expect, it } from "vitest";
import type { ResumeAnalysis } from "../../core/api/api.types";
import {
  compareAnalyses,
  defaultComparisonPair,
  describeOverallDelta,
} from "./compare";

function analysis(overrides: Partial<ResumeAnalysis> = {}): ResumeAnalysis {
  return {
    id: 1,
    resumeId: 1,
    originalFilename: "cv.pdf",
    overallScore: 60,
    atsScore: 50,
    contentScore: 60,
    structureScore: 70,
    skillsScore: 70,
    experienceScore: 55,
    educationScore: 80,
    projectsScore: 40,
    analyzedAt: "2026-10-01T10:00:00",
    sections: [],
    recommendations: [],
    ...overrides,
  };
}

const BEFORE = analysis({
  id: 1,
  overallScore: 60,
  recommendations: [
    { id: 11, category: "Contact Info", priority: "Critical", message: "Add contact details." },
    { id: 12, category: "Achievements", priority: "Important", message: "Add metrics." },
  ],
});

const AFTER = analysis({
  id: 2,
  overallScore: 72,
  atsScore: 70,
  contentScore: 60,
  structureScore: 70,
  skillsScore: 75,
  experienceScore: 50,
  educationScore: 80,
  projectsScore: 60,
  analyzedAt: "2026-10-02T10:00:00",
  recommendations: [
    { id: 21, category: "Achievements", priority: "Important", message: "Add metrics." },
    { id: 22, category: "Projects", priority: "Suggested", message: "Add a projects section." },
  ],
});

describe("compareAnalyses", () => {
  const comparison = compareAnalyses(BEFORE, AFTER);

  it("reports the overall movement from baseline to compared scan", () => {
    expect(comparison.before.id).toBe(1);
    expect(comparison.after.id).toBe(2);
    expect(comparison.overallDelta).toBe(12);
  });

  it("compares every weighted dimension and splits it by direction", () => {
    expect(comparison.dimensions.map((dimension) => dimension.key)).toEqual([
      "ats",
      "content",
      "skills",
      "experience",
      "education",
      "projects",
      "structure",
    ]);
    expect(comparison.dimensions.find((dimension) => dimension.key === "ats")).toMatchObject({
      before: 50,
      after: 70,
      delta: 20,
    });
    expect(comparison.improved.map((dimension) => dimension.key)).toEqual([
      "ats",
      "skills",
      "projects",
    ]);
    expect(comparison.regressed.map((dimension) => dimension.key)).toEqual(["experience"]);
    expect(comparison.unchanged.map((dimension) => dimension.key)).toEqual([
      "content",
      "education",
      "structure",
    ]);
  });

  it("matches findings by category and message, not by scan-local id", () => {
    expect(comparison.stillOpen.map((finding) => finding.title)).toEqual(["Achievements"]);
    expect(comparison.resolved.map((finding) => finding.title)).toEqual(["Contact Info"]);
    expect(comparison.appeared.map((finding) => finding.title)).toEqual(["Projects"]);
    expect(comparison.appeared[0]).toMatchObject({
      message: "Add a projects section.",
      severity: "info",
    });
    expect(comparison.resolved[0].severity).toBe("critical");
  });

  it("does not mutate either analysis", () => {
    expect(BEFORE.recommendations).toHaveLength(2);
    expect(AFTER.recommendations).toHaveLength(2);
  });

  it("handles a scan compared with itself as no movement", () => {
    const same = compareAnalyses(AFTER, AFTER);
    expect(same.overallDelta).toBe(0);
    expect(same.appeared).toHaveLength(0);
    expect(same.resolved).toHaveLength(0);
    expect(same.stillOpen).toHaveLength(AFTER.recommendations.length);
  });
});

describe("defaultComparisonPair", () => {
  it("uses the newest scan as the compared scan and the one before as baseline", () => {
    const pair = defaultComparisonPair([AFTER, BEFORE]);
    expect(pair?.after.id).toBe(2);
    expect(pair?.before.id).toBe(1);
  });

  it("returns null until two scans exist", () => {
    expect(defaultComparisonPair([])).toBeNull();
    expect(defaultComparisonPair([BEFORE])).toBeNull();
  });
});

describe("describeOverallDelta", () => {
  it("words the movement in points", () => {
    expect(describeOverallDelta(12)).toBe("Up 12 points");
    expect(describeOverallDelta(1)).toBe("Up 1 point");
    expect(describeOverallDelta(-5)).toBe("Down 5 points");
    expect(describeOverallDelta(0)).toBe("No change");
  });
});
