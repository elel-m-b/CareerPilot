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
    <div class="ez-login-wrapper">
      <app-toast></app-toast>

      <!-- Left Hero & Branding Section -->
      <div class="ez-left-panel">
        <div class="ez-brand-header">
          <div class="brand-logo-icon">🎯</div>
          <span class="brand-title">Resume Analyzer</span>
        </div>

        <div class="ez-hero-center">
          <div class="hero-illustration-wrapper">
            <img src="/assets/illustrations/illustration-robot.png" alt="Resume Analyzer AI Assistant" />
          </div>
          <div class="hero-caption">
            <h3>AI-Powered Resume Optimization</h3>
            <p>Score your CV against ATS algorithms, identify missing keywords, and land top job offers.</p>
          </div>
        </div>

        <!-- Decorative Abstract Curves (Inspired by EZBookkeeping) -->
        <div class="decorative-shapes">
          <svg viewBox="0 0 800 200" preserveAspectRatio="none">
            <path d="M0 120 Q200 60 400 130 T800 90 L800 200 L0 200 Z" fill="rgba(99, 102, 241, 0.08)"></path>
            <path d="M0 150 Q250 100 500 160 T800 120 L800 200 L0 200 Z" fill="rgba(139, 92, 246, 0.12)"></path>
          </svg>
        </div>
      </div>

      <!-- Right Login Form Section (EZBookkeeping UX Inspired) -->
      <div class="ez-right-panel glass-card">
        <div class="ez-form-container">
          <!-- Form Header -->
          <div class="ez-header">
            <h2>Welcome to Resume Analyzer</h2>
            <p class="sub-text">Please log in with your Resume Analyzer account</p>
          </div>

          <!-- Demo Account Helper Box -->
          <div class="demo-account-banner">
            <p>
              You can use the demo account (user <code>alex.smith&#64;example.com</code>, password <code>password123</code>), or register a new user.
            </p>
            <button type="button" class="demo-fill-btn" (click)="fillDemoCredentials()">
              ⚡ Fill Demo Credentials
            </button>
          </div>

          <!-- Form Fields -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <!-- Outlined Input Group: Username / Email -->
            <div class="ez-input-group" [class.focused]="activeField === 'email'" [class.invalid]="isControlInvalid('email')">
              <label for="email">Email Address</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="name@company.com"
                (focus)="activeField = 'email'"
                (blur)="activeField = ''"
              />
              <span class="field-error" *ngIf="isControlInvalid('email')">Please enter a valid email address.</span>
            </div>

            <!-- Outlined Input Group: Password -->
            <div class="ez-input-group" [class.focused]="activeField === 'password'" [class.invalid]="isControlInvalid('password')">
              <label for="password">Password</label>
              <div class="password-input-wrapper">
                <input
                  id="password"
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="••••••••"
                  (focus)="activeField = 'password'"
                  (blur)="activeField = ''"
                />
                <button type="button" class="toggle-pwd-btn" (click)="showPassword = !showPassword" aria-label="Toggle password visibility">
                  {{ showPassword ? '👁️' : '🙈' }}
                </button>
              </div>
              <span class="field-error" *ngIf="isControlInvalid('password')">Password is required.</span>
            </div>

            <!-- Sub Links Row -->
            <div class="ez-sub-row">
              <label class="remember-me">
                <input type="checkbox" formControlName="rememberMe" />
                <span>Remember me</span>
              </label>
              <a href="javascript:void(0)" (click)="onForgotPassword()" class="forgot-link">Forgot Password?</a>
            </div>

            <!-- Main Submit Button -->
            <button type="submit" class="ez-btn-primary" [disabled]="loginForm.invalid || isLoading">
              <span *ngIf="!isLoading">Log In</span>
              <span *ngIf="isLoading">Signing in...</span>
            </button>
          </form>

          <!-- Divider -->
          <div class="ez-divider">
            <span>or</span>
          </div>

          <!-- Quick Action Demo Sign-In -->
          <button type="button" class="ez-btn-secondary" (click)="loginAsDemo()" [disabled]="isLoading">
            🚀 Quick Demo Login
          </button>

          <!-- Register Link -->
          <div class="ez-register-prompt">
            <span>Don't have an account? </span>
            <a routerLink="/register" class="register-link">Create an account</a>
          </div>

          <!-- Footer Utilities & Copyright -->
          <div class="ez-footer">
            <div class="footer-utilities">
              <button type="button" class="theme-switch-btn" (click)="themeService.toggleTheme()">
                <span>Theme: {{ (themeService.theme$ | async) === 'dark' ? '🌙 Dark' : '☀️ Light' }}</span>
              </button>
            </div>
            <div class="footer-divider"></div>
            <div class="footer-copyright">
              Powered by <strong>Resume Analyzer</strong> v1.0.0
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ez-login-wrapper {
      width: 100vw;
      height: 100vh;
      display: flex;
      background: var(--bg-primary);
      overflow: hidden;
    }

    /* Left Panel Styling */
    .ez-left-panel {
      flex: 1.3;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 48px;
      background: linear-gradient(145deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.12) 100%);
      border-right: 1px solid var(--border-color);
      overflow: hidden;

      .ez-brand-header {
        display: flex;
        align-items: center;
        gap: 12px;

        .brand-logo-icon {
          font-size: 2.2rem;
          line-height: 1;
        }
        .brand-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--text-main);
          letter-spacing: -0.5px;
        }
      }

      .ez-hero-center {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        z-index: 2;
        max-width: 520px;
        margin: 0 auto;

        .hero-illustration-wrapper img {
          max-height: 320px;
          object-fit: contain;
          filter: drop-shadow(0 20px 30px rgba(99, 102, 241, 0.2));
        }

        .hero-caption {
          margin-top: 24px;
          h3 {
            font-size: 1.4rem;
            color: var(--text-main);
            margin-bottom: 8px;
          }
          p {
            font-size: 0.95rem;
            color: var(--text-secondary);
            line-height: 1.6;
          }
        }
      }

      .decorative-shapes {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 200px;
        pointer-events: none;
        z-index: 1;

        svg {
          width: 100%;
          height: 100%;
        }
      }
    }

    /* Right Panel Styling (EZBookkeeping UX Inspired) */
    .ez-right-panel {
      flex: 1;
      min-width: 420px;
      max-width: 520px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 48px 44px;
      border-radius: 0;
      border-top: none;
      border-bottom: none;
      border-right: none;
      background: var(--bg-secondary);
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.15);
      z-index: 5;
    }

    .ez-form-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: center;
    }

    .ez-header {
      margin-bottom: 20px;

      h2 {
        font-family: 'Outfit', sans-serif;
        font-size: 1.65rem;
        font-weight: 700;
        color: var(--text-main);
      }

      .sub-text {
        font-size: 0.875rem;
        color: var(--text-muted);
        margin-top: 6px;
      }
    }

    .demo-account-banner {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-left: 4px solid var(--primary-color);
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 22px;

      p {
        font-size: 0.825rem;
        color: var(--text-secondary);
        line-height: 1.5;

        code {
          background: rgba(99, 102, 241, 0.15);
          color: var(--primary-color);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
        }
      }

      .demo-fill-btn {
        margin-top: 8px;
        background: transparent;
        border: none;
        color: var(--primary-color);
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        gap: 4px;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    /* Floating / Fieldset Styled Input Groups */
    .ez-input-group {
      position: relative;
      display: flex;
      flex-direction: column;
      border: 1.5px solid var(--border-color);
      border-radius: 10px;
      padding: 8px 14px;
      margin-bottom: 18px;
      background: var(--bg-surface);
      transition: all 0.2s ease;

      label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }

      input {
        border: none;
        background: transparent;
        color: var(--text-main);
        font-size: 0.95rem;
        outline: none;
        padding: 2px 0;
        width: 100%;

        &::placeholder {
          color: var(--text-muted);
          opacity: 0.6;
        }
      }

      &.focused {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);

        label {
          color: var(--primary-color);
        }
      }

      &.invalid {
        border-color: var(--error-color);

        label {
          color: var(--error-color);
        }
      }

      .field-error {
        font-size: 0.75rem;
        color: var(--error-color);
        margin-top: 4px;
      }
    }

    .password-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      input {
        padding-right: 36px;
      }

      .toggle-pwd-btn {
        position: absolute;
        right: 0;
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        opacity: 0.8;

        &:hover {
          opacity: 1;
        }
      }
    }

    .ez-sub-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      font-size: 0.85rem;

      .remember-me {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-secondary);
        cursor: pointer;

        input[type="checkbox"] {
          accent-color: var(--primary-color);
          width: 16px;
          height: 16px;
        }
      }

      .forgot-link {
        color: var(--primary-color);
        text-decoration: none;
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .ez-btn-primary {
      width: 100%;
      padding: 12px;
      border-radius: 10px;
      border: none;
      background: var(--primary-gradient);
      color: #ffffff;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: var(--shadow-glow);
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .ez-divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 18px 0;
      color: var(--text-muted);
      font-size: 0.8rem;

      &::before, &::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid var(--border-color);
      }

      span {
        padding: 0 12px;
      }
    }

    .ez-btn-secondary {
      width: 100%;
      padding: 11px;
      border-radius: 10px;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-main);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        border-color: var(--primary-color);
        background: var(--bg-hover);
      }
    }

    .ez-register-prompt {
      text-align: center;
      margin-top: 22px;
      font-size: 0.875rem;
      color: var(--text-muted);

      .register-link {
        color: var(--primary-color);
        font-weight: 600;
        text-decoration: none;
        margin-left: 4px;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    /* Footer Utilities inspired by EZBookkeeping */
    .ez-footer {
      margin-top: auto;
      padding-top: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;

      .theme-switch-btn {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        font-size: 0.825rem;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;

        &:hover {
          color: var(--primary-color);
          background: var(--bg-surface);
        }
      }

      .footer-divider {
        width: 100%;
        height: 1px;
        background: var(--border-color);
      }

      .footer-copyright {
        font-size: 0.775rem;
        color: var(--text-muted);

        strong {
          color: var(--text-secondary);
        }
      }
    }

    /* Responsive adjustments */
    @media (max-width: 900px) {
      .ez-left-panel {
        display: none;
      }
      .ez-right-panel {
        flex: 1;
        max-width: 100%;
        box-shadow: none;
      }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  activeField = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    public themeService: ThemeService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['alex.smith@example.com', [Validators.required, Validators.email]],
      password: ['password123', [Validators.required]],
      rememberMe: [true]
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
    this.toastService.info('Demo credentials filled!');
  }

  onForgotPassword(): void {
    this.toastService.info('Please contact support or sign up for a new account.');
  }

  loginAsDemo(): void {
    this.fillDemoCredentials();
    this.onSubmit();
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
        this.toastService.success(`Welcome back, ${res.user.username}!`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || 'Invalid email or password. Please try again.';
        this.toastService.error(msg, 'Login Failed');
      }
    });
  }
}
