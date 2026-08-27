import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toastService.toasts$ | async"
        class="toast-item"
        [ngClass]="toast.type"
      >
        <div class="toast-icon">
          <span *ngIf="toast.type === 'success'">✓</span>
          <span *ngIf="toast.type === 'error'">✕</span>
          <span *ngIf="toast.type === 'warning'">⚠</span>
          <span *ngIf="toast.type === 'info'">ℹ</span>
        </div>
        <div class="toast-content">
          <div class="toast-title" *ngIf="toast.title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" (click)="toastService.remove(toast.id)">×</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
      width: 100%;
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 12px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      color: var(--text-main);
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);

      &.success { border-left: 4px solid var(--success-color); }
      &.error { border-left: 4px solid var(--error-color); }
      &.warning { border-left: 4px solid var(--warning-color); }
      &.info { border-left: 4px solid var(--info-color); }
    }
    .toast-icon {
      font-weight: 700;
      font-size: 1.1rem;
      margin-top: 1px;
    }
    .toast-content {
      flex: 1;
    }
    .toast-title {
      font-weight: 600;
      font-size: 0.9rem;
      margin-bottom: 2px;
    }
    .toast-message {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .toast-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.2rem;
      cursor: pointer;
      line-height: 1;
      padding: 0 4px;
      &:hover { color: var(--text-main); }
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
