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
      <div class="page-header">
        <h2>User Profile</h2>
        <p>Manage your account settings and personal details</p>
      </div>

      <div class="profile-grid">
        <!-- Overview Card -->
        <div class="glass-card profile-card">
          <div class="profile-avatar-large">
            {{ profile.username.substring(0, 2).toUpperCase() }}
          </div>
          <h3 class="profile-username">{{ profile.username }}</h3>
          <span class="profile-email">{{ profile.email }}</span>
          <span class="badge badge-success">Active Account</span>

          <div class="account-meta">
            <div class="meta-row">
              <span class="meta-label">User ID:</span>
              <span class="meta-val">#{{ profile.id }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Member Since:</span>
              <span class="meta-val">{{ profile.createdAt | date:'mediumDate' }}</span>
            </div>
          </div>
        </div>

        <!-- Edit Form Card -->
        <div class="glass-card edit-card">
          <h3>Edit Profile Information</h3>
          <p class="edit-sub">Update your account display name</p>

          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="username">Username / Full Name</label>
              <input
                id="username"
                type="text"
                formControlName="username"
                [class.invalid]="isInvalid('username')"
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
                class="disabled-input"
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
      gap: 24px;
    }
    .page-header {
      h2 { font-size: 1.6rem; color: var(--text-main); }
      p { font-size: 0.9rem; color: var(--text-muted); margin-top: 4px; }
    }
    .profile-grid {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 24px;
    }
    .profile-card {
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;

      .profile-avatar-large {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: var(--primary-gradient);
        color: #ffffff;
        font-family: 'Outfit', sans-serif;
        font-size: 2rem;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-glow);
        margin-bottom: 16px;
      }
      .profile-username { font-size: 1.3rem; color: var(--text-main); }
      .profile-email { font-size: 0.85rem; color: var(--text-muted); margin: 4px 0 14px 0; }
    }
    .account-meta {
      width: 100%;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      .meta-label { color: var(--text-muted); }
      .meta-val { color: var(--text-main); font-weight: 600; }
    }
    .edit-card {
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      h3 { font-size: 1.25rem; color: var(--text-main); }
      .edit-sub { font-size: 0.85rem; color: var(--text-muted); margin-top: -10px; }
    }
    .disabled-input {
      opacity: 0.6;
      cursor: not-allowed;
      background: var(--bg-primary) !important;
    }
    input.invalid { border-color: var(--error-color) !important; }

    @media (max-width: 800px) {
      .profile-grid { grid-template-columns: 1fr; }
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
