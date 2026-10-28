import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps, ReactNode } from "react";

/**
 * Single source of truth for the colour scheme.
 *
 * The theme is stored under the `theme` key in localStorage (next-themes
 * default) and applied as a `dark` class on <html>, which is what the
 * `@custom-variant dark` rule in `index.css` looks for. `index.html` reads the
 * same key before the bundle loads so a refresh never flashes the wrong theme.
 */
export function ThemeProvider({
  children,
  ...props
}: { children: ReactNode } & ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
