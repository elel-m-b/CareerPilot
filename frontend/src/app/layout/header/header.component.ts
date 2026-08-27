import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header-wrapper glass-card">
      <div class="header-left">
        <button class="mobile-toggle" (click)="toggleSidebar.emit()" aria-label="Toggle Menu">
          ☰
        </button>
        <div class="header-tagline">
          <span>AI-Powered Resume Analysis & ATS Optimization</span>
        </div>
      </div>

      <div class="header-right">
        <!-- Quick Upload Action -->
        <button class="btn btn-primary btn-sm" (click)="openUploadModal.emit()">
          <span>⚡</span> Analyze CV
        </button>

        <!-- Theme Toggle Switch -->
        <button class="theme-toggle-btn" (click)="themeService.toggleTheme()" title="Toggle Theme Mode">
          <span *ngIf="(themeService.theme$ | async) === 'dark'">☀️</span>
          <span *ngIf="(themeService.theme$ | async) === 'light'">🌙</span>
        </button>

        <!-- User Dropdown Link -->
        <a routerLink="/profile" class="user-header-link" *ngIf="authService.currentUser$ | async as user">
          <div class="header-avatar">
            {{ user.username.substring(0, 2).toUpperCase() }}
          </div>
          <span class="user-header-name">{{ user.username }}</span>
        </a>
      </div>
    </header>
  `,
  styles: [`
    .header-wrapper {
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      border-radius: 0;
      border-bottom: 1px solid var(--border-color);
      border-top: none;
      border-left: none;
      border-right: none;
      background: var(--bg-secondary);
      width: 100%;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .mobile-toggle {
      display: none;
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-main);
      font-size: 1.2rem;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
    }
    .header-tagline {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-muted);
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .theme-toggle-btn {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      font-size: 1.1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--border-focus);
        background: var(--bg-hover);
      }
    }
    .user-header-link {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--text-main);
      padding: 4px 8px;
      border-radius: 10px;
      transition: background 0.2s ease;

      &:hover {
        background: var(--bg-surface);
      }
    }
    .header-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--primary-gradient);
      color: #ffffff;
      font-size: 0.8rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-header-name {
      font-size: 0.875rem;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .mobile-toggle {
        display: block;
      }
      .header-tagline {
        display: none;
      }
      .user-header-name {
        display: none;
      }
    }
  `]
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() openUploadModal = new EventEmitter<void>();

  constructor(
    public themeService: ThemeService,
    public authService: AuthService
  ) {}
}
