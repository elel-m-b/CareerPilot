import type { Routes } from "@angular/router";
import { authGuard } from "./core/auth/auth.guard";
import { PLANNED_FEATURES } from "./lib/features";

/**
 * The route table from the previous Angular entry point, unchanged:
 * every product screen is private, every planned feature keeps its route and
 * shows the same explicit coming-soon page.
 */
export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("./pages/landing").then((m) => m.LandingPage),
    title: "CareerPilot — ATS CV scanner for students and interns",
  },
  {
    path: "auth",
    loadComponent: () => import("./pages/auth").then((m) => m.AuthPage),
    title: "Sign in — CareerPilot",
  },
  {
    path: "dashboard",
    canActivate: [authGuard],
    loadComponent: () => import("./pages/dashboard").then((m) => m.DashboardPage),
    title: "Dashboard — CareerPilot",
  },
  {
    path: "cv",
    canActivate: [authGuard],
    loadComponent: () => import("./pages/my-cv").then((m) => m.MyCvPage),
    title: "My CV — CareerPilot",
  },
  {
    path: "cv/:resumeId/compare",
    canActivate: [authGuard],
    loadComponent: () => import("./pages/compare").then((m) => m.ComparePage),
    title: "Compare scans — CareerPilot",
  },
  {
    path: "cv/:resumeId/edit",
    canActivate: [authGuard],
    data: { feature: PLANNED_FEATURES.cvEditor },
    loadComponent: () => import("./pages/coming-soon").then((m) => m.ComingSoonPage),
  },
  {
    path: "cv/:resumeId",
    canActivate: [authGuard],
    loadComponent: () => import("./pages/cv-analysis").then((m) => m.CvAnalysisPage),
    title: "CV report — CareerPilot",
  },
  {
    path: "jobs",
    canActivate: [authGuard],
    data: { feature: PLANNED_FEATURES.jobs },
    loadComponent: () => import("./pages/coming-soon").then((m) => m.ComingSoonPage),
  },
  {
    path: "jobs/:jobId",
    canActivate: [authGuard],
    data: { feature: PLANNED_FEATURES.jobs },
    loadComponent: () => import("./pages/coming-soon").then((m) => m.ComingSoonPage),
  },
  {
    path: "job-description",
    canActivate: [authGuard],
    data: { feature: PLANNED_FEATURES.jobDescription },
    loadComponent: () => import("./pages/coming-soon").then((m) => m.ComingSoonPage),
  },
  {
    path: "companies",
    canActivate: [authGuard],
    data: { feature: PLANNED_FEATURES.companies },
    loadComponent: () => import("./pages/coming-soon").then((m) => m.ComingSoonPage),
  },
  {
    path: "companies/:slug",
    canActivate: [authGuard],
    data: { feature: PLANNED_FEATURES.companies },
    loadComponent: () => import("./pages/coming-soon").then((m) => m.ComingSoonPage),
  },
  {
    path: "applications",
    canActivate: [authGuard],
    data: { feature: PLANNED_FEATURES.applications },
    loadComponent: () => import("./pages/coming-soon").then((m) => m.ComingSoonPage),
  },
  {
    path: "prep",
    canActivate: [authGuard],
    data: { feature: PLANNED_FEATURES.prep },
    loadComponent: () => import("./pages/coming-soon").then((m) => m.ComingSoonPage),
  },
  {
    path: "prep/:planId",
    canActivate: [authGuard],
    data: { feature: PLANNED_FEATURES.prep },
    loadComponent: () => import("./pages/coming-soon").then((m) => m.ComingSoonPage),
  },
  {
    path: "roadmap",
    canActivate: [authGuard],
    data: { feature: PLANNED_FEATURES.roadmap },
    loadComponent: () => import("./pages/coming-soon").then((m) => m.ComingSoonPage),
  },
  {
    path: "copilot",
    canActivate: [authGuard],
    data: { feature: PLANNED_FEATURES.copilot },
    loadComponent: () => import("./pages/coming-soon").then((m) => m.ComingSoonPage),
  },
  {
    path: "profile",
    canActivate: [authGuard],
    loadComponent: () => import("./pages/profile").then((m) => m.ProfilePage),
    title: "Profile — CareerPilot",
  },
  {
    path: "settings",
    canActivate: [authGuard],
    loadComponent: () => import("./pages/settings").then((m) => m.SettingsPage),
    title: "Settings — CareerPilot",
  },
  {
    path: "**",
    loadComponent: () => import("./pages/not-found").then((m) => m.NotFoundPage),
    title: "Page not found — CareerPilot",
  },
];
