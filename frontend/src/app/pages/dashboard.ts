import { Component, computed, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import {
  LucideArrowRight,
  LucideCircleAlert,
  LucideFileText,
  LucideScanLine,
} from "@lucide/angular";
import { ApiService } from "../core/api/api.service";
import type { DashboardStats, Resume, ResumeAnalysis } from "../core/api/api.types";
import {
  type DashboardSummary,
  summariseDashboard,
} from "../lib/cv/dashboard";
import {
  dimensionsFromAnalysis,
  issuesFromAnalysis,
  trendFromAnalyses,
} from "../lib/cv/report";
import { formatBytes } from "../lib/cv/validation";
import { TONE_LABEL, TONE_TEXT, formatRelative, scoreTone } from "../lib/format";
import type { AtsDimension } from "../lib/types";
import { cn } from "../lib/utils";
import {
  AlertComponent,
  AlertDescriptionComponent,
  AlertTitleComponent,
} from "../shared/alert";
import { AppShellComponent } from "../shared/app-shell";
import { buttonClass } from "../shared/button";
import { CvUploadDialogComponent } from "../shared/cv/cv-upload-dialog";
import { DimensionBarsComponent } from "../shared/cv/dimension-bars";
import { IssueListComponent } from "../shared/cv/issue-list";
import { ScoreDialComponent } from "../shared/cv/score-dial";
import { ScoreTrendComponent } from "../shared/cv/score-trend";
import { PageHeaderComponent } from "../shared/page-header";
import { PanelComponent, StatTileComponent } from "../shared/panel";
import { PlannedFeaturesComponent } from "../shared/planned-features";
import { SkeletonComponent } from "../shared/skeleton";

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

@Component({
  selector: "app-dashboard-page",
  imports: [
    RouterLink,
    AppShellComponent,
    PageHeaderComponent,
    PanelComponent,
    StatTileComponent,
    SkeletonComponent,
    AlertComponent,
    AlertTitleComponent,
    AlertDescriptionComponent,
    CvUploadDialogComponent,
    DimensionBarsComponent,
    IssueListComponent,
    ScoreDialComponent,
    ScoreTrendComponent,
    LucideArrowRight,
    LucideCircleAlert,
    LucideFileText,
    LucideScanLine,
    PlannedFeaturesComponent,
  ],
  template: `
    <app-shell area="Dashboard">
      @if (loading()) {
        <div class="flex flex-col gap-12">
          <app-skeleton className="h-24 w-full" />
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            @for (item of [0, 1, 2, 3]; track item) {
              <app-skeleton className="h-28 w-full" />
            }
          </div>
          <div class="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <app-skeleton className="h-80 w-full" />
            <app-skeleton className="h-80 w-full" />
          </div>
        </div>
      } @else if (error()) {
        <app-alert variant="destructive" className="rounded-md">
          <svg lucideCircleAlert class="size-4"></svg>
          <app-alert-title className="text-sm">We could not load your dashboard</app-alert-title>
          <app-alert-description className="text-sm leading-relaxed">
            {{ error()?.message }}
          </app-alert-description>
        </app-alert>
        <button type="button" [class]="buttonClass('outline', 'default', 'mt-6')" (click)="load()">
          Try again
        </button>
      } @else if (!hasResumes()) {
        <app-page-header
          eyebrow="Career dashboard"
          title="Dashboard"
          description="Your whole search in one place. Upload a CV to unlock the deterministic ATS analysis."
        />
        <div class="mt-12 rounded-md border border-dashed border-border">
          <div class="mx-auto flex max-w-xl flex-col items-center gap-6 px-6 py-16 text-center">
            <span class="grid size-10 place-items-center rounded-md border border-border">
              <svg lucideScanLine class="size-4 text-muted-foreground"></svg>
            </span>
            <div class="flex flex-col gap-2">
              <h2 class="text-lg font-medium tracking-tight text-foreground">No CV scanned yet</h2>
              <p class="text-sm leading-relaxed text-muted-foreground">
                CareerPilot needs one document to work with. Upload a text-based PDF or DOCX and the
                first report is generated in seconds.
              </p>
            </div>
            <ol class="flex w-full flex-col gap-3 text-left">
              @for (step of emptySteps; track step; let index = $index) {
                <li class="flex items-start gap-3 border-t border-border/80 pt-3">
                  <span class="text-xs tabular-nums text-muted-foreground">{{ index + 1 }}</span>
                  <span class="text-sm leading-relaxed text-muted-foreground">{{ step }}</span>
                </li>
              }
            </ol>
            <div class="flex flex-wrap items-center justify-center gap-3">
              <app-cv-upload-dialog label="Upload my CV" (uploaded)="openResume($event)" />
              <a routerLink="/cv" [class]="buttonClass('outline')">Manage my CVs</a>
            </div>
          </div>
        </div>
        <div class="mt-12">
          <app-planned-features />
        </div>
      } @else {
        <app-page-header
          eyebrow="Career dashboard"
          title="Dashboard"
          [description]="headerDescription()"
        >
          @if (summary().currentResume; as currentResume) {
            <a [routerLink]="['/cv', currentResume.id]" [class]="buttonClass('outline')">
              Open CV report
            </a>
            @if (summary().previous) {
              <a
                [routerLink]="['/cv', currentResume.id, 'compare']"
                [class]="buttonClass('outline', 'default', 'gap-2')"
              >
                Compare scans
              </a>
            }
          }
          <app-cv-upload-dialog label="New scan" (uploaded)="openResume($event)" />
        </app-page-header>

        <div class="mt-12 flex flex-col gap-10">
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <app-stat-tile
              label="Latest ATS score"
              [value]="summary().latest ? summary().latest!.overallScore : '—'"
              [unit]="summary().latest ? '%' : undefined"
              [tone]="latestTone()"
              [hint]="latestHint()"
            />
            <app-stat-tile
              label="Priority findings"
              [value]="summary().latest ? severityTotal() : '—'"
              [hint]="severityHint()"
            />
            <app-stat-tile
              label="CVs on file"
              [value]="summary().totalResumes"
              [hint]="scanCountLabel()"
            />
            <app-stat-tile
              label="Best score"
              [value]="summary().bestScore ?? '—'"
              [unit]="summary().bestScore !== null ? '%' : undefined"
              [tone]="bestTone()"
              [hint]="bestHint()"
            />
          </div>

          @if (!summary().latest) {
            <app-panel title="No analysis yet">
              <p class="text-sm leading-relaxed text-muted-foreground">
                Your document is stored and its text was extracted. Run the analysis to score it
                across the seven ATS dimensions.
              </p>
              @if (summary().currentResume; as currentResume) {
                <a
                  [routerLink]="['/cv', currentResume.id]"
                  [class]="buttonClass('default', 'default', 'mt-4 gap-2')"
                >
                  Open {{ currentResume.originalFilename }}
                  <svg lucideArrowRight class="size-4"></svg>
                </a>
              }
            </app-panel>
          } @else {
            <div class="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
              <div class="flex flex-col gap-6">
                <app-panel title="Dimension breakdown">
                  @if (summary().previous) {
                    <span panelAction class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      vs previous scan
                    </span>
                  }
                  <app-dimension-bars
                    [dimensions]="dimensions()"
                    [deltas]="deltas()"
                  />
                </app-panel>

                <app-panel title="Priority fixes">
                  <a
                    panelAction
                    [routerLink]="['/cv', summary().latest!.resumeId]"
                    [class]="buttonClass('ghost', 'sm', 'gap-1.5 text-xs')"
                  >
                    All findings
                    <svg lucideArrowRight class="size-3.5"></svg>
                  </a>
                  <app-issue-list
                    [issues]="issues()"
                    emptyLabel="No findings were raised for this scan. Your CV covers the essentials the engine checks."
                  />
                </app-panel>
              </div>

              <div class="flex flex-col gap-6">
                <app-panel title="Coverage">
                  <app-score-dial
                    [score]="latestScore()"
                    [band]="latestBand()"
                    [size]="112"
                    [caption]="trendCaption()"
                  />
                  <div class="mt-6">
                    <app-score-trend [points]="trend()" />
                  </div>
                </app-panel>

                @if (summary().currentResume; as currentResume) {
                  <app-panel title="Current CV">
                    <a panelAction routerLink="/cv" [class]="buttonClass('ghost', 'sm', 'text-xs')">
                      Manage
                    </a>
                    <div class="flex items-start gap-3">
                      <span class="grid size-9 shrink-0 place-items-center rounded-md border border-border">
                        <svg lucideFileText class="size-4 text-muted-foreground"></svg>
                      </span>
                      <div class="min-w-0">
                        <p class="truncate text-sm font-medium text-foreground">
                          {{ currentResume.originalFilename }}
                        </p>
                        <p class="truncate text-xs text-muted-foreground">
                          {{ formatBytes(currentResume.fileSize) }} · uploaded
                          {{ formatRelative(dateValue(currentResume.uploadedAt)) }}
                        </p>
                      </div>
                    </div>
                    <dl class="mt-4 grid grid-cols-2 gap-4 border-t border-border/80 pt-4">
                      <div>
                        <dt class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Format</dt>
                        <dd class="mt-1 text-sm text-foreground">
                          {{ currentResume.fileType.includes("pdf") ? "PDF" : "DOCX" }}
                        </dd>
                      </div>
                      <div>
                        <dt class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Scans</dt>
                        <dd class="mt-1 text-sm tabular-nums text-foreground">
                          {{ summary().currentAnalyses.length }}
                        </dd>
                      </div>
                    </dl>
                  </app-panel>
                }

                <app-panel title="Do this next">
                  <ol class="flex flex-col gap-4">
                    @for (recommendation of topRecommendations(); track recommendation.id; let index = $index) {
                      <li class="flex items-start gap-3">
                        <span class="grid size-5 shrink-0 place-items-center rounded-[3px] border border-border text-[10px] tabular-nums text-muted-foreground">
                          {{ index + 1 }}
                        </span>
                        <span class="text-sm leading-relaxed text-foreground">{{ recommendation.message }}</span>
                      </li>
                    }
                    @if (topRecommendations().length === 0) {
                      <li class="text-sm text-muted-foreground">No outstanding actions for this scan.</li>
                    }
                  </ol>
                </app-panel>
              </div>
            </div>
          }

          @if (recentAnalyses().length > 0) {
            <app-panel title="Recent scans">
              <span panelAction class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {{ recentAnalyses().length }} total
              </span>
              <ul class="divide-y divide-border/70">
                @for (analysis of recentAnalyses(); track analysis.id) {
                  <li>
                    <a
                      [routerLink]="['/cv', analysis.resumeId]"
                      class="flex w-full flex-wrap items-baseline gap-x-4 gap-y-1 py-3 text-left transition-colors hover:text-foreground"
                    >
                      <span [class]="cn('w-12 shrink-0 text-sm tabular-nums', TONE_TEXT[scoreTone(analysis.overallScore)])">
                        {{ analysis.overallScore }}%
                      </span>
                      <span class="min-w-0 flex-1 truncate text-sm text-foreground">{{ analysis.originalFilename }}</span>
                      <span class="text-xs text-muted-foreground">
                        {{ formatRelative(dateValue(analysis.analyzedAt)) }}
                      </span>
                      <span class="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                        {{ analysis.recommendations.length }} finding{{ analysis.recommendations.length === 1 ? "" : "s" }}
                      </span>
                    </a>
                  </li>
                }
              </ul>
            </app-panel>
          }

          <app-planned-features />
        </div>
      }
    </app-shell>

  `,
})
export class DashboardPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly stats = signal<DashboardStats | undefined>(undefined);
  protected readonly resumes = signal<Resume[]>([]);
  protected readonly history = signal<ResumeAnalysis[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<Error | null>(null);

  protected readonly buttonClass = buttonClass;
  protected readonly cn = cn;
  protected readonly TONE_TEXT = TONE_TEXT;
  protected readonly scoreTone = scoreTone;
  protected readonly formatRelative = formatRelative;
  protected readonly formatBytes = formatBytes;
  protected readonly emptySteps = [
    "Upload the PDF or DOCX you send to employers.",
    "The server extracts the text and parses your sections.",
    "Get seven dimension scores, findings and a prioritised fix list.",
  ];

  protected readonly summary = computed<DashboardSummary>(() =>
    summariseDashboard({
      stats: this.stats(),
      resumes: this.resumes(),
      analyses: this.history(),
    }),
  );

  protected readonly hasResumes = computed(
    () => this.resumes().length > 0 || this.summary().totalResumes > 0,
  );
  protected readonly latestScore = computed(() => this.summary().latest?.overallScore ?? 0);
  protected readonly latestTone = computed(() =>
    this.summary().latest
      ? TONE_TEXT[scoreTone(this.summary().latest!.overallScore)]
      : undefined,
  );
  protected readonly bestTone = computed(() => {
    const best = this.summary().bestScore;
    return best !== null ? TONE_TEXT[scoreTone(best)] : undefined;
  });
  protected readonly latestBand = computed(() =>
    TONE_LABEL[scoreTone(this.summary().latest?.overallScore)],
  );
  protected readonly dimensions = computed(() => {
    const latest = this.summary().latest;
    return latest ? dimensionsFromAnalysis(latest) : [];
  });
  protected readonly issues = computed(() => {
    const latest = this.summary().latest;
    return latest ? issuesFromAnalysis(latest) : [];
  });
  protected readonly deltas = computed(() => {
    const previous = this.summary().previous;
    return dimensionDeltas(previous ? dimensionsFromAnalysis(previous) : undefined, this.dimensions());
  });
  protected readonly trend = computed(() => trendFromAnalyses(this.summary().currentAnalyses));
  protected readonly recentAnalyses = computed(() => this.summary().analyses.slice(0, 5));
  protected readonly topRecommendations = computed(
    () => this.summary().latest?.recommendations.slice(0, 4) ?? [],
  );
  protected readonly severityTotal = computed(() => {
    const counts = this.summary().severityCounts;
    return counts.critical + counts.warning;
  });

  protected readonly headerDescription = computed(() => {
    const { latest, currentResume, totalAnalyses } = this.summary();
    if (!latest) {
      return "Your CV is on file but has not been scored yet. Open it to run the first scan.";
    }
    const name = currentResume?.originalFilename ?? latest.originalFilename;
    return `Latest scan: ${name} · ${formatRelative(Date.parse(latest.analyzedAt))} · ${totalAnalyses} scan${
      totalAnalyses === 1 ? "" : "s"
    } recorded.`;
  });

  protected readonly latestHint = computed(() => {
    const latest = this.summary().latest;
    if (!latest) return "Run a scan to get a score";
    return `${TONE_LABEL[scoreTone(latest.overallScore)]} · ${formatRelative(
      Date.parse(latest.analyzedAt),
    )}`;
  });

  protected readonly severityHint = computed(() => {
    if (!this.summary().latest) return "Run a scan to get findings";
    const counts = this.summary().severityCounts;
    return `${counts.critical} critical · ${counts.warning} important`;
  });

  protected readonly scanCountLabel = computed(() => {
    const total = this.summary().totalAnalyses;
    return `${total} scan${total === 1 ? "" : "s"} recorded`;
  });

  protected readonly bestHint = computed(() => {
    const { averageScore, bestScore } = this.summary();
    if (averageScore !== null) return `Average ${Math.round(averageScore)}% across all scans`;
    return bestScore !== null ? "Across every scan" : "No scans recorded yet";
  });

  protected readonly trendCaption = computed(() => {
    const latest = this.summary().latest;
    return latest ? `Last analysed ${formatRelative(Date.parse(latest.analyzedAt))}` : "";
  });

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [stats, resumes, history] = await Promise.all([
        this.api.dashboard.stats(),
        this.api.resumes.list(),
        this.api.analyses.history(),
      ]);
      this.stats.set(stats);
      this.resumes.set(resumes);
      this.history.set(history);
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause : new Error(String(cause)));
    } finally {
      this.loading.set(false);
    }
  }

  protected openResume(resumeId: number): void {
    void this.router.navigate(["/cv", resumeId]);
  }

  protected dateValue(value: string): number {
    return Date.parse(value);
  }
}
