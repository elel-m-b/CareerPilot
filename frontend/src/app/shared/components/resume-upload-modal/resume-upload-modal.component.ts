import { Component, EventEmitter, Input, Output } from '@angular/core';
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
      <div class="glass-card modal-content animate-fade-in" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2>Upload Resume for AI Analysis</h2>
            <p class="modal-subtitle">Upload your CV in PDF or DOCX format to calculate ATS score & recommendations.</p>
          </div>
          <button class="close-btn" (click)="close.emit()">×</button>
        </div>

        <div class="modal-body">
          <!-- Illustration banner -->
          <div class="upload-illustration-banner">
            <img src="/assets/illustrations/illustration-target.png" alt="Resume target illustration" />
          </div>

          <!-- Drag and Drop Zone -->
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
            <div class="drop-icon">📄</div>
            <div class="drop-text" *ngIf="!selectedFile">
              <span class="highlight">Click to upload</span> or drag and drop your resume
              <div class="file-hint">Supports PDF, DOCX (Max 10MB)</div>
            </div>
            <div class="selected-file-info" *ngIf="selectedFile">
              <div class="file-name">{{ selectedFile.name }}</div>
              <div class="file-size">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</div>
              <button class="remove-file-btn" (click)="removeFile($event)">Remove file</button>
            </div>
          </div>

          <!-- Loading state during upload & analysis -->
          <div class="upload-status" *ngIf="isUploading || isAnalyzing">
            <div class="spinner"></div>
            <div class="status-text">
              <span *ngIf="isUploading">Uploading resume to server...</span>
              <span *ngIf="isAnalyzing">Analyzing resume structure & calculating ATS score...</span>
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
            Upload & Analyze
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-content {
      width: 100%;
      max-width: 560px;
      padding: 28px;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;

      h2 {
        font-size: 1.35rem;
        color: var(--text-main);
      }
      .modal-subtitle {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin-top: 4px;
      }
    }
    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.6rem;
      color: var(--text-muted);
      cursor: pointer;
      line-height: 1;
      &:hover { color: var(--text-main); }
    }
    .upload-illustration-banner {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
      img {
        max-height: 140px;
        object-fit: contain;
      }
    }
    .drop-zone {
      border: 2px dashed var(--border-color);
      border-radius: 14px;
      padding: 30px 20px;
      text-align: center;
      cursor: pointer;
      background: var(--bg-surface);
      transition: all 0.25s ease;

      &:hover, &.dragging {
        border-color: var(--primary-color);
        background: rgba(99, 102, 241, 0.05);
      }
    }
    .drop-icon {
      font-size: 2.5rem;
      margin-bottom: 10px;
    }
    .drop-text {
      font-size: 0.9rem;
      color: var(--text-secondary);
      .highlight {
        color: var(--primary-color);
        font-weight: 600;
      }
      .file-hint {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-top: 6px;
      }
    }
    .selected-file-info {
      .file-name {
        font-weight: 600;
        color: var(--text-main);
        font-size: 0.95rem;
      }
      .file-size {
        font-size: 0.8rem;
        color: var(--text-muted);
        margin-top: 2px;
      }
      .remove-file-btn {
        margin-top: 10px;
        background: transparent;
        border: none;
        color: var(--error-color);
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        text-decoration: underline;
      }
    }
    .upload-status {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 18px;
      padding: 12px 16px;
      background: var(--bg-surface);
      border-radius: 10px;
      border: 1px solid var(--border-color);

      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(99, 102, 241, 0.2);
        border-top-color: var(--primary-color);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      .status-text {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-secondary);
      }
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ResumeUploadModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() uploaded = new EventEmitter<number>(); // Emits analysisId or resumeId

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

  onBackdropClick(event: MouseEvent) {
    if (!this.isUploading && !this.isAnalyzing) {
      this.close.emit();
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.validateAndSetFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.validateAndSetFile(input.files[0]);
    }
  }

  removeFile(event: MouseEvent) {
    event.stopPropagation();
    this.selectedFile = null;
  }

  validateAndSetFile(file: File) {
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

  submitUploadAndAnalyze() {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.resumeService.uploadResume(this.selectedFile).subscribe({
      next: (resume) => {
        this.isUploading = false;
        this.isAnalyzing = true;
        this.toastService.success('Resume uploaded successfully. Analyzing content...');

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
