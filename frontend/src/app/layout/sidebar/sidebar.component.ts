import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar-wrapper glass-card">
      <div class="sidebar-brand">
        <div class="logo-icon">🎯</div>
        <div class="brand-text">
          <h2>Resume Analyzer</h2>
          <span class="brand-sub">AI Career Assistant</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-icon">📊</span>
          <span class="nav-label">Dashboard</span>
        </a>
        <a routerLink="/my-resumes" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-icon">📁</span>
          <span class="nav-label">My Resumes</span>
        </a>
        <a routerLink="/analysis" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-icon">⚡</span>
          <span class="nav-label">Analysis Reports</span>
        </a>
        <a routerLink="/recommendations" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-icon">💡</span>
          <span class="nav-label">Recommendations</span>
        </a>
        <a routerLink="/profile" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-icon">👤</span>
          <span class="nav-label">User Profile</span>
        </a>
        <a routerLink="/settings" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-icon">⚙️</span>
          <span class="nav-label">Settings</span>
        </a>
      </nav>

      <div class="sidebar-footer" *ngIf="authService.currentUser$ | async as user">
        <div class="user-card">
          <div class="user-avatar">
            {{ user.username.substring(0, 2).toUpperCase() }}
          </div>
          <div class="user-details">
            <span class="user-name">{{ user.username }}</span>
            <span class="user-email">{{ user.email }}</span>
          </div>
        </div>
        <button class="logout-btn" (click)="logout()" title="Logout">
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar-wrapper {
      width: 260px;
      height: 100%;
      display: flex;
      flex-direction: column;
      border-radius: 0;
      border-right: 1px solid var(--border-color);
      border-top: none;
      border-bottom: none;
      border-left: none;
      padding: 24px 16px;
      background: var(--bg-secondary);
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 12px 24px 12px;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 20px;
    }
    .logo-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--primary-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      box-shadow: var(--shadow-glow);
    }
    .brand-text {
      h2 {
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--text-main);
        line-height: 1.1;
      }
      .brand-sub {
        font-size: 0.725rem;
        color: var(--text-muted);
        font-weight: 500;
      }
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      border-radius: 12px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.925rem;
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover {
        color: var(--text-main);
        background: var(--bg-surface);
      }

      &.active {
        color: #ffffff;
        background: var(--primary-gradient);
        font-weight: 600;
        box-shadow: var(--shadow-glow);
      }
    }
    .nav-icon {
      font-size: 1.15rem;
    }
    .sidebar-footer {
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .user-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: var(--bg-surface);
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary-color);
      color: #ffffff;
      font-size: 0.85rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .user-details {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
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
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      background: var(--error-bg);
      color: var(--error-color);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--error-color);
        color: #ffffff;
      }
    }
  `]
})
export class SidebarComponent {
  @Output() navClicked = new EventEmitter<void>();

  constructor(public authService: AuthService) {}

  onNavClick() {
    this.navClicked.emit();
  }

  logout() {
    this.authService.logout();
  }
}
