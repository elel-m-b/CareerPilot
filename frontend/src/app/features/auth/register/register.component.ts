import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-register',
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
          <h2>Create Your Candidate Profile</h2>
          <p>Join the resume evaluation system to gain detailed ATS scoring, section feedback, and tailored career recommendations.</p>

          <div class="feature-checklist">
            <div class="feature-item">
              <span class="feature-bullet">■</span>
              <span>Fast deterministic resume parsing algorithm</span>
            </div>
            <div class="feature-item">
              <span class="feature-bullet">■</span>
              <span>Comprehensive 7-dimension score breakdown</span>
            </div>
            <div class="feature-item">
              <span class="feature-bullet">■</span>
              <span>Secure JWT authenticated user session</span>
            </div>
          </div>
        </div>

        <div class="panel-footer">
          <span>Production-grade REST Architecture</span>
          <span class="version-tag">v1.0.0</span>
        </div>
      </div>

      <!-- Right Register Form Panel -->
      <div class="auth-form-panel">
        <div class="form-card">
          <div class="form-header">
            <h2>Create Account</h2>
            <p>Enter your information to register</p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="username">Full Name / Username</label>
              <input
                id="username"
                type="text"
                formControlName="username"
                placeholder="Jane Doe"
                [class.is-invalid]="isControlInvalid('username')"
              />
              <span class="form-error" *ngIf="isControlInvalid('username')">
                Username must be between 3 and 50 characters.
              </span>
            </div>

            <div class="form-group">
              <label for="email">Email Address</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="name@example.com"
                [class.is-invalid]="isControlInvalid('email')"
              />
              <span class="form-error" *ngIf="isControlInvalid('email')">
                Please enter a valid email address.
              </span>
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <div class="password-input-group">
                <input
                  id="password"
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="At least 6 characters"
                  [class.is-invalid]="isControlInvalid('password')"
                />
                <button type="button" class="pwd-toggle" (click)="showPassword = !showPassword">
                  {{ showPassword ? 'HIDE' : 'SHOW' }}
                </button>
              </div>
              <span class="form-error" *ngIf="isControlInvalid('password')">
                Password must be at least 6 characters long.
              </span>
            </div>

            <button type="submit" class="btn btn-primary btn-lg full-width" [disabled]="registerForm.invalid || isLoading">
              <span *ngIf="!isLoading">Create Account</span>
              <span *ngIf="isLoading">Creating Account...</span>
            </button>
          </form>

          <div class="auth-divider">
            <span>OR</span>
          </div>

          <div class="register-prompt">
            <span>Already have an account?</span>
            <a routerLink="/login" class="link-bold">Sign In</a>
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
export class RegisterComponent {
  registerForm: FormGroup;
  showPassword = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  isControlInvalid(controlName: string): boolean {
    const ctrl = this.registerForm.get(controlName);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { username, email, password } = this.registerForm.value;

    this.authService.register({ username, email, password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.toastService.success(`Account created! Welcome, ${res.user.username}`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || 'Registration failed. Email or username might already exist.';
        this.toastService.error(msg, 'Registration Error');
      }
    });
  }
}
