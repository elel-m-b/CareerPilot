import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { ResumeService } from '../../core/services/resume.service';
import { AnalysisService } from '../../core/services/analysis.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats } from '../../core/models/dashboard.model';
import { Resume } from '../../core/models/resume.model';
import { ResumeAnalysis } from '../../core/models/analysis.model';
import { ResumeUploadModalComponent } from '../../shared/components/resume-upload-modal/resume-upload-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ResumeUploadModalComponent
  ],
  template: `
    <div class="dashboard-page animate-fade-in">
      <!-- Header Banner -->
      <div class="card hero-banner">
        <div class="hero-content">
          <div class="badge badge-neutral text-mono">OVERVIEW</div>
          <h1>Welcome, {{ (authService.currentUser$ | async)?.username }}</h1>
          <p class="text-secondary">
            Resume evaluation platform metrics, ATS compatibility breakdown, and candidate file management.
          </p>
          <div class="hero-actions">
            <button class="btn btn-primary" (click)="showUploadModal = true">
              Upload New Resume
            </button>
            <a routerLink="/my-resumes" class="btn btn-outline">
              View Resumes
            </a>
          </div>
        </div>
      </div>

      <!-- Stat Cards Grid -->
      <div class="stats-grid" *ngIf="stats">
        <div class="card stat-card">
          <div class="stat-label text-mono">TOTAL RESUMES</div>
          <div class="stat-value text-mono">{{ stats.totalResumes }}</div>
          <div class="stat-sub text-muted">Uploaded documents</div>
        </div>

        <div class="card stat-card">
          <div class="stat-label text-mono">TOTAL ANALYSES</div>
          <div class="stat-value text-mono">{{ stats.totalAnalyses }}</div>
          <div class="stat-sub text-muted">Completed evaluations</div>
        </div>

        <div class="card stat-card">
          <div class="stat-label text-mono">AVERAGE SCORE</div>
          <div class="stat-value text-mono">{{ stats.averageScore ? (stats.averageScore.toFixed(1) + ' / 100') : 'N/A' }}</div>
          <div class="stat-sub text-muted">Mean ATS rating</div>
        </div>

        <div class="card stat-card">
          <div class="stat-label text-mono">BEST SCORE</div>
          <div class="stat-value text-mono">{{ stats.bestScore ? (stats.bestScore + ' / 100') : 'N/A' }}</div>
          <div class="stat-sub text-muted">Peak candidate score</div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="dashboard-grid">
        <!-- Recent Resumes Section -->
        <div class="card content-card">
          <div class="card-header flex-between">
            <h3>Recent Resumes</h3>
            <a routerLink="/my-resumes" class="text-mono link-subtle">View All →</a>
          </div>

          <div class="table-container">
            <table class="custom-table" *ngIf="recentResumes.length > 0; else emptyResumes">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Format</th>
                  <th>Uploaded</th>
                  <th>Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let res of recentResumes">
                  <td class="font-medium text-mono">{{ res.originalFilename }}</td>
                  <td><span class="badge badge-neutral text-mono">{{ res.fileType }}</span></td>
                  <td class="text-muted text-mono">{{ res.uploadedAt | date:'yyyy-MM-dd' }}</td>
                  <td>
                    <span class="score-pill">
                      {{ res.latestScore ? res.latestScore + ' / 100' : 'Pending' }}
                    </span>
                  </td>
                  <td>
                    <a
                      *ngIf="res.latestAnalysisId"
                      [routerLink]="['/analysis', res.latestAnalysisId]"
                      class="btn btn-outline btn-sm"
                    >
                      Report
                    </a>
                    <button
                      *ngIf="!res.latestAnalysisId"
                      class="btn btn-primary btn-sm"
                      (click)="triggerAnalysis(res.id)"
                    >
                      Analyze
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <ng-template #emptyResumes>
              <div class="empty-state">
                <p class="text-secondary">No resumes uploaded yet.</p>
                <button class="btn btn-primary btn-sm" (click)="showUploadModal = true">Upload Resume</button>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- Recent Analysis Reports Section -->
        <div class="card content-card">
          <div class="card-header flex-between">
            <h3>Analysis History</h3>
            <a routerLink="/analysis" class="text-mono link-subtle">View All →</a>
          </div>

          <div class="analysis-list" *ngIf="recentAnalyses.length > 0; else emptyAnalyses">
            <div
              *ngFor="let item of recentAnalyses"
              class="analysis-item-card"
              [routerLink]="['/analysis', item.id]"
            >
              <div class="item-left">
                <div class="score-box text-mono">
                  {{ item.overallScore }}
                </div>
                <div class="item-details">
                  <div class="item-title text-mono">{{ item.originalFilename }}</div>
                  <div class="item-date text-muted text-mono">{{ item.analyzedAt | date:'yyyy-MM-dd HH:mm' }}</div>
                </div>
              </div>
              <div class="item-right">
                <span class="badge badge-neutral text-mono">ATS {{ item.atsScore }}%</span>
              </div>
            </div>
          </div>

          <ng-template #emptyAnalyses>
            <div class="empty-state">
              <p class="text-secondary">No analysis reports generated yet.</p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Resume Upload Modal -->
      <app-resume-upload-modal
        *ngIf="showUploadModal"
        (close)="showUploadModal = false"
      ></app-resume-upload-modal>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .hero-banner {
      padding: 28px;
      
      .hero-content {
        max-width: 640px;

        h1 {
          font-size: 1.75rem;
          margin-top: 10px;
          font-weight: 700;
        }

        p {
          font-size: 0.925rem;
          margin-top: 8px;
          line-height: 1.5;
        }
      }

      .hero-actions {
        display: flex;
        gap: 12px;
        margin-top: 20px;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;

      .stat-card {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 4px;

        .stat-label {
          font-size: 0.6875rem;
          color: var(--text-muted);
          letter-spacing: 0.06em;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-main);
          margin: 4px 0;
        }

        .stat-sub {
          font-size: 0.75rem;
        }
      }
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 20px;
    }

    .content-card {
      display: flex;
      flex-direction: column;
      gap: 16px;

      h3 {
        font-size: 1.1rem;
        font-weight: 600;
      }

      .link-subtle {
        font-size: 0.75rem;
        color: var(--text-muted);

        &:hover {
          color: var(--text-main);
        }
      }
    }

    .analysis-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .analysis-item-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--text-main);
        background-color: var(--bg-surface-hover);
      }
    }

    .item-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .score-box {
        width: 36px;
        height: 36px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.9rem;
      }

      .item-title {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-main);
      }

      .item-date {
        font-size: 0.725rem;
      }
    }

    .empty-state {
      padding: 32px 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    @media (max-width: 900px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  recentResumes: Resume[] = [];
  recentAnalyses: ResumeAnalysis[] = [];
  showUploadModal = false;

  constructor(
    public authService: AuthService,
    private dashboardService: DashboardService,
    private resumeService: ResumeService,
    private analysisService: AnalysisService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.dashboardService.getStats().subscribe({
      next: (data) => this.stats = data,
      error: () => {}
    });

    this.resumeService.getUserResumes().subscribe({
      next: (data) => this.recentResumes = data.slice(0, 5),
      error: () => {}
    });

    this.analysisService.getUserAnalysisHistory().subscribe({
      next: (data) => this.recentAnalyses = data.slice(0, 5),
      error: () => {}
    });
  }

  triggerAnalysis(resumeId: number): void {
    this.analysisService.analyzeResume(resumeId).subscribe({
      next: () => this.loadDashboardData(),
      error: () => {}
    });
  }
}
