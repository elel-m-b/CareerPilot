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
    <div class="auth-page-container">
      <app-toast></app-toast>
      <div class="auth-split-box glass-card">
        <!-- Left Side: Brand & Illustration -->
        <div class="auth-illustration-side">
          <div class="brand-header">
            <div class="logo">🎯</div>
            <h1>Resume Analyzer</h1>
          </div>
          <p class="tagline">
            Join thousands of professionals optimizing their CVs with AI intelligence and land top job offers.
          </p>
          <div class="illustration-wrapper">
            <img src="/assets/illustrations/illustration-robot.png" alt="Resume Analyzer AI Robot" />
          </div>
        </div>

        <!-- Right Side: Register Form -->
        <div class="auth-form-side">
          <div class="form-header">
            <h2>Create an Account</h2>
            <p>Get started with free resume analysis</p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="username">Full Name / Username</label>
              <input
                id="username"
                type="text"
                formControlName="username"
                placeholder="John Doe"
                [class.invalid]="isControlInvalid('username')"
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
                placeholder="name@company.com"
                [class.invalid]="isControlInvalid('email')"
              />
              <span class="form-error" *ngIf="isControlInvalid('email')">
                Please enter a valid email address.
              </span>
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                placeholder="At least 6 characters"
                [class.invalid]="isControlInvalid('password')"
              />
              <span class="form-error" *ngIf="isControlInvalid('password')">
                Password must be at least 6 characters long.
              </span>
            </div>

            <button type="submit" class="btn btn-primary btn-full" [disabled]="registerForm.invalid || isLoading">
              <span *ngIf="!isLoading">Create Account</span>
              <span *ngIf="isLoading">Creating account...</span>
            </button>
          </form>

          <div class="form-footer">
            <span>Already have an account?</span>
            <a routerLink="/login" class="login-link">Sign In</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-primary);
      padding: 20px;
    }
    .auth-split-box {
      display: flex;
      width: 100%;
      max-width: 960px;
      min-height: 560px;
      overflow: hidden;
      border-radius: 20px;
    }
    .auth-illustration-side {
      flex: 1.1;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%);
      padding: 40px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-right: 1px solid var(--border-color);

      .brand-header {
        display: flex;
        align-items: center;
        gap: 12px;
        .logo { font-size: 2rem; }
        h1 { font-size: 1.5rem; color: var(--text-main); }
      }
      .tagline {
        font-size: 1rem;
        color: var(--text-secondary);
        line-height: 1.6;
        margin-top: 16px;
      }
      .illustration-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 20px;
        img {
          max-width: 100%;
          max-height: 280px;
          object-fit: contain;
        }
      }
    }
    .auth-form-side {
      flex: 1;
      padding: 48px 40px;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .form-header {
        margin-bottom: 24px;
        h2 { font-size: 1.6rem; color: var(--text-main); }
        p { font-size: 0.9rem; color: var(--text-muted); margin-top: 4px; }
      }
    }
    .btn-full {
      width: 100%;
      padding: 12px;
      font-size: 1rem;
      margin-top: 8px;
    }
    .form-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-muted);
      .login-link {
        color: var(--primary-color);
        font-weight: 600;
        text-decoration: none;
        margin-left: 6px;
        &:hover { text-decoration: underline; }
      }
    }
    input.invalid {
      border-color: var(--error-color) !important;
    }

    @media (max-width: 840px) {
      .auth-split-box { flex-direction: column; }
      .auth-illustration-side { display: none; }
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
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

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { username, email, password } = this.registerForm.value;

    this.authService.register({ username, email, password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.toastService.success(`Account created successfully! Welcome, ${res.user.username}`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || 'Registration failed. Email or username might already be in use.';
        this.toastService.error(msg, 'Registration Error');
      }
    });
  }
}
