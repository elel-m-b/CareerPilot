import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { AuthService } from "./core/auth/auth.service";
import { ThemeService } from "./core/theme/theme.service";
import { ComingSoonDialogComponent } from "./shared/coming-soon-dialog";
import { ToastContainerComponent } from "./shared/toast-container";

/** Keeps the service singletons alive for the whole session. */
@Component({
  selector: "app-root",
  imports: [RouterOutlet, ToastContainerComponent, ComingSoonDialogComponent],
  template: `
    <router-outlet />
    <app-coming-soon-dialog />
    <app-toast-container />
  `,
})
export class App {
  // Injected here so the stored session is restored and the theme is applied
  // before the first route renders, exactly as the Angular providers did.
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);
}
