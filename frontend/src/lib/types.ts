/**
 * Shared UI types.
 *
 * The DTO shapes under `@/api/types` mirror the Spring Boot API exactly. The
 * types here describe how the ATS report is presented, so components can stay
 * decoupled from the transport layer.
 */

/** Severity of a single ATS finding. */
export type IssueSeverity = "critical" | "warning" | "info";

/** One weighted ATS dimension in the report. */
export type AtsDimension = {
  key: string;
  label: string;
  score: number;
  weight: number;
  summary: string;
};

/** A single explanation of a deduction with a concrete next action. */
export type AtsIssue = {
  id: string;
  severity: IssueSeverity;
  title: string;
  explanation: string;
  /** Optional concrete action; omitted when the backend message is the action. */
  recommendation?: string;
  dimension: string;
};

/** Pipeline states used by the (not yet implemented) application tracker. */
export type ApplicationStatus =
  | "saved"
  | "applied"
  | "assessment"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";
