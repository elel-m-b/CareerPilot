import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ToastComponent],
  template: `
    <div class="auth-wrapper">
      <app-toast></app-toast>

      <!-- Left Branding & Info Panel -->
      <div class="auth-brand-panel">
        <div class="brand-header">
          <div class="brand-badge">CV</div>
          <span class="brand-title">Resume Analyzer</span>
        </div>

        <div class="hero-content">
          <h2>Professional Resume Intelligence Platform</h2>
          <p>Analyze resumes against industry standards, calculate ATS compatibility scores, extract structured skills, and generate actionable recommendations.</p>

          <div class="feature-checklist">
            <div class="feature-item">
              <span class="feature-bullet">■</span>
              <span>Automated PDF & DOCX section parsing</span>
            </div>
            <div class="feature-item">
              <span class="feature-bullet">■</span>
              <span>Deterministic ATS score & category rating</span>
            </div>
            <div class="feature-item">
              <span class="feature-bullet">■</span>
              <span>Prioritized feedback & optimization history</span>
            </div>
          </div>
        </div>

        <div class="panel-footer">
          <span>Production-grade REST Architecture</span>
          <span class="version-tag">v1.0.0</span>
        </div>
      </div>

      <!-- Right Login Form Panel -->
      <div class="auth-form-panel">
        <div class="form-card">
          <div class="form-header">
            <h2>Sign In</h2>
            <p>Access your resume analysis dashboard</p>
          </div>

          <div class="demo-banner">
            <div class="demo-info">
              <span>Demo Account:</span>
              <code class="text-mono">alex.smith&#64;example.com</code>
            </div>
            <button type="button" class="btn btn-sm btn-outline" (click)="fillDemoCredentials()">
              Autofill Credentials
            </button>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="email">Email Address</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="name@example.com"
                [class.is-invalid]="isControlInvalid('email')"
              />
              <span class="form-error" *ngIf="isControlInvalid('email')">Please enter a valid email address.</span>
            </div>

            <div class="form-group">
              <div class="flex-between">
                <label for="password">Password</label>
              </div>
              <div class="password-input-group">
                <input
                  id="password"
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="••••••••"
                  [class.is-invalid]="isControlInvalid('password')"
                />
                <button type="button" class="pwd-toggle" (click)="showPassword = !showPassword">
                  {{ showPassword ? 'HIDE' : 'SHOW' }}
                </button>
              </div>
              <span class="form-error" *ngIf="isControlInvalid('password')">Password is required.</span>
            </div>

            <button type="submit" class="btn btn-primary btn-lg full-width" [disabled]="loginForm.invalid || isLoading">
              <span *ngIf="!isLoading">Sign In</span>
              <span *ngIf="isLoading">Authenticating...</span>
            </button>
          </form>

          <div class="auth-divider">
            <span>OR</span>
          </div>

          <div class="register-prompt">
            <span>Don't have an account?</span>
            <a routerLink="/register" class="link-bold">Create Account</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: 100vh;
      width: 100vw;
      display: flex;
      background-color: var(--bg-app);
    }

    .auth-brand-panel {
      flex: 1;
      padding: 60px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-right: 1px solid var(--border-color);
      background-color: var(--bg-sidebar);

      .brand-header {
        display: flex;
        align-items: center;
        gap: 12px;

        .brand-badge {
          width: 36px;
          height: 36px;
          background: var(--text-main);
          color: var(--text-inverse);
          font-family: var(--font-mono);
          font-weight: 700;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
        }

        .brand-title {
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
      }

      .hero-content {
        max-width: 520px;
        margin: 40px 0;

        h2 {
          font-size: 2.2rem;
          font-weight: 700;
          line-height: 1.25;
          margin-bottom: 16px;
          color: var(--text-main);
        }

        p {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .feature-checklist {
          display: flex;
          flex-direction: column;
          gap: 14px;

          .feature-item {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 0.925rem;
            color: var(--text-main);

            .feature-bullet {
              font-size: 0.75rem;
              color: var(--text-secondary);
            }
          }
        }
      }

      .panel-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8rem;
        color: var(--text-muted);
        border-top: 1px solid var(--border-color);
        padding-top: 20px;

        .version-tag {
          font-family: var(--font-mono);
        }
      }
    }

    .auth-form-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;

      .form-card {
        width: 100%;
        max-width: 420px;
      }

      .form-header {
        margin-bottom: 28px;

        h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 6px;
        }

        p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
      }

      .demo-banner {
        background-color: var(--bg-surface);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 12px 14px;
        margin-bottom: 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;

        .demo-info {
          display: flex;
          flex-direction: column;
          font-size: 0.75rem;
          color: var(--text-secondary);

          code {
            color: var(--text-main);
            font-size: 0.8rem;
          }
        }
      }

      .password-input-group {
        position: relative;
        display: flex;
        align-items: center;

        input {
          padding-right: 60px;
        }

        .pwd-toggle {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 0.7rem;
          font-weight: 600;
          cursor: pointer;

          &:hover {
            color: var(--text-main);
          }
        }
      }

      .full-width {
        width: 100%;
        margin-top: 8px;
      }

      .auth-divider {
        display: flex;
        align-items: center;
        margin: 24px 0;

        &::before, &::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border-color);
        }

        span {
          padding: 0 12px;
          font-size: 0.75rem;
          font-family: var(--font-mono);
          color: var(--text-muted);
        }
      }

      .register-prompt {
        text-align: center;
        font-size: 0.875rem;
        color: var(--text-secondary);

        .link-bold {
          margin-left: 6px;
          color: var(--text-main);
          font-weight: 600;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }

    @media (max-width: 860px) {
      .auth-brand-panel {
        display: none;
      }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    public themeService: ThemeService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['alex.smith@example.com', [Validators.required, Validators.email]],
      password: ['password123', [Validators.required]]
    });
  }

  isControlInvalid(controlName: string): boolean {
    const ctrl = this.loginForm.get(controlName);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  fillDemoCredentials(): void {
    this.loginForm.patchValue({
      email: 'alex.smith@example.com',
      password: 'password123'
    });
    this.toastService.info('Demo credentials loaded');
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.toastService.success(`Authenticated as ${res.user.username}`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || 'Authentication failed. Please check your credentials.';
        this.toastService.error(msg, 'Sign In Error');
      }
    });
  }
}
