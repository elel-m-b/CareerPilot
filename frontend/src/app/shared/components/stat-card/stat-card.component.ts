import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-card stat-card">
      <div class="stat-icon-box" [style.background]="iconBg" [style.color]="iconColor">
        <span>{{ icon }}</span>
      </div>
      <div class="stat-info">
        <span class="stat-label">{{ label }}</span>
        <h3 class="stat-value">{{ value }}</h3>
        <span class="stat-subtitle" *ngIf="subtitle">{{ subtitle }}</span>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .stat-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 1.6rem;
      font-weight: 800;
      margin-top: 2px;
      color: var(--text-main);
    }
    .stat-subtitle {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 2px;
    }
  `]
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = '';
  @Input() subtitle: string = '';
  @Input() icon: string = '📊';
  @Input() iconBg: string = 'rgba(99, 102, 241, 0.15)';
  @Input() iconColor: string = '#6366f1';
}
