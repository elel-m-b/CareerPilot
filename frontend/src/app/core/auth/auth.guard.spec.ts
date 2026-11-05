import { TestBed } from "@angular/core/testing";
import {
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
  UrlTree,
  provideRouter,
  Router,
} from "@angular/router";
import { describe, expect, it } from "vitest";
import { signal } from "@angular/core";
import { AuthService } from "./auth.service";
import { authGuard } from "./auth.guard";

const route = {} as ActivatedRouteSnapshot;

function state(url: string): RouterStateSnapshot {
  return { url } as RouterStateSnapshot;
}

function configure(authenticated: boolean): void {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: AuthService,
        useValue: {
          ready: Promise.resolve(),
          isAuthenticated: signal(authenticated),
        },
      },
    ],
  });
}

describe("authGuard", () => {
  it("allows an authenticated session", async () => {
    configure(true);
    const result = await TestBed.runInInjectionContext(() =>
      authGuard(route, state("/dashboard")),
    );
    expect(result).toBe(true);
  });

  it("redirects a signed-out visitor to /auth with the requested path", async () => {
    configure(false);
    const result = await TestBed.runInInjectionContext(() =>
      authGuard(route, state("/cv/12?tab=history")),
    );
    expect(result).toBeInstanceOf(UrlTree);

    const tree = result as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(tree)).toBe(
      "/auth?returnTo=%2Fcv%2F12%3Ftab%3Dhistory",
    );
  });
});
