import { format, formatDistanceToNowStrict } from "date-fns";

import type { IssueSeverity } from "@/lib/types";

/** Shared display helpers for the CV report UI. */

export function formatDate(timestamp?: number): string {
  if (!timestamp) return "—";
  return format(new Date(timestamp), "d MMM yyyy");
}

export function formatDateTime(timestamp?: number): string {
  if (!timestamp) return "—";
  return format(new Date(timestamp), "d MMM yyyy, HH:mm");
}

export function formatRelative(timestamp?: number): string {
  if (!timestamp) return "Never";
  const date = new Date(timestamp);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  if (sameDay) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  const days = Math.abs(Date.now() - timestamp) / 86_400_000;
  if (days < 30) return `${formatDistanceToNowStrict(date)} ago`;
  return formatDate(timestamp);
}

export type ScoreTone = "strong" | "good" | "needs_work" | "weak";

export function scoreTone(score?: number): ScoreTone {
  if (score === undefined) return "weak";
  if (score >= 80) return "strong";
  if (score >= 65) return "good";
  if (score >= 45) return "needs_work";
  return "weak";
}

export const TONE_TEXT: Record<ScoreTone, string> = {
  strong: "text-success",
  good: "text-foreground",
  needs_work: "text-warning",
  weak: "text-critical",
};

export const TONE_BG: Record<ScoreTone, string> = {
  strong: "bg-success",
  good: "bg-foreground",
  needs_work: "bg-warning",
  weak: "bg-critical",
};

export const TONE_LABEL: Record<ScoreTone, string> = {
  strong: "Strong",
  good: "Good",
  needs_work: "Needs work",
  weak: "Weak",
};

export const SEVERITY_LABEL: Record<IssueSeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Suggestion",
};

export const SEVERITY_CLASS: Record<IssueSeverity, string> = {
  critical: "border-critical/30 text-critical",
  warning: "border-warning/40 text-warning",
  info: "border-border text-muted-foreground",
};

export const DIMENSION_STATUS_LABEL: Record<string, string> = {
  strong: "Strong",
  good: "Good",
  needs_work: "Needs work",
  weak: "Weak",
};

export function formatDelta(delta: number): string {
  if (delta === 0) return "no change";
  return delta > 0 ? `+${delta} points` : `${delta} points`;
}

export function truncate(value: string, max = 48): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

export function titleCase(value: string): string {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
