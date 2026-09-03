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
      <div class="page-header flex-between">
        <div>
          <h2>Analysis Reports</h2>
          <p class="text-secondary">Historical ATS compatibility ratings and evaluation reports</p>
        </div>
      </div>

      <div class="reports-grid" *ngIf="reports.length > 0; else emptyReports">
        <div
          class="card report-card"
          *ngFor="let item of reports"
          [routerLink]="['/analysis', item.id]"
        >
          <div class="report-card-top flex-between">
            <div class="score-badge text-mono">
              <span class="score-num">{{ item.overallScore }}</span>
              <span class="score-den text-muted">/ 100</span>
            </div>
            <div class="report-meta text-right">
              <span class="analyzed-date text-mono text-muted">{{ item.analyzedAt | date:'yyyy-MM-dd HH:mm' }}</span>
            </div>
          </div>

          <h3 class="file-title text-mono">{{ item.originalFilename }}</h3>

          <div class="subscores-row">
            <div class="subscore-pill text-mono">
              <span class="sub-label text-muted">ATS:</span>
              <span class="sub-val">{{ item.atsScore }}%</span>
            </div>
            <div class="subscore-pill text-mono">
              <span class="sub-label text-muted">Content:</span>
              <span class="sub-val">{{ item.contentScore }}%</span>
            </div>
            <div class="subscore-pill text-mono">
              <span class="sub-label text-muted">Skills:</span>
              <span class="sub-val">{{ item.skillsScore }}%</span>
            </div>
          </div>

          <div class="report-card-bottom flex-between text-mono">
            <span class="recs-count text-muted">{{ item.recommendations ? item.recommendations.length : 0 }} Recommendations</span>
            <span class="view-btn">Inspect Report →</span>
          </div>
        </div>
      </div>

      <ng-template #emptyReports>
        <div class="card empty-container">
          <h3>No Analysis Reports</h3>
          <p class="text-secondary">Upload a resume and run analysis to populate your evaluation history.</p>
          <a routerLink="/dashboard" class="btn btn-primary">Go to Dashboard</a>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .analysis-list-page {
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

    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .report-card {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--text-main);
        background-color: var(--bg-surface-hover);
      }
    }

    .score-badge {
      display: inline-flex;
      align-items: baseline;
      gap: 4px;

      .score-num {
        font-size: 1.5rem;
        font-weight: 700;
      }

      .score-den {
        font-size: 0.75rem;
      }
    }

    .text-right {
      text-align: right;
    }

    .file-title {
      font-size: 0.925rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .analyzed-date {
      font-size: 0.75rem;
    }

    .subscores-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .subscore-pill {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 4px 8px;
      font-size: 0.75rem;
      display: flex;
      gap: 4px;

      .sub-val {
        font-weight: 600;
      }
    }

    .report-card-bottom {
      padding-top: 10px;
      border-top: 1px solid var(--border-color);
      font-size: 0.75rem;

      .view-btn {
        font-weight: 600;
      }
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
}
