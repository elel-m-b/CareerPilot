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
    <header class="header-wrapper">
      <div class="header-left">
        <button class="mobile-toggle" (click)="toggleSidebar.emit()" aria-label="Toggle Menu">
          Menu
        </button>
        <div class="header-tagline text-mono">
          <span>SYSTEM // RESUME ANALYZER ENGINE</span>
        </div>
      </div>

      <div class="header-right">
        <!-- Upload Quick Action -->
        <button class="btn btn-primary btn-sm" (click)="openUploadModal.emit()">
          Upload & Analyze Resume
        </button>

        <!-- Theme Toggle -->
        <button class="theme-toggle-btn" (click)="themeService.toggleTheme()" title="Toggle Dark/Light Mode">
          <span class="text-mono">{{ (themeService.theme$ | async) === 'dark' ? 'LIGHT' : 'DARK' }}</span>
        </button>

        <!-- User Info Link -->
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
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--bg-sidebar);
      width: 100%;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .mobile-toggle {
      display: none;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      font-size: 0.8rem;
      font-family: var(--font-mono);
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }

    .header-tagline {
      font-size: 0.75rem;
      color: var(--text-muted);
      letter-spacing: 0.04em;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .theme-toggle-btn {
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--text-main);
      }
    }

    .user-header-link {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: var(--text-main);
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      transition: background 0.15s ease;

      &:hover {
        background: var(--bg-surface);
      }
    }

    .header-avatar {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      background: var(--text-main);
      color: var(--text-inverse);
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-header-name {
      font-size: 0.85rem;
      font-weight: 500;
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
