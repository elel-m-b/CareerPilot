import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-score-circle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="score-circle-container" [style.width.px]="size" [style.height.px]="size">
      <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 100 100">
        <!-- Background track -->
        <circle
          cx="50" cy="50" r="42"
          stroke="var(--border-color)"
          stroke-width="8"
          fill="transparent"
        />
        <!-- Progress arc -->
        <circle
          cx="50" cy="50" r="42"
          [attr.stroke]="scoreColor"
          stroke-width="8"
          stroke-linecap="round"
          fill="transparent"
          [attr.stroke-dasharray]="dashArray"
          [attr.stroke-dashoffset]="dashOffset"
          transform="rotate(-90 50 50)"
          style="transition: stroke-dashoffset 1s ease-in-out;"
        />
      </svg>
      <div class="score-text-overlay">
        <span class="score-value" [style.color]="scoreColor">{{ score }}</span>
        <span class="score-max">/100</span>
        <span class="score-label" *ngIf="showLabel">{{ getScoreCategory(score) }}</span>
      </div>
    </div>
  `,
  styles: [`
    .score-circle-container {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    svg {
      transform: rotate(0deg);
    }
    .score-text-overlay {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      line-height: 1;
    }
    .score-value {
      font-family: 'Outfit', sans-serif;
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: -1px;
    }
    .score-max {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
      margin-top: 2px;
    }
    .score-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
      color: var(--text-secondary);
    }
  `]
})
export class ScoreCircleComponent implements OnChanges {
  @Input() score: number = 0;
  @Input() size: number = 160;
  @Input() showLabel: boolean = true;

  dashArray = 2 * Math.PI * 42; // circumference ~263.89
  dashOffset = this.dashArray;

  ngOnChanges(): void {
    const validScore = Math.min(100, Math.max(0, this.score || 0));
    this.dashOffset = this.dashArray - (validScore / 100) * this.dashArray;
  }

  get scoreColor(): string {
    if (this.score >= 85) return '#10b981'; // Emerald Green
    if (this.score >= 70) return '#3b82f6'; // Bright Blue
    if (this.score >= 50) return '#f59e0b'; // Amber Orange
    return '#ef4444'; // Red
  }

  getScoreCategory(val: number): string {
    if (val >= 85) return 'Excellent';
    if (val >= 70) return 'Good Resume';
    if (val >= 50) return 'Needs Work';
    return 'Poor Match';
  }
}
