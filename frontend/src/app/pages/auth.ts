import { Component, computed, effect, inject, input, signal } from "@angular/core";
import {
  FormBuilder,
  type FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import {
  LucideArrowRight,
  LucideLoaderCircle,
  LucideLock,
  LucideMail,
  LucideUserRound,
} from "@lucide/angular";
import { AuthService } from "../core/auth/auth.service";
import { describeError } from "../lib/cv/report";
import { cn } from "../lib/utils";
import { BrandComponent } from "../shared/brand";
import { buttonClass } from "../shared/button";
import { ThemeToggleComponent } from "../shared/theme-toggle";

type AuthMode = "signin" | "signup";

/**
 * Sign in / create account.
 *
 * CareerPilot authenticates with email + password and receives a stateless JWT.
 * The reference OTP and guest flows are not part of this backend, so they are
 * deliberately absent rather than simulated.
 */
@Component({
  selector: "app-auth-page",
  imports: [
    ReactiveFormsModule,
    RouterLink,
    BrandComponent,
    ThemeToggleComponent,
    LucideArrowRight,
    LucideLoaderCircle,
    LucideLock,
    LucideMail,
    LucideUserRound,
  ],
  template: `
    <div class="relative flex min-h-screen flex-col bg-background">
      <div class="absolute right-3 top-3 z-10 sm:right-6 sm:top-5">
        <app-theme-toggle />
      </div>

      <div class="flex flex-1 items-center justify-center px-4 py-12">
        <div
          class="flex w-full max-w-[400px] flex-col gap-6 rounded-md border border-border bg-card py-6 pb-0 text-card-foreground shadow-sm"
        >
          <div class="grid auto-rows-min items-start gap-2 px-6 text-center">
            <button
              type="button"
              (click)="goHome()"
              class="mx-auto mb-2 flex w-fit items-center"
              aria-label="Back to the CareerPilot home page"
            >
              <app-brand />
            </button>
            <h1 class="leading-none font-semibold text-lg font-medium tracking-tight">
              {{ mode() === "signin" ? "Sign in to CareerPilot" : "Create your account" }}
            </h1>
            <p class="text-muted-foreground text-sm text-sm leading-relaxed">
              {{
                mode() === "signin"
                  ? "Use the email address and password you registered with."
                  : "Your account keeps every CV and analysis private to you."
              }}
            </p>
          </div>

          <div class="px-6">
            <div class="flex flex-col gap-2">
              <div
                role="tablist"
                aria-label="Authentication mode"
                class="bg-muted text-muted-foreground inline-flex h-9 w-full items-center justify-center rounded-lg p-[3px]"
              >
                <button
                  type="button"
                  role="tab"
                  [attr.aria-selected]="mode() === 'signin'"
                  [class]="tabClass('signin')"
                  (click)="setMode('signin')"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  role="tab"
                  [attr.aria-selected]="mode() === 'signup'"
                  [class]="tabClass('signup')"
                  (click)="setMode('signup')"
                >
                  Create account
                </button>
              </div>

              @if (mode() === "signin") {
                <form class="mt-5 flex flex-col gap-4" [formGroup]="signInForm" (ngSubmit)="handleSignIn()">
                  <fieldset [disabled]="isLoading()" class="m-0 flex flex-col gap-4 border-0 p-0">
                  <div class="flex flex-col gap-2">
                    <label for="signin-email" class="text-sm leading-none font-medium">Email</label>
                    <div class="relative">
                      <svg lucideMail class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"></svg>
                      <input
                        id="signin-email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        formControlName="email"
                        [class]="inputClass('pl-9')"
                        required
                      />
                    </div>
                  </div>

                  <div class="flex flex-col gap-2">
                    <label for="signin-password" class="text-sm leading-none font-medium">Password</label>
                    <div class="relative">
                      <svg lucideLock class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"></svg>
                      <input
                        id="signin-password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        formControlName="password"
                        [class]="inputClass('pl-9')"
                        required
                        minlength="6"
                      />
                    </div>
                  </div>
                  </fieldset>

                  @if (error()) {
                    <p class="text-sm text-critical">{{ error() }}</p>
                  }

                  <button type="submit" [class]="buttonClass('default') + ' w-full gap-2'" [disabled]="isLoading()">
                    @if (isLoading()) {
                      <svg lucideLoaderCircle class="size-4 animate-spin"></svg>
                      Signing in…
                    } @else {
                      Sign in
                      <svg lucideArrowRight class="size-4"></svg>
                    }
                  </button>
                </form>
              } @else {
                <form class="mt-5 flex flex-col gap-4" [formGroup]="signUpForm" (ngSubmit)="handleSignUp()">
                  <fieldset [disabled]="isLoading()" class="m-0 flex flex-col gap-4 border-0 p-0">
                  <div class="flex flex-col gap-2">
                    <label for="signup-username" class="text-sm leading-none font-medium">Name</label>
                    <div class="relative">
                      <svg lucideUserRound class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"></svg>
                      <input
                        id="signup-username"
                        autoComplete="username"
                        placeholder="Your name"
                        formControlName="username"
                        [class]="inputClass('pl-9')"
                        required
                        minlength="3"
                        maxlength="50"
                      />
                    </div>
                  </div>

                  <div class="flex flex-col gap-2">
                    <label for="signup-email" class="text-sm leading-none font-medium">Email</label>
                    <div class="relative">
                      <svg lucideMail class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"></svg>
                      <input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        formControlName="email"
                        [class]="inputClass('pl-9')"
                        required
                      />
                    </div>
                  </div>

                  <div class="flex flex-col gap-2">
                    <label for="signup-password" class="text-sm leading-none font-medium">Password</label>
                    <div class="relative">
                      <svg lucideLock class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"></svg>
                      <input
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        formControlName="password"
                        [class]="inputClass('pl-9')"
                        required
                        minlength="6"
                        maxlength="100"
                      />
                    </div>
                  </div>
                  </fieldset>

                  @if (error()) {
                    <p class="text-sm text-critical">{{ error() }}</p>
                  }

                  <button type="submit" [class]="buttonClass('default') + ' w-full gap-2'" [disabled]="isLoading()">
                    @if (isLoading()) {
                      <svg lucideLoaderCircle class="size-4 animate-spin"></svg>
                      Creating account…
                    } @else {
                      Create account
                      <svg lucideArrowRight class="size-4"></svg>
                    }
                  </button>
                </form>
              }
            </div>
          </div>

          <p class="mt-0 border-t border-border/80 px-6 pb-6 pt-4 text-center text-xs leading-relaxed text-muted-foreground">
            <a routerLink="/" class="text-foreground underline underline-offset-4">Back to the home page</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class AuthPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly forms = inject(FormBuilder);

  /** Query parameter supplied by guarded routes. */
  readonly returnTo = input<string | null>(null);
  readonly redirectAfterAuth = input<string>("/dashboard");

  protected readonly buttonClass = buttonClass;
  protected readonly mode = signal<AuthMode>("signin");
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly signInForm: FormGroup = this.forms.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]],
  });

  protected readonly signUpForm: FormGroup = this.forms.nonNullable.group({
    username: ["", [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
  });

  protected readonly redirect = computed(() => {
    const returnTo = this.returnTo();
    if (typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
      return returnTo;
    }
    return this.redirectAfterAuth() ?? "/dashboard";
  });

  constructor() {
    effect(() => {
      if (!this.auth.isLoading() && this.auth.isAuthenticated()) {
        void this.router.navigateByUrl(this.redirect() || "/dashboard", { replaceUrl: true });
      }
    });
  }

  protected setMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.error.set(null);
  }

  protected tabClass(tab: AuthMode): string {
    return cn(
      "inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2 py-1 text-sm font-medium text-foreground transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
      this.mode() === tab
        ? "bg-background shadow-sm dark:border-input dark:bg-input/30 dark:text-foreground"
        : "dark:text-muted-foreground",
    );
  }

  protected inputClass(extra = ""): string {
    return cn(
      "border-input placeholder:text-muted-foreground dark:bg-input/30 h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
      extra,
    );
  }

  protected async handleSignIn(): Promise<void> {
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }
    const { email, password } = this.signInForm.getRawValue() as {
      email: string;
      password: string;
    };
    this.isLoading.set(true);
    this.error.set(null);
    try {
      await this.auth.signIn(email, password);
      await this.router.navigateByUrl(this.redirect() || "/dashboard", { replaceUrl: true });
    } catch (cause) {
      this.error.set(describeError(cause, "We could not sign you in with those details."));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async handleSignUp(): Promise<void> {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    }
    const { username, email, password } = this.signUpForm.getRawValue() as {
      username: string;
      email: string;
      password: string;
    };
    this.isLoading.set(true);
    this.error.set(null);
    try {
      await this.auth.signUp(username, email, password);
      await this.router.navigateByUrl(this.redirect() || "/dashboard", { replaceUrl: true });
    } catch (cause) {
      this.error.set(describeError(cause, "We could not create that account."));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected goHome(): void {
    void this.router.navigateByUrl("/");
  }
}
