import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ResumeService } from '../../../core/services/resume.service';
import { AnalysisService } from '../../../core/services/analysis.service';
import { ToastService } from '../../../core/services/toast.service';
import { ResumeDetail } from '../../../core/models/resume.model';
import { ResumeAnalysis } from '../../../core/models/analysis.model';

@Component({
  selector: 'app-resume-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="resume-detail-page animate-fade-in" *ngIf="resume">
      <div class="detail-header flex-between">
        <div>
          <button class="btn btn-outline btn-sm mb-2" routerLink="/my-resumes">← Back to Resumes</button>
          <div class="header-title-box">
            <h2 class="text-mono">{{ resume.originalFilename }}</h2>
            <span class="badge badge-neutral text-mono">{{ resume.fileType }}</span>
            <span class="text-mono text-muted">{{ (resume.fileSize / 1024).toFixed(0) }} KB</span>
          </div>
        </div>
        <button class="btn btn-primary" (click)="triggerAnalysis()">
          Run Deterministic Analysis
        </button>
      </div>

      <div class="detail-grid">
        <!-- Extracted Text Card -->
        <div class="card text-card">
          <div class="card-title-row flex-between">
            <h3>Extracted Text Content</h3>
            <span class="badge badge-neutral text-mono">PARSED</span>
          </div>
          <div class="text-content-box">
            <pre *ngIf="resume.extractedText" class="text-mono">{{ resume.extractedText }}</pre>
            <div *ngIf="!resume.extractedText" class="no-text text-muted">No text extracted from document.</div>
          </div>
        </div>

        <!-- History & Meta Sidebar Card -->
        <div class="card side-info-card">
          <h3>File Metadata</h3>
          <div class="info-list">
            <div class="info-item flex-between text-mono">
              <span class="label text-muted">Uploaded:</span>
              <span class="value">{{ resume.uploadedAt | date:'yyyy-MM-dd HH:mm' }}</span>
            </div>
            <div class="info-item flex-between text-mono">
              <span class="label text-muted">Updated:</span>
              <span class="value">{{ resume.updatedAt | date:'yyyy-MM-dd HH:mm' }}</span>
            </div>
          </div>

          <h3 class="history-title">Evaluation Runs</h3>
          <div class="history-list" *ngIf="analyses.length > 0; else noAnalyses">
            <div
              *ngFor="let item of analyses"
              class="history-item flex-between"
              [routerLink]="['/analysis', item.id]"
            >
              <div class="score-pill">
                {{ item.overallScore }}
              </div>
              <div class="history-details text-mono">
                <div class="history-date">{{ item.analyzedAt | date:'yyyy-MM-dd HH:mm' }}</div>
                <div class="history-sub text-muted">ATS Score: {{ item.atsScore }}%</div>
              </div>
              <span class="arrow text-mono">→</span>
            </div>
          </div>
          <ng-template #noAnalyses>
            <div class="no-analyses-box">
              <p class="text-muted">No evaluation runs recorded for this file.</p>
              <button class="btn btn-primary btn-sm" (click)="triggerAnalysis()">Run Analysis</button>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .resume-detail-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .mb-2 {
      margin-bottom: 8px;
    }

    .header-title-box {
      display: flex;
      align-items: center;
      gap: 12px;

      h2 {
        font-size: 1.35rem;
        font-weight: 700;
      }
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 20px;
    }

    .text-card {
      display: flex;
      flex-direction: column;
      gap: 16px;

      h3 {
        font-size: 1.1rem;
        font-weight: 600;
      }
    }

    .text-content-box {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 16px;
      max-height: 540px;
      overflow-y: auto;

      pre {
        white-space: pre-wrap;
        font-size: 0.8125rem;
        color: var(--text-main);
        line-height: 1.6;
      }

      .no-text {
        text-align: center;
        padding: 40px;
        font-size: 0.875rem;
      }
    }

    .side-info-card {
      display: flex;
      flex-direction: column;
      gap: 16px;

      h3 {
        font-size: 1.1rem;
        font-weight: 600;
      }

      .history-title {
        margin-top: 8px;
      }
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-color);

      .info-item {
        font-size: 0.775rem;
      }
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .history-item {
      padding: 10px 12px;
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--text-main);
        background-color: var(--bg-surface-hover);
      }

      .history-date {
        font-size: 0.8rem;
        font-weight: 600;
      }

      .history-sub {
        font-size: 0.725rem;
      }
    }

    .no-analyses-box {
      text-align: center;
      padding: 24px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;

      p {
        font-size: 0.85rem;
      }
    }

    @media (max-width: 900px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ResumeDetailComponent implements OnInit {
  resume: ResumeDetail | null = null;
  analyses: ResumeAnalysis[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private resumeService: ResumeService,
    private analysisService: AnalysisService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadResumeDetail(id);
      this.loadAnalyses(id);
    }
  }

  loadResumeDetail(id: number): void {
    this.resumeService.getResumeDetail(id).subscribe({
      next: (data) => this.resume = data,
      error: () => this.toastService.error('Failed to load resume details.')
    });
  }

  loadAnalyses(id: number): void {
    this.analysisService.getResumeAnalyses(id).subscribe({
      next: (data) => this.analyses = data,
      error: () => {}
    });
  }

  triggerAnalysis(): void {
    if (!this.resume) return;
    this.toastService.info('Running resume analysis...');
    this.analysisService.analyzeResume(this.resume.id).subscribe({
      next: (res) => {
        this.toastService.success('Analysis completed!');
        this.router.navigate(['/analysis', res.id]);
      },
      error: () => this.toastService.error('Analysis failed.')
    });
  }
}
