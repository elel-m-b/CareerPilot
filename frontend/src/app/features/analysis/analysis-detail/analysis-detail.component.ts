import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AnalysisService } from '../../../core/services/analysis.service';
import { ToastService } from '../../../core/services/toast.service';
import { Recommendation, ResumeAnalysis } from '../../../core/models/analysis.model';

@Component({
  selector: 'app-analysis-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="analysis-detail-page animate-fade-in" *ngIf="analysis">
      <!-- Top Action Bar -->
      <div class="page-top-bar flex-between">
        <button class="btn btn-outline btn-sm" routerLink="/analysis">← Back to All Reports</button>
        <div class="top-actions">
          <button class="btn btn-danger btn-sm" (click)="deleteReport()">Delete Report</button>
        </div>
      </div>

      <!-- Overview Header Card -->
      <div class="card overview-card flex-between">
        <div class="score-overall-box text-mono">
          <div class="overall-val">{{ analysis.overallScore }}</div>
          <div class="overall-label text-muted">OVERALL RATING</div>
        </div>

        <div class="overview-info">
          <div class="filename-row">
            <h2 class="text-mono">{{ analysis.originalFilename }}</h2>
            <span class="analyzed-time text-mono text-muted">EVALUATED AT {{ analysis.analyzedAt | date:'yyyy-MM-dd HH:mm' }}</span>
          </div>

          <div class="key-metrics-pills">
            <div class="metric-pill text-mono">
              <span class="pill-title text-muted">ATS COMPATIBILITY</span>
              <span class="pill-val">{{ analysis.atsScore }}%</span>
            </div>
            <div class="metric-pill text-mono">
              <span class="pill-title text-muted">CONTENT QUALITY</span>
              <span class="pill-val">{{ analysis.contentScore }}%</span>
            </div>
            <div class="metric-pill text-mono">
              <span class="pill-title text-muted">STRUCTURE</span>
              <span class="pill-val">{{ analysis.structureScore }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2-Column Section: Sub-Scores & Recommendations -->
      <div class="detail-grid">
        <!-- Sub-Scores Column -->
        <div class="card column-card">
          <h3>Dimension Breakdown</h3>
          <p class="section-sub text-muted">Component-level scores evaluated by deterministic engine</p>

          <div class="score-bars-container">
            <div class="bar-row">
              <div class="bar-label flex-between text-mono">
                <span>ATS Optimization</span>
                <span>{{ analysis.atsScore }}/100</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" [style.width.%]="analysis.atsScore"></div>
              </div>
            </div>

            <div class="bar-row">
              <div class="bar-label flex-between text-mono">
                <span>Content & Keywords</span>
                <span>{{ analysis.contentScore }}/100</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" [style.width.%]="analysis.contentScore"></div>
              </div>
            </div>

            <div class="bar-row">
              <div class="bar-label flex-between text-mono">
                <span>Structure & Formatting</span>
                <span>{{ analysis.structureScore }}/100</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" [style.width.%]="analysis.structureScore"></div>
              </div>
            </div>

            <div class="bar-row">
              <div class="bar-label flex-between text-mono">
                <span>Technical & Soft Skills</span>
                <span>{{ analysis.skillsScore }}/100</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" [style.width.%]="analysis.skillsScore"></div>
              </div>
            </div>

            <div class="bar-row">
              <div class="bar-label flex-between text-mono">
                <span>Work Experience</span>
                <span>{{ analysis.experienceScore }}/100</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" [style.width.%]="analysis.experienceScore"></div>
              </div>
            </div>

            <div class="bar-row">
              <div class="bar-label flex-between text-mono">
                <span>Education Credentials</span>
                <span>{{ analysis.educationScore }}/100</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" [style.width.%]="analysis.educationScore"></div>
              </div>
            </div>

            <div class="bar-row">
              <div class="bar-label flex-between text-mono">
                <span>Projects & Portfolio</span>
                <span>{{ analysis.projectsScore }}/100</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" [style.width.%]="analysis.projectsScore"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommendations Column -->
        <div class="card column-card">
          <div class="card-header-row flex-between">
            <div>
              <h3>Recommendations</h3>
              <p class="section-sub text-muted">Suggestions to improve ATS score</p>
            </div>

            <div class="priority-tabs">
              <button
                class="tab-btn text-mono"
                [class.active]="activePriority === 'ALL'"
                (click)="activePriority = 'ALL'"
              >ALL ({{ analysis.recommendations.length }})</button>
              <button
                class="tab-btn text-mono"
                [class.active]="activePriority === 'HIGH'"
                (click)="activePriority = 'HIGH'"
              >HIGH</button>
              <button
                class="tab-btn text-mono"
                [class.active]="activePriority === 'MEDIUM'"
                (click)="activePriority = 'MEDIUM'"
              >MED</button>
              <button
                class="tab-btn text-mono"
                [class.active]="activePriority === 'LOW'"
                (click)="activePriority = 'LOW'"
              >LOW</button>
            </div>
          </div>

          <div class="recs-list" *ngIf="filteredRecommendations.length > 0; else noRecs">
            <div
              *ngFor="let rec of filteredRecommendations"
              class="rec-item-card"
            >
              <div class="rec-header flex-between mb-2">
                <span class="badge" [ngClass]="getPriorityBadgeClass(rec.priority)">
                  {{ rec.priority }}
                </span>
                <span class="badge badge-neutral text-mono">{{ rec.category }}</span>
              </div>
              <p class="rec-message">{{ rec.message }}</p>
            </div>
          </div>
          <ng-template #noRecs>
            <div class="no-recs-box text-muted">
              <p>No {{ activePriority !== 'ALL' ? activePriority : '' }} recommendations.</p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Section Feedback Breakdown -->
      <div class="card full-width-card" *ngIf="analysis.sections && analysis.sections.length > 0">
        <h3>Section Evaluation Feedback</h3>
        <p class="section-sub text-muted">Detailed observations extracted per section</p>

        <div class="sections-grid">
          <div *ngFor="let sec of analysis.sections" class="section-box">
            <div class="section-box-header flex-between">
              <span class="section-type-title text-mono">{{ formatSectionType(sec.sectionType) }}</span>
              <span class="score-pill">
                {{ sec.score }} / 100
              </span>
            </div>
            <p class="section-feedback text-secondary">{{ sec.feedback }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analysis-detail-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .overview-card {
      padding: 24px;
      gap: 32px;

      .score-overall-box {
        width: 110px;
        height: 110px;
        background: var(--bg-surface);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .overall-val {
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1;
        }

        .overall-label {
          font-size: 0.625rem;
          letter-spacing: 0.08em;
          margin-top: 4px;
        }
      }

      .overview-info {
        flex: 1;

        .filename-row {
          h2 {
            font-size: 1.35rem;
            font-weight: 700;
          }
          .analyzed-time {
            font-size: 0.75rem;
            display: block;
            margin-top: 2px;
          }
        }
      }

      .key-metrics-pills {
        display: flex;
        gap: 12px;
        margin-top: 16px;

        .metric-pill {
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;

          .pill-title {
            font-size: 0.65rem;
            letter-spacing: 0.06em;
          }

          .pill-val {
            font-size: 1.15rem;
            font-weight: 700;
            margin-top: 2px;
          }
        }
      }
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1.1fr;
      gap: 20px;
    }

    .column-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;

      h3 {
        font-size: 1.1rem;
        font-weight: 600;
      }
    }

    .section-sub {
      font-size: 0.775rem;
      margin-top: -6px;
    }

    .score-bars-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;

      .bar-row {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .bar-label {
          font-size: 0.775rem;
        }
      }
    }

    .priority-tabs {
      display: flex;
      gap: 4px;

      .tab-btn {
        padding: 4px 8px;
        font-size: 0.7rem;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-color);
        background: var(--bg-surface);
        color: var(--text-secondary);
        cursor: pointer;

        &.active {
          background: var(--text-main);
          color: var(--text-inverse);
          border-color: var(--text-main);
          font-weight: 600;
        }
      }
    }

    .recs-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 6px;
    }

    .rec-item-card {
      padding: 12px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);

      .rec-message {
        font-size: 0.85rem;
        line-height: 1.5;
      }
    }

    .full-width-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;

      h3 {
        font-size: 1.1rem;
        font-weight: 600;
      }
    }

    .sections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }

    .section-box {
      padding: 14px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);

      .section-box-header {
        margin-bottom: 8px;

        .section-type-title {
          font-size: 0.85rem;
          font-weight: 600;
        }
      }

      .section-feedback {
        font-size: 0.8125rem;
        line-height: 1.5;
      }
    }

    .no-recs-box {
      padding: 24px;
      text-align: center;
      font-size: 0.85rem;
    }

    .mb-2 {
      margin-bottom: 8px;
    }

    @media (max-width: 900px) {
      .overview-card {
        flex-direction: column;
        align-items: flex-start;
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }
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
    return this.analysis.recommendations.filter(r => r.priority.toUpperCase() === this.activePriority.toUpperCase());
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

  getPriorityBadgeClass(priority: string): string {
    const p = priority.toUpperCase();
    if (p === 'HIGH' || p === 'CRITICAL') return 'badge-high';
    if (p === 'MEDIUM' || p === 'IMPORTANT') return 'badge-medium';
    return 'badge-low';
  }

  formatSectionType(type: string): string {
    return type.replace(/_/g, ' ').toUpperCase();
  }
}
