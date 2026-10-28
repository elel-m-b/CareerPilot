import { api } from "@/api/endpoints";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useComingSoon } from "@/components/ComingSoon";
import { Panel } from "@/components/Panel";
import { DimensionBars } from "@/components/cv/DimensionBars";
import { IssueList, SeveritySummary } from "@/components/cv/IssueList";
import { ScoreDial } from "@/components/cv/ScoreDial";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResource } from "@/hooks/use-resource";
import {
  countSeverities,
  describeError,
  dimensionsFromAnalysis,
  issuesFromAnalysis,
} from "@/lib/cv/report";
import { formatBytes } from "@/lib/cv/validation";
import { TONE_LABEL, TONE_TEXT, formatDateTime, scoreTone } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

function downloadTextFile(fileName: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function CvAnalysis() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const { showComingSoon } = useComingSoon();

  const id = Number(resumeId);
  const validId = Number.isInteger(id) && id > 0;

  const resume = useResource(
    () => (validId ? api.resumes.get(id) : Promise.reject(new Error("Invalid CV id"))),
    [id, validId],
  );
  const analysesResponse = useResource(
    () => (validId ? api.analyses.forResume(id) : Promise.reject(new Error("Invalid CV id"))),
    [id, validId],
  );

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const unavailable = (
    <AppShell area="CV report">
      <Alert variant="destructive" className="rounded-md">
        <AlertCircle className="size-4" />
        <AlertTitle className="text-sm">This report is not available</AlertTitle>
        <AlertDescription className="text-sm leading-relaxed">
          The CV was deleted, or it belongs to another account.
        </AlertDescription>
      </Alert>
      <Button variant="outline" className="mt-6 gap-2" onClick={() => navigate("/cv")}>
        <ArrowLeft className="size-4" />
        Back to my CV
      </Button>
    </AppShell>
  );

  if (!validId) return unavailable;

  if (resume.loading || analysesResponse.loading) {
    return (
      <AppShell area="CV report">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    );
  }

  if (resume.error) return unavailable;

  const document = resume.data;
  if (!document) return unavailable;

  const analyses = analysesResponse.data ?? [];
  const active = analyses.find((analysis) => analysis.id === selectedId) ?? analyses[0];
  const activeIndex = active ? analyses.findIndex((analysis) => analysis.id === active.id) : -1;
  const previous = activeIndex >= 0 ? analyses[activeIndex + 1] : undefined;

  const issues = active ? issuesFromAnalysis(active) : [];
  const counts = countSeverities(issues);
  const dimensions = active ? dimensionsFromAnalysis(active) : [];
  const previousDimensions = previous ? dimensionsFromAnalysis(previous) : undefined;
  const deltas = previousDimensions
    ? Object.fromEntries(
        dimensions.map((dimension) => {
          const before = previousDimensions.find((item) => item.key === dimension.key);
          return [dimension.key, before ? dimension.score - before.score : 0];
        }),
      )
    : undefined;

  const words = document.extractedText.trim() ? document.extractedText.trim().split(/\s+/).length : 0;

  async function handleScan() {
    setScanning(true);
    try {
      await api.analyses.analyze(id);
      setSelectedId(null);
      analysesResponse.reload();
      resume.reload();
      toast.success("Scan complete.");
    } catch (cause) {
      toast.error(describeError(cause, "We could not scan this CV."));
    } finally {
      setScanning(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.resumes.remove(id);
      toast.success("CV deleted.");
      navigate("/cv");
    } catch (cause) {
      toast.error(describeError(cause, "We could not delete this CV."));
      setDeleting(false);
    }
  }

  return (
    <AppShell area="CV report">
      <div className="mb-8">
        <Link
          to="/cv"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to my CV
        </Link>
      </div>

      <PageHeader
        eyebrow="CV report"
        title={document.originalFilename}
        description={`${formatBytes(document.fileSize)} · ${words} words · uploaded ${formatDateTime(
          Date.parse(document.uploadedAt),
        )}${active ? ` · ${analyses.length} scan${analyses.length === 1 ? "" : "s"}` : ""}`}
        actions={
          <>
            <Button
              className="gap-2"
              onClick={() => showComingSoon("The CV editor and ATS export")}
            >
              <Sparkles className="size-4" />
              Build the ATS version
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                downloadTextFile(
                  `${document.originalFilename.replace(/\.[^.]+$/, "") || "cv"}.txt`,
                  document.extractedText,
                )
              }
            >
              <Download className="size-4" />
              Download text
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleScan} disabled={scanning}>
              {scanning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {active ? "Re-scan" : "Run scan"}
            </Button>
            <Button
              variant="ghost"
              className="gap-2 text-critical hover:text-critical"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </>
        }
      />

      {!active ? (
        <div className="mt-10 flex flex-col gap-6">
          <Alert className="rounded-md">
            <AlertCircle className="size-4" />
            <AlertTitle className="text-sm">No analysis stored for this CV</AlertTitle>
            <AlertDescription className="text-sm leading-relaxed">
              Run a scan to generate the deterministic ATS report for this document.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={handleScan} disabled={scanning} className="gap-2">
              {scanning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Scan this CV
            </Button>
            <Button variant="outline" onClick={() => navigate("/cv")}>
              Back to my CV
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-6">
            <Panel title="ATS compatibility">
              <ScoreDial
                score={active.overallScore}
                band={TONE_LABEL[scoreTone(active.overallScore)]}
                caption={`Scanned ${formatDateTime(Date.parse(active.analyzedAt))}`}
              />
              <div className="mt-6">
                <SeveritySummary counts={counts} />
              </div>
            </Panel>

            <Tabs defaultValue="overview">
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-md bg-secondary/70 p-1">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="findings">Findings ({issues.length})</TabsTrigger>
                <TabsTrigger value="sections">Section feedback</TabsTrigger>
                <TabsTrigger value="text">Extracted text</TabsTrigger>
                <TabsTrigger value="history">History ({analyses.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <Panel title="Dimension breakdown">
                  <DimensionBars dimensions={dimensions} deltas={deltas} />
                </Panel>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <Panel title="Do this next">
                    <ol className="flex flex-col gap-4">
                      {active.recommendations.map((recommendation, index) => (
                        <li key={recommendation.id} className="flex items-start gap-3">
                          <span className="grid size-5 shrink-0 place-items-center rounded-[3px] border border-border text-[10px] tabular-nums text-muted-foreground">
                            {index + 1}
                          </span>
                          <span className="text-sm leading-relaxed text-foreground">
                            {recommendation.message}
                          </span>
                        </li>
                      ))}
                      {active.recommendations.length === 0 && (
                        <li className="text-sm text-muted-foreground">
                          No outstanding actions for this scan.
                        </li>
                      )}
                    </ol>
                  </Panel>
                  <Panel title="Working well">
                    {dimensions.filter((dimension) => dimension.score >= 80).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No dimension reached 80% yet. Resolve the critical findings first.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-4">
                        {dimensions
                          .filter((dimension) => dimension.score >= 80)
                          .map((dimension) => (
                            <li
                              key={dimension.key}
                              className="text-sm leading-relaxed text-muted-foreground"
                            >
                              <span className="mr-2 text-foreground">✓</span>
                              {dimension.label} scored {dimension.score}%
                            </li>
                          ))}
                      </ul>
                    )}
                  </Panel>
                </div>
              </TabsContent>

              <TabsContent value="findings" className="mt-6">
                <Panel title="All findings">
                  <IssueList
                    issues={issues}
                    emptyLabel="No findings were raised for this scan."
                  />
                </Panel>
              </TabsContent>

              <TabsContent value="sections" className="mt-6">
                <Panel title="Feedback per dimension">
                  <ul className="divide-y divide-border/70">
                    {active.sections.map((section) => (
                      <li key={section.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
                        <div className="flex items-baseline justify-between gap-4">
                          <p className="text-sm font-medium text-foreground">
                            {section.sectionType
                              .toLowerCase()
                              .split("_")
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(" ")}
                          </p>
                          <span
                            className={cn(
                              "text-sm tabular-nums",
                              TONE_TEXT[scoreTone(section.score)],
                            )}
                          >
                            {section.score}%
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {section.feedback}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </TabsContent>

              <TabsContent value="text" className="mt-6">
                <Panel title="What was extracted from your document">
                  <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-secondary/40 p-4 text-xs leading-relaxed text-foreground">
                    {document.extractedText || "No text could be extracted from this document."}
                  </pre>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Parsing and scoring run on this extracted text. A scan without a text layer
                    produces an empty document, which is why image-only PDFs cannot be analysed.
                  </p>
                </Panel>
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <Panel title="Analysis history" bodyClassName="px-0 py-0">
                  <ul className="divide-y divide-border/80">
                    {analyses.map((analysis, index) => {
                      const before = analyses[index + 1];
                      const delta = before
                        ? analysis.overallScore - before.overallScore
                        : undefined;
                      const isActive = analysis.id === active.id;
                      return (
                        <li key={analysis.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(analysis.id)}
                            className={cn(
                              "flex w-full flex-wrap items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-secondary/50",
                              isActive && "bg-secondary/60",
                            )}
                          >
                            <span
                              className={cn(
                                "w-14 text-lg font-medium tabular-nums",
                                TONE_TEXT[scoreTone(analysis.overallScore)],
                              )}
                            >
                              {analysis.overallScore}%
                            </span>
                            <span className="text-sm text-foreground">
                              {TONE_LABEL[scoreTone(analysis.overallScore)]} ·{" "}
                              {analysis.recommendations.length} finding
                              {analysis.recommendations.length === 1 ? "" : "s"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(Date.parse(analysis.analyzedAt))}
                            </span>
                            {delta !== undefined && (
                              <span
                                className={cn(
                                  "text-xs",
                                  delta > 0
                                    ? "text-success"
                                    : delta < 0
                                      ? "text-critical"
                                      : "text-muted-foreground",
                                )}
                              >
                                {delta > 0 ? "+" : ""}
                                {delta} vs previous
                              </span>
                            )}
                            <span className="ml-auto text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                              {isActive ? "Displayed" : "View"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </Panel>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex flex-col gap-6">
            <Panel title="Document">
              <dl className="flex flex-col gap-4">
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    File
                  </dt>
                  <dd className="mt-1 break-all text-sm text-foreground">
                    {document.originalFilename}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Size / type
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {formatBytes(document.fileSize)} · {document.fileType}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Uploaded
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {formatDateTime(Date.parse(document.uploadedAt))}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Last scanned
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {formatDateTime(Date.parse(active.analyzedAt))}
                  </dd>
                </div>
              </dl>
              <Button
                variant="outline"
                className="mt-5 w-full gap-2"
                onClick={handleScan}
                disabled={scanning}
              >
                {scanning ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Re-scan this CV
              </Button>
            </Panel>

            <Panel title="Scoring engine">
              <p className="text-sm leading-relaxed text-muted-foreground">
                DeterministicAnalyzer v1. Seven weighted dimensions, fixed rules, no external
                service. The same document always produces the same score.
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground">
                <li>· Nothing is generated on your behalf.</li>
                <li>· Missing information is reported, never invented.</li>
                <li>· Every finding shows the category that raised it.</li>
              </ul>
            </Panel>

            <Panel title="Text statistics">
              <dl className="grid grid-cols-2 gap-4">
                {[
                  ["Words", words],
                  ["Characters", document.extractedText.length],
                  ["Findings", issues.length],
                  ["Scans", analyses.length],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm tabular-nums text-foreground">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </Panel>

            <Panel title="CV editor">
              <p className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                <FileText className="mt-0.5 size-4 shrink-0" />
                The guided editor and ATS PDF export are not available yet.
              </p>
              <Button
                size="sm"
                className="mt-4 w-full"
                variant="outline"
                onClick={() => showComingSoon("The CV editor and ATS export")}
              >
                Coming soon
              </Button>
            </Panel>
          </div>
        </div>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={(open) => !deleting && setDeleteOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-medium tracking-tight">
              Delete this CV?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              The stored document and every analysis of it are removed permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
              className="bg-critical text-white hover:bg-critical/90"
            >
              {deleting ? "Deleting…" : "Delete CV"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
