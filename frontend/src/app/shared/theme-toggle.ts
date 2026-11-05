import { Component, computed, inject, input } from "@angular/core";
import { LucideMoon, LucideSun } from "@lucide/angular";
import { ThemeService } from "../core/theme/theme.service";
import { cn } from "../lib/utils";
import { buttonClass } from "./button";

/** Must stay in sync with the cross-fade duration declared in `styles.css`. */
const THEME_TRANSITION_MS = 260;

/**
 * Sun / moon switch for the top-right corner of every header.
 *
 * The icons are driven by CSS (`.dark` on <html>), so the button shows the right
 * glyph from the first paint; only the click handler needs the resolved theme.
 */
@Component({
  selector: "app-theme-toggle",
  imports: [LucideSun, LucideMoon],
  template: `
    <button
      type="button"
      [class]="classes()"
      [attr.aria-label]="label()"
      [attr.title]="label()"
      (click)="toggleTheme()"
    >
      <svg lucideSun class="size-4 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0"></svg>
      <svg lucideMoon class="absolute size-4 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100"></svg>
    </button>
  `,
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);

  readonly className = input("");

  protected readonly label = computed(() =>
    this.themeService.resolvedTheme() === "dark" ? "Switch to light mode" : "Switch to dark mode",
  );

  protected readonly classes = computed(() =>
    cn(
      buttonClass("ghost", "icon"),
      "theme-switch relative size-9 shrink-0 rounded-md text-muted-foreground hover:text-foreground",
      this.className(),
    ),
  );

  protected toggleTheme(): void {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), THEME_TRANSITION_MS);
    this.themeService.setTheme(
      this.themeService.resolvedTheme() === "dark" ? "light" : "dark",
    );
  }
}
