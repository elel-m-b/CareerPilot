import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideArrowLeft, LucideCheck, LucideClock } from "@lucide/angular";
import { COMING_SOON_MESSAGE, type PlannedFeature } from "../lib/features";
import {
  AlertComponent,
  AlertDescriptionComponent,
  AlertTitleComponent,
} from "../shared/alert";
import { AppShellComponent } from "../shared/app-shell";
import { buttonClass } from "../shared/button";
import { PageHeaderComponent } from "../shared/page-header";
import { PanelComponent } from "../shared/panel";
import { RevealDirective } from "../shared/reveal.directive";

/**
 * Full-screen placeholder for a planned feature. The route and navigation entry
 * remain in place so the roadmap is visible, but nothing pretends to work.
 */
@Component({
  selector: "app-coming-soon-page",
  imports: [
    RouterLink,
    AppShellComponent,
    PageHeaderComponent,
    PanelComponent,
    AlertComponent,
    AlertTitleComponent,
    AlertDescriptionComponent,
    RevealDirective,
    LucideArrowLeft,
    LucideCheck,
    LucideClock,
  ],
  template: `
    <app-shell [area]="feature().title">
      <app-page-header
        eyebrow="Planned feature"
        [title]="feature().title"
        [description]="feature().description"
      >
        <a routerLink="/dashboard" [class]="buttonClass('outline', 'default', 'gap-2')">
          <svg lucideArrowLeft class="size-4"></svg>
          Back to dashboard
        </a>
      </app-page-header>

      <div class="mt-10 flex flex-col gap-6">
        <app-alert className="rounded-md border-warning/40 bg-warning/5">
          <svg lucideClock class="size-4 text-warning"></svg>
          <app-alert-title className="text-sm">{{ message }}</app-alert-title>
          <app-alert-description className="text-sm leading-relaxed">
            The CareerPilot backend does not expose this feature yet, so there is nothing to
            connect it to. The screen is intentionally read-only rather than showing placeholder
            data.
          </app-alert-description>
        </app-alert>

        <div appReveal>
          <app-panel title="What this screen will do">
            <ul class="flex flex-col gap-3">
              @for (capability of feature().capabilities; track capability) {
                <li class="flex items-start gap-3">
                  <svg lucideCheck class="mt-0.5 size-4 shrink-0 text-muted-foreground"></svg>
                  <span class="text-sm leading-relaxed text-muted-foreground">{{ capability }}</span>
                </li>
              }
            </ul>
          </app-panel>
        </div>

        <div appReveal [delay]="80">
          <app-panel title="Available today">
            <p class="text-sm leading-relaxed text-muted-foreground">
              The working parts of CareerPilot are the CV scan, the seven-dimension ATS report, the
              dashboard and your account settings.
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <a routerLink="/cv" [class]="buttonClass('outline', 'sm')">My CV</a>
              <a routerLink="/dashboard" [class]="buttonClass('outline', 'sm')">Dashboard</a>
              <a routerLink="/profile" [class]="buttonClass('ghost', 'sm')">Profile</a>
            </div>
          </app-panel>
        </div>
      </div>
    </app-shell>
  `,
})
export class ComingSoonPage {
  /** Supplied by the route's `data.feature` through `withComponentInputBinding`. */
  readonly feature = input.required<PlannedFeature>();

  protected readonly message = COMING_SOON_MESSAGE;
  protected readonly buttonClass = buttonClass;
}
