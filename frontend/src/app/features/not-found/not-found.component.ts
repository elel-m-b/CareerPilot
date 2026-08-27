import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="not-found-container animate-fade-in">
      <div class="glass-card not-found-card">
        <div class="illustration-box">
          <img src="/assets/illustrations/illustration-target.png" alt="Page Not Found" />
        </div>
        <h1>404 — Page Not Found</h1>
        <p>The page you are looking for does not exist or has been moved.</p>
        <a routerLink="/dashboard" class="btn btn-primary">Return to Dashboard</a>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      width: 100%;
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .not-found-card {
      padding: 48px;
      text-align: center;
      max-width: 480px;
      width: 100%;

      .illustration-box img { max-height: 180px; object-fit: contain; margin-bottom: 20px; }
      h1 { font-size: 1.8rem; color: var(--text-main); margin-bottom: 8px; }
      p { font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 24px; }
    }
  `]
})
export class NotFoundComponent {}
