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
      <div class="page-header flex-between">
        <div>
          <h2>My Resumes</h2>
          <p class="text-secondary">Uploaded candidate files and extracted document details</p>
        </div>
        <button class="btn btn-primary" (click)="showUploadModal = true">
          Upload New Resume
        </button>
      </div>

      <!-- Resumes Table View -->
      <div class="card" *ngIf="resumes.length > 0; else emptyState">
        <div class="table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>File Format</th>
                <th>File Size</th>
                <th>Uploaded Date</th>
                <th>ATS Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let resume of resumes">
                <td>
                  <div class="file-name text-mono font-medium" [title]="resume.originalFilename">
                    {{ resume.originalFilename }}
                  </div>
                </td>
                <td>
                  <span class="badge badge-neutral text-mono">{{ resume.fileType }}</span>
                </td>
                <td class="text-mono text-muted">
                  {{ (resume.fileSize / 1024).toFixed(0) }} KB
                </td>
                <td class="text-mono text-muted">
                  {{ resume.uploadedAt | date:'yyyy-MM-dd HH:mm' }}
                </td>
                <td>
                  <span class="score-pill">
                    {{ resume.latestScore ? resume.latestScore + ' / 100' : 'Unanalyzed' }}
                  </span>
                </td>
                <td>
                  <div class="actions-group">
                    <a
                      *ngIf="resume.latestAnalysisId"
                      [routerLink]="['/analysis', resume.latestAnalysisId]"
                      class="btn btn-outline btn-sm"
                    >
                      View Report
                    </a>
                    <button
                      *ngIf="!resume.latestAnalysisId"
                      class="btn btn-primary btn-sm"
                      (click)="analyze(resume.id)"
                    >
                      Analyze
                    </button>
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
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="card empty-container">
          <h3>No Resumes Uploaded</h3>
          <p class="text-secondary">Upload a PDF or DOCX file to extract text sections and generate ATS scores.</p>
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
      gap: 20px;
    }

    .page-header {
      h2 {
        font-size: 1.5rem;
        font-weight: 700;
      }
      p {
        font-size: 0.875rem;
        margin-top: 2px;
      }
    }

    .file-name {
      font-size: 0.875rem;
    }

    .actions-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .empty-container {
      padding: 48px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;

      h3 {
        font-size: 1.25rem;
      }
      p {
        font-size: 0.875rem;
        max-width: 440px;
      }
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
    this.toastService.info('Analyzing resume document...');
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
    if (confirm(`Are you sure you want to delete "${filename}"?`)) {
      this.resumeService.deleteResume(id).subscribe({
        next: () => {
          this.toastService.success('Resume deleted.');
          this.loadResumes();
        },
        error: () => this.toastService.error('Failed to delete resume.')
      });
    }
  }
}
