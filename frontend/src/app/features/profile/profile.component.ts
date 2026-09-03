import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UserProfile } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-page animate-fade-in" *ngIf="profile">
      <div class="page-header flex-between">
        <div>
          <h2>User Profile</h2>
          <p class="text-secondary">Manage candidate credentials and account information</p>
        </div>
      </div>

      <div class="profile-grid">
        <!-- Overview Card -->
        <div class="card profile-card">
          <div class="profile-avatar text-mono">
            {{ profile.username.substring(0, 2).toUpperCase() }}
          </div>
          <h3 class="profile-username text-mono">{{ profile.username }}</h3>
          <span class="profile-email text-mono text-muted">{{ profile.email }}</span>
          <span class="badge badge-neutral text-mono">ACTIVE ACCOUNT</span>

          <div class="account-meta text-mono">
            <div class="meta-row flex-between">
              <span class="meta-label text-muted">USER ID:</span>
              <span class="meta-val">#{{ profile.id }}</span>
            </div>
            <div class="meta-row flex-between">
              <span class="meta-label text-muted">REGISTERED:</span>
              <span class="meta-val">{{ profile.createdAt | date:'yyyy-MM-dd' }}</span>
            </div>
          </div>
        </div>

        <!-- Edit Form Card -->
        <div class="card edit-card">
          <h3>Account Information</h3>
          <p class="edit-sub text-secondary">Update account display name</p>

          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="username">Username / Display Name</label>
              <input
                id="username"
                type="text"
                formControlName="username"
                [class.is-invalid]="isInvalid('username')"
              />
              <span class="form-error" *ngIf="isInvalid('username')">
                Username must be between 3 and 50 characters.
              </span>
            </div>

            <div class="form-group">
              <label for="email">Email Address (Read-only)</label>
              <input
                id="email"
                type="email"
                [value]="profile.email"
                disabled
                class="disabled-input text-mono"
              />
            </div>

            <button type="submit" class="btn btn-primary" [disabled]="profileForm.invalid || isSaving">
              <span *ngIf="!isSaving">Save Profile Changes</span>
              <span *ngIf="isSaving">Saving...</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
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

    .profile-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 20px;
    }

    .profile-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;

      .profile-avatar {
        width: 64px;
        height: 64px;
        border-radius: var(--radius-sm);
        background: var(--text-main);
        color: var(--text-inverse);
        font-size: 1.5rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 14px;
      }

      .profile-username {
        font-size: 1.15rem;
        font-weight: 700;
      }

      .profile-email {
        font-size: 0.775rem;
        margin: 2px 0 12px 0;
      }
    }

    .account-meta {
      width: 100%;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .meta-row {
      font-size: 0.75rem;
    }

    .edit-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;

      h3 {
        font-size: 1.1rem;
        font-weight: 600;
      }

      .edit-sub {
        font-size: 0.85rem;
        margin-top: -8px;
      }
    }

    .disabled-input {
      opacity: 0.6;
      cursor: not-allowed;
      background-color: var(--bg-surface) !important;
    }

    @media (max-width: 800px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  profile: UserProfile | null = null;
  profileForm: FormGroup;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.userService.getCurrentUser().subscribe({
      next: (data) => {
        this.profile = data;
        this.profileForm.patchValue({ username: data.username });
      },
      error: () => this.toastService.error('Failed to load profile data.')
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.profileForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;

    this.isSaving = true;
    const { username } = this.profileForm.value;

    this.userService.updateProfile({ username }).subscribe({
      next: (updated) => {
        this.isSaving = false;
        this.profile = updated;
        if (this.authService.currentUser) {
          this.authService.updateCurrentUser({
            ...this.authService.currentUser,
            username: updated.username
          });
        }
        this.toastService.success('Profile updated successfully!');
      },
      error: (err) => {
        this.isSaving = false;
        this.toastService.error(err.error?.message || 'Failed to update profile.');
      }
    });
  }
}
