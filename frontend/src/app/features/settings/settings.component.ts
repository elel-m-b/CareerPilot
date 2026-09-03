import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-page animate-fade-in">
      <div class="page-header flex-between">
        <div>
          <h2>System Settings</h2>
          <p class="text-secondary">Configure theme parameters and view backend API integration status</p>
        </div>
      </div>

      <div class="settings-grid">
        <!-- Theme Preference Card -->
        <div class="card setting-card">
          <h3>Interface Theme</h3>
          <p class="setting-desc text-secondary">Select interface color scheme mode</p>

          <div class="theme-options">
            <div
              class="theme-box"
              [class.active]="(themeService.theme$ | async) === 'dark'"
              (click)="themeService.setTheme('dark')"
            >
              <div class="theme-label">
                <span class="name text-mono">DARK MODE</span>
                <span class="sub text-muted">Black canvas with pure white elements and borders</span>
              </div>
            </div>

            <div
              class="theme-box"
              [class.active]="(themeService.theme$ | async) === 'light'"
              (click)="themeService.setTheme('light')"
            >
              <div class="theme-label">
                <span class="name text-mono">LIGHT MODE</span>
                <span class="sub text-muted">White canvas with pure black text and high contrast borders</span>
              </div>
            </div>
          </div>
        </div>

        <!-- API & Connection Details -->
        <div class="card setting-card">
          <h3>Backend Integration</h3>
          <p class="setting-desc text-secondary">Spring Boot REST API endpoint & authentication status</p>

          <div class="info-rows">
            <div class="info-row flex-between text-mono">
              <span class="info-key text-muted">API BASE URL:</span>
              <span class="info-val">{{ apiUrl }}</span>
            </div>
            <div class="info-row flex-between text-mono">
              <span class="info-key text-muted">CONNECTION STATUS:</span>
              <span class="badge badge-neutral">CONNECTED</span>
            </div>
            <div class="info-row flex-between text-mono">
              <span class="info-key text-muted">AUTH SPECIFICATION:</span>
              <span class="info-val">Stateless JWT Bearer Token</span>
            </div>
            <div class="info-row flex-between text-mono">
              <span class="info-key text-muted">PARSER ALGORITHM:</span>
              <span class="info-val">Deterministic Heuristic Section Matcher</span>
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
      gap: 20px;
    }

    .page-header {
      h2 {
        font-size: 1.5rem;
        font-weight: 700;
      }
      p {
        font-size: 0.875rem;
        margin-top: 2px;
      }
    }

    .settings-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .setting-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;

      h3 {
        font-size: 1.1rem;
        font-weight: 600;
      }

      .setting-desc {
        font-size: 0.85rem;
        margin-top: -8px;
      }
    }

    .theme-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-top: 6px;
    }

    .theme-box {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 16px;
      cursor: pointer;
      background-color: var(--bg-surface);
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--text-main);
        background-color: var(--bg-surface-hover);
      }

      &.active {
        border-color: var(--text-main);
        background-color: var(--text-main);
        color: var(--text-inverse);

        .name {
          color: var(--text-inverse);
        }

        .sub {
          color: rgba(255, 255, 255, 0.7);
        }
      }
    }

    .theme-label {
      .name {
        font-size: 0.875rem;
        font-weight: 700;
        display: block;
      }

      .sub {
        font-size: 0.75rem;
        margin-top: 4px;
        display: block;
      }
    }

    .info-rows {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 6px;
    }

    .info-row {
      padding: 10px 14px;
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      font-size: 0.775rem;
    }
  `]
})
export class SettingsComponent {
  apiUrl = environment.apiUrl;

  constructor(public themeService: ThemeService) {}
}
