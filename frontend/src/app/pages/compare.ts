import { Component, type OnInit, computed, inject, input, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  LucideArrowDown,
  LucideArrowLeft,
  LucideArrowRight,
  LucideArrowUp,
  LucideCircleAlert,
  LucideColumns2,
  LucideLoaderCircle,
  LucideMinus,
  LucideRefreshCw,
} from "@lucide/angular";
import { ApiService } from "../core/api/api.service";
import type { ResumeAnalysis, ResumeDetail } from "../core/api/api.types";
import { ToastService } from "../core/toast/toast.service";
import {
  type DimensionComparison,
  type FindingChange,
  compareAnalyses,
  defaultComparisonPair,
  describeOverallDelta,
} from "../lib/cv/compare";
import { sortAnalysesNewestFirst } from "../lib/cv/dashboard";
import { describeError } from "../lib/cv/report";
import { formatBytes } from "../lib/cv/validation";
import {
  SEVERITY_CLASS,
  SEVERITY_LABEL,
  TONE_LABEL,
  TONE_TEXT,
  formatDateTime,
  scoreTone,
} from "../lib/format";
import type { AtsIssue } from "../lib/types";
import { cn } from "../lib/utils";
import {
  AlertComponent,
  AlertDescriptionComponent,
  AlertTitleComponent,
} from "../shared/alert";
import { AppShellComponent } from "../shared/app-shell";
import { buttonClass } from "../shared/button";
import { IssueListComponent } from "../shared/cv/issue-list";
import { ScoreDialComponent } from "../shared/cv/score-dial";
import { PageHeaderComponent } from "../shared/page-header";
import { PanelComponent } from "../shared/panel";
import { SkeletonComponent } from "../shared/skeleton";

function toIssues(findings: FindingChange[]): AtsIssue[] {
  return findings.map((finding) => ({
    id: finding.key,
    severity: finding.severity,
    title: finding.title,
    explanation: finding.message,
    dimension: finding.category.toLowerCase().replace(/\s+/g, "_"),
  }));
}

/**
 * Compare any two stored scans of one CV.
 *
 * The report already shows the change against the immediately previous scan;
 * this screen answers the wider question — "did my edit actually help?" — by
 * letting the user pick the baseline and the compared scan and showing the
 * movement per dimension plus the findings that appeared and were resolved.
 */
@Component({
  selector: "app-compare-page",
  imports: [
    RouterLink,
    AppShellComponent,
    PageHeaderComponent,
    PanelComponent,
    SkeletonComponent,
    AlertComponent,
    AlertTitleComponent,
    AlertDescriptionComponent,
    ScoreDialComponent,
    IssueListComponent,
    LucideArrowDown,
    LucideArrowLeft,
    LucideArrowRight,
    LucideArrowUp,
    LucideCircleAlert,
    LucideColumns2,
    LucideLoaderCircle,
    LucideMinus,
    LucideRefreshCw,
  ],
  template: `
    <app-shell area="Compare scans">
      @if (!validId() || (!loading() && (error() || !document()))) {
        <app-alert variant="destructive" className="rounded-md">
          <svg lucideCircleAlert class="size-4"></svg>
          <app-alert-title className="text-sm">This comparison is not available</app-alert-title>
          <app-alert-description className="text-sm leading-relaxed">
            The CV was deleted, or it belongs to another account.
          </app-alert-description>
        </app-alert>
        <a routerLink="/cv" [class]="buttonClass('outline', 'default', 'mt-6 gap-2')">
          <svg lucideArrowLeft class="size-4"></svg>
          Back to my CV
        </a>
      } @else if (loading()) {
        <div class="flex flex-col gap-6">
          <app-skeleton className="h-24 w-full" />
          <app-skeleton className="h-96 w-full" />
        </div>
      } @else if (document(); as doc) {
        <div class="mb-8">
          <a
            [routerLink]="['/cv', id()]"
            class="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg lucideArrowLeft class="size-3.5"></svg>
            Back to the CV report
          </a>
        </div>

        <app-page-header
          eyebrow="Scan comparison"
          [title]="doc.originalFilename"
          [description]="description(doc)"
        >
          <a [routerLink]="['/cv', id()]" [class]="buttonClass('outline', 'default', 'gap-2')">
            <svg lucideColumns2 class="size-4"></svg>
            Open the report
          </a>
          <button
            type="button"
            [class]="buttonClass('outline', 'default', 'gap-2')"
            [disabled]="scanning()"
            (click)="handleScan()"
          >
            @if (scanning()) {
              <svg lucideLoaderCircle class="size-4 animate-spin"></svg>
            } @else {
              <svg lucideRefreshCw class="size-4"></svg>
            }
            Run a new scan
          </button>
        </app-page-header>

        @if (analyses().length < 2) {
          <div class="mt-10 flex flex-col gap-6">
            <app-alert className="rounded-md">
              <svg lucideCircleAlert class="size-4"></svg>
              <app-alert-title className="text-sm">Two scans are needed to compare</app-alert-title>
              <app-alert-description className="text-sm leading-relaxed">
                This CV has {{ analyses().length }} stored scan{{ analyses().length === 1 ? "" : "s" }}.
                Edit the document, upload it again, or re-scan it, and the comparison becomes
                available.
              </app-alert-description>
            </app-alert>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                [class]="buttonClass('default', 'default', 'gap-2')"
                [disabled]="scanning()"
                (click)="handleScan()"
              >
                <svg lucideRefreshCw class="size-4"></svg>
                Scan this CV
              </button>
              <a [routerLink]="['/cv', id()]" [class]="buttonClass('outline')">Back to the report</a>
            </div>
          </div>
        } @else if (comparison(); as comparison) {
          <div class="mt-10 flex flex-col gap-6">
            <!-- Scan pickers -->
            <div class="grid gap-4 rounded-md border border-border bg-card p-5 sm:grid-cols-2">
              <label class="flex flex-col gap-2">
                <span class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Baseline scan
                </span>
                <select
                  [class]="selectClass()"
                  [value]="beforeId()"
                  (change)="setBefore($event)"
                >
                  @for (analysis of analyses(); track analysis.id) {
                    <option [value]="analysis.id" [selected]="analysis.id === beforeId()">
                      {{ analysis.overallScore }}% · {{ formatDateTime(dateValue(analysis.analyzedAt)) }}
                    </option>
                  }
                </select>
              </label>
              <label class="flex flex-col gap-2">
                <span class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Compared scan
                </span>
                <select
                  [class]="selectClass()"
                  [value]="afterId()"
                  (change)="setAfter($event)"
                >
                  @for (analysis of analyses(); track analysis.id) {
                    <option [value]="analysis.id" [selected]="analysis.id === afterId()">
                      {{ analysis.overallScore }}% · {{ formatDateTime(dateValue(analysis.analyzedAt)) }}
                    </option>
                  }
                </select>
              </label>
            </div>

            <!-- Overall movement -->
            <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <app-panel title="Overall movement">
                <div class="flex flex-wrap items-center gap-8">
                  <app-score-dial
                    [score]="comparison.after.overallScore"
                    [band]="band(comparison.after.overallScore)"
                    [size]="104"
                    [caption]="'Compared scan · ' + formatDateTime(dateValue(comparison.after.analyzedAt))"
                  />
                  <div class="flex flex-col gap-2">
                    <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      Change vs baseline
                    </p>
                    <p [class]="cn('flex items-center gap-2 text-3xl font-medium tabular-nums', deltaTone(comparison.overallDelta))">
                      @if (comparison.overallDelta > 0) {
                        <svg lucideArrowUp class="size-5"></svg>
                      } @else if (comparison.overallDelta < 0) {
                        <svg lucideArrowDown class="size-5"></svg>
                      } @else {
                        <svg lucideMinus class="size-5"></svg>
                      }
                      {{ signed(comparison.overallDelta) }}
                    </p>
                    <p class="text-xs leading-relaxed text-muted-foreground">
                      {{ describeOverallDelta(comparison.overallDelta) }} ·
                      baseline {{ comparison.before.overallScore }}%
                    </p>
                  </div>
                </div>
                <dl class="mt-6 grid grid-cols-3 divide-x divide-border/70 border-y border-border/70">
                  <div class="px-4 py-3">
                    <dt class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Improved</dt>
                    <dd class="mt-1 text-xl font-medium tabular-nums text-success">{{ comparison.improved.length }}</dd>
                  </div>
                  <div class="px-4 py-3">
                    <dt class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Regressed</dt>
                    <dd class="mt-1 text-xl font-medium tabular-nums text-critical">{{ comparison.regressed.length }}</dd>
                  </div>
                  <div class="px-4 py-3">
                    <dt class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Unchanged</dt>
                    <dd class="mt-1 text-xl font-medium tabular-nums text-muted-foreground">{{ comparison.unchanged.length }}</dd>
                  </div>
                </dl>
              </app-panel>

              <app-panel title="Findings movement">
                <dl class="flex flex-col gap-4">
                  <div class="flex items-center justify-between gap-4">
                    <dt class="text-xs text-muted-foreground">Resolved</dt>
                    <dd class="text-sm font-medium tabular-nums text-success">{{ comparison.resolved.length }}</dd>
                  </div>
                  <div class="flex items-center justify-between gap-4">
                    <dt class="text-xs text-muted-foreground">Still open</dt>
                    <dd class="text-sm font-medium tabular-nums text-foreground">{{ comparison.stillOpen.length }}</dd>
                  </div>
                  <div class="flex items-center justify-between gap-4">
                    <dt class="text-xs text-muted-foreground">Newly raised</dt>
                    <dd class="text-sm font-medium tabular-nums text-warning">{{ comparison.appeared.length }}</dd>
                  </div>
                </dl>
                <p class="mt-5 border-t border-border/80 pt-4 text-xs leading-relaxed text-muted-foreground">
                  Findings are matched by their category and message across scans, so a stored
                  recommendation that is no longer raised counts as resolved.
                </p>
              </app-panel>
            </div>

            <!-- Dimension by dimension -->
            <app-panel title="Dimension by dimension">
              <ul class="divide-y divide-border/70">
                @for (dimension of comparison.dimensions; track dimension.key) {
                  <li class="py-4 first:pt-0 last:pb-0">
                    <div class="flex flex-wrap items-baseline justify-between gap-2">
                      <p class="text-sm font-medium text-foreground">{{ dimension.label }}</p>
                      <p class="text-xs tabular-nums text-muted-foreground">
                        {{ dimension.before }}% <svg lucideArrowRight class="inline size-3"></svg>
                        <span [class]="cn('ml-1 text-sm', deltaTone(dimension.delta))">
                          {{ dimension.after }}%
                        </span>
                        @if (dimension.delta !== 0) {
                          <span [class]="cn('ml-2', deltaTone(dimension.delta))">
                            {{ signed(dimension.delta) }}
                          </span>
                        }
                      </p>
                    </div>
                    <div class="mt-2.5 flex flex-col gap-1.5">
                      <div class="flex items-center gap-3">
                        <span class="w-16 shrink-0 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Baseline</span>
                        <span class="h-[3px] flex-1 overflow-hidden rounded-full bg-secondary">
                          <span
                            class="block h-full rounded-full bg-muted-foreground/60"
                            [style.width.%]="dimension.before"
                          ></span>
                        </span>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="w-16 shrink-0 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Compared</span>
                        <span class="h-[3px] flex-1 overflow-hidden rounded-full bg-secondary">
                          <span
                            [class]="cn('cp-bar-fill block h-full rounded-full', barTone(dimension))"
                            [style.width.%]="dimension.after"
                          ></span>
                        </span>
                      </div>
                    </div>
                    <p class="mt-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Weighted {{ dimension.weight }}% of the overall score
                    </p>
                  </li>
                }
              </ul>
            </app-panel>

            <!-- Findings that changed -->
            <div class="grid gap-6 lg:grid-cols-2">
              <app-panel title="Resolved findings">
                <app-issue-list
                  [issues]="resolvedIssues()"
                  emptyLabel="No finding from the baseline scan was resolved by the compared scan."
                />
              </app-panel>
              <app-panel title="Newly raised findings">
                <app-issue-list
                  [issues]="appearedIssues()"
                  emptyLabel="The compared scan raised no new findings."
                />
              </app-panel>
            </div>

            @if (comparison.stillOpen.length > 0) {
              <app-panel title="Still open">
                <ul class="flex flex-col gap-3">
                  @for (finding of comparison.stillOpen; track finding.key) {
                    <li class="flex flex-col gap-1 border-b border-border/70 pb-3 last:border-0 last:pb-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <span [class]="cn('rounded-[3px] border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em]', SEVERITY_CLASS[finding.severity])">
                          {{ SEVERITY_LABEL[finding.severity] }}
                        </span>
                        <span class="text-sm font-medium text-foreground">{{ finding.title }}</span>
                      </div>
                      <p class="text-sm leading-relaxed text-muted-foreground">{{ finding.message }}</p>
                    </li>
                  }
                </ul>
              </app-panel>
            }

            @if (comparison.overallDelta === 0 && comparison.appeared.length === 0 && comparison.resolved.length === 0) {
              <p class="text-xs leading-relaxed text-muted-foreground">
                These two scans produced the same score and the same findings. The deterministic
                engine always returns the same result for the same extracted text, so an edit has
                to change what it measures.
              </p>
            }
          </div>
        }
      }
    </app-shell>
  `,
})
export class ComparePage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);

  /** Route parameter, bound by `withComponentInputBinding`. */
  readonly resumeId = input<string | null>(null);

  protected readonly document = signal<ResumeDetail | null>(null);
  protected readonly analyses = signal<ResumeAnalysis[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<Error | null>(null);
  protected readonly scanning = signal(false);
  protected readonly beforeId = signal<number | null>(null);
  protected readonly afterId = signal<number | null>(null);

  protected readonly buttonClass = buttonClass;
  protected readonly formatDateTime = formatDateTime;
  protected readonly formatBytes = formatBytes;
  protected readonly describeOverallDelta = describeOverallDelta;
  protected readonly SEVERITY_LABEL = SEVERITY_LABEL;
  protected readonly SEVERITY_CLASS = SEVERITY_CLASS;
  protected readonly TONE_LABEL = TONE_LABEL;
  protected readonly cn = cn;
  protected readonly dateValue = (value: string) => Date.parse(value);

  protected readonly id = computed(() => Number(this.resumeId()));
  protected readonly validId = computed(() => Number.isInteger(this.id()) && this.id() > 0);

  protected readonly comparison = computed(() => {
    const before = this.analyses().find((analysis) => analysis.id === this.beforeId());
    const after = this.analyses().find((analysis) => analysis.id === this.afterId());
    if (!before || !after || before.id === after.id) return null;
    return compareAnalyses(before, after);
  });

  protected readonly resolvedIssues = computed(() =>
    this.comparison() ? toIssues(this.comparison()!.resolved) : [],
  );
  protected readonly appearedIssues = computed(() =>
    this.comparison() ? toIssues(this.comparison()!.appeared) : [],
  );

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    if (!this.validId()) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      const [document, analyses] = await Promise.all([
        this.api.resumes.get(this.id()),
        this.api.analyses.forResume(this.id()),
      ]);
      this.document.set(document);
      const ordered = sortAnalysesNewestFirst(analyses);
      this.analyses.set(ordered);

      const pair = defaultComparisonPair(ordered);
      this.beforeId.set(pair?.before.id ?? ordered[0]?.id ?? null);
      this.afterId.set(pair?.after.id ?? ordered[0]?.id ?? null);
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause : new Error(String(cause)));
    } finally {
      this.loading.set(false);
    }
  }

  protected selectClass(): string {
    return cn(
      "border-input dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
    );
  }

  protected setBefore(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    if (Number.isNaN(id)) return;
    // Two different scans are required; when the user picks the scan that is
    // already on the other side, swap them instead of silently ignoring it.
    if (id === this.afterId()) this.afterId.set(this.beforeId());
    this.beforeId.set(id);
  }

  protected setAfter(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    if (Number.isNaN(id)) return;
    if (id === this.beforeId()) this.beforeId.set(this.afterId());
    this.afterId.set(id);
  }

  protected description(doc: ResumeDetail): string {
    const count = this.analyses().length;
    return `${formatBytes(doc.fileSize)} · ${count} stored scan${count === 1 ? "" : "s"} · pick any two to see what changed.`;
  }

  protected band(score: number): string {
    return TONE_LABEL[scoreTone(score)];
  }

  protected signed(delta: number): string {
    return delta > 0 ? `+${delta}` : String(delta);
  }

  protected deltaTone(delta: number): string {
    if (delta > 0) return "text-success";
    if (delta < 0) return "text-critical";
    return "text-muted-foreground";
  }

  protected barTone(dimension: DimensionComparison): string {
    const tone = scoreTone(dimension.after);
    if (tone === "strong") return "bg-success";
    if (tone === "needs_work") return "bg-warning";
    if (tone === "weak") return "bg-critical";
    return "bg-foreground";
  }

  protected async handleScan(): Promise<void> {
    this.scanning.set(true);
    try {
      await this.api.analyses.analyze(this.id());
      await this.load();
      this.toastService.success("Scan complete.");
    } catch (cause) {
      this.toastService.error(describeError(cause, "We could not scan this CV."));
    } finally {
      this.scanning.set(false);
    }
  }
}
