import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api } from "@/api/endpoints";
import { describeError } from "@/lib/cv/report";
import {
  ACCEPTED_CV_EXTENSIONS,
  MAX_CV_BYTES,
  formatBytes,
  validateCvFile,
} from "@/lib/cv/validation";
import { cn } from "@/lib/utils";
import { AlertCircle, FileText, Loader2, Upload, X } from "lucide-react";
import { useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

type UploadStage = "idle" | "uploading" | "analyzing";

const STEP_LABELS: { key: Exclude<UploadStage, "idle">; label: string }[] = [
  { key: "uploading", label: "Uploading and extracting the text layer" },
  { key: "analyzing", label: "Parsing and scoring seven weighted dimensions" },
];

/**
 * Uploads a CV to the CareerPilot API and immediately runs the deterministic
 * ATS analysis, so the user lands on a report rather than an empty document.
 */
export function CvUploadDialog({
  trigger,
  onUploaded,
}: {
  trigger: ReactNode;
  onUploaded?: (resumeId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = stage !== "idle";

  /**
   * Reset the native input as well as React state. A file input only fires
   * `change` when its value changes, so re-selecting the same file (common
   * after editing `CV.pdf`) would otherwise do nothing.
   */
  function clearInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  function openFilePicker() {
    if (busy || !inputRef.current) return;
    clearInput();
    inputRef.current.click();
  }

  function pickFile(next: File | null) {
    setFile(next);
    setError(null);
    if (!next) {
      clearInput();
      return;
    }
    const validation = validateCvFile(next);
    if (!validation.ok) setError(validation.message);
  }

  function reset() {
    setFile(null);
    setError(null);
    setDragging(false);
    setStage("idle");
    clearInput();
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) pickFile(dropped);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose the CV file you want to scan.");
      return;
    }

    const validation = validateCvFile(file);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    try {
      setError(null);

      setStage("uploading");
      const resume = await api.resumes.upload(file);

      setStage("analyzing");
      try {
        const analysis = await api.analyses.analyze(resume.id);
        toast.success(`Scan complete — ATS score ${analysis.overallScore}%`);
      } catch (analysisError) {
        // The document is stored; the user can retry the scan from its report.
        toast.warning(
          `CV uploaded, but the scan did not finish: ${describeError(analysisError)}`,
        );
      }

      reset();
      setOpen(false);
      onUploaded?.(resume.id);
    } catch (cause) {
      setError(describeError(cause, "We could not upload this CV. Please try again."));
    } finally {
      setStage("idle");
    }
  }

  const selectedValidation = file ? validateCvFile(file) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        setOpen(next);
        if (next) clearInput();
        else reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium tracking-tight">Scan a CV</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Upload the document you apply with. CareerPilot extracts its text, parses the
            structure and scores seven weighted ATS dimensions. Nothing is invented on your behalf.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              CV file (PDF or DOCX · max {formatBytes(MAX_CV_BYTES)})
            </Label>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={openFilePicker}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-6 py-8 text-center transition-colors",
                dragging ? "border-foreground bg-secondary/60" : "border-border hover:bg-secondary/40",
                busy && "pointer-events-none opacity-70",
              )}
            >
              <Upload className="size-4 text-muted-foreground" />
              {file ? (
                <div className="flex items-center gap-2">
                  <FileText className="size-4" />
                  <span className="text-sm text-foreground">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    aria-label="Remove file"
                    onClick={(event) => {
                      event.stopPropagation();
                      pickFile(null);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-foreground">Drop your CV here or click to browse</p>
                  <p className="text-xs text-muted-foreground">
                    Scanned images cannot be analysed — export a text-based PDF or a .docx file.
                  </p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_CV_EXTENSIONS}
                className="hidden"
                onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
              />
            </div>
            {selectedValidation && !selectedValidation.ok && (
              <p className="text-xs text-critical">{selectedValidation.message}</p>
            )}
          </div>

          {busy && (
            <ol className="flex flex-col gap-2 border-y border-border/70 py-4">
              {STEP_LABELS.map((step) => {
                const order: UploadStage[] = ["uploading", "analyzing"];
                const currentIndex = order.indexOf(stage);
                const stepIndex = order.indexOf(step.key);
                const state =
                  stepIndex < currentIndex ? "done" : stepIndex === currentIndex ? "active" : "todo";
                return (
                  <li key={step.key} className="flex items-center gap-2 text-sm">
                    {state === "active" ? (
                      <Loader2 className="size-3.5 animate-spin text-foreground" />
                    ) : (
                      <span
                        className={cn(
                          "size-3.5 rounded-full border",
                          state === "done" ? "border-foreground bg-foreground" : "border-border",
                        )}
                      />
                    )}
                    <span className={cn(state === "todo" ? "text-muted-foreground" : "text-foreground")}>
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          {error && (
            <Alert variant="destructive" className="rounded-md">
              <AlertCircle className="size-4" />
              <AlertTitle className="text-sm">We could not scan this CV</AlertTitle>
              <AlertDescription className="text-sm leading-relaxed">{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                reset();
                setOpen(false);
              }}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy || (selectedValidation !== null && !selectedValidation.ok)}>
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Scanning…
                </>
              ) : (
                "Scan this CV"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
