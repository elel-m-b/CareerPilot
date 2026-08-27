import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-score-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="score-bar-wrapper">
      <div class="score-bar-header">
        <span class="score-bar-title">{{ title }}</span>
        <span class="score-bar-val" [style.color]="barColor">{{ score }}/100</span>
      </div>
      <div class="score-bar-track">
        <div
          class="score-bar-fill"
          [style.width.%]="score"
          [style.background]="barColor"
        ></div>
      </div>
    </div>
  `,
  styles: [`
    .score-bar-wrapper {
      margin-bottom: 14px;
    }
    .score-bar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      font-size: 0.875rem;
    }
    .score-bar-title {
      font-weight: 600;
      color: var(--text-main);
    }
    .score-bar-val {
      font-weight: 700;
    }
    .score-bar-track {
      height: 8px;
      background: var(--bg-surface);
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid var(--border-color);
    }
    .score-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `]
})
export class ScoreBarComponent {
  @Input() title: string = '';
  @Input() score: number = 0;

  get barColor(): string {
    if (this.score >= 85) return '#10b981';
    if (this.score >= 70) return '#3b82f6';
    if (this.score >= 50) return '#f59e0b';
    return '#ef4444';
  }
}
