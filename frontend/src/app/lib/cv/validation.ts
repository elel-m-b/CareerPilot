/**
 * Client-side mirrors of the backend's upload rules.
 *
 * The server enforces these in `ResumeParserService` and
 * `spring.servlet.multipart`; checking here gives an immediate, specific error
 * instead of a failed multipart request.
 */

export const MAX_CV_BYTES = 10 * 1024 * 1024; // 10 MB — matches application.yml

export type CvFileKind = "pdf" | "docx";

export const ACCEPTED_CV_EXTENSIONS = ".pdf,.docx";

export const CV_KIND_LABELS: Record<CvFileKind, string> = {
  pdf: "PDF",
  docx: "Word document",
};

export type CvFileValidation =
  | { ok: true; kind: CvFileKind }
  | { ok: false; message: string };

/** Resolve the file kind from the extension, which is what the server checks. */
export function detectCvKind(file: { name: string }): CvFileKind | null {
  const extension = file.name.toLowerCase().split(".").pop() ?? "";
  if (extension === "pdf") return "pdf";
  if (extension === "docx") return "docx";
  return null;
}

export function validateCvFile(file: { name: string; size: number }): CvFileValidation {
  if (file.size === 0) {
    return { ok: false, message: "That file is empty. Choose the document you actually send." };
  }
  if (file.size > MAX_CV_BYTES) {
    return {
      ok: false,
      message: `That file is ${formatBytes(file.size)}. The maximum is ${formatBytes(MAX_CV_BYTES)}.`,
    };
  }
  const kind = detectCvKind(file);
  if (!kind) {
    return {
      ok: false,
      message: "Only PDF and DOCX files are supported. Export your CV in one of those formats.",
    };
  }
  return { ok: true, kind };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`;
}
