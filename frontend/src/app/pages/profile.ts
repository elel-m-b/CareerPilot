import { Component, inject, signal } from "@angular/core";
import {
  LucideCircleAlert,
  LucideLoaderCircle,
  LucideMail,
  LucideUserRound,
} from "@lucide/angular";
import { ApiService } from "../core/api/api.service";
import { AuthService } from "../core/auth/auth.service";
import { ComingSoonService } from "../core/coming-soon/coming-soon.service";
import { ToastService } from "../core/toast/toast.service";
import { describeError } from "../lib/cv/report";
import { formatDate } from "../lib/format";
import {
  AlertComponent,
  AlertDescriptionComponent,
  AlertTitleComponent,
} from "../shared/alert";
import { AppShellComponent } from "../shared/app-shell";
import { buttonClass } from "../shared/button";
import { PageHeaderComponent } from "../shared/page-header";
import { PanelComponent } from "../shared/panel";

/**
 * Account profile.
 *
 * The backend stores a username, email and creation date for each user, so that
 * is exactly what this screen edits. The richer career profile from the
 * reference frontend is listed as planned rather than rendered as dead inputs.
 */
@Component({
  selector: "app-profile-page",
  imports: [
    AppShellComponent,
    PageHeaderComponent,
    PanelComponent,
    AlertComponent,
    AlertTitleComponent,
    AlertDescriptionComponent,
    LucideCircleAlert,
    LucideLoaderCircle,
    LucideMail,
    LucideUserRound,
  ],
  template: `
    <app-shell area="Profile">
      <app-page-header
        eyebrow="Account"
        title="Profile"
        description="How you appear in CareerPilot, and the account details your CVs and reports are scoped to."
      />

      <div class="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div class="flex flex-col gap-6">
          <app-panel title="Account details">
            <form class="flex flex-col gap-5" (submit)="handleSave($event)">
              <div class="flex flex-col gap-2">
                <label for="profile-username" class="text-sm leading-none font-medium">Name</label>
                <div class="relative">
                  <svg lucideUserRound class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"></svg>
                  <input
                    id="profile-username"
                    [value]="username()"
                    (input)="username.set(inputValue($event))"
                    [class]="inputClass('pl-9')"
                    minlength="3"
                    maxlength="50"
                    required
                    [disabled]="saving()"
                  />
                </div>
                <p class="text-xs text-muted-foreground">Between 3 and 50 characters.</p>
              </div>

              <div class="flex flex-col gap-2">
                <label for="profile-email" class="text-sm leading-none font-medium">Email</label>
                <div class="relative">
                  <svg lucideMail class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"></svg>
                  <input
                    id="profile-email"
                    [value]="auth.user()?.email ?? ''"
                    [class]="inputClass('pl-9')"
                    readonly
                    disabled
                  />
                </div>
                <p class="text-xs text-muted-foreground">
                  The email is your sign-in identity and cannot be changed here yet.
                </p>
              </div>

              @if (error()) {
                <app-alert variant="destructive" className="rounded-md">
                  <svg lucideCircleAlert class="size-4"></svg>
                  <app-alert-title className="text-sm">Update failed</app-alert-title>
                  <app-alert-description className="text-sm">{{ error() }}</app-alert-description>
                </app-alert>
              }

              <div class="flex items-center gap-2">
                <button
                  type="submit"
                  [class]="buttonClass()"
                  [disabled]="saving() || username().trim() === (auth.user()?.name ?? '')"
                >
                  @if (saving()) {
                    <svg lucideLoaderCircle class="size-4 animate-spin"></svg>
                    Saving…
                  } @else {
                    Save changes
                  }
                </button>
                <button
                  type="button"
                  [class]="buttonClass('ghost')"
                  [disabled]="saving()"
                  (click)="username.set(auth.user()?.name ?? '')"
                >
                  Reset
                </button>
              </div>
            </form>
          </app-panel>

          <app-panel title="Career profile">
            <p class="text-sm leading-relaxed text-muted-foreground">
              The career profile that feeds job matching — target role, skills, work mode,
              locations and links — belongs to a feature the backend does not implement yet.
            </p>
            <ul class="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              @for (field of plannedFields; track field) {
                <li class="flex items-start gap-2">
                  <span class="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground"></span>
                  {{ field }}
                </li>
              }
            </ul>
            <button
              type="button"
              [class]="buttonClass('outline', 'sm', 'mt-5')"
              (click)="showComingSoon('The career profile')"
            >
              Career profile — coming soon
            </button>
          </app-panel>
        </div>

        <div class="flex h-fit flex-col gap-6 lg:sticky lg:top-24">
          <app-panel title="Membership">
            <dl class="flex flex-col gap-4">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-xs text-muted-foreground">Member since</dt>
                <dd class="text-sm text-foreground">
                  {{ auth.user()?.createdAt ? formatDate(createdAt()) : "—" }}
                </dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-xs text-muted-foreground">Account ID</dt>
                <dd class="text-sm tabular-nums text-foreground">{{ auth.user()?.id ?? "—" }}</dd>
              </div>
            </dl>
          </app-panel>

          <app-panel title="Security">
            <ul class="flex flex-col gap-3 text-xs leading-relaxed text-muted-foreground">
              <li>· Sign-in uses your email and a BCrypt-hashed password.</li>
              <li>· Every request carries a signed JWT; the session is stateless.</li>
              <li>· Your CVs, analyses and recommendations are scoped to your user id.</li>
            </ul>
            <button
              type="button"
              [class]="buttonClass('ghost', 'sm', 'mt-4 text-muted-foreground')"
              (click)="showComingSoon('Password change')"
            >
              Change password — coming soon
            </button>
          </app-panel>
        </div>
      </div>
    </app-shell>
  `,
})
export class ProfilePage {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);
  private readonly comingSoon = inject(ComingSoonService);
  protected readonly auth = inject(AuthService);

  protected readonly username = signal(this.auth.user()?.name ?? "");
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly buttonClass = buttonClass;
  protected readonly formatDate = formatDate;
  protected readonly plannedFields = [
    "Headline and target role",
    "Skills and languages",
    "Preferred locations and work mode",
    "Portfolio, GitHub and LinkedIn links",
    "Years of experience and job types",
    "Profile completeness score",
  ];

  protected inputClass(extra = ""): string {
    return (
      "border-input placeholder:text-muted-foreground dark:bg-input/30 h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm " +
      extra
    );
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected createdAt(): number {
    const value = this.auth.user()?.createdAt;
    return value ? Date.parse(value) : 0;
  }

  protected showComingSoon(label: string): void {
    this.comingSoon.show(label);
  }

  protected async handleSave(event: Event): Promise<void> {
    event.preventDefault();
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.api.users.update(this.username().trim());
      await this.auth.refreshUser();
      this.toastService.success("Profile updated.");
    } catch (cause) {
      this.error.set(describeError(cause, "We could not update your profile."));
    } finally {
      this.saving.set(false);
    }
  }
}
