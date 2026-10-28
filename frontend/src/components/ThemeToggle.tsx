import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback } from "react";

/** Must stay in sync with the cross-fade duration declared in `index.css`. */
const THEME_TRANSITION_MS = 260;

/**
 * Sun / moon switch for the top-right corner of every header.
 *
 * The icons are driven by CSS (`.dark` on <html>), so the button shows the right
 * glyph from the first paint; only the click handler needs the resolved theme.
 * A short-lived `theme-transition` class on <html> lets every surface cross-fade
 * without leaving permanent transitions on interactive elements.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), THEME_TRANSITION_MS);
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const label =
    resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        "theme-switch relative size-9 shrink-0 rounded-md text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <Sun className="size-4 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
