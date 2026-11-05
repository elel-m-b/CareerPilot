import { Component, ElementRef, inject, signal, viewChild } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import {
  LucideCircleAlert,
  LucideDownload,
  LucideEllipsis,
  LucideFileText,
  LucidePencil,
  LucideScanLine,
  LucideStar,
  LucideTrash2,
  LucideUpload,
} from "@lucide/angular";
import { ApiService } from "../core/api/api.service";
import type { Resume } from "../core/api/api.types";
import { ComingSoonService } from "../core/coming-soon/coming-soon.service";
import { ToastService } from "../core/toast/toast.service";
import { describeError } from "../lib/cv/report";
import { formatBytes } from "../lib/cv/validation";
import { TONE_TEXT, formatRelative, scoreTone, titleCase } from "../lib/format";
import { cn } from "../lib/utils";
import {
  AlertComponent,
  AlertDescriptionComponent,
  AlertTitleComponent,
} from "../shared/alert";
import { AppShellComponent } from "../shared/app-shell";
import { buttonClass } from "../shared/button";
import { CvUploadDialogComponent } from "../shared/cv/cv-upload-dialog";
import { DropdownComponent, dropdownItemClass } from "../shared/dropdown";
import { PageHeaderComponent } from "../shared/page-header";
import { PanelComponent } from "../shared/panel";
import { SkeletonComponent } from "../shared/skeleton";

function formatLabel(fileType: string, name: string): string {
  if (fileType.includes("pdf") || name.toLowerCase().endsWith(".pdf")) return "PDF";
  if (fileType.includes("word") || name.toLowerCase().endsWith(".docx")) return "DOCX";
  return titleCase(fileType.split("/").pop() ?? "file");
}

@Component({
  selector: "app-my-cv-page",
  imports: [
    RouterLink,
    AppShellComponent,
    PageHeaderComponent,
    PanelComponent,
    SkeletonComponent,
    AlertComponent,
    AlertTitleComponent,
    AlertDescriptionComponent,
    CvUploadDialogComponent,
    DropdownComponent,
    LucideCircleAlert,
    LucideDownload,
    LucideEllipsis,
    LucideFileText,
    LucidePencil,
    LucideScanLine,
    LucideStar,
    LucideTrash2,
  ],
  template: `
    <app-shell area="My CV">
      <app-page-header
        eyebrow="CV library"
        title="My CV"
        description="Every document you upload keeps its own scan history, so you can compare reports and see whether an edit actually improved the score."
      >
        <app-cv-upload-dialog label="Scan a CV" (uploaded)="openResume($event)" />
      </app-page-header>

      @if (loading()) {
        <div class="mt-10 flex flex-col gap-6">
          <app-skeleton className="h-32 w-full" />
          <app-skeleton className="h-64 w-full" />
        </div>
      } @else if (error()) {
        <app-alert variant="destructive" className="mt-10 rounded-md">
          <svg lucideCircleAlert class="size-4"></svg>
          <app-alert-title className="text-sm">We could not load your CVs</app-alert-title>
          <app-alert-description className="text-sm leading-relaxed">
            {{ error()?.message }}
          </app-alert-description>
        </app-alert>
      } @else if (rows().length === 0) {
        <div class="mt-12 rounded-md border border-dashed border-border">
          <div class="mx-auto flex max-w-xl flex-col items-center gap-6 px-6 py-16 text-center">
            <span class="grid size-10 place-items-center rounded-md border border-border">
              <svg lucideFileText class="size-4 text-muted-foreground"></svg>
            </span>
            <div class="flex flex-col gap-2">
              <h2 class="text-lg font-medium tracking-tight text-foreground">
                Your CV library is empty
              </h2>
              <p class="text-sm leading-relaxed text-muted-foreground">
                Upload a text-based PDF or DOCX file up to 10 MB. Scanned images have no text
                layer, so they cannot be analysed — export the document again from your editor.
              </p>
            </div>
            <app-cv-upload-dialog label="Upload my CV" (uploaded)="openResume($event)" />
          </div>
        </div>
      } @else {
        <div class="mt-10 flex flex-col gap-6">
          @if (current(); as currentResume) {
            <app-panel title="Most recent CV">
              <a
                panelAction
                [routerLink]="['/cv', currentResume.id]"
                [class]="buttonClass('outline', 'sm')"
              >
                Open report
              </a>
              <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div class="flex items-start gap-4">
                  <span
                    [class]="cn(
                      'text-4xl font-medium tabular-nums tracking-[-0.03em]',
                      TONE_TEXT[scoreTone(currentResume.latestScore)]
                    )"
                  >
                    {{ currentResume.latestScore !== null ? currentResume.latestScore + "%" : "—" }}
                  </span>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-foreground">
                      {{ currentResume.originalFilename }}
                    </p>
                    <p class="mt-0.5 truncate text-xs text-muted-foreground">
                      {{ formatLabel(currentResume.fileType, currentResume.originalFilename) }} ·
                      {{ formatBytes(currentResume.fileSize) }} · uploaded
                      {{ formatRelative(dateValue(currentResume.uploadedAt)) }}
                    </p>
                    <p class="mt-1 text-xs text-muted-foreground">
                      {{
                        currentResume.latestAnalysisId
                          ? "Scored by the deterministic seven-dimension engine."
                          : "Not scored yet — open the report to run the first scan."
                      }}
                    </p>
                  </div>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    [class]="buttonClass('outline', 'sm', 'gap-2')"
                    (click)="showComingSoon('Downloading the original file')"
                  >
                    <svg lucideDownload class="size-4"></svg>
                    Download
                  </button>
                  <app-cv-upload-dialog
                    label="Upload another"
                    variant="outline"
                    size="sm"
                    (uploaded)="openResume($event)"
                  />
                </div>
              </div>
            </app-panel>
          }

          <app-panel title="All CVs ({{ rows().length }})" bodyClassName="px-0 py-0">
            <div class="relative w-full overflow-x-auto">
              <table class="w-full caption-bottom text-sm">
                <thead class="[&_tr]:border-b">
                  <tr class="border-border/80 hover:bg-transparent">
                    <th class="h-10 pl-6 text-left align-middle text-[11px] font-medium uppercase tracking-[0.14em] whitespace-nowrap text-muted-foreground">
                      Document
                    </th>
                    <th class="h-10 px-2 text-left align-middle text-[11px] font-medium uppercase tracking-[0.14em] whitespace-nowrap text-muted-foreground">
                      Format
                    </th>
                    <th class="h-10 px-2 text-left align-middle text-[11px] font-medium uppercase tracking-[0.14em] whitespace-nowrap text-muted-foreground">
                      Score
                    </th>
                    <th class="h-10 px-2 text-left align-middle text-[11px] font-medium uppercase tracking-[0.14em] whitespace-nowrap text-muted-foreground">
                      Uploaded
                    </th>
                    <th class="h-10 pr-6 text-right align-middle text-[11px] font-medium uppercase tracking-[0.14em] whitespace-nowrap text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="[&_tr:last-child]:border-0">
                  @for (row of rows(); track row.id) {
                    <tr class="border-b border-border/80 transition-colors hover:bg-muted/50">
                      <td class="p-2 pl-6 align-top whitespace-normal">
                        <div class="flex flex-col gap-1">
                          <a
                            [routerLink]="['/cv', row.id]"
                            class="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                          >{{ row.originalFilename }}</a>
                          <span class="text-xs text-muted-foreground">
                            {{ formatBytes(row.fileSize) }} ·
                            {{ formatRelative(dateValue(row.uploadedAt)) }}
                          </span>
                          @if (row.id === current()?.id) {
                            <span class="w-fit rounded-[3px] border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-foreground">
                              Most recent
                            </span>
                          }
                        </div>
                      </td>
                      <td class="p-2 align-top text-sm text-foreground">
                        {{ formatLabel(row.fileType, row.originalFilename) }}
                      </td>
                      <td class="p-2 align-top">
                        @if (row.latestScore === null) {
                          <span class="text-sm text-muted-foreground">—</span>
                        } @else {
                          <span [class]="cn('text-sm tabular-nums', TONE_TEXT[scoreTone(row.latestScore)])">
                            {{ row.latestScore }}%
                          </span>
                        }
                        <p class="mt-1 text-xs text-muted-foreground">
                          {{ row.latestAnalysisId ? "Latest scan" : "Not scanned" }}
                        </p>
                      </td>
                      <td class="p-2 align-top text-xs text-muted-foreground">
                        {{ formatRelative(dateValue(row.uploadedAt)) }}
                      </td>
                      <td class="p-2 pr-6 align-top text-right">
                        <app-dropdown align="bottom-end" panelClassName="w-52">
                          <button
                            dropdownTrigger
                            type="button"
                            [class]="buttonClass('ghost', 'icon-sm')"
                            [attr.aria-label]="'Actions for ' + row.originalFilename"
                          >
                            <svg lucideEllipsis class="size-4"></svg>
                          </button>
                          <div dropdownPanel class="flex flex-col">
                            <button type="button" [class]="itemClass()" (click)="openResume(row.id)">
                              <svg lucideScanLine class="size-4"></svg>
                              Open report
                            </button>
                            <button
                              type="button"
                              [class]="itemClass()"
                              (click)="showComingSoon('Downloading the original file')"
                            >
                              <svg lucideDownload class="size-4"></svg>
                              Download file
                            </button>
                            <button
                              type="button"
                              [class]="itemClass()"
                              [disabled]="row.id === current()?.id"
                              (click)="showComingSoon('Choosing a current CV')"
                            >
                              <svg lucideStar class="size-4"></svg>
                              Set as current
                            </button>
                            <button
                              type="button"
                              [class]="itemClass()"
                              (click)="showComingSoon('Renaming a CV')"
                            >
                              <svg lucidePencil class="size-4"></svg>
                              Rename
                            </button>
                            <div class="my-1 h-px bg-border"></div>
                            <button
                              type="button"
                              [class]="itemClass('text-critical focus:text-critical')"
                              (click)="confirmDelete(row)"
                            >
                              <svg lucideTrash2 class="size-4"></svg>
                              Delete CV
                            </button>
                          </div>
                        </app-dropdown>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </app-panel>

          <p class="text-xs leading-relaxed text-muted-foreground">
            Deleting a CV also deletes every analysis recorded for it. Original-file download,
            renaming and choosing a current version are not implemented yet and show a Coming Soon
            notice.
          </p>
        </div>
      }

      <dialog #deleteDialog class="cp-modal" (close)="deleting.set(null)">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <h2 class="text-base font-medium tracking-tight">
              Delete “{{ deleting()?.originalFilename }}”?
            </h2>
            <p class="text-sm leading-relaxed text-muted-foreground">
              This removes the stored document and every analysis recorded for it. This action
              cannot be undone.
            </p>
          </div>
          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              [class]="buttonClass('outline')"
              [disabled]="busy()"
              (click)="closeDeleteDialog()"
            >
              Keep it
            </button>
            <button
              type="button"
              [class]="buttonClass('default', 'default', 'bg-critical text-white hover:bg-critical/90')"
              [disabled]="busy()"
              (click)="handleDelete()"
            >
              {{ busy() ? "Deleting…" : "Delete CV" }}
            </button>
          </div>
        </div>
      </dialog>
    </app-shell>
  `,
})
export class MyCvPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly comingSoon = inject(ComingSoonService);

  protected readonly rows = signal<Resume[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<Error | null>(null);
  protected readonly deleting = signal<Resume | null>(null);
  protected readonly busy = signal(false);

  protected readonly buttonClass = buttonClass;
  protected readonly itemClass = (extra = "") => dropdownItemClass(extra);
  protected readonly formatBytes = formatBytes;
  protected readonly formatRelative = formatRelative;
  protected readonly formatLabel = formatLabel;
  protected readonly scoreTone = scoreTone;
  protected readonly TONE_TEXT = TONE_TEXT;
  protected readonly cn = cn;

  private readonly deleteDialog = viewChild<ElementRef<HTMLDialogElement>>("deleteDialog");

  constructor() {
    void this.load();
  }

  protected current(): Resume | undefined {
    return this.rows()[0];
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.rows.set(await this.api.resumes.list());
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause : new Error(String(cause)));
    } finally {
      this.loading.set(false);
    }
  }

  protected openResume(resumeId: number): void {
    void this.router.navigate(["/cv", resumeId]);
  }

  protected showComingSoon(label: string): void {
    this.comingSoon.show(label);
  }

  protected confirmDelete(resume: Resume): void {
    this.deleting.set(resume);
    this.deleteDialog()?.nativeElement.showModal();
  }

  protected closeDeleteDialog(): void {
    this.deleteDialog()?.nativeElement.close();
    this.deleting.set(null);
  }

  protected async handleDelete(): Promise<void> {
    const resume = this.deleting();
    if (!resume) return;
    this.busy.set(true);
    try {
      await this.api.resumes.remove(resume.id);
      this.toastService.success("CV deleted.");
      this.closeDeleteDialog();
      await this.load();
    } catch (cause) {
      this.toastService.error(describeError(cause, "We could not delete that CV."));
    } finally {
      this.busy.set(false);
    }
  }

  protected dateValue(value: string): number {
    return Date.parse(value);
  }
}
