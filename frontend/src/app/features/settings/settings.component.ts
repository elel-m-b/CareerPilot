import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, Theme } from '../../core/services/theme.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-page animate-fade-in">
      <div class="page-header">
        <h2>Application Settings</h2>
        <p>Configure theme preferences, notifications, and connection parameters</p>
      </div>

      <div class="settings-grid">
        <!-- Theme Preference Card -->
        <div class="glass-card setting-card">
          <h3>Appearance & Theme</h3>
          <p class="setting-desc">Choose your preferred visual theme interface</p>

          <div class="theme-options">
            <div
              class="theme-box dark-box"
              [class.active]="(themeService.theme$ | async) === 'dark'"
              (click)="themeService.setTheme('dark')"
            >
              <div class="box-preview dark-prev">
                <div class="prev-header"></div>
                <div class="prev-body"></div>
              </div>
              <div class="theme-label">
                <span class="name">Dark Mode (Default)</span>
                <span class="sub">High-contrast glassmorphic theme</span>
              </div>
            </div>

            <div
              class="theme-box light-box"
              [class.active]="(themeService.theme$ | async) === 'light'"
              (click)="themeService.setTheme('light')"
            >
              <div class="box-preview light-prev">
                <div class="prev-header"></div>
                <div class="prev-body"></div>
              </div>
              <div class="theme-label">
                <span class="name">Light Mode</span>
                <span class="sub">Clean, high-visibility layout</span>
              </div>
            </div>
          </div>
        </div>

        <!-- API & Connection Details -->
        <div class="glass-card setting-card">
          <h3>Backend Integration & Security</h3>
          <p class="setting-desc">Status of connection to Spring Boot API service</p>

          <div class="info-rows">
            <div class="info-row">
              <span class="info-key">API Server Endpoint:</span>
              <span class="info-val code-val">{{ apiUrl }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">Connection Status:</span>
              <span class="badge badge-success">● Connected (HTTP 200)</span>
            </div>
            <div class="info-row">
              <span class="info-key">Authentication Engine:</span>
              <span class="info-val">Stateless JWT Bearer Token</span>
            </div>
            <div class="info-row">
              <span class="info-key">Scoring Algorithm:</span>
              <span class="info-val">Deterministic ATS Engine (Rule-based & Section Parser)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .page-header {
      h2 { font-size: 1.6rem; color: var(--text-main); }
      p { font-size: 0.9rem; color: var(--text-muted); margin-top: 4px; }
    }
    .settings-grid {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .setting-card {
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      h3 { font-size: 1.25rem; color: var(--text-main); }
      .setting-desc { font-size: 0.85rem; color: var(--text-muted); margin-top: -10px; }
    }
    .theme-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 8px;
    }
    .theme-box {
      border: 2px solid var(--border-color);
      border-radius: 14px;
      padding: 16px;
      cursor: pointer;
      background: var(--bg-surface);
      transition: all 0.25s ease;
      display: flex;
      flex-direction: column;
      gap: 14px;

      &:hover { border-color: var(--primary-color); }
      &.active { border-color: var(--primary-color); box-shadow: var(--shadow-glow); }
    }
    .box-preview {
      height: 100px;
      border-radius: 8px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid var(--border-color);
    }
    .dark-prev { background: #0b0f19; .prev-header { height: 16px; background: #1f293d; border-radius: 4px; } .prev-body { flex: 1; background: #111827; border-radius: 4px; } }
    .light-prev { background: #ffffff; .prev-header { height: 16px; background: #e2e8f0; border-radius: 4px; } .prev-body { flex: 1; background: #f8fafc; border-radius: 4px; } }

    .theme-label {
      .name { font-size: 0.95rem; font-weight: 700; color: var(--text-main); display: block; }
      .sub { font-size: 0.775rem; color: var(--text-muted); }
    }

    .info-rows {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      font-size: 0.875rem;

      .info-key { color: var(--text-secondary); font-weight: 500; }
      .info-val { color: var(--text-main); font-weight: 600; }
      .code-val { font-family: monospace; color: var(--primary-color); }
    }
  `]
})
export class SettingsComponent {
  apiUrl = environment.apiUrl;

  constructor(public themeService: ThemeService) {}
}
