import {
  Component,
  ElementRef,
  type OnDestroy,
  inject,
  input,
  output,
  signal,
  viewChild,
} from "@angular/core";
import {
  LucideCircleAlert,
  LucideFileText,
  LucideLoaderCircle,
  LucideUpload,
  LucideCross,
} from "@lucide/angular";
import { ApiService } from "../../core/api/api.service";
import { ToastService } from "../../core/toast/toast.service";
import { describeError } from "../../lib/cv/report";
import {
  ACCEPTED_CV_EXTENSIONS,
  MAX_CV_BYTES,
  type CvFileValidation,
  formatBytes,
  validateCvFile,
} from "../../lib/cv/validation";
import { cn } from "../../lib/utils";
import {
  AlertComponent,
  AlertDescriptionComponent,
  AlertTitleComponent,
} from "../alert";
import { type ButtonSize, type ButtonVariant, buttonClass } from "../button";

type UploadStage = "idle" | "uploading" | "analyzing";

const STEP_LABELS: { key: Exclude<UploadStage, "idle">; label: string }[] = [
  { key: "uploading", label: "Uploading and extracting the text layer" },
  { key: "analyzing", label: "Parsing and scoring seven weighted dimensions" },
];

/**
 * Uploads a CV to the CareerPilot API and immediately runs the deterministic
 * ATS analysis, so the user lands on a report rather than an empty document.
 */
@Component({
  selector: "app-cv-upload-dialog",
  imports: [
    AlertComponent,
    AlertTitleComponent,
    AlertDescriptionComponent,
    LucideCircleAlert,
    LucideFileText,
    LucideLoaderCircle,
    LucideUpload,
    LucideCross,
  ],
  template: `
    <button
      type="button"
      [class]="buttonClass(variant(), size(), 'gap-2')"
      (click)="openDialog()"
    >
      <svg lucideUpload class="size-4"></svg>
      {{ label() }}
    </button>

    <dialog
      #dialog
      class="cp-modal max-h-[92vh] overflow-y-auto sm:max-w-xl"
      (close)="reset()"
      (click)="onBackdropClick($event)"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2 text-center sm:text-left">
          <h2 class="text-lg font-medium tracking-tight">Scan a CV</h2>
          <p class="text-sm leading-relaxed text-muted-foreground">
            Upload the document you apply with. CareerPilot extracts its text, parses the structure
            and scores seven weighted ATS dimensions. Nothing is invented on your behalf.
          </p>
        </div>

        <form class="flex flex-col gap-6" (submit)="handleSubmit($event)">
          <div class="flex flex-col gap-2">
            <span class="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              CV file (PDF or DOCX · max {{ maxBytesLabel }})
            </span>
            <div
              role="button"
              tabindex="0"
              (click)="openFilePicker()"
              (keydown.enter)="openFilePicker()"
              (dragover)="onDragOver($event)"
              (dragleave)="dragging.set(false)"
              (drop)="onDrop($event)"
              [class]="cn(
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-6 py-8 text-center transition-colors',
                dragging() ? 'border-foreground bg-secondary/60' : 'border-border hover:bg-secondary/40',
                busy() && 'pointer-events-none opacity-70'
              )"
            >
              <svg lucideUpload class="size-4 text-muted-foreground"></svg>
              @if (file(); as selected) {
                <div class="flex items-center gap-2">
                  <svg lucideFileText class="size-4"></svg>
                  <span class="text-sm text-foreground">{{ selected.name }}</span>
                  <span class="text-xs text-muted-foreground">{{ formatBytes(selected.size) }}</span>
                  <button
                    type="button"
                    aria-label="Remove file"
                    class="text-muted-foreground hover:text-foreground"
                    (click)="pickFile(null); $event.stopPropagation()"
                  >
                    <svg lucideCross class="size-3.5"></svg>
                  </button>
                </div>
              } @else {
                <p class="text-sm text-foreground">Drop your CV here or click to browse</p>
                <p class="text-xs text-muted-foreground">
                  Scanned images cannot be analysed — export a text-based PDF or a .docx file.
                </p>
              }
              <input
                #fileInput
                type="file"
                [attr.accept]="acceptedExtensions"
                class="hidden"
                (change)="onFileInput($event)"
              />
            </div>
            @if (selectedValidation(); as validation) {
              @if (!validation.ok) {
                <p class="text-xs text-critical">{{ validation.message }}</p>
              }
            }
          </div>

          @if (busy()) {
            <ol class="flex flex-col gap-2 border-y border-border/70 py-4">
              @for (step of stepLabels; track step.key) {
                <li class="flex items-center gap-2 text-sm">
                  @if (stepState(step.key) === "active") {
                    <svg lucideLoaderCircle class="size-3.5 animate-spin text-foreground"></svg>
                  } @else {
                    <span
                      [class]="cn(
                        'size-3.5 rounded-full border',
                        stepState(step.key) === 'done' ? 'border-foreground bg-foreground' : 'border-border'
                      )"
                    ></span>
                  }
                  <span
                    [class]="cn(stepState(step.key) === 'todo' ? 'text-muted-foreground' : 'text-foreground')"
                  >
                    {{ step.label }}
                  </span>
                </li>
              }
            </ol>
          }

          @if (error()) {
            <app-alert variant="destructive" className="rounded-md">
              <svg lucideCircleAlert class="size-4"></svg>
              <app-alert-title className="text-sm">We could not scan this CV</app-alert-title>
              <app-alert-description className="text-sm leading-relaxed">
                {{ error() }}
              </app-alert-description>
            </app-alert>
          }

          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              [class]="buttonClass('ghost')"
              [disabled]="busy()"
              (click)="cancel()"
            >
              Cancel
            </button>
            <button
              type="submit"
              [class]="buttonClass()"
              [disabled]="busy() || (selectedValidation() !== null && !selectedValidation()!.ok)"
            >
              @if (busy()) {
                <svg lucideLoaderCircle class="size-4 animate-spin"></svg>
                Scanning…
              } @else {
                Scan this CV
              }
            </button>
          </div>
        </form>
      </div>
    </dialog>
  `,
})
export class CvUploadDialogComponent implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);

  readonly label = input("Scan a CV");
  readonly variant = input<ButtonVariant>("default");
  readonly size = input<ButtonSize>("default");
  readonly uploaded = output<number>();

  protected readonly file = signal<File | null>(null);
  protected readonly stage = signal<UploadStage>("idle");
  protected readonly error = signal<string | null>(null);
  protected readonly dragging = signal(false);

  protected readonly stepLabels = STEP_LABELS;
  protected readonly acceptedExtensions = ACCEPTED_CV_EXTENSIONS;
  protected readonly maxBytesLabel = formatBytes(MAX_CV_BYTES);
  protected readonly busy = () => this.stage() !== "idle";
  protected readonly buttonClass = buttonClass;
  protected readonly formatBytes = formatBytes;
  protected readonly cn = cn;

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>("dialog");
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>("fileInput");

  protected readonly selectedValidation = (): CvFileValidation | null =>
    this.file() ? validateCvFile(this.file()!) : null;

  ngOnDestroy(): void {
    if (this.dialog().nativeElement.open) this.dialog().nativeElement.close();
  }

  protected openDialog(): void {
    this.reset();
    this.dialog().nativeElement.showModal();
  }

  protected cancel(): void {
    this.reset();
    this.dialog().nativeElement.close();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement && !this.busy()) this.cancel();
  }

  protected openFilePicker(): void {
    if (this.busy()) return;
    const input = this.fileInput().nativeElement;
    // A file input only fires `change` when its value changes, so re-selecting
    // the same file (common after editing `CV.pdf`) would otherwise do nothing.
    input.value = "";
    input.click();
  }

  protected onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pickFile(input.files?.[0] ?? null);
  }

  protected pickFile(next: File | null): void {
    this.file.set(next);
    this.error.set(null);
    const input = this.fileInput?.()?.nativeElement;
    if (!next && input) input.value = "";
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const dropped = event.dataTransfer?.files?.[0];
    if (dropped) this.pickFile(dropped);
  }

  protected reset(): void {
    this.file.set(null);
    this.error.set(null);
    this.dragging.set(false);
    this.stage.set("idle");
    const input = this.fileInput?.()?.nativeElement;
    if (input) input.value = "";
  }

  protected stepState(key: Exclude<UploadStage, "idle">): "done" | "active" | "todo" {
    const order: UploadStage[] = ["uploading", "analyzing"];
    const currentIndex = order.indexOf(this.stage());
    const stepIndex = order.indexOf(key);
    if (stepIndex < currentIndex) return "done";
    if (stepIndex === currentIndex) return "active";
    return "todo";
  }

  protected async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const selected = this.file();
    if (!selected) {
      this.error.set("Choose the CV file you want to scan.");
      return;
    }

    const validation = validateCvFile(selected);
    if (!validation.ok) {
      this.error.set(validation.message);
      return;
    }

    try {
      this.error.set(null);

      this.stage.set("uploading");
      const resume = await this.api.resumes.upload(selected);

      this.stage.set("analyzing");
      try {
        const analysis = await this.api.analyses.analyze(resume.id);
        this.toastService.success(`Scan complete — ATS score ${analysis.overallScore}%`);
      } catch (analysisError) {
        // The document is stored; the user can retry the scan from its report.
        this.toastService.warning(
          `CV uploaded, but the scan did not finish: ${describeError(analysisError)}`,
        );
      }

      this.reset();
      this.dialog().nativeElement.close();
      this.uploaded.emit(resume.id);
    } catch (cause) {
      this.error.set(describeError(cause, "We could not upload this CV. Please try again."));
    } finally {
      this.stage.set("idle");
    }
  }
}
