import { Component, computed, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import {
  LucideCircleAlert,
  LucideDynamicIcon,
  LucideLogOut,
  LucideMoon,
  LucideShieldCheck,
  LucideSun,
  LucideTrash2,
  type LucideIcon,
} from "@lucide/angular";
import { ApiService } from "../core/api/api.service";
import type { DashboardStats, Resume } from "../core/api/api.types";
import { AuthService } from "../core/auth/auth.service";
import { ComingSoonService } from "../core/coming-soon/coming-soon.service";
import { ThemeService, type ThemeMode } from "../core/theme/theme.service";
import { cn } from "../lib/utils";
import {
  AlertComponent,
  AlertDescriptionComponent,
  AlertTitleComponent,
} from "../shared/alert";
import { AppShellComponent } from "../shared/app-shell";
import { buttonClass } from "../shared/button";
import { PageHeaderComponent } from "../shared/page-header";
import { PanelComponent, StatTileComponent } from "../shared/panel";
import { SkeletonComponent } from "../shared/skeleton";

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: LucideSun },
  { value: "dark", label: "Dark", icon: LucideMoon },
  { value: "system", label: "System", icon: LucideShieldCheck },
];

@Component({
  selector: "app-settings-page",
  imports: [
    RouterLink,
    AppShellComponent,
    PageHeaderComponent,
    PanelComponent,
    StatTileComponent,
    SkeletonComponent,
    AlertComponent,
    AlertTitleComponent,
    AlertDescriptionComponent,
    LucideCircleAlert,
    LucideDynamicIcon,
    LucideLogOut,
    LucideTrash2,
  ],
  template: `
    <app-shell area="Settings">
      <app-page-header
        eyebrow="Account"
        title="Settings"
        description="Your account, how CareerPilot looks, and the data the platform stores on your behalf."
      />

      <div class="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div class="flex flex-col gap-6">
          <app-panel title="Account">
            <dl class="flex flex-col gap-4">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-xs text-muted-foreground">Email</dt>
                <dd class="truncate text-sm text-foreground">{{ auth.user()?.email ?? "—" }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-xs text-muted-foreground">Name</dt>
                <dd class="truncate text-sm text-foreground">{{ auth.user()?.name ?? "Not set" }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-xs text-muted-foreground">Sign-in method</dt>
                <dd class="text-sm text-foreground">Email and password</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-xs text-muted-foreground">Session</dt>
                <dd class="text-sm text-foreground">Stateless JWT</dd>
              </div>
            </dl>

            <p class="mt-5 text-xs leading-relaxed text-muted-foreground">
              CareerPilot authenticates against its own Spring Boot API. The token is stored in this
              browser and every request is scoped to your user id.
            </p>

            <div class="mt-5 flex flex-wrap gap-2">
              <a routerLink="/profile" [class]="buttonClass('outline')">Edit my profile</a>
              <button
                type="button"
                [class]="buttonClass('ghost', 'default', 'gap-2 text-muted-foreground')"
                (click)="handleSignOut()"
              >
                <svg lucideLogOut class="size-4"></svg>
                Sign out
              </button>
            </div>
          </app-panel>

          <app-panel title="Appearance">
            <p class="text-sm leading-relaxed text-muted-foreground">
              The theme is saved in this browser and applied before the first paint, so there is no
              flash of the wrong colours when you reload.
            </p>
            <div class="mt-5 grid gap-3 sm:grid-cols-3">
              @for (option of themeOptions; track option.value) {
                <button
                  type="button"
                  (click)="themeService.setTheme(option.value)"
                  [class]="cn(
                    'flex items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors',
                    themeService.theme() === option.value
                      ? 'border-foreground bg-secondary text-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )"
                >
                  <svg [lucideIcon]="option.icon" class="size-4"></svg>
                  {{ option.label }}
                </button>
              }
            </div>
          </app-panel>

          <app-panel title="Your data">
            @if (loading()) {
              <app-skeleton className="h-32 w-full" />
            } @else if (error()) {
              <app-alert variant="destructive" className="rounded-md">
                <svg lucideCircleAlert class="size-4"></svg>
                <app-alert-title className="text-sm">We could not load your data summary</app-alert-title>
                <app-alert-description className="text-sm leading-relaxed">
                  {{ error()?.message }}
                </app-alert-description>
              </app-alert>
            } @else {
              <div class="grid gap-4 sm:grid-cols-3">
                <app-stat-tile
                  label="CVs stored"
                  [value]="stats()?.totalResumes ?? 0"
                  [hint]="cvCountLabel()"
                />
                <app-stat-tile
                  label="Scans recorded"
                  [value]="stats()?.totalAnalyses ?? 0"
                  [hint]="scanHint()"
                />
                <app-stat-tile
                  label="Best score"
                  [value]="(stats()?.totalAnalyses ?? 0) > 0 ? stats()!.bestScore : '—'"
                  [unit]="(stats()?.totalAnalyses ?? 0) > 0 ? '%' : undefined"
                  [hint]="(stats()?.totalAnalyses ?? 0) > 0 ? 'Across every scan' : 'No scans recorded yet'"
                />
              </div>

              <p class="mt-6 border-t border-border/80 pt-5 text-xs leading-relaxed text-muted-foreground">
                Each CV can be deleted individually from
                <a routerLink="/cv" class="text-foreground underline underline-offset-4">My CV</a>,
                which also removes its full analysis history.
              </p>
            }
          </app-panel>

          <app-panel title="Danger zone">
            <app-alert variant="destructive" className="rounded-md">
              <svg lucideCircleAlert class="size-4"></svg>
              <app-alert-title className="text-sm">Delete everything, keep the account</app-alert-title>
              <app-alert-description className="text-sm leading-relaxed">
                A single action that wipes every CV and analysis is not implemented yet. Delete
                individual CVs from the CV library in the meantime.
              </app-alert-description>
            </app-alert>
            <button
              type="button"
              [class]="buttonClass('outline', 'default', 'mt-5 gap-2 border-critical/40 text-critical hover:text-critical')"
              (click)="showComingSoon('Deleting all account data')"
            >
              <svg lucideTrash2 class="size-4"></svg>
              Delete my CareerPilot data
            </button>
          </app-panel>
        </div>

        <div class="flex h-fit flex-col gap-6 lg:sticky lg:top-24">
          <app-panel title="Session">
            <p class="text-sm leading-relaxed text-muted-foreground">
              {{
                auth.user()
                  ? "You are signed in with a live JWT session. Private routes are scoped to your account only."
                  : "Your session has ended. Sign in again to reach your data."
              }}
            </p>
            @if (!auth.user()) {
              <a
                routerLink="/auth"
                [queryParams]="{ returnTo: '/dashboard' }"
                [class]="buttonClass('default', 'default', 'mt-4 w-full')"
              >
                Sign in again
              </a>
            }
          </app-panel>

          <app-panel title="How your data is used">
            <ul class="flex flex-col gap-3 text-xs leading-relaxed text-muted-foreground">
              <li>· CV files are stored against your account and only readable by you.</li>
              <li>· Analysis runs entirely from your document; nothing is sent to a third party.</li>
              <li>· Deleting a CV removes its stored document and its full analysis history.</li>
              <li>· The deterministic engine never generates content on your behalf.</li>
            </ul>
          </app-panel>
        </div>
      </div>
    </app-shell>
  `,
})
export class SettingsPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly comingSoon = inject(ComingSoonService);
  protected readonly auth = inject(AuthService);
  protected readonly themeService = inject(ThemeService);

  protected readonly stats = signal<DashboardStats | undefined>(undefined);
  protected readonly resumes = signal<Resume[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<Error | null>(null);

  protected readonly themeOptions = THEME_OPTIONS;
  protected readonly buttonClass = buttonClass;
  protected readonly cn = cn;

  protected readonly cvCountLabel = computed(() => {
    const count = this.resumes().length;
    return `${count} document${count === 1 ? "" : "s"} on file`;
  });

  protected readonly scanHint = computed(() => {
    const total = this.stats()?.totalAnalyses ?? 0;
    return total > 0 ? `Average ${Math.round(this.stats()?.averageScore ?? 0)}%` : "Run a scan from My CV";
  });

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [stats, resumes] = await Promise.all([
        this.api.dashboard.stats(),
        this.api.resumes.list(),
      ]);
      this.stats.set(stats);
      this.resumes.set(resumes);
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause : new Error(String(cause)));
    } finally {
      this.loading.set(false);
    }
  }

  protected handleSignOut(): void {
    // Clearing the session makes the guard redirect this protected screen, so
    // go to /auth explicitly rather than racing that redirect.
    this.auth.signOut();
    void this.router.navigateByUrl("/auth", { replaceUrl: true });
  }

  protected showComingSoon(label: string): void {
    this.comingSoon.show(label);
  }
}
