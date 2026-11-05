import {
  Component,
  ElementRef,
  type OnInit,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import {
  LucideArrowLeft,
  LucideCircleAlert,
  LucideDownload,
  LucideFileText,
  LucideLoaderCircle,
  LucideRefreshCw,
  LucideSparkles,
  LucideTrash2,
} from "@lucide/angular";
import { ApiService } from "../core/api/api.service";
import type { ResumeAnalysis, ResumeDetail } from "../core/api/api.types";
import { ComingSoonService } from "../core/coming-soon/coming-soon.service";
import { ToastService } from "../core/toast/toast.service";
import {
  countSeverities,
  describeError,
  dimensionsFromAnalysis,
  issuesFromAnalysis,
} from "../lib/cv/report";
import { formatBytes } from "../lib/cv/validation";
import { TONE_LABEL, TONE_TEXT, formatDateTime, scoreTone } from "../lib/format";
import { cn } from "../lib/utils";
import {
  AlertComponent,
  AlertDescriptionComponent,
  AlertTitleComponent,
} from "../shared/alert";
import { AppShellComponent } from "../shared/app-shell";
import { buttonClass } from "../shared/button";
import { DimensionBarsComponent } from "../shared/cv/dimension-bars";
import { IssueListComponent, SeveritySummaryComponent } from "../shared/cv/issue-list";
import { ScoreDialComponent } from "../shared/cv/score-dial";
import { PageHeaderComponent } from "../shared/page-header";
import { PanelComponent } from "../shared/panel";
import { SkeletonComponent } from "../shared/skeleton";

type Tab = "overview" | "findings" | "sections" | "text" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "findings", label: "Findings" },
  { id: "sections", label: "Section feedback" },
  { id: "text", label: "Extracted text" },
  { id: "history", label: "History" },
];

function downloadTextFile(fileName: string, text: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

@Component({
  selector: "app-cv-analysis-page",
  imports: [
    RouterLink,
    AppShellComponent,
    PageHeaderComponent,
    PanelComponent,
    SkeletonComponent,
    AlertComponent,
    AlertTitleComponent,
    AlertDescriptionComponent,
    DimensionBarsComponent,
    IssueListComponent,
    SeveritySummaryComponent,
    ScoreDialComponent,
    LucideArrowLeft,
    LucideCircleAlert,
    LucideDownload,
    LucideFileText,
    LucideLoaderCircle,
    LucideRefreshCw,
    LucideSparkles,
    LucideTrash2,
  ],
  template: `
    <app-shell area="CV report">
      @if (!validId() || (!loading() && (error() || !document()))) {
        <app-alert variant="destructive" className="rounded-md">
          <svg lucideCircleAlert class="size-4"></svg>
          <app-alert-title className="text-sm">This report is not available</app-alert-title>
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
            routerLink="/cv"
            class="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg lucideArrowLeft class="size-3.5"></svg>
            Back to my CV
          </a>
        </div>

        <app-page-header
          eyebrow="CV report"
          [title]="doc.originalFilename"
          [description]="headerDescription(doc)"
        >
          <button
            type="button"
            [class]="buttonClass('default', 'default', 'gap-2')"
            (click)="showComingSoon('The CV editor and ATS export')"
          >
            <svg lucideSparkles class="size-4"></svg>
            Build the ATS version
          </button>
          @if (analyses().length >= 2 && active()) {
            <a
              [routerLink]="['/cv', id(), 'compare']"
              [class]="buttonClass('outline', 'default', 'gap-2')"
            >
              Compare scans
            </a>
          }
          <button type="button" [class]="buttonClass('outline', 'default', 'gap-2')" (click)="downloadText(doc)">
            <svg lucideDownload class="size-4"></svg>
            Download text
          </button>
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
            {{ active() ? "Re-scan" : "Run scan" }}
          </button>
          <button
            type="button"
            [class]="buttonClass('ghost', 'default', 'gap-2 text-critical hover:text-critical')"
            (click)="openDeleteDialog()"
          >
            <svg lucideTrash2 class="size-4"></svg>
            Delete
          </button>
        </app-page-header>

        @if (!active()) {
          <div class="mt-10 flex flex-col gap-6">
            <app-alert className="rounded-md">
              <svg lucideCircleAlert class="size-4"></svg>
              <app-alert-title className="text-sm">No analysis stored for this CV</app-alert-title>
              <app-alert-description className="text-sm leading-relaxed">
                Run a scan to generate the deterministic ATS report for this document.
              </app-alert-description>
            </app-alert>
            <div class="flex gap-2">
              <button
                type="button"
                [class]="buttonClass('default', 'default', 'gap-2')"
                [disabled]="scanning()"
                (click)="handleScan()"
              >
                @if (scanning()) {
                  <svg lucideLoaderCircle class="size-4 animate-spin"></svg>
                } @else {
                  <svg lucideRefreshCw class="size-4"></svg>
                }
                Scan this CV
              </button>
              <a routerLink="/cv" [class]="buttonClass('outline')">Back to my CV</a>
            </div>
          </div>
        } @else {
          <div class="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
            <div class="flex flex-col gap-6">
              <app-panel title="ATS compatibility">
                <app-score-dial
                  [score]="active()!.overallScore"
                  [band]="activeBand()"
                  [caption]="'Scanned ' + formatDateTime(dateValue(active()!.analyzedAt))"
                />
                <div class="mt-6">
                  <app-severity-summary [counts]="counts()" />
                </div>
              </app-panel>

              <div class="flex flex-col gap-2">
                <div
                  role="tablist"
                  aria-label="Report sections"
                  class="inline-flex h-auto w-full flex-wrap items-center justify-start gap-1 rounded-md bg-secondary/70 p-1"
                >
                  @for (tab of tabs; track tab.id) {
                    <button
                      type="button"
                      role="tab"
                      [attr.aria-selected]="activeTab() === tab.id"
                      [class]="tabClass(tab.id)"
                      (click)="activeTab.set(tab.id)"
                    >
                      {{ tabLabel(tab) }}
                    </button>
                  }
                </div>

                @switch (activeTab()) {
                  @case ("overview") {
                    <div class="mt-6 flex flex-col gap-6">
                      <app-panel title="Dimension breakdown">
                        <app-dimension-bars [dimensions]="dimensions()" [deltas]="deltas()" />
                      </app-panel>

                      <div class="grid gap-6 md:grid-cols-2">
                        <app-panel title="Do this next">
                          <ol class="flex flex-col gap-4">
                            @for (recommendation of active()!.recommendations; track recommendation.id; let index = $index) {
                              <li class="flex items-start gap-3">
                                <span class="grid size-5 shrink-0 place-items-center rounded-[3px] border border-border text-[10px] tabular-nums text-muted-foreground">
                                  {{ index + 1 }}
                                </span>
                                <span class="text-sm leading-relaxed text-foreground">
                                  {{ recommendation.message }}
                                </span>
                              </li>
                            }
                            @if (active()!.recommendations.length === 0) {
                              <li class="text-sm text-muted-foreground">
                                No outstanding actions for this scan.
                              </li>
                            }
                          </ol>
                        </app-panel>

                        <app-panel title="Working well">
                          @if (strongDimensions().length === 0) {
                            <p class="text-sm text-muted-foreground">
                              No dimension reached 80% yet. Resolve the critical findings first.
                            </p>
                          } @else {
                            <ul class="flex flex-col gap-4">
                              @for (dimension of strongDimensions(); track dimension.key) {
                                <li class="text-sm leading-relaxed text-muted-foreground">
                                  <span class="mr-2 text-foreground">✓</span>
                                  {{ dimension.label }} scored {{ dimension.score }}%
                                </li>
                              }
                            </ul>
                          }
                        </app-panel>
                      </div>
                    </div>
                  }

                  @case ("findings") {
                    <div class="mt-6">
                      <app-panel title="All findings">
                        <app-issue-list [issues]="issues()" emptyLabel="No findings were raised for this scan." />
                      </app-panel>
                    </div>
                  }

                  @case ("sections") {
                    <div class="mt-6">
                      <app-panel title="Feedback per dimension">
                        <ul class="divide-y divide-border/70">
                          @for (section of active()!.sections; track section.id) {
                            <li class="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
                              <div class="flex items-baseline justify-between gap-4">
                                <p class="text-sm font-medium text-foreground">
                                  {{ sectionTitle(section.sectionType) }}
                                </p>
                                <span [class]="cn('text-sm tabular-nums', TONE_TEXT[scoreTone(section.score)])">
                                  {{ section.score }}%
                                </span>
                              </div>
                              <p class="text-sm leading-relaxed text-muted-foreground">
                                {{ section.feedback }}
                              </p>
                            </li>
                          }
                        </ul>
                      </app-panel>
                    </div>
                  }

                  @case ("text") {
                    <div class="mt-6">
                      <app-panel title="What was extracted from your document">
                        <pre class="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-secondary/40 p-4 text-xs leading-relaxed text-foreground">{{ doc.extractedText || "No text could be extracted from this document." }}</pre>
                        <p class="mt-3 text-xs leading-relaxed text-muted-foreground">
                          Parsing and scoring run on this extracted text. A scan without a text
                          layer produces an empty document, which is why image-only PDFs cannot be
                          analysed.
                        </p>
                      </app-panel>
                    </div>
                  }

                  @case ("history") {
                    <div class="mt-6">
                      <app-panel title="Analysis history" bodyClassName="px-0 py-0">
                        @if (analyses().length >= 2) {
                          <a
                            panelAction
                            [routerLink]="['/cv', id(), 'compare']"
                            [class]="buttonClass('ghost', 'sm', 'gap-1.5 text-xs')"
                          >
                            Compare any two scans
                          </a>
                        }
                        <ul class="divide-y divide-border/80">
                          @for (analysis of analyses(); track analysis.id; let index = $index) {
                            <li>
                              <button
                                type="button"
                                (click)="selectedId.set(analysis.id)"
                                [class]="cn(
                                  'flex w-full flex-wrap items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-secondary/50',
                                  analysis.id === active()!.id && 'bg-secondary/60'
                                )"
                              >
                                <span [class]="cn('w-14 text-lg font-medium tabular-nums', TONE_TEXT[scoreTone(analysis.overallScore)])">
                                  {{ analysis.overallScore }}%
                                </span>
                                <span class="text-sm text-foreground">
                                  {{ TONE_LABEL[scoreTone(analysis.overallScore)] }} ·
                                  {{ analysis.recommendations.length }} finding{{ analysis.recommendations.length === 1 ? "" : "s" }}
                                </span>
                                <span class="text-xs text-muted-foreground">
                                  {{ formatDateTime(dateValue(analysis.analyzedAt)) }}
                                </span>
                                @let delta = historyDelta(index);
                                @if (delta !== undefined) {
                                  <span
                                    [class]="cn(
                                      'text-xs',
                                      delta > 0 ? 'text-success' : delta < 0 ? 'text-critical' : 'text-muted-foreground'
                                    )"
                                  >
                                    {{ delta > 0 ? "+" : "" }}{{ delta }} vs previous
                                  </span>
                                }
                                <span class="ml-auto text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                                  {{ analysis.id === active()!.id ? "Displayed" : "View" }}
                                </span>
                              </button>
                            </li>
                          }
                        </ul>
                      </app-panel>
                    </div>
                  }
                }
              </div>
            </div>

            <div class="flex flex-col gap-6">
              <app-panel title="Document">
                <dl class="flex flex-col gap-4">
                  <div>
                    <dt class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">File</dt>
                    <dd class="mt-1 break-all text-sm text-foreground">{{ doc.originalFilename }}</dd>
                  </div>
                  <div>
                    <dt class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Size / type</dt>
                    <dd class="mt-1 text-sm text-foreground">
                      {{ formatBytes(doc.fileSize) }} · {{ doc.fileType }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Uploaded</dt>
                    <dd class="mt-1 text-sm text-foreground">
                      {{ formatDateTime(dateValue(doc.uploadedAt)) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Last scanned</dt>
                    <dd class="mt-1 text-sm text-foreground">
                      {{ formatDateTime(dateValue(active()!.analyzedAt)) }}
                    </dd>
                  </div>
                </dl>
                <button
                  type="button"
                  [class]="buttonClass('outline', 'default', 'mt-5 w-full gap-2')"
                  [disabled]="scanning()"
                  (click)="handleScan()"
                >
                  @if (scanning()) {
                    <svg lucideLoaderCircle class="size-4 animate-spin"></svg>
                  } @else {
                    <svg lucideRefreshCw class="size-4"></svg>
                  }
                  Re-scan this CV
                </button>
              </app-panel>

              <app-panel title="Scoring engine">
                <p class="text-sm leading-relaxed text-muted-foreground">
                  DeterministicAnalyzer v1. Seven weighted dimensions, fixed rules, no external
                  service. The same document always produces the same score.
                </p>
                <ul class="mt-4 flex flex-col gap-2 text-xs text-muted-foreground">
                  <li>· Nothing is generated on your behalf.</li>
                  <li>· Missing information is reported, never invented.</li>
                  <li>· Every finding shows the category that raised it.</li>
                </ul>
              </app-panel>

              <app-panel title="Text statistics">
                <dl class="grid grid-cols-2 gap-4">
                  <div>
                    <dt class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Words</dt>
                    <dd class="mt-1 text-sm tabular-nums text-foreground">{{ words(doc) }}</dd>
                  </div>
                  <div>
                    <dt class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Characters</dt>
                    <dd class="mt-1 text-sm tabular-nums text-foreground">{{ doc.extractedText.length }}</dd>
                  </div>
                  <div>
                    <dt class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Findings</dt>
                    <dd class="mt-1 text-sm tabular-nums text-foreground">{{ issues().length }}</dd>
                  </div>
                  <div>
                    <dt class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Scans</dt>
                    <dd class="mt-1 text-sm tabular-nums text-foreground">{{ analyses().length }}</dd>
                  </div>
                </dl>
              </app-panel>

              <app-panel title="CV editor">
                <p class="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                  <svg lucideFileText class="mt-0.5 size-4 shrink-0"></svg>
                  The guided editor and ATS PDF export are not available yet.
                </p>
                <button
                  type="button"
                  [class]="buttonClass('outline', 'sm', 'mt-4 w-full')"
                  (click)="showComingSoon('The CV editor and ATS export')"
                >
                  Coming soon
                </button>
              </app-panel>
            </div>
          </div>
        }
      }

      <dialog #deleteDialog class="cp-modal" (close)="deleteOpen.set(false)">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <h2 class="text-base font-medium tracking-tight">Delete this CV?</h2>
            <p class="text-sm leading-relaxed text-muted-foreground">
              The stored document and every analysis of it are removed permanently.
            </p>
          </div>
          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              [class]="buttonClass('outline')"
              [disabled]="deleting()"
              (click)="closeDeleteDialog()"
            >
              Keep it
            </button>
            <button
              type="button"
              [class]="buttonClass('default', 'default', 'bg-critical text-white hover:bg-critical/90')"
              [disabled]="deleting()"
              (click)="handleDelete()"
            >
              {{ deleting() ? "Deleting…" : "Delete CV" }}
            </button>
          </div>
        </div>
      </dialog>
    </app-shell>
  `,
})
export class CvAnalysisPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly comingSoon = inject(ComingSoonService);

  /** Route parameter, bound by `withComponentInputBinding`. */
  readonly resumeId = input<string | null>(null);

  protected readonly document = signal<ResumeDetail | null>(null);
  protected readonly analyses = signal<ResumeAnalysis[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<Error | null>(null);
  protected readonly selectedId = signal<number | null>(null);
  protected readonly scanning = signal(false);
  protected readonly deleting = signal(false);
  protected readonly deleteOpen = signal(false);
  protected readonly activeTab = signal<Tab>("overview");

  protected readonly tabs = TABS;
  protected readonly buttonClass = buttonClass;
  protected readonly formatBytes = formatBytes;
  protected readonly formatDateTime = formatDateTime;
  protected readonly TONE_TEXT = TONE_TEXT;
  protected readonly TONE_LABEL = TONE_LABEL;
  protected readonly scoreTone = scoreTone;
  protected readonly cn = cn;

  private readonly deleteDialog = viewChild<ElementRef<HTMLDialogElement>>("deleteDialog");

  protected readonly id = computed(() => Number(this.resumeId()));
  protected readonly validId = computed(() => Number.isInteger(this.id()) && this.id() > 0);

  protected readonly active = computed<ResumeAnalysis | null>(() => {
    const analyses = this.analyses();
    if (analyses.length === 0) return null;
    return analyses.find((analysis) => analysis.id === this.selectedId()) ?? analyses[0];
  });

  protected readonly previous = computed<ResumeAnalysis | null>(() => {
    const active = this.active();
    if (!active) return null;
    const index = this.analyses().findIndex((analysis) => analysis.id === active.id);
    return index >= 0 ? (this.analyses()[index + 1] ?? null) : null;
  });

  protected readonly issues = computed(() => {
    const active = this.active();
    return active ? issuesFromAnalysis(active) : [];
  });

  protected readonly counts = computed(() => countSeverities(this.issues()));

  protected readonly dimensions = computed(() => {
    const active = this.active();
    return active ? dimensionsFromAnalysis(active) : [];
  });

  protected readonly deltas = computed(() => {
    const previous = this.previous();
    if (!previous) return undefined;
    const previousDimensions = dimensionsFromAnalysis(previous);
    const map: Record<string, number> = {};
    for (const dimension of this.dimensions()) {
      const before = previousDimensions.find((item) => item.key === dimension.key);
      map[dimension.key] = before ? dimension.score - before.score : 0;
    }
    return map;
  });

  protected readonly strongDimensions = computed(() =>
    this.dimensions().filter((dimension) => dimension.score >= 80),
  );

  protected readonly activeBand = computed(() =>
    TONE_LABEL[scoreTone(this.active()?.overallScore)],
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
      this.analyses.set(analyses);
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause : new Error(String(cause)));
    } finally {
      this.loading.set(false);
    }
  }

  protected tabLabel(tab: { id: Tab; label: string }): string {
    if (tab.id === "findings") return `Findings (${this.issues().length})`;
    if (tab.id === "history") return `History (${this.analyses().length})`;
    return tab.label;
  }

  protected tabClass(tab: Tab): string {
    return cn(
      "text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
      this.activeTab() === tab &&
        "bg-background shadow-sm dark:border-input dark:bg-input/30 dark:text-foreground",
    );
  }

  protected sectionTitle(sectionType: string): string {
    return sectionType
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  protected historyDelta(index: number): number | undefined {
    const analyses = this.analyses();
    const before = analyses[index + 1];
    return before ? analyses[index].overallScore - before.overallScore : undefined;
  }

  protected headerDescription(doc: ResumeDetail): string {
    const scans = this.analyses().length;
    return `${formatBytes(doc.fileSize)} · ${this.words(doc)} words · uploaded ${formatDateTime(
      Date.parse(doc.uploadedAt),
    )}${this.active() ? ` · ${scans} scan${scans === 1 ? "" : "s"}` : ""}`;
  }

  protected words(doc: ResumeDetail): number {
    const text = doc.extractedText.trim();
    return text ? text.split(/\s+/).length : 0;
  }

  protected downloadText(doc: ResumeDetail): void {
    const base = doc.originalFilename.replace(/\.[^.]+$/, "") || "cv";
    downloadTextFile(`${base}.txt`, doc.extractedText);
  }

  protected showComingSoon(label: string): void {
    this.comingSoon.show(label);
  }

  protected async handleScan(): Promise<void> {
    this.scanning.set(true);
    try {
      await this.api.analyses.analyze(this.id());
      this.selectedId.set(null);
      await this.load();
      this.toastService.success("Scan complete.");
    } catch (cause) {
      this.toastService.error(describeError(cause, "We could not scan this CV."));
    } finally {
      this.scanning.set(false);
    }
  }

  protected openDeleteDialog(): void {
    this.deleteOpen.set(true);
    this.deleteDialog()?.nativeElement.showModal();
  }

  protected closeDeleteDialog(): void {
    this.deleteDialog()?.nativeElement.close();
    this.deleteOpen.set(false);
  }

  protected async handleDelete(): Promise<void> {
    this.deleting.set(true);
    try {
      await this.api.resumes.remove(this.id());
      this.toastService.success("CV deleted.");
      await this.router.navigateByUrl("/cv");
    } catch (cause) {
      this.toastService.error(describeError(cause, "We could not delete this CV."));
      this.deleting.set(false);
    }
  }

  protected dateValue(value: string): number {
    return Date.parse(value);
  }
}
