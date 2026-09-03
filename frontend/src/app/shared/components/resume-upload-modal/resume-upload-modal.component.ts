import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumeService } from '../../../core/services/resume.service';
import { AnalysisService } from '../../../core/services/analysis.service';
import { ToastService } from '../../../core/services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-resume-upload-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onBackdropClick($event)">
      <div class="modal-content card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h3>Upload & Analyze Resume</h3>
            <p class="modal-subtitle">Upload a PDF or DOCX file to extract candidate data & calculate ATS metrics.</p>
          </div>
          <button class="close-btn" (click)="close.emit()">×</button>
        </div>

        <div class="modal-body">
          <div
            class="drop-zone"
            [class.dragging]="isDragging"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            (click)="fileInput.click()"
          >
            <input
              #fileInput
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              (change)="onFileSelected($event)"
              hidden
            />
            <div class="drop-text" *ngIf="!selectedFile">
              <div class="file-icon-box">FILE</div>
              <span class="highlight">Select file</span> or drag & drop document here
              <div class="file-hint">PDF or DOCX (Max 10MB)</div>
            </div>
            <div class="selected-file-info" *ngIf="selectedFile">
              <div class="file-name text-mono">{{ selectedFile.name }}</div>
              <div class="file-size text-muted">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</div>
              <button class="remove-file-btn" (click)="removeFile($event)">Remove File</button>
            </div>
          </div>

          <div class="upload-status" *ngIf="isUploading || isAnalyzing">
            <div class="status-indicator"></div>
            <div class="status-text text-mono">
              <span *ngIf="isUploading">UPLOADING RESUME DOCUMENT...</span>
              <span *ngIf="isAnalyzing">PARSING SECTIONS & COMPUTING SCORES...</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="close.emit()" [disabled]="isUploading || isAnalyzing">Cancel</button>
          <button
            class="btn btn-primary"
            (click)="submitUploadAndAnalyze()"
            [disabled]="!selectedFile || isUploading || isAnalyzing"
          >
            Run Analysis
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-content {
      width: 100%;
      max-width: 520px;
      padding: 24px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;

      h3 {
        font-size: 1.25rem;
        font-weight: 700;
      }

      .modal-subtitle {
        font-size: 0.8125rem;
        color: var(--text-secondary);
        margin-top: 4px;
      }
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      color: var(--text-muted);
      cursor: pointer;
      line-height: 1;

      &:hover {
        color: var(--text-main);
      }
    }

    .drop-zone {
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-md);
      padding: 32px 20px;
      text-align: center;
      cursor: pointer;
      background-color: var(--bg-surface);
      transition: all 0.15s ease;

      &:hover, &.dragging {
        border-color: var(--text-main);
        background-color: var(--bg-surface-hover);
      }
    }

    .file-icon-box {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 0.75rem;
      width: 44px;
      height: 36px;
      margin: 0 auto 12px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
    }

    .drop-text {
      font-size: 0.875rem;
      color: var(--text-secondary);

      .highlight {
        color: var(--text-main);
        font-weight: 600;
        text-decoration: underline;
      }

      .file-hint {
        font-size: 0.75rem;
        font-family: var(--font-mono);
        color: var(--text-muted);
        margin-top: 8px;
      }
    }

    .selected-file-info {
      .file-name {
        font-weight: 600;
        color: var(--text-main);
        font-size: 0.9rem;
      }

      .file-size {
        font-size: 0.75rem;
        margin-top: 2px;
      }

      .remove-file-btn {
        margin-top: 12px;
        background: transparent;
        border: none;
        color: #ef4444;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        text-decoration: underline;
      }
    }

    .upload-status {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
      padding: 12px 14px;
      background-color: var(--bg-surface);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);

      .status-indicator {
        width: 10px;
        height: 10px;
        background-color: var(--text-main);
        border-radius: 50%;
        animation: pulse 1s infinite alternate;
      }

      .status-text {
        font-size: 0.75rem;
        color: var(--text-main);
        letter-spacing: 0.05em;
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 24px;
    }

    @keyframes pulse {
      from { opacity: 0.3; }
      to { opacity: 1; }
    }
  `]
})
export class ResumeUploadModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() uploaded = new EventEmitter<number>();

  selectedFile: File | null = null;
  isDragging = false;
  isUploading = false;
  isAnalyzing = false;

  constructor(
    private resumeService: ResumeService,
    private analysisService: AnalysisService,
    private toastService: ToastService,
    private router: Router
  ) {}

  onBackdropClick(event: MouseEvent): void {
    if (!this.isUploading && !this.isAnalyzing) {
      this.close.emit();
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.validateAndSetFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.validateAndSetFile(input.files[0]);
    }
  }

  removeFile(event: MouseEvent): void {
    event.stopPropagation();
    this.selectedFile = null;
  }

  validateAndSetFile(file: File): void {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const fileName = file.name.toLowerCase();

    if (!validTypes.includes(file.type) && !fileName.endsWith('.pdf') && !fileName.endsWith('.docx')) {
      this.toastService.error('Invalid file format. Only PDF and DOCX files are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.toastService.error('File size exceeds 10MB limit.');
      return;
    }

    this.selectedFile = file;
  }

  submitUploadAndAnalyze(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.resumeService.uploadResume(this.selectedFile).subscribe({
      next: (resume) => {
        this.isUploading = false;
        this.isAnalyzing = true;
        this.toastService.success('Resume uploaded. Running deterministic analyzer...');

        this.analysisService.analyzeResume(resume.id).subscribe({
          next: (analysis) => {
            this.isAnalyzing = false;
            this.toastService.success('Resume analysis completed!');
            this.close.emit();
            this.router.navigate(['/analysis', analysis.id]);
          },
          error: (err) => {
            this.isAnalyzing = false;
            this.toastService.error(err.error?.message || 'Failed to analyze resume.');
          }
        });
      },
      error: (err) => {
        this.isUploading = false;
        this.toastService.error(err.error?.message || 'Failed to upload resume file.');
      }
    });
  }
}
