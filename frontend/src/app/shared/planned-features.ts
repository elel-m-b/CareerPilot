import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  LucideBot,
  LucideBriefcase,
  LucideDynamicIcon,
  LucideRoute,
  LucideTarget,
  type LucideIcon,
} from "@lucide/angular";

const TILES: { to: string; label: string; description: string; icon: LucideIcon }[] = [
  {
    to: "/jobs",
    label: "Job matching",
    description: "Score every posting against your CV and profile.",
    icon: LucideBriefcase,
  },
  {
    to: "/applications",
    label: "Application tracking",
    description: "Move each application from saved to offer.",
    icon: LucideTarget,
  },
  {
    to: "/prep",
    label: "Interview preparation",
    description: "Turn a target job into a daily preparation plan.",
    icon: LucideRoute,
  },
  {
    to: "/copilot",
    label: "AI Career Copilot",
    description: "Ask questions grounded in your own documents.",
    icon: LucideBot,
  },
];

/** Visible roadmap entries for features the backend does not expose yet. */
@Component({
  selector: "app-planned-features",
  imports: [RouterLink, LucideDynamicIcon],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex items-end justify-between gap-4">
        <div>
          <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Roadmap</p>
          <h2 class="mt-2 text-lg font-medium tracking-tight text-foreground">Planned features</h2>
        </div>
        <p class="max-w-sm text-xs leading-relaxed text-muted-foreground">
          Visible now, marked clearly until their backend APIs ship.
        </p>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @for (tile of tiles; track tile.to) {
          <a
            [routerLink]="tile.to"
            class="group flex flex-col gap-3 rounded-md border border-dashed border-border bg-card px-6 py-5 transition-colors hover:border-foreground/30"
          >
            <span class="grid size-8 place-items-center rounded-md border border-border">
              <svg [lucideIcon]="tile.icon" class="size-4 text-muted-foreground"></svg>
            </span>
            <div>
              <p class="text-sm font-medium text-foreground">{{ tile.label }}</p>
              <p class="mt-1 text-xs leading-relaxed text-muted-foreground">{{ tile.description }}</p>
            </div>
            <span class="mt-auto text-[10px] uppercase tracking-[0.14em] text-warning">
              Coming soon
            </span>
          </a>
        }
      </div>
    </div>
  `,
})
export class PlannedFeaturesComponent {
  protected readonly tiles = TILES;
}
