import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar-wrapper">
      <div class="sidebar-brand">
        <div class="brand-badge">CV</div>
        <div class="brand-text">
          <h2>Resume Analyzer</h2>
          <span class="brand-sub">Platform</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-title">MAIN</div>
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-bullet">■</span>
          <span class="nav-label">Dashboard</span>
        </a>
        <a routerLink="/my-resumes" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-bullet">■</span>
          <span class="nav-label">My Resumes</span>
        </a>
        <a routerLink="/analysis" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-bullet">■</span>
          <span class="nav-label">Analysis Reports</span>
        </a>
        <a routerLink="/recommendations" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-bullet">■</span>
          <span class="nav-label">Recommendations</span>
        </a>

        <div class="nav-section-title mt-4">ACCOUNT</div>
        <a routerLink="/profile" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-bullet">■</span>
          <span class="nav-label">User Profile</span>
        </a>
        <a routerLink="/settings" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-bullet">■</span>
          <span class="nav-label">Settings</span>
        </a>
      </nav>

      <div class="sidebar-footer" *ngIf="authService.currentUser$ | async as user">
        <div class="user-info">
          <span class="user-name">{{ user.username }}</span>
          <span class="user-email">{{ user.email }}</span>
        </div>
        <button class="btn btn-outline btn-sm full-width" (click)="logout()">
          Sign Out
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar-wrapper {
      width: 240px;
      height: 100%;
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--border-color);
      padding: 24px 16px;
      background-color: var(--bg-sidebar);
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 24px;

      .brand-badge {
        width: 32px;
        height: 32px;
        background: var(--text-main);
        color: var(--text-inverse);
        font-family: var(--font-mono);
        font-weight: 700;
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-sm);
      }

      .brand-text {
        h2 {
          font-size: 1rem;
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }
        .brand-sub {
          font-size: 0.7rem;
          font-family: var(--font-mono);
          color: var(--text-muted);
          text-transform: uppercase;
        }
      }
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;

      .nav-section-title {
        font-size: 0.6875rem;
        font-family: var(--font-mono);
        color: var(--text-muted);
        letter-spacing: 0.08em;
        padding: 8px 12px 4px;

        &.mt-4 {
          margin-top: 16px;
        }
      }
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.15s ease;

      .nav-bullet {
        font-size: 0.5rem;
        color: var(--text-muted);
        transition: color 0.15s ease;
      }

      &:hover {
        color: var(--text-main);
        background-color: var(--bg-surface);

        .nav-bullet {
          color: var(--text-main);
        }
      }

      &.active {
        color: var(--text-inverse);
        background-color: var(--text-main);
        font-weight: 600;

        .nav-bullet {
          color: var(--text-inverse);
        }
      }
    }

    .sidebar-footer {
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 12px;

      .user-info {
        display: flex;
        flex-direction: column;

        .user-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-email {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .full-width {
        width: 100%;
      }
    }
  `]
})
export class SidebarComponent {
  @Output() navClicked = new EventEmitter<void>();

  constructor(public authService: AuthService) {}

  onNavClick(): void {
    this.navClicked.emit();
  }

  logout(): void {
    this.authService.logout();
  }
}
