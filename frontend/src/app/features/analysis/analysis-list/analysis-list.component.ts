import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnalysisService } from '../../../core/services/analysis.service';
import { ToastService } from '../../../core/services/toast.service';
import { ResumeAnalysis } from '../../../core/models/analysis.model';

@Component({
  selector: 'app-analysis-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="analysis-list-page animate-fade-in">
      <div class="page-header">
        <div>
          <h2>Analysis Reports</h2>
          <p>Review past AI resume score evaluations and ATS compliance reports</p>
        </div>
      </div>

      <div class="reports-grid" *ngIf="reports.length > 0; else emptyReports">
        <div
          class="glass-card report-card"
          *ngFor="let item of reports"
          [routerLink]="['/analysis', item.id]"
        >
          <div class="report-card-top">
            <div class="score-circle-badge" [style.border-color]="getScoreColor(item.overallScore)">
              <span class="score-num" [style.color]="getScoreColor(item.overallScore)">{{ item.overallScore }}</span>
              <span class="score-den">/100</span>
            </div>
            <div class="report-meta">
              <h3 class="file-title">{{ item.originalFilename }}</h3>
              <span class="analyzed-date">Analyzed {{ item.analyzedAt | date:'medium' }}</span>
            </div>
          </div>

          <div class="subscores-row">
            <div class="subscore-pill">
              <span class="sub-label">ATS Score:</span>
              <span class="sub-val">{{ item.atsScore }}%</span>
            </div>
            <div class="subscore-pill">
              <span class="sub-label">Content:</span>
              <span class="sub-val">{{ item.contentScore }}%</span>
            </div>
            <div class="subscore-pill">
              <span class="sub-label">Skills:</span>
              <span class="sub-val">{{ item.skillsScore }}%</span>
            </div>
          </div>

          <div class="report-card-bottom">
            <span class="recs-count">💡 {{ item.recommendations ? item.recommendations.length : 0 }} Recommendations</span>
            <span class="view-btn">View Detailed Report →</span>
          </div>
        </div>
      </div>

      <ng-template #emptyReports>
        <div class="glass-card empty-container">
          <div class="empty-icon">⚡</div>
          <h3>No Analysis Reports Found</h3>
          <p>Go to your uploaded resumes and click "Analyze" to generate a report.</p>
          <a routerLink="/dashboard" class="btn btn-primary">Go to Dashboard</a>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .analysis-list-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .page-header {
      h2 { font-size: 1.6rem; color: var(--text-main); }
      p { font-size: 0.9rem; color: var(--text-muted); margin-top: 4px; }
    }
    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }
    .report-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      cursor: pointer;
      &:hover { border-color: var(--primary-color); }
    }
    .report-card-top {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .score-circle-badge {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 4px solid #6366f1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      .score-num { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.2rem; line-height: 1; }
      .score-den { font-size: 0.65rem; color: var(--text-muted); }
    }
    .report-meta {
      flex: 1;
      overflow: hidden;
      .file-title {
        font-size: 1.05rem;
        font-weight: 600;
        color: var(--text-main);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .analyzed-date { font-size: 0.775rem; color: var(--text-muted); margin-top: 2px; display: block; }
    }
    .subscores-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .subscore-pill {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 0.775rem;
      display: flex;
      align-items: center;
      gap: 4px;
      .sub-label { color: var(--text-muted); }
      .sub-val { color: var(--text-main); font-weight: 700; }
    }
    .report-card-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 12px;
      border-top: 1px solid var(--border-color);
      font-size: 0.85rem;
      .recs-count { color: var(--text-secondary); }
      .view-btn { color: var(--primary-color); font-weight: 600; }
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
export class AnalysisListComponent implements OnInit {
  reports: ResumeAnalysis[] = [];

  constructor(
    private analysisService: AnalysisService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.analysisService.getUserAnalysisHistory().subscribe({
      next: (data) => this.reports = data,
      error: () => this.toastService.error('Failed to load analysis reports.')
    });
  }

  getScoreColor(score: number): string {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }
}
