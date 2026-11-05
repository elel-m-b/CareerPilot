import { Component, DestroyRef, ElementRef, inject, input, signal, viewChild } from "@angular/core";
import {
  Router,
  RouterLink,
  RouterLinkActive,
  NavigationEnd,
} from "@angular/router";
import {
  LucideBot,
  LucideBriefcase,
  LucideBuilding2,
  LucideClipboardList,
  LucideDynamicIcon,
  LucideFileText,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideMenu,
  LucideRoute,
  LucideSend,
  LucideSettings,
  LucideTarget,
  LucideUserRound,
  type LucideIcon,
} from "@lucide/angular";
import { AuthService } from "../core/auth/auth.service";
import { cn } from "../lib/utils";
import { BrandComponent } from "./brand";
import { DropdownComponent, dropdownItemClass } from "./dropdown";
import { ThemeToggleComponent } from "./theme-toggle";

/** The rail's two resting widths, in px. */
const COLLAPSED_WIDTH = 64;
const EXPANDED_WIDTH = 264;

type NavItem = { to: string; label: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LucideLayoutDashboard },
  { to: "/cv", label: "My CV", icon: LucideFileText },
  { to: "/copilot", label: "AI Copilot", icon: LucideBot },
  { to: "/jobs", label: "Jobs", icon: LucideBriefcase },
  { to: "/job-description", label: "JD generator", icon: LucideClipboardList },
  { to: "/companies", label: "Companies", icon: LucideBuilding2 },
  { to: "/applications", label: "Applications", icon: LucideSend },
  { to: "/prep", label: "Interview prep", icon: LucideTarget },
  { to: "/roadmap", label: "Learning roadmap", icon: LucideRoute },
  { to: "/profile", label: "Profile", icon: LucideUserRound },
  { to: "/settings", label: "Settings", icon: LucideSettings },
];

/**
 * Chrome for every signed-in screen: a hover-expanding navigation rail from `lg`
 * up, a left drawer below it, and a sticky top bar carrying the area name, the
 * theme switch and (on small screens) the drawer trigger.
 */
@Component({
  selector: "app-shell",
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideDynamicIcon,
    LucideMenu,
    LucideLogOut,
    ThemeToggleComponent,
    BrandComponent,
    DropdownComponent,
  ],
  template: `
    <div class="min-h-screen bg-background">
      <div class="mx-auto flex w-full max-w-[1440px]">
        <!-- Desktop rail: a 64px strip that floats an expanded panel above the
             page, so hovering never reflows the content. -->
        <aside
          #rail
          aria-label="Main"
          class="sticky top-0 z-30 hidden h-screen w-16 shrink-0 lg:block"
          (mouseenter)="railOpen.set(true)"
          (mouseleave)="maybeCollapse()"
          (focusin)="railOpen.set(true)"
          (focusout)="onRailFocusOut($event)"
        >
          <div
            [class]="cn(
              'absolute inset-y-0 left-0 flex flex-col overflow-hidden border-r border-border/80 bg-sidebar transition-[width,box-shadow] duration-300 ease-out',
              railOpen() && 'shadow-[10px_0_30px_-18px_rgb(0_0_0/0.35)] dark:shadow-[10px_0_30px_-14px_rgb(0_0_0/0.8)]'
            )"
            [style.width.px]="railOpen() ? expandedWidth : collapsedWidth"
          >
            <div class="flex h-16 shrink-0 items-center px-5">
              <a routerLink="/dashboard" aria-label="CareerPilot dashboard" class="inline-flex items-center">
                <app-brand [compact]="!railOpen()" />
              </a>
            </div>

            <nav
              aria-label="Sections"
              class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-x-hidden overflow-y-auto px-3 py-2"
            >
              @for (item of navItems; track item.to) {
                <a
                  [routerLink]="item.to"
                  routerLinkActive="font-medium text-foreground"
                  #rla="routerLinkActive"
                  [attr.aria-label]="item.label"
                  [attr.title]="item.label"
                  [class]="cn(
                    'group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60',
                    rla.isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  )"
                >
                  @if (rla.isActive) {
                    <span class="absolute inset-0 rounded-md bg-secondary"></span>
                  }
                  <span class="relative z-10 flex items-center gap-2.5">
                    <svg [lucideIcon]="item.icon" class="size-4 shrink-0 transition-transform duration-200 group-hover:scale-105"></svg>
                    <span
                      [class]="cn(
                        'whitespace-nowrap transition-all duration-200',
                        railOpen() ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
                      )"
                    >{{ item.label }}</span>
                  </span>
                </a>
              }
            </nav>

            <div class="shrink-0 border-t border-border/80 p-3">
              <app-dropdown align="right-start" panelClassName="w-56">
                <button
                  dropdownTrigger
                  type="button"
                  [attr.title]="email()"
                  class="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left outline-none transition-colors hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  <span
                    class="grid size-7 shrink-0 place-items-center rounded-[3px] bg-secondary text-[10px] font-medium"
                  >{{ initials() }}</span>
                  <span
                    [class]="cn(
                      'min-w-0 flex-1 truncate text-xs text-muted-foreground transition-all duration-200',
                      railOpen() ? 'opacity-100' : '-translate-x-2 opacity-0'
                    )"
                  >{{ email() }}</span>
                </button>
                <div dropdownPanel class="flex flex-col">
                  <div class="px-2 py-1.5 text-xs font-normal text-muted-foreground">
                    Signed in as
                    <div class="mt-0.5 truncate text-foreground">{{ email() }}</div>
                  </div>
                  <div class="my-1 h-px bg-border"></div>
                  <button type="button" [class]="itemClass()" (click)="go('/profile')">Profile</button>
                  <button type="button" [class]="itemClass()" (click)="go('/settings')">Settings</button>
                  <div class="my-1 h-px bg-border"></div>
                  <button
                    type="button"
                    [class]="itemClass('text-critical focus:text-critical')"
                    (click)="handleSignOut()"
                  >
                    <svg lucideLogOut class="size-4"></svg>
                    Sign out
                  </button>
                </div>
              </app-dropdown>
            </div>
          </div>
        </aside>

        <!-- Mobile navigation, as a left drawer with a real focus trap. -->
        <dialog #drawer class="cp-drawer" (close)="drawerOpen.set(false)" (click)="onDrawerBackdrop($event)">
          <div class="flex h-full flex-col">
            <div class="flex h-16 shrink-0 items-center px-6">
              <a routerLink="/dashboard" aria-label="CareerPilot dashboard" class="inline-flex items-center" (click)="drawerOpen.set(false)">
                <app-brand />
              </a>
            </div>
            <nav aria-label="Sections" class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
              @for (item of navItems; track item.to) {
                <a
                  [routerLink]="item.to"
                  routerLinkActive="font-medium text-foreground"
                  #rlaDrawer="routerLinkActive"
                  [attr.aria-label]="item.label"
                  [class]="cn(
                    'group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm outline-none transition-colors',
                    rlaDrawer.isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  )"
                  (click)="drawerOpen.set(false)"
                >
                  @if (rlaDrawer.isActive) {
                    <span class="absolute inset-0 rounded-md bg-secondary"></span>
                  }
                  <span class="relative z-10 flex items-center gap-2.5">
                    <svg [lucideIcon]="item.icon" class="size-4 shrink-0"></svg>
                    <span class="whitespace-nowrap">{{ item.label }}</span>
                  </span>
                </a>
              }
            </nav>
            <div class="shrink-0 border-t border-border/80 p-3">
              <div class="flex items-center gap-2.5 px-2 py-2">
                <span class="grid size-7 shrink-0 place-items-center rounded-[3px] bg-secondary text-[10px] font-medium">{{ initials() }}</span>
                <span class="min-w-0 flex-1 truncate text-xs text-muted-foreground">{{ email() }}</span>
              </div>
            </div>
          </div>
        </dialog>

        <div class="flex min-w-0 flex-1 flex-col">
          <header
            class="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border/80 bg-background/90 px-4 backdrop-blur-sm lg:px-10"
          >
            <div class="flex min-w-0 items-center gap-2">
              <button
                type="button"
                class="inline-flex size-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent lg:hidden"
                aria-label="Open navigation"
                (click)="openDrawer()"
              >
                <svg lucideMenu class="size-5"></svg>
              </button>
              <a routerLink="/dashboard" class="lg:hidden" aria-label="CareerPilot dashboard">
                <app-brand [compact]="true" />
              </a>
              <span
                class="hidden truncate text-[11px] uppercase tracking-[0.16em] text-muted-foreground lg:inline"
              >{{ area() }}</span>
            </div>
            <div class="flex items-center gap-1">
              <app-theme-toggle />
            </div>
          </header>

          <main class="cp-page-enter flex-1 px-4 py-8 lg:px-10 lg:py-12">
            <ng-content />
          </main>
        </div>
      </div>
    </div>
  `,
})
export class AppShellComponent {
  readonly area = input.required<string>();

  protected readonly navItems = NAV_ITEMS;
  protected readonly collapsedWidth = COLLAPSED_WIDTH;
  protected readonly expandedWidth = EXPANDED_WIDTH;
  protected readonly railOpen = signal(false);
  protected readonly drawerOpen = signal(false);
  protected readonly cn = cn;

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly rail = viewChild<ElementRef<HTMLElement>>("rail");
  private readonly drawer = viewChild<ElementRef<HTMLDialogElement>>("drawer");

  protected readonly email = () => this.auth.user()?.email ?? "Guest session";
  protected readonly initials = () =>
    (this.auth.user()?.name ?? this.auth.user()?.email ?? "G").slice(0, 2).toUpperCase();
  protected readonly itemClass = (extra = "") => dropdownItemClass(extra);

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const drawer = this.drawer()?.nativeElement;
        if (drawer?.open) drawer.close();
      }
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  protected maybeCollapse(): void {
    const rail = this.rail()?.nativeElement;
    if (rail?.contains(document.activeElement)) return;
    this.railOpen.set(false);
  }

  protected onRailFocusOut(event: FocusEvent): void {
    const rail = this.rail()?.nativeElement;
    const next = event.relatedTarget as Node | null;
    if (!rail || (next && rail.contains(next))) return;
    this.railOpen.set(false);
  }

  protected openDrawer(): void {
    this.drawer()?.nativeElement.showModal();
    this.drawerOpen.set(true);
  }

  protected onDrawerBackdrop(event: MouseEvent): void {
    if (event.target === this.drawer()?.nativeElement) this.drawer()?.nativeElement.close();
  }

  protected go(path: string): void {
    void this.router.navigateByUrl(path);
  }

  protected handleSignOut(): void {
    // Clearing the session makes the guard redirect protected screens, so
    // navigate explicitly rather than racing that redirect.
    this.auth.signOut();
    void this.router.navigateByUrl("/auth", { replaceUrl: true });
  }
}
