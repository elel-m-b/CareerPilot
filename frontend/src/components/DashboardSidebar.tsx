import { Brand } from "@/components/Brand";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Bot,
  Briefcase,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Route,
  Send,
  Settings,
  Target,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { NavLink, useLocation, useNavigate } from "react-router";

/** The rail's two resting widths, in px. */
const COLLAPSED_WIDTH = 64;
const EXPANDED_WIDTH = 264;
/** Fast enough to feel like a hover, damped enough not to wobble. */
const RAIL_SPRING = { type: "spring" as const, stiffness: 300, damping: 32 };

type NavItem = { to: string; label: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cv", label: "My CV", icon: FileText },
  { to: "/copilot", label: "AI Copilot", icon: Bot },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/job-description", label: "JD generator", icon: ClipboardList },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/applications", label: "Applications", icon: Send },
  { to: "/prep", label: "Interview prep", icon: Target },
  { to: "/roadmap", label: "Learning roadmap", icon: Route },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/settings", label: "Settings", icon: Settings },
];

type SidebarContextValue = {
  /** Desktop rail: expanded while the pointer or focus is inside it. */
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  /** Mobile drawer. Kept separate — on a desktop the rail's hover state must
   *  never pop the drawer open. */
  drawerOpen: boolean;
  setDrawerOpen: Dispatch<SetStateAction<boolean>>;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ open, setOpen, drawerOpen, setDrawerOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * One navigation link.
 *
 * The label stays in the DOM and fades out rather than being switched to
 * `display: none`, so the rail keeps a stable layout while it opens and closes.
 * The accessible name always comes from `aria-label`, which means a collapsed
 * rail is still perfectly usable with a screen reader or keyboard.
 */
function SidebarLink({
  item,
  pillId,
  showLabel,
  onNavigate,
}: {
  item: NavItem;
  pillId: string;
  showLabel: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      aria-label={item.label}
      title={item.label}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60",
          isActive
            ? "font-medium text-foreground"
            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId={pillId}
              className="absolute inset-0 rounded-md bg-secondary"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2.5">
            <Icon className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-105" />
            <motion.span
              animate={{ opacity: showLabel ? 1 : 0, x: showLabel ? 0 : -8 }}
              transition={{ duration: 0.18, ease: EASE }}
              className="whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          </span>
        </>
      )}
    </NavLink>
  );
}

/** Signed-in identity plus the account actions, pinned to the bottom. */
function SidebarAccount({ showLabel }: { showLabel: boolean }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const email = user?.email ?? "Guest session";
  const initials = (user?.name ?? user?.email ?? "G").slice(0, 2).toUpperCase();

  const handleSignOut = () => {
    // RequireAuth already redirects protected screens once the session clears;
    // navigate explicitly so the destination is deterministic.
    signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={email}
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left outline-none transition-colors hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <Avatar className="size-7 shrink-0 rounded-[3px]">
            <AvatarFallback className="rounded-[3px] bg-secondary text-[10px] font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <motion.span
            animate={{ opacity: showLabel ? 1 : 0, x: showLabel ? 0 : -8 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
          >
            {email}
          </motion.span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" className="w-56">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Signed in as
          <div className="mt-0.5 truncate text-foreground">{email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-critical focus:text-critical"
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Desktop rail: a 64px icon strip that expands to 264px while the pointer or
 * keyboard focus is inside it.
 *
 * The expanded panel is *positioned* rather than laid out, so the page never
 * reflows: a hover that widened the flex column would shove every dashboard
 * 200px sideways each time the cursor crossed the sidebar. The rail keeps a
 * constant 64px footprint and the panel floats above the content instead. The
 * brand mark and every icon share one x, so only the labels move.
 */
export function SidebarRail() {
  const { open, setOpen } = useSidebar();
  const ref = useRef<HTMLElement>(null);

  // Never collapse out from under a focused link — a keyboard user would be
  // left tabbing through labels they cannot see.
  const collapse = () => {
    if (ref.current?.contains(document.activeElement)) return;
    setOpen(false);
  };

  return (
    <aside
      ref={ref}
      aria-label="Main"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={collapse}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={collapse}
      className="sticky top-0 z-30 hidden h-screen w-16 shrink-0 lg:block"
    >
      <motion.div
        animate={{ width: open ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
        transition={RAIL_SPRING}
        className={cn(
          "absolute inset-y-0 left-0 flex flex-col overflow-hidden border-r border-border/80 bg-sidebar transition-shadow duration-300",
          open &&
            "shadow-[10px_0_30px_-18px_rgb(0_0_0/0.35)] dark:shadow-[10px_0_30px_-14px_rgb(0_0_0/0.8)]",
        )}
      >
        <div className="flex h-16 shrink-0 items-center px-5">
          <NavLink to="/dashboard" aria-label="CareerPilot dashboard">
            {open ? <Brand /> : <Brand compact />}
          </NavLink>
        </div>

        <nav
          aria-label="Sections"
          className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-x-hidden overflow-y-auto px-3 py-2"
        >
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} item={item} pillId="nav-pill-rail" showLabel={open} />
          ))}
        </nav>

        <div className="shrink-0 border-t border-border/80 p-3">
          <SidebarAccount showLabel={open} />
        </div>
      </motion.div>
    </aside>
  );
}

/** Header button that opens the drawer. Hidden from `lg` up, where the rail takes over. */
export function SidebarMobileTrigger({ className }: { className?: string }) {
  const { setDrawerOpen } = useSidebar();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Open navigation"
      onClick={() => setDrawerOpen(true)}
      className={cn("lg:hidden", className)}
    >
      <Menu className="size-5" />
    </Button>
  );
}

/**
 * Mobile navigation, as a left drawer.
 *
 * Built on the Radix `Sheet` rather than a hand-rolled animated panel so it
 * inherits a real focus trap, Escape-to-close, an overlay and the correct
 * `aria-modal` semantics instead of re-implementing them.
 */
export function SidebarMobileDrawer() {
  const { drawerOpen, setDrawerOpen } = useSidebar();
  const { pathname } = useLocation();

  // Close on navigation, including a tap on the route that is already active.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname, setDrawerOpen]);

  // And close if the viewport grows into the desktop layout while it is open.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const close = () => {
      if (query.matches) setDrawerOpen(false);
    };
    query.addEventListener("change", close);
    return () => query.removeEventListener("change", close);
  }, [setDrawerOpen]);

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent
        side="left"
        aria-describedby={undefined}
        className="w-[280px] max-w-[85vw] gap-0 bg-sidebar p-0 sm:max-w-[280px]"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-16 shrink-0 items-center px-6">
          <NavLink to="/dashboard" aria-label="CareerPilot dashboard">
            <Brand />
          </NavLink>
        </div>
        <nav
          aria-label="Sections"
          className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2"
        >
          {NAV_ITEMS.map((item) => (
            <SidebarLink
              key={item.to}
              item={item}
              pillId="nav-pill-drawer"
              showLabel
              onNavigate={() => setDrawerOpen(false)}
            />
          ))}
        </nav>
        <div className="shrink-0 border-t border-border/80 p-3">
          <SidebarAccount showLabel />
        </div>
      </SheetContent>
    </Sheet>
  );
}
