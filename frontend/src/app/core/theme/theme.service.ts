import { Injectable, computed, effect, signal } from "@angular/core";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function readStoredTheme(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    /* Private mode or blocked storage: follow the system preference. */
  }
  return "system";
}

/**
 * Single source of truth for the colour scheme.
 *
 * The theme is stored under the `theme` key in localStorage and applied as a
 * `dark` class on <html>, which is what the `@custom-variant dark` rule in
 * `styles.css` looks for. `index.html` reads the same key before the bundle
 * loads so a refresh never flashes the wrong theme.
 */
@Injectable({ providedIn: "root" })
export class ThemeService {
  readonly theme = signal<ThemeMode>(readStoredTheme());
  private readonly canMatchMedia =
    typeof window !== "undefined" && typeof window.matchMedia === "function";
  private readonly systemDark = signal(
    this.canMatchMedia ? window.matchMedia(DARK_QUERY).matches : false,
  );
  readonly resolvedTheme = computed<ResolvedTheme>(() => {
    const mode = this.theme();
    if (mode === "system") return this.systemDark() ? "dark" : "light";
    return mode;
  });

  constructor() {
    if (this.canMatchMedia) {
      const query = window.matchMedia(DARK_QUERY);
      const sync = () => this.systemDark.set(query.matches);
      query.addEventListener("change", sync);
    }

    // Keeps <html> and color-scheme in sync with the resolved theme.
    effect(() => this.apply(this.resolvedTheme()));
  }

  setTheme(mode: ThemeMode): void {
    this.theme.set(mode);
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* Private mode or blocked storage: the choice lives for this session only. */
    }
  }

  private apply(resolved: ResolvedTheme): void {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.style.colorScheme = resolved;
  }
}
