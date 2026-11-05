/**
 * Features that exist in the Career-Compass frontend reference but have no
 * CareerPilot backend yet.
 *
 * They stay visible in navigation and routes, and every entry point shows the
 * same explicit message instead of pretending to work. Keeping the registry in
 * one place makes the gap easy to audit and easy to shrink as APIs land.
 */

export const COMING_SOON_MESSAGE = "Coming Soon — This feature is not implemented yet";

export type PlannedFeature = {
  id: string;
  /** Short feature name, used in the dialog and page header. */
  title: string;
  /** One sentence describing what the finished feature does. */
  description: string;
  /** Concrete capabilities planned for the feature. */
  capabilities: string[];
};

export const PLANNED_FEATURES = {
  cvEditor: {
    id: "cv-editor",
    title: "CV editor and ATS export",
    description:
      "Build an ATS-safe version of your CV from the document you already uploaded, with guided fixes and a text-selectable PDF export.",
    capabilities: [
      "Editable draft generated from the parsed CV",
      "Guided fixes mapped to each ATS finding",
      "ATS template preview and PDF export",
    ],
  },
  jobs: {
    id: "jobs",
    title: "Job matching",
    description:
      "Browse job postings and see how well each one fits your CV and profile across weighted matching dimensions.",
    capabilities: [
      "Searchable job catalog with saved postings",
      "Deterministic match score with a breakdown",
      "Match explanation per job posting",
    ],
  },
  jobDescription: {
    id: "job-description",
    title: "Job description generator",
    description:
      "Draft a structured job description from a role, seniority and skill set, then keep drafts for reuse.",
    capabilities: ["Role and seniority inputs", "Structured draft output", "Saved draft history"],
  },
  companies: {
    id: "companies",
    title: "Companies directory",
    description:
      "Explore companies in the catalog, their open roles and what they look for in candidates.",
    capabilities: ["Company profiles", "Open roles per company", "Saved companies"],
  },
  applications: {
    id: "applications",
    title: "Application tracking",
    description:
      "Track every application through a pipeline from saved to offer, with a status timeline and interview dates.",
    capabilities: ["Pipeline board", "Status timeline", "Interview dates and notes"],
  },
  prep: {
    id: "prep",
    title: "Interview preparation",
    description:
      "Turn a target job into a day-by-day preparation plan with practice questions and progress tracking.",
    capabilities: ["Preparation plans per job", "Question bank and practice answers", "Daily agenda"],
  },
  roadmap: {
    id: "roadmap",
    title: "Learning roadmap",
    description:
      "Identify skill gaps against your target role and generate a week-by-week learning roadmap.",
    capabilities: ["Skill-gap analysis", "Curated learning resources", "Weekly roadmap with tasks"],
  },
  copilot: {
    id: "copilot",
    title: "AI Career Copilot",
    description:
      "Ask career questions grounded in your own documents, with cited sources for every answer.",
    capabilities: ["Document-grounded answers", "Citations", "Saved conversations"],
  },
} as const satisfies Record<string, PlannedFeature>;

/** Look a planned feature up by key. */
export function plannedFeature(key: keyof typeof PLANNED_FEATURES): PlannedFeature {
  return PLANNED_FEATURES[key];
}
