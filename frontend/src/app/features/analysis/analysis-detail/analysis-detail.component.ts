import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AnalysisService } from '../../../core/services/analysis.service';
import { ToastService } from '../../../core/services/toast.service';
import { Recommendation, ResumeAnalysis } from '../../../core/models/analysis.model';
import { ScoreCircleComponent } from '../../../shared/components/score-circle/score-circle.component';
import { ScoreBarComponent } from '../../../shared/components/score-bar/score-bar.component';

@Component({
  selector: 'app-analysis-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ScoreCircleComponent,
    ScoreBarComponent
  ],
  template: `
    <div class="analysis-detail-page animate-fade-in" *ngIf="analysis">
      <!-- Top Action Bar -->
      <div class="page-top-bar">
        <button class="btn btn-secondary btn-sm" routerLink="/analysis">← All Reports</button>
        <div class="top-actions">
          <button class="btn btn-danger btn-sm" (click)="deleteReport()">Delete Report</button>
        </div>
      </div>

      <!-- Overview Header Card -->
      <div class="glass-card overview-card">
        <div class="overview-left">
          <app-score-circle
            [score]="analysis.overallScore"
            [size]="170"
            [showLabel]="true"
          ></app-score-circle>
        </div>

        <div class="overview-info">
          <div class="filename-row">
            <h2>{{ analysis.originalFilename }}</h2>
            <span class="analyzed-time">Evaluated on {{ analysis.analyzedAt | date:'medium' }}</span>
          </div>

          <p class="overview-desc">
            Your resume was evaluated across 7 core structural and ATS dimensions. Below is the detailed breakdown and actionable feedback.
          </p>

          <div class="key-metrics-pills">
            <div class="metric-pill">
              <span class="pill-title">ATS Compatibility</span>
              <span class="pill-val" [style.color]="getScoreColor(analysis.atsScore)">{{ analysis.atsScore }}%</span>
            </div>
            <div class="metric-pill">
              <span class="pill-title">Content Quality</span>
              <span class="pill-val" [style.color]="getScoreColor(analysis.contentScore)">{{ analysis.contentScore }}%</span>
            </div>
            <div class="metric-pill">
              <span class="pill-title">Structure & Layout</span>
              <span class="pill-val" [style.color]="getScoreColor(analysis.structureScore)">{{ analysis.structureScore }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2-Column Section: Sub-Scores & Recommendations -->
      <div class="detail-grid">
        <!-- Sub-Scores Column -->
        <div class="glass-card column-card">
          <h3>Dimension Breakdown</h3>
          <p class="section-sub">Individual component scores evaluated by the analyzer engine</p>

          <div class="score-bars-container">
            <app-score-bar title="ATS Optimization" [score]="analysis.atsScore"></app-score-bar>
            <app-score-bar title="Content & Keywords" [score]="analysis.contentScore"></app-score-bar>
            <app-score-bar title="Structure & Layout" [score]="analysis.structureScore"></app-score-bar>
            <app-score-bar title="Technical & Soft Skills" [score]="analysis.skillsScore"></app-score-bar>
            <app-score-bar title="Work Experience" [score]="analysis.experienceScore"></app-score-bar>
            <app-score-bar title="Education Credentials" [score]="analysis.educationScore"></app-score-bar>
            <app-score-bar title="Projects & Portfolio" [score]="analysis.projectsScore"></app-score-bar>
          </div>
        </div>

        <!-- Recommendations Column -->
        <div class="glass-card column-card">
          <div class="card-header-row">
            <div>
              <h3>AI Recommendations</h3>
              <p class="section-sub">Tailored suggestions to improve ATS ranking</p>
            </div>

            <!-- Filter tabs -->
            <div class="priority-tabs">
              <button
                class="tab-btn"
                [class.active]="activePriority === 'ALL'"
                (click)="activePriority = 'ALL'"
              >All ({{ analysis.recommendations.length }})</button>
              <button
                class="tab-btn priority-critical"
                [class.active]="activePriority === 'Critical'"
                (click)="activePriority = 'Critical'"
              >Critical</button>
              <button
                class="tab-btn priority-important"
                [class.active]="activePriority === 'Important'"
                (click)="activePriority = 'Important'"
              >Important</button>
              <button
                class="tab-btn priority-suggested"
                [class.active]="activePriority === 'Suggested'"
                (click)="activePriority = 'Suggested'"
              >Suggested</button>
            </div>
          </div>

          <div class="recs-list" *ngIf="filteredRecommendations.length > 0; else noRecs">
            <div
              *ngFor="let rec of filteredRecommendations"
              class="rec-item-card"
              [ngClass]="'priority-border-' + rec.priority.toLowerCase()"
            >
              <div class="rec-header">
                <span class="badge" [ngClass]="getPriorityBadgeClass(rec.priority)">
                  {{ rec.priority }}
                </span>
                <span class="badge badge-info">{{ rec.category }}</span>
              </div>
              <p class="rec-message">{{ rec.message }}</p>
            </div>
          </div>
          <ng-template #noRecs>
            <div class="no-recs-box">
              <p>No {{ activePriority !== 'ALL' ? activePriority : '' }} recommendations found!</p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Section Feedback Breakdown -->
      <div class="glass-card full-width-card" *ngIf="analysis.sections && analysis.sections.length > 0">
        <h3>Detailed Section Analysis</h3>
        <p class="section-sub">Specific evaluation and feedback per resume section</p>

        <div class="sections-grid">
          <div *ngFor="let sec of analysis.sections" class="section-box">
            <div class="section-box-header">
              <span class="section-type-title">{{ formatSectionType(sec.sectionType) }}</span>
              <span class="badge" [ngClass]="getScoreBadgeClass(sec.score)">
                {{ sec.score }}/100
              </span>
            </div>
            <p class="section-feedback">{{ sec.feedback }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analysis-detail-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .page-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .overview-card {
      padding: 32px;
      display: flex;
      align-items: center;
      gap: 36px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
    }
    .overview-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .filename-row {
        h2 { font-size: 1.7rem; color: var(--text-main); }
        .analyzed-time { font-size: 0.8rem; color: var(--text-muted); }
      }
      .overview-desc {
        font-size: 0.925rem;
        color: var(--text-secondary);
        line-height: 1.6;
      }
    }
    .key-metrics-pills {
      display: flex;
      gap: 16px;
      margin-top: 8px;
    }
    .metric-pill {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      padding: 10px 16px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;

      .pill-title { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
      .pill-val { font-family: 'Outfit', sans-serif; font-size: 1.3rem; font-weight: 800; margin-top: 2px; }
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 24px;
    }
    .column-card {
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      h3 { font-size: 1.2rem; color: var(--text-main); }
    }
    .section-sub {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: -8px;
    }
    .score-bars-container {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .card-header-row {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .priority-tabs {
      display: flex;
      gap: 6px;
      background: var(--bg-surface);
      padding: 4px;
      border-radius: 10px;
      border: 1px solid var(--border-color);
    }
    .tab-btn {
      flex: 1;
      padding: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;

      &.active {
        background: var(--bg-secondary);
        color: var(--text-main);
        box-shadow: var(--shadow-sm);
      }
    }
    .recs-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;
    }
    .rec-item-card {
      padding: 14px 16px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 12px;

      &.priority-border-critical { border-left: 4px solid var(--error-color); }
      &.priority-border-important { border-left: 4px solid var(--warning-color); }
      &.priority-border-suggested { border-left: 4px solid var(--info-color); }
    }
    .rec-header {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }
    .rec-message {
      font-size: 0.875rem;
      color: var(--text-main);
      line-height: 1.5;
    }
    .full-width-card {
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      h3 { font-size: 1.2rem; color: var(--text-main); }
    }
    .sections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      margin-top: 8px;
    }
    .section-box {
      padding: 16px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 12px;
    }
    .section-box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .section-type-title {
        font-weight: 700;
        font-size: 0.9rem;
        color: var(--text-main);
      }
    }
    .section-feedback {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    .no-recs-box {
      padding: 30px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    @media (max-width: 960px) {
      .overview-card { flex-direction: column; text-align: center; }
      .key-metrics-pills { justify-content: center; }
      .detail-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AnalysisDetailComponent implements OnInit {
  analysis: ResumeAnalysis | null = null;
  activePriority: string = 'ALL';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private analysisService: AnalysisService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.analysisService.getAnalysisById(id).subscribe({
        next: (data) => this.analysis = data,
        error: () => this.toastService.error('Failed to load analysis report.')
      });
    }
  }

  get filteredRecommendations(): Recommendation[] {
    if (!this.analysis) return [];
    if (this.activePriority === 'ALL') return this.analysis.recommendations;
    return this.analysis.recommendations.filter(r => r.priority.toLowerCase() === this.activePriority.toLowerCase());
  }

  deleteReport(): void {
    if (!this.analysis) return;
    if (confirm('Are you sure you want to delete this analysis report?')) {
      this.analysisService.deleteAnalysis(this.analysis.id).subscribe({
        next: () => {
          this.toastService.success('Report deleted.');
          this.router.navigate(['/analysis']);
        },
        error: () => this.toastService.error('Failed to delete report.')
      });
    }
  }

  getScoreColor(score: number): string {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }

  getScoreBadgeClass(score: number): string {
    if (score >= 85) return 'badge-success';
    if (score >= 70) return 'badge-info';
    if (score >= 50) return 'badge-warning';
    return 'badge-error';
  }

  getPriorityBadgeClass(priority: string): string {
    const p = priority.toLowerCase();
    if (p === 'critical') return 'badge-error';
    if (p === 'important') return 'badge-warning';
    return 'badge-info';
  }

  formatSectionType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
