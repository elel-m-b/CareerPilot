import { Toaster } from "@/components/ui/sonner";
import { ComingSoonPage, ComingSoonProvider } from "@/components/ComingSoon";
import { RequireAuth } from "@/components/RequireAuth";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { PLANNED_FEATURES, type PlannedFeature } from "@/lib/features";
import { MotionConfig } from "framer-motion";
import React, { StrictMode, Suspense, lazy, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";

const Landing = lazy(() => import("./pages/Landing"));
const AuthPage = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MyCv = lazy(() => import("./pages/MyCv"));
const CvAnalysis = lazy(() => import("./pages/CvAnalysis"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

/** Every product screen is private: signed-out visitors go to /auth with a return path. */
function protect(element: ReactNode) {
  return <RequireAuth>{element}</RequireAuth>;
}

/** Route for a feature that has no backend yet, with the standard notice. */
function planned(feature: PlannedFeature) {
  return protect(<ComingSoonPage feature={feature} />);
}

function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-pulse text-sm text-muted-foreground">Loading…</div>
    </div>
  );
}

/** Keeps a runtime error from leaving the user on a blank page. */
class RootErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || "Unknown runtime error" };
  }

  componentDidCatch(error: Error) {
    console.error("[CareerPilot] Unexpected runtime error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
          <div className="max-w-md text-center">
            <p className="text-sm font-semibold">Something went wrong</p>
            <p className="mt-2 break-words text-xs text-muted-foreground">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
            >
              Reload the page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ComingSoonProvider>
            <MotionConfig reducedMotion="user">
              <BrowserRouter>
                <Suspense fallback={<RouteLoading />}>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route
                      path="/auth"
                      element={<AuthPage redirectAfterAuth="/dashboard" />}
                    />
                    <Route path="/dashboard" element={protect(<Dashboard />)} />
                    <Route path="/cv" element={protect(<MyCv />)} />
                    <Route path="/cv/:resumeId" element={protect(<CvAnalysis />)} />
                    <Route path="/cv/:resumeId/edit" element={planned(PLANNED_FEATURES.cvEditor)} />
                    <Route path="/jobs" element={planned(PLANNED_FEATURES.jobs)} />
                    <Route path="/jobs/:jobId" element={planned(PLANNED_FEATURES.jobs)} />
                    <Route
                      path="/job-description"
                      element={planned(PLANNED_FEATURES.jobDescription)}
                    />
                    <Route path="/companies" element={planned(PLANNED_FEATURES.companies)} />
                    <Route
                      path="/companies/:slug"
                      element={planned(PLANNED_FEATURES.companies)}
                    />
                    <Route path="/applications" element={planned(PLANNED_FEATURES.applications)} />
                    <Route path="/prep" element={planned(PLANNED_FEATURES.prep)} />
                    <Route path="/prep/:planId" element={planned(PLANNED_FEATURES.prep)} />
                    <Route path="/roadmap" element={planned(PLANNED_FEATURES.roadmap)} />
                    <Route path="/copilot" element={planned(PLANNED_FEATURES.copilot)} />
                    <Route path="/profile" element={protect(<Profile />)} />
                    <Route path="/settings" element={protect(<Settings />)} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
              <Toaster />
            </MotionConfig>
          </ComingSoonProvider>
        </AuthProvider>
      </ThemeProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
