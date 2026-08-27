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
      <div class="detail-header">
        <button class="btn btn-secondary btn-sm" routerLink="/my-resumes">← Back to Resumes</button>
        <div class="header-title-box">
          <h2>{{ resume.originalFilename }}</h2>
          <span class="badge badge-info">{{ resume.fileType }}</span>
          <span class="file-size-tag">{{ (resume.fileSize / 1024).toFixed(0) }} KB</span>
        </div>
      </div>

      <div class="detail-grid">
        <!-- Extracted Text Card -->
        <div class="glass-card text-card">
          <div class="card-title-row">
            <h3>Extracted Resume Content</h3>
            <button class="btn btn-primary btn-sm" (click)="triggerAnalysis()">
              <span>⚡</span> Run Analysis
            </button>
          </div>
          <div class="text-content-box">
            <pre *ngIf="resume.extractedText">{{ resume.extractedText }}</pre>
            <div *ngIf="!resume.extractedText" class="no-text">No text extracted from this file.</div>
          </div>
        </div>

        <!-- History & Info Sidebar Card -->
        <div class="glass-card side-info-card">
          <h3>File Information</h3>
          <div class="info-list">
            <div class="info-item">
              <span class="label">Uploaded On:</span>
              <span class="value">{{ resume.uploadedAt | date:'medium' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Last Updated:</span>
              <span class="value">{{ resume.updatedAt | date:'medium' }}</span>
            </div>
          </div>

          <h3 class="history-title">Analysis History</h3>
          <div class="history-list" *ngIf="analyses.length > 0; else noAnalyses">
            <div
              *ngFor="let item of analyses"
              class="history-item"
              [routerLink]="['/analysis', item.id]"
            >
              <div class="score-pill" [style.background]="getScoreColor(item.overallScore)">
                {{ item.overallScore }}
              </div>
              <div class="history-details">
                <div class="history-date">{{ item.analyzedAt | date:'short' }}</div>
                <div class="history-sub">ATS: {{ item.atsScore }}%</div>
              </div>
              <span class="arrow">→</span>
            </div>
          </div>
          <ng-template #noAnalyses>
            <div class="no-analyses-box">
              <p>No analysis performed yet for this document.</p>
              <button class="btn btn-primary btn-sm" (click)="triggerAnalysis()">Run AI Analysis</button>
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
      gap: 24px;
    }
    .detail-header {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .header-title-box {
      display: flex;
      align-items: center;
      gap: 12px;
      h2 { font-size: 1.6rem; color: var(--text-main); }
      .file-size-tag { font-size: 0.85rem; color: var(--text-muted); }
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
    }
    .text-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      h3 { font-size: 1.15rem; color: var(--text-main); }
    }
    .text-content-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
      max-height: 520px;
      overflow-y: auto;
      pre {
        font-family: 'Inter', sans-serif;
        white-space: pre-wrap;
        font-size: 0.9rem;
        color: var(--text-secondary);
        line-height: 1.6;
      }
      .no-text { color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 40px; }
    }
    .side-info-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      h3 { font-size: 1.1rem; color: var(--text-main); }
      .history-title { margin-top: 12px; }
    }
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      .label { color: var(--text-muted); }
      .value { color: var(--text-main); font-weight: 500; }
    }
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .history-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      background: var(--bg-surface);
      border-radius: 10px;
      border: 1px solid var(--border-color);
      cursor: pointer;
      &:hover { border-color: var(--primary-color); }
    }
    .score-pill {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      color: #ffffff;
      font-weight: 800;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .history-details { flex: 1; }
    .history-date { font-size: 0.8rem; font-weight: 600; color: var(--text-main); }
    .history-sub { font-size: 0.75rem; color: var(--text-muted); }
    .no-analyses-box {
      text-align: center;
      padding: 20px 10px;
      p { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px; }
    }

    @media (max-width: 900px) {
      .detail-grid { grid-template-columns: 1fr; }
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
    this.toastService.info('Analyzing resume...');
    this.analysisService.analyzeResume(this.resume.id).subscribe({
      next: (res) => {
        this.toastService.success('Analysis completed!');
        this.router.navigate(['/analysis', res.id]);
      },
      error: () => this.toastService.error('Analysis failed.')
    });
  }

  getScoreColor(score: number): string {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }
}
