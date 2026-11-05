import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ThemeToggleComponent } from "../shared/theme-toggle";

@Component({
  selector: "app-not-found",
  imports: [RouterLink, ThemeToggleComponent],
  template: `
    <div class="cp-page-enter relative flex min-h-screen flex-col bg-background">
      <div class="absolute right-3 top-3 z-10 sm:right-6 sm:top-5">
        <app-theme-toggle />
      </div>

      <div class="flex flex-1 flex-col items-center justify-center">
        <div class="relative mx-auto max-w-5xl px-4">
          <div class="flex min-h-[200px] items-center justify-center">
            <div class="text-center">
              <h1 class="mb-4 text-4xl font-bold text-foreground">404</h1>
              <p class="text-lg text-muted-foreground">Page Not Found</p>
              <a
                routerLink="/"
                class="mt-6 inline-block text-sm text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
              >
                Back to the home page
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundPage {}
