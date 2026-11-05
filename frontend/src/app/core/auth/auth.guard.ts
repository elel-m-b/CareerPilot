import { inject } from "@angular/core";
import { type CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";

/**
 * Every product screen is private: signed-out visitors go to /auth with the
 * path they were trying to reach, matching the previous Angular guard.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ready;

  if (auth.isAuthenticated()) return true;

  const returnTo = state.url;
  return router.createUrlTree(["/auth"], { queryParams: { returnTo } });
};
