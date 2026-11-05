import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiService } from "../core/api/api.service";
import type { ResumeAnalysis, ResumeDetail } from "../core/api/api.types";
import { ComparePage } from "./compare";

function analysis(overrides: Partial<ResumeAnalysis> = {}): ResumeAnalysis {
  return {
    id: 1,
    resumeId: 7,
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

const DOCUMENT: ResumeDetail = {
  id: 7,
  userId: 1,
  originalFilename: "cv.pdf",
  fileType: "application/pdf",
  fileSize: 2048,
  extractedText: "A CV",
  uploadedAt: "2026-09-30T09:00:00",
  updatedAt: "2026-09-30T09:00:00",
};

const NEWER = analysis({
  id: 2,
  overallScore: 72,
  atsScore: 70,
  projectsScore: 60,
  analyzedAt: "2026-10-02T10:00:00",
  recommendations: [
    { id: 21, category: "Achievements", priority: "Important", message: "Add metrics." },
    { id: 22, category: "Projects", priority: "Suggested", message: "Add a projects section." },
  ],
});

const OLDER = analysis({
  id: 1,
  overallScore: 60,
  analyzedAt: "2026-10-01T10:00:00",
  recommendations: [
    { id: 11, category: "Contact Info", priority: "Critical", message: "Add contact details." },
    { id: 12, category: "Achievements", priority: "Important", message: "Add metrics." },
  ],
});

async function settle(fixture: ComponentFixture<ComparePage>): Promise<void> {
  for (let index = 0; index < 4; index++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }
}

describe("ComparePage", () => {
  let fixture: ComponentFixture<ComparePage>;

  beforeEach(async () => {
    const api = {
      resumes: { get: vi.fn().mockResolvedValue(DOCUMENT) },
      analyses: { forResume: vi.fn().mockResolvedValue([NEWER, OLDER]) },
    };

    await TestBed.configureTestingModule({
      imports: [ComparePage],
      providers: [provideRouter([]), { provide: ApiService, useValue: api }],
    }).compileComponents();

    fixture = TestBed.createComponent(ComparePage);
    fixture.componentRef.setInput("resumeId", "7");
    fixture.detectChanges();
    await settle(fixture);
  });

  it("loads the CV and defaults to the newest scan against the previous one", () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? "";
    expect(text).toContain("cv.pdf");
    expect(text).toContain("Baseline scan");
    expect(text).toContain("Compared scan");
    expect(text).toContain("Overall movement");
  });

  it("renders the overall movement and the findings that changed", () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? "";
    expect(text).toContain("+12");
    expect(text).toContain("Resolved findings");
    expect(text).toContain("Contact Info");
    expect(text).toContain("Newly raised findings");
    expect(text).toContain("Add a projects section.");
    expect(text).toContain("Still open");
  });

  it("swaps the baseline when the same scan is chosen on both sides", () => {
    const selects = (fixture.nativeElement as HTMLElement).querySelectorAll("select");
    expect(selects).toHaveLength(2);

    const baseline = selects[0] as HTMLSelectElement;
    baseline.value = "2";
    baseline.dispatchEvent(new Event("change"));
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      beforeId: () => number | null;
      afterId: () => number | null;
    };
    expect(component.beforeId()).toBe(2);
    expect(component.afterId()).toBe(1);
  });
});
