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
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ResumeUploadModalComponent } from '../../shared/components/resume-upload-modal/resume-upload-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StatCardComponent,
    ResumeUploadModalComponent
  ],
  template: `
    <div class="dashboard-page animate-fade-in">
      <!-- Welcome Hero Banner -->
      <div class="glass-card hero-banner">
        <div class="hero-content">
          <span class="badge badge-info">AI Career Engine</span>
          <h1>Welcome back, {{ (authService.currentUser$ | async)?.username }}!</h1>
          <p>
            Here is an overview of your resume performance, ATS compatibility metrics, and actionable career insights.
          </p>
          <div class="hero-actions">
            <button class="btn btn-primary" (click)="showUploadModal = true">
              <span>🚀</span> Analyze a New Resume
            </button>
            <a routerLink="/my-resumes" class="btn btn-secondary">
              <span>📁</span> View My Resumes
            </a>
          </div>
        </div>
        <div class="hero-illustration">
          <img src="/assets/illustrations/illustration-robot.png" alt="Dashboard Banner Illustration" />
        </div>
      </div>

      <!-- Stat Cards Grid -->
      <div class="stats-grid" *ngIf="stats">
        <app-stat-card
          label="Total Resumes"
          [value]="stats.totalResumes"
          subtitle="Uploaded documents"
          icon="📄"
          iconBg="rgba(99, 102, 241, 0.15)"
          iconColor="#6366f1"
        ></app-stat-card>

        <app-stat-card
          label="Total Analyses"
          [value]="stats.totalAnalyses"
          subtitle="Completed AI reviews"
          icon="⚡"
          iconBg="rgba(139, 92, 246, 0.15)"
          iconColor="#8b5cf6"
        ></app-stat-card>

        <app-stat-card
          label="Average Score"
          [value]="stats.averageScore ? (stats.averageScore.toFixed(1) + '/100') : 'N/A'"
          subtitle="Overall performance"
          icon="📈"
          iconBg="rgba(59, 130, 246, 0.15)"
          iconColor="#3b82f6"
        ></app-stat-card>

        <app-stat-card
          label="Best Score"
          [value]="stats.bestScore ? (stats.bestScore + '/100') : 'N/A'"
          subtitle="Highest resume rating"
          icon="🏆"
          iconBg="rgba(16, 185, 129, 0.15)"
          iconColor="#10b981"
        ></app-stat-card>
      </div>

      <!-- Main Dashboard Content Grid -->
      <div class="dashboard-grid">
        <!-- Recent Resumes Section -->
        <div class="glass-card content-card">
          <div class="card-header">
            <h3>Recent Resumes</h3>
            <a routerLink="/my-resumes" class="view-all-link">View All →</a>
          </div>
          <div class="table-container">
            <table class="data-table" *ngIf="recentResumes.length > 0; else emptyResumes">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Format</th>
                  <th>Uploaded</th>
                  <th>Latest Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let res of recentResumes">
                  <td class="font-medium">{{ res.originalFilename }}</td>
                  <td><span class="badge badge-info">{{ res.fileType }}</span></td>
                  <td class="text-muted">{{ res.uploadedAt | date:'mediumDate' }}</td>
                  <td>
                    <span
                      class="badge"
                      [ngClass]="getScoreBadgeClass(res.latestScore)"
                    >
                      {{ res.latestScore ? res.latestScore + '/100' : 'Unanalyzed' }}
                    </span>
                  </td>
                  <td>
                    <a
                      *ngIf="res.latestAnalysisId"
                      [routerLink]="['/analysis', res.latestAnalysisId]"
                      class="btn btn-secondary btn-sm"
                    >
                      View Report
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
                <div class="empty-icon">📄</div>
                <h4>No resumes uploaded yet</h4>
                <p>Upload your first CV to calculate ATS score and get recommendations.</p>
                <button class="btn btn-primary btn-sm" (click)="showUploadModal = true">Upload Resume</button>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- Recent Analysis Reports Section -->
        <div class="glass-card content-card">
          <div class="card-header">
            <h3>Latest Analysis Reports</h3>
            <a routerLink="/analysis" class="view-all-link">View All →</a>
          </div>
          <div class="analysis-list" *ngIf="recentAnalyses.length > 0; else emptyAnalyses">
            <div
              *ngFor="let item of recentAnalyses"
              class="analysis-item-card"
              [routerLink]="['/analysis', item.id]"
            >
              <div class="item-left">
                <div class="score-badge-circle" [style.border-color]="getScoreColor(item.overallScore)">
                  {{ item.overallScore }}
                </div>
                <div class="item-details">
                  <div class="item-title">{{ item.originalFilename }}</div>
                  <div class="item-date">Analyzed {{ item.analyzedAt | date:'short' }}</div>
                </div>
              </div>
              <div class="item-right">
                <span class="badge badge-success">ATS: {{ item.atsScore }}%</span>
                <span class="arrow-icon">→</span>
              </div>
            </div>
          </div>
          <ng-template #emptyAnalyses>
            <div class="empty-state">
              <div class="empty-icon">⚡</div>
              <h4>No analysis reports yet</h4>
              <p>Run your first AI analysis to view detailed feedback.</p>
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
      gap: 28px;
    }
    .hero-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 36px 40px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%);
      border-color: rgba(99, 102, 241, 0.2);

      .hero-content {
        max-width: 600px;
        h1 {
          font-size: 1.85rem;
          margin-top: 10px;
          color: var(--text-main);
        }
        p {
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin-top: 8px;
          line-height: 1.6;
        }
      }
      .hero-actions {
        display: flex;
        gap: 14px;
        margin-top: 24px;
      }
      .hero-illustration {
        img {
          max-height: 170px;
          object-fit: contain;
        }
      }
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 24px;
    }
    .content-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      h3 { font-size: 1.15rem; color: var(--text-main); }
      .view-all-link {
        font-size: 0.85rem;
        color: var(--primary-color);
        text-decoration: none;
        font-weight: 600;
        &:hover { text-decoration: underline; }
      }
    }
    .table-container {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;

      th {
        text-align: left;
        padding: 10px 12px;
        color: var(--text-muted);
        font-weight: 600;
        border-bottom: 1px solid var(--border-color);
      }
      td {
        padding: 12px;
        border-bottom: 1px solid var(--border-color);
        color: var(--text-secondary);
      }
      .font-medium {
        font-weight: 600;
        color: var(--text-main);
      }
      .text-muted { color: var(--text-muted); }
    }
    .analysis-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .analysis-item-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--primary-color);
        transform: translateX(4px);
      }
    }
    .item-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .score-badge-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid #6366f1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 0.95rem;
      color: var(--text-main);
    }
    .item-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-main);
    }
    .item-date {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .item-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .arrow-icon {
      color: var(--text-muted);
      font-weight: 700;
    }
    .empty-state {
      padding: 30px 20px;
      text-align: center;
      .empty-icon { font-size: 2.2rem; margin-bottom: 8px; }
      h4 { font-size: 1rem; color: var(--text-main); }
      p { font-size: 0.85rem; color: var(--text-muted); margin: 4px 0 14px 0; }
    }

    @media (max-width: 992px) {
      .dashboard-grid { grid-template-columns: 1fr; }
      .hero-illustration { display: none; }
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

  getScoreBadgeClass(score?: number): string {
    if (!score) return 'badge-info';
    if (score >= 85) return 'badge-success';
    if (score >= 70) return 'badge-info';
    if (score >= 50) return 'badge-warning';
    return 'badge-error';
  }

  getScoreColor(score: number): string {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }
}
