import { Brand } from "@/components/Brand";
import {
  SidebarMobileDrawer,
  SidebarMobileTrigger,
  SidebarProvider,
  SidebarRail,
} from "@/components/DashboardSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EASE } from "@/lib/motion";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router";

/**
 * Chrome for every signed-in screen: a hover-expanding navigation rail from `lg`
 * up, a left drawer below it, and a sticky top bar carrying the area name, the
 * theme switch and (on small screens) the drawer trigger.
 */
export function AppShell({
  children,
  area,
}: {
  children: ReactNode;
  /** Name of the current product area, shown in the desktop top bar. */
  area: string;
}) {
  const { pathname } = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex w-full max-w-[1440px]">
          <SidebarRail />
          <SidebarMobileDrawer />

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border/80 bg-background/90 px-4 backdrop-blur-sm lg:px-10">
              <div className="flex min-w-0 items-center gap-2">
                <SidebarMobileTrigger />
                <NavLink
                  to="/dashboard"
                  className="lg:hidden"
                  aria-label="CareerPilot dashboard"
                >
                  <Brand compact />
                </NavLink>
                <span className="hidden truncate text-[11px] uppercase tracking-[0.16em] text-muted-foreground lg:inline">
                  {area}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle />
              </div>
            </header>

            {/* Keyed on the route so each screen eases in instead of snapping.
                Deliberately short and transform-only so it never delays content
                or fights the per-section reveals inside a page. */}
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: EASE }}
              className="flex-1 px-4 py-8 lg:px-10 lg:py-12"
            >
              {children}
            </motion.main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

/** Consistent page header used by every authenticated screen. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p>
        )}
        <h1 className="mt-2 text-2xl font-medium tracking-[-0.02em] text-foreground">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
