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
      <div class="card recs-banner">
        <div class="banner-content">
          <div class="badge badge-neutral text-mono">FEEDBACK ENGINE</div>
          <h1>Candidate Recommendations</h1>
          <p class="text-secondary">
            Aggregated improvement points extracted from your resume evaluations. Address high-priority entries to optimize ATS parsing compliance.
          </p>
        </div>
      </div>

      <!-- Filters Row -->
      <div class="card filter-card flex-between">
        <div class="filter-group">
          <label class="text-mono">PRIORITY:</label>
          <div class="filter-pills">
            <button class="pill-btn text-mono" [class.active]="selectedPriority === 'ALL'" (click)="selectedPriority = 'ALL'">ALL</button>
            <button class="pill-btn text-mono" [class.active]="selectedPriority === 'HIGH'" (click)="selectedPriority = 'HIGH'">HIGH</button>
            <button class="pill-btn text-mono" [class.active]="selectedPriority === 'MEDIUM'" (click)="selectedPriority = 'MEDIUM'">MED</button>
            <button class="pill-btn text-mono" [class.active]="selectedPriority === 'LOW'" (click)="selectedPriority = 'LOW'">LOW</button>
          </div>
        </div>

        <div class="filter-group">
          <label class="text-mono">CATEGORY:</label>
          <select [(ngModel)]="selectedCategory" class="category-select text-mono">
            <option value="ALL">All Categories</option>
            <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
          </select>
        </div>
      </div>

      <!-- Recommendations Grid -->
      <div class="recs-grid" *ngIf="filteredRecs.length > 0; else emptyState">
        <div
          class="card rec-card"
          *ngFor="let rec of filteredRecs"
        >
          <div class="rec-top flex-between">
            <span class="badge" [ngClass]="getPriorityBadgeClass(rec.priority)">{{ rec.priority }}</span>
            <span class="badge badge-neutral text-mono">{{ rec.category }}</span>
          </div>

          <p class="rec-text">{{ rec.message }}</p>

          <div class="rec-footer flex-between text-mono">
            <span class="doc-origin text-muted">{{ rec.documentName }}</span>
            <a [routerLink]="['/analysis', rec.analysisId]" class="view-analysis-link">Report →</a>
          </div>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="card empty-container">
          <h3>No Recommendations Found</h3>
          <p class="text-secondary">Try adjusting filters or upload a new resume for analysis.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .recs-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .recs-banner {
      padding: 24px;

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-top: 8px;
      }

      p {
        font-size: 0.875rem;
        margin-top: 4px;
      }
    }

    .filter-card {
      padding: 14px 20px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 10px;

      label {
        font-size: 0.725rem;
        color: var(--text-muted);
      }
    }

    .filter-pills {
      display: flex;
      gap: 4px;
    }

    .pill-btn {
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-secondary);
      font-size: 0.725rem;
      cursor: pointer;

      &.active {
        background: var(--text-main);
        color: var(--text-inverse);
        border-color: var(--text-main);
        font-weight: 600;
      }
    }

    .category-select {
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-main);
      font-size: 0.75rem;
      outline: none;
    }

    .recs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .rec-card {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .rec-text {
      font-size: 0.85rem;
      line-height: 1.5;
    }

    .rec-footer {
      padding-top: 10px;
      border-top: 1px solid var(--border-color);
      font-size: 0.75rem;

      .view-analysis-link {
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

    @media (max-width: 768px) {
      .filter-card {
        flex-direction: column;
        align-items: flex-start;
      }
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
      const matchP = this.selectedPriority === 'ALL' || r.priority.toUpperCase() === this.selectedPriority.toUpperCase();
      const matchC = this.selectedCategory === 'ALL' || r.category === this.selectedCategory;
      return matchP && matchC;
    });
  }

  getPriorityBadgeClass(priority: string): string {
    const p = priority.toUpperCase();
    if (p === 'HIGH' || p === 'CRITICAL') return 'badge-high';
    if (p === 'MEDIUM' || p === 'IMPORTANT') return 'badge-medium';
    return 'badge-low';
  }
}
