import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ResumeService } from '../../../core/services/resume.service';
import { AnalysisService } from '../../../core/services/analysis.service';
import { ToastService } from '../../../core/services/toast.service';
import { Resume } from '../../../core/models/resume.model';
import { ResumeUploadModalComponent } from '../../../shared/components/resume-upload-modal/resume-upload-modal.component';

@Component({
  selector: 'app-resume-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ResumeUploadModalComponent],
  template: `
    <div class="resumes-page animate-fade-in">
      <div class="page-header">
        <div>
          <h2>My Resumes</h2>
          <p>Manage and analyze your uploaded resume documents</p>
        </div>
        <button class="btn btn-primary" (click)="showUploadModal = true">
          <span>📄</span> Upload New Resume
        </button>
      </div>

      <!-- Resume Grid -->
      <div class="resumes-grid" *ngIf="resumes.length > 0; else emptyState">
        <div class="glass-card resume-card" *ngFor="let resume of resumes">
          <div class="resume-card-header">
            <div class="file-icon">📄</div>
            <div class="file-meta">
              <h3 class="file-name" [title]="resume.originalFilename">{{ resume.originalFilename }}</h3>
              <span class="file-sub">Uploaded {{ resume.uploadedAt | date:'mediumDate' }} • {{ (resume.fileSize / 1024).toFixed(0) }} KB</span>
            </div>
            <span class="badge badge-info">{{ resume.fileType }}</span>
          </div>

          <div class="resume-card-body">
            <div class="score-indicator">
              <span class="score-label">Latest ATS Score:</span>
              <span
                class="badge"
                [ngClass]="getScoreBadgeClass(resume.latestScore)"
              >
                {{ resume.latestScore ? resume.latestScore + '/100' : 'Not Analyzed' }}
              </span>
            </div>
          </div>

          <div class="resume-card-footer">
            <button
              class="btn btn-primary btn-sm"
              *ngIf="!resume.latestAnalysisId"
              (click)="analyze(resume.id)"
            >
              Analyze Now
            </button>

            <a
              *ngIf="resume.latestAnalysisId"
              [routerLink]="['/analysis', resume.latestAnalysisId]"
              class="btn btn-primary btn-sm"
            >
              View Report
            </a>

            <button
              class="btn btn-secondary btn-sm"
              (click)="viewDetails(resume.id)"
            >
              Details
            </button>

            <button
              class="btn btn-danger btn-sm"
              (click)="deleteResume(resume.id, resume.originalFilename)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="glass-card empty-container">
          <div class="empty-icon">📁</div>
          <h3>No Resumes Uploaded</h3>
          <p>Upload a resume file (PDF or DOCX) to get started with ATS analysis.</p>
          <button class="btn btn-primary" (click)="showUploadModal = true">Upload Resume</button>
        </div>
      </ng-template>

      <!-- Upload Modal -->
      <app-resume-upload-modal
        *ngIf="showUploadModal"
        (close)="showUploadModal = false; loadResumes()"
      ></app-resume-upload-modal>
    </div>
  `,
  styles: [`
    .resumes-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      h2 { font-size: 1.6rem; color: var(--text-main); }
      p { font-size: 0.9rem; color: var(--text-muted); margin-top: 4px; }
    }
    .resumes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    .resume-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .resume-card-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;

      .file-icon {
        font-size: 2rem;
        background: var(--bg-surface);
        padding: 8px;
        border-radius: 10px;
      }
      .file-meta {
        flex: 1;
        overflow: hidden;
      }
      .file-name {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-main);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .file-sub {
        font-size: 0.775rem;
        color: var(--text-muted);
        display: block;
        margin-top: 2px;
      }
    }
    .resume-card-body {
      padding: 12px;
      background: var(--bg-surface);
      border-radius: 10px;
      border: 1px solid var(--border-color);
    }
    .score-indicator {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .score-label {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-secondary);
      }
    }
    .resume-card-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: auto;
    }
    .empty-container {
      padding: 60px 20px;
      text-align: center;
      .empty-icon { font-size: 3rem; margin-bottom: 12px; }
      h3 { font-size: 1.3rem; color: var(--text-main); }
      p { font-size: 0.9rem; color: var(--text-muted); margin: 6px 0 20px 0; }
    }
  `]
})
export class ResumeListComponent implements OnInit {
  resumes: Resume[] = [];
  showUploadModal = false;

  constructor(
    private resumeService: ResumeService,
    private analysisService: AnalysisService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadResumes();
  }

  loadResumes(): void {
    this.resumeService.getUserResumes().subscribe({
      next: (data) => this.resumes = data,
      error: () => this.toastService.error('Failed to load resumes.')
    });
  }

  analyze(id: number): void {
    this.toastService.info('Running AI Resume Analysis...');
    this.analysisService.analyzeResume(id).subscribe({
      next: (analysis) => {
        this.toastService.success('Analysis completed!');
        this.router.navigate(['/analysis', analysis.id]);
      },
      error: () => this.toastService.error('Failed to analyze resume.')
    });
  }

  viewDetails(id: number): void {
    this.router.navigate(['/my-resumes', id]);
  }

  deleteResume(id: number, filename: string): void {
    if (confirm(`Are you sure you want to delete "${filename}"? This will also remove associated analysis data.`)) {
      this.resumeService.deleteResume(id).subscribe({
        next: () => {
          this.toastService.success('Resume deleted successfully.');
          this.loadResumes();
        },
        error: () => this.toastService.error('Failed to delete resume.')
      });
    }
  }

  getScoreBadgeClass(score?: number): string {
    if (!score) return 'badge-info';
    if (score >= 85) return 'badge-success';
    if (score >= 70) return 'badge-info';
    if (score >= 50) return 'badge-warning';
    return 'badge-error';
  }
}
