import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AnalysisService } from '../../core/services/analysis.service';
import { Recommendation } from '../../core/models/analysis.model';

interface RecWithDoc extends Recommendation {
  documentName: string;
  analysisId: number;
}

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="recs-page animate-fade-in">
      <!-- Header Banner -->
      <div class="glass-card recs-banner">
        <div class="banner-content">
          <span class="badge badge-warning">AI Career Recommendations</span>
          <h1>Actionable Resume Improvements</h1>
          <p>
            Aggregated feedback derived from your analyzed resumes. Focus on high-priority items to boost ATS ranking.
          </p>
        </div>
        <div class="banner-illustration">
          <img src="/assets/illustrations/illustration-robot.png" alt="Recommendations Robot" />
        </div>
      </div>

      <!-- Filters Row -->
      <div class="glass-card filter-card">
        <div class="filter-group">
          <label>Filter Priority:</label>
          <div class="filter-pills">
            <button class="pill-btn" [class.active]="selectedPriority === 'ALL'" (click)="selectedPriority = 'ALL'">All</button>
            <button class="pill-btn critical" [class.active]="selectedPriority === 'Critical'" (click)="selectedPriority = 'Critical'">Critical</button>
            <button class="pill-btn important" [class.active]="selectedPriority === 'Important'" (click)="selectedPriority = 'Important'">Important</button>
            <button class="pill-btn suggested" [class.active]="selectedPriority === 'Suggested'" (click)="selectedPriority = 'Suggested'">Suggested</button>
          </div>
        </div>

        <div class="filter-group">
          <label>Category:</label>
          <select [(ngModel)]="selectedCategory" class="category-select">
            <option value="ALL">All Categories</option>
            <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
          </select>
        </div>
      </div>

      <!-- Recommendations Grid -->
      <div class="recs-grid" *ngIf="filteredRecs.length > 0; else emptyState">
        <div
          class="glass-card rec-card"
          *ngFor="let rec of filteredRecs"
          [ngClass]="'border-' + rec.priority.toLowerCase()"
        >
          <div class="rec-top">
            <span class="badge" [ngClass]="getPriorityBadgeClass(rec.priority)">{{ rec.priority }}</span>
            <span class="badge badge-info">{{ rec.category }}</span>
          </div>

          <p class="rec-text">{{ rec.message }}</p>

          <div class="rec-footer">
            <span class="doc-origin">📄 {{ rec.documentName }}</span>
            <a [routerLink]="['/analysis', rec.analysisId]" class="view-analysis-link">Open Report →</a>
          </div>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="glass-card empty-container">
          <div class="empty-icon">💡</div>
          <h3>No Recommendations Match Filter</h3>
          <p>Try resetting priority or category filters, or analyze more resumes.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .recs-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .recs-banner {
      padding: 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);

      .banner-content {
        max-width: 600px;
        h1 { font-size: 1.7rem; margin-top: 8px; color: var(--text-main); }
        p { font-size: 0.925rem; color: var(--text-secondary); margin-top: 6px; line-height: 1.6; }
      }
      .banner-illustration img { max-height: 130px; object-fit: contain; }
    }
    .filter-card {
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 12px;
      label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
    }
    .filter-pills {
      display: flex;
      gap: 6px;
    }
    .pill-btn {
      padding: 6px 14px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-secondary);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;

      &.active {
        background: var(--primary-color);
        color: #ffffff;
        border-color: var(--primary-color);
      }
    }
    .category-select {
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-main);
      font-size: 0.85rem;
      outline: none;
    }
    .recs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }
    .rec-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;

      &.border-critical { border-left: 5px solid var(--error-color); }
      &.border-important { border-left: 5px solid var(--warning-color); }
      &.border-suggested { border-left: 5px solid var(--info-color); }
    }
    .rec-top { display: flex; gap: 8px; }
    .rec-text { font-size: 0.925rem; color: var(--text-main); line-height: 1.55; }
    .rec-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 12px;
      border-top: 1px solid var(--border-color);
      font-size: 0.8rem;
      .doc-origin { color: var(--text-muted); font-weight: 500; }
      .view-analysis-link { color: var(--primary-color); font-weight: 600; text-decoration: none; &:hover { text-decoration: underline; } }
    }
    .empty-container {
      padding: 60px 20px;
      text-align: center;
      .empty-icon { font-size: 3rem; margin-bottom: 12px; }
      h3 { font-size: 1.3rem; color: var(--text-main); }
      p { font-size: 0.9rem; color: var(--text-muted); margin-top: 6px; }
    }

    @media (max-width: 768px) {
      .banner-illustration { display: none; }
      .filter-card { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class RecommendationsComponent implements OnInit {
  allRecs: RecWithDoc[] = [];
  selectedPriority: string = 'ALL';
  selectedCategory: string = 'ALL';
  categories: string[] = [];

  constructor(private analysisService: AnalysisService) {}

  ngOnInit(): void {
    this.analysisService.getUserAnalysisHistory().subscribe({
      next: (analyses) => {
        const list: RecWithDoc[] = [];
        const catSet = new Set<string>();

        analyses.forEach(a => {
          if (a.recommendations) {
            a.recommendations.forEach(r => {
              catSet.add(r.category);
              list.push({
                ...r,
                documentName: a.originalFilename,
                analysisId: a.id
              });
            });
          }
        });

        this.allRecs = list;
        this.categories = Array.from(catSet);
      },
      error: () => {}
    });
  }

  get filteredRecs(): RecWithDoc[] {
    return this.allRecs.filter(r => {
      const matchP = this.selectedPriority === 'ALL' || r.priority.toLowerCase() === this.selectedPriority.toLowerCase();
      const matchC = this.selectedCategory === 'ALL' || r.category === this.selectedCategory;
      return matchP && matchC;
    });
  }

  getPriorityBadgeClass(priority: string): string {
    const p = priority.toLowerCase();
    if (p === 'critical') return 'badge-error';
    if (p === 'important') return 'badge-warning';
    return 'badge-info';
  }
}
