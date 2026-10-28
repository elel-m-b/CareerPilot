import { api } from "@/api/endpoints";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Panel, StatTile } from "@/components/Panel";
import { CvUploadDialog } from "@/components/cv/CvUploadDialog";
import { DimensionBars } from "@/components/cv/DimensionBars";
import { IssueList } from "@/components/cv/IssueList";
import { ScoreDial } from "@/components/cv/ScoreDial";
import { ScoreTrend } from "@/components/cv/ScoreTrend";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useResource } from "@/hooks/use-resource";
import { summariseDashboard } from "@/lib/cv/dashboard";
import {
  dimensionsFromAnalysis,
  issuesFromAnalysis,
  trendFromAnalyses,
} from "@/lib/cv/report";
import { formatBytes } from "@/lib/cv/validation";
import { TONE_LABEL, TONE_TEXT, formatRelative, scoreTone } from "@/lib/format";
import { VIEWPORT, staggerContainer } from "@/lib/motion";
import type { AtsDimension } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Briefcase,
  FileText,
  Route,
  ScanLine,
  Target,
  Upload,
} from "lucide-react";
import { Link, useNavigate } from "react-router";

function dimensionDeltas(
  previous: AtsDimension[] | undefined,
  current: AtsDimension[],
): Record<string, number> | undefined {
  if (!previous || previous.length === 0) return undefined;
  const map: Record<string, number> = {};
  for (const dimension of current) {
    const before = previous.find((item) => item.key === dimension.key);
    if (before) map[dimension.key] = dimension.score - before.score;
  }
  return map;
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-12">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}

/** Visible roadmap entries for features the backend does not expose yet. */
const PLANNED_TILES = [
  {
    to: "/jobs",
    label: "Job matching",
    description: "Score every posting against your CV and profile.",
    icon: Briefcase,
  },
  {
    to: "/applications",
    label: "Application tracking",
    description: "Move each application from saved to offer.",
    icon: Target,
  },
  {
    to: "/prep",
    label: "Interview preparation",
    description: "Turn a target job into a daily preparation plan.",
    icon: Route,
  },
  {
    to: "/copilot",
    label: "AI Career Copilot",
    description: "Ask questions grounded in your own documents.",
    icon: Bot,
  },
];

function EmptyDashboard() {
  const navigate = useNavigate();
  const steps = [
    "Upload the PDF or DOCX you send to employers.",
    "The server extracts the text and parses your sections.",
    "Get seven dimension scores, findings and a prioritised fix list.",
  ];

  return (
    <div className="mt-12 rounded-md border border-dashed border-border">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-6 py-16 text-center">
        <span className="grid size-10 place-items-center rounded-md border border-border">
          <ScanLine className="size-4 text-muted-foreground" />
        </span>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium tracking-tight text-foreground">No CV scanned yet</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            CareerPilot needs one document to work with. Upload a text-based PDF or DOCX and the
            first report is generated in seconds.
          </p>
        </div>
        <ol className="flex w-full flex-col gap-3 text-left">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3 border-t border-border/80 pt-3">
              <span className="text-xs tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-sm leading-relaxed text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <CvUploadDialog
            trigger={
              <Button className="gap-2">
                <Upload className="size-4" />
                Upload my CV
              </Button>
            }
            onUploaded={(resumeId) => navigate(`/cv/${resumeId}`)}
          />
          <Button variant="outline" onClick={() => navigate("/cv")}>
            Manage my CVs
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = useResource(() => api.dashboard.stats(), []);
  const resumes = useResource(() => api.resumes.list(), []);
  const history = useResource(() => api.analyses.history(), []);

  const loading = stats.loading || resumes.loading || history.loading;
  const error = stats.error ?? resumes.error ?? history.error;

  if (loading) {
    return (
      <AppShell area="Dashboard">
        <DashboardSkeleton />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell area="Dashboard">
        <Alert variant="destructive" className="rounded-md">
          <AlertCircle className="size-4" />
          <AlertTitle className="text-sm">We could not load your dashboard</AlertTitle>
          <AlertDescription className="text-sm leading-relaxed">{error.message}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            stats.reload();
            resumes.reload();
            history.reload();
          }}
        >
          Try again
        </Button>
      </AppShell>
    );
  }

  const summary = summariseDashboard({
    stats: stats.data,
    resumes: resumes.data,
    analyses: history.data,
  });
  const { latest, previous, currentResume, currentAnalyses, severityCounts } = summary;
  const dimensions = latest ? dimensionsFromAnalysis(latest) : [];
  const previousDimensions = previous ? dimensionsFromAnalysis(previous) : undefined;
  const issues = latest ? issuesFromAnalysis(latest) : [];
  const score = latest?.overallScore ?? 0;
  const hasResumes = (resumes.data?.length ?? 0) > 0 || summary.totalResumes > 0;

  if (!hasResumes) {
    return (
      <AppShell area="Dashboard">
        <PageHeader
          eyebrow="Career dashboard"
          title="Dashboard"
          description="Your whole search in one place. Upload a CV to unlock the deterministic ATS analysis."
        />
        <EmptyDashboard />
        <div className="mt-12">
          <PlannedFeatures />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell area="Dashboard">
      <PageHeader
        eyebrow="Career dashboard"
        title="Dashboard"
        description={
          latest
            ? `Latest scan: ${currentResume?.originalFilename ?? latest.originalFilename} · ${formatRelative(
                Date.parse(latest.analyzedAt),
              )} · ${summary.totalAnalyses} scan${
                summary.totalAnalyses === 1 ? "" : "s"
              } recorded.`
            : "Your CV is on file but has not been scored yet. Open it to run the first scan."
        }
        actions={
          <>
            {currentResume && (
              <Button variant="outline" onClick={() => navigate(`/cv/${currentResume.id}`)}>
                Open CV report
              </Button>
            )}
            <CvUploadDialog
              trigger={
                <Button className="gap-2">
                  <Upload className="size-4" />
                  New scan
                </Button>
              }
              onUploaded={(resumeId) => navigate(`/cv/${resumeId}`)}
            />
          </>
        }
      />

      <div className="mt-12 flex flex-col gap-10">
        <motion.div
          variants={staggerContainer(0.06)}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatTile
            label="Latest ATS score"
            value={latest ? latest.overallScore : "—"}
            unit={latest ? "%" : undefined}
            tone={latest ? TONE_TEXT[scoreTone(latest.overallScore)] : undefined}
            hint={
              latest
                ? `${TONE_LABEL[scoreTone(latest.overallScore)]} · ${formatRelative(
                    Date.parse(latest.analyzedAt),
                  )}`
                : "Run a scan to get a score"
            }
          />
          <StatTile
            label="Priority findings"
            value={latest ? severityCounts.critical + severityCounts.warning : "—"}
            hint={
              latest
                ? `${severityCounts.critical} critical · ${severityCounts.warning} important`
                : "Run a scan to get findings"
            }
          />
          <StatTile
            label="CVs on file"
            value={summary.totalResumes}
            hint={`${summary.totalAnalyses} scan${
              summary.totalAnalyses === 1 ? "" : "s"
            } recorded`}
          />
          <StatTile
            label="Best score"
            value={summary.bestScore ?? "—"}
            unit={summary.bestScore !== null ? "%" : undefined}
            tone={
              summary.bestScore !== null
                ? TONE_TEXT[scoreTone(summary.bestScore)]
                : undefined
            }
            hint={
              summary.averageScore !== null
                ? `Average ${Math.round(summary.averageScore)}% across all scans`
                : "No scans recorded yet"
            }
          />
        </motion.div>

        {!latest ? (
          <Panel title="No analysis yet">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your document is stored and its text was extracted. Run the analysis to score it
              across the seven ATS dimensions.
            </p>
            {currentResume && (
              <Button className="mt-4 gap-2" onClick={() => navigate(`/cv/${currentResume.id}`)}>
                Open {currentResume.originalFilename}
                <ArrowRight className="size-4" />
              </Button>
            )}
          </Panel>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
            <motion.div
              variants={staggerContainer(0.08)}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              className="flex flex-col gap-6"
            >
              <Panel
                title="Dimension breakdown"
                action={
                  previous ? (
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      vs previous scan
                    </span>
                  ) : undefined
                }
              >
                <DimensionBars
                  dimensions={dimensions}
                  deltas={dimensionDeltas(previousDimensions, dimensions)}
                />
              </Panel>

              <Panel
                title="Priority fixes"
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => navigate(`/cv/${latest.resumeId}`)}
                  >
                    All findings
                    <ArrowRight className="size-3.5" />
                  </Button>
                }
              >
                <IssueList
                  issues={issues}
                  emptyLabel="No findings were raised for this scan. Your CV covers the essentials the engine checks."
                />
              </Panel>
            </motion.div>

            <motion.div
              variants={staggerContainer(0.08)}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              className="flex flex-col gap-6"
            >
              <Panel title="Coverage">
                <ScoreDial
                  score={score}
                  band={TONE_LABEL[scoreTone(score)]}
                  size={112}
                  caption={`Last analysed ${formatRelative(Date.parse(latest.analyzedAt))}`}
                />
                <div className="mt-6">
                  <ScoreTrend points={trendFromAnalyses(currentAnalyses)} />
                </div>
              </Panel>

              {currentResume && (
                <Panel
                  title="Current CV"
                  action={
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/cv")}>
                      Manage
                    </Button>
                  }
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border">
                      <FileText className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {currentResume.originalFilename}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatBytes(currentResume.fileSize)} · uploaded{" "}
                        {formatRelative(Date.parse(currentResume.uploadedAt))}
                      </p>
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-border/80 pt-4">
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        Format
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        {currentResume.fileType.includes("pdf") ? "PDF" : "DOCX"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        Scans
                      </dt>
                      <dd className="mt-1 text-sm tabular-nums text-foreground">
                        {currentAnalyses.length}
                      </dd>
                    </div>
                  </dl>
                </Panel>
              )}

              <Panel title="Do this next">
                <ol className="flex flex-col gap-4">
                  {latest.recommendations.slice(0, 4).map((recommendation, index) => (
                    <li key={recommendation.id} className="flex items-start gap-3">
                      <span className="grid size-5 shrink-0 place-items-center rounded-[3px] border border-border text-[10px] tabular-nums text-muted-foreground">
                        {index + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-foreground">
                        {recommendation.message}
                      </span>
                    </li>
                  ))}
                  {latest.recommendations.length === 0 && (
                    <li className="text-sm text-muted-foreground">
                      No outstanding actions for this scan.
                    </li>
                  )}
                </ol>
              </Panel>
            </motion.div>
          </div>
        )}

        <RecentScans
          analyses={summary.analyses}
          onOpen={(resumeId) => navigate(`/cv/${resumeId}`)}
        />

        <PlannedFeatures />
      </div>
    </AppShell>
  );
}

/**
 * Every scan across every CV, newest first.
 *
 * The dashboard focuses on the current CV, so without this list a scan of an
 * older document would only be reachable from the CV library.
 */
function RecentScans({
  analyses,
  onOpen,
}: {
  analyses: ReturnType<typeof summariseDashboard>["analyses"];
  onOpen: (resumeId: number) => void;
}) {
  if (analyses.length === 0) return null;

  return (
    <Panel
      title="Recent scans"
      action={
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {analyses.length} total
        </span>
      }
    >
      <ul className="divide-y divide-border/70">
        {analyses.slice(0, 5).map((analysis) => (
          <li key={analysis.id}>
            <button
              type="button"
              onClick={() => onOpen(analysis.resumeId)}
              className="flex w-full flex-wrap items-baseline gap-x-4 gap-y-1 py-3 text-left transition-colors hover:text-foreground"
            >
              <span
                className={cn(
                  "w-12 shrink-0 text-sm tabular-nums",
                  TONE_TEXT[scoreTone(analysis.overallScore)],
                )}
              >
                {analysis.overallScore}%
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {analysis.originalFilename}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatRelative(Date.parse(analysis.analyzedAt))}
              </span>
              <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {analysis.recommendations.length} finding
                {analysis.recommendations.length === 1 ? "" : "s"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function PlannedFeatures() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Roadmap</p>
          <h2 className="mt-2 text-lg font-medium tracking-tight text-foreground">
            Planned features
          </h2>
        </div>
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
          Visible now, marked clearly until their backend APIs ship.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANNED_TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.to}
              to={tile.to}
              className="group flex flex-col gap-3 rounded-md border border-dashed border-border bg-card px-6 py-5 transition-colors hover:border-foreground/30"
            >
              <span className="grid size-8 place-items-center rounded-md border border-border">
                <Icon className="size-4 text-muted-foreground" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{tile.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {tile.description}
                </p>
              </div>
              <span className="mt-auto text-[10px] uppercase tracking-[0.14em] text-warning">
                Coming soon
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
