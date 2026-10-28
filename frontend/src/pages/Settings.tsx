import { api } from "@/api/endpoints";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useComingSoon } from "@/components/ComingSoon";
import { Panel, StatTile } from "@/components/Panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useResource } from "@/hooks/use-resource";
import { cn } from "@/lib/utils";
import { AlertCircle, LogOut, Moon, ShieldCheck, Sun, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useNavigate, Link } from "react-router";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: ShieldCheck },
] as const;

export default function Settings() {
  const { user, signOut } = useAuth();
  const { showComingSoon } = useComingSoon();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const stats = useResource(() => api.dashboard.stats(), []);
  const resumes = useResource(() => api.resumes.list(), []);

  function handleSignOut() {
    // Clearing the session makes RequireAuth redirect this protected screen, so
    // go to /auth explicitly rather than racing that redirect.
    signOut();
    navigate("/auth", { replace: true });
  }

  return (
    <AppShell area="Settings">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Your account, how CareerPilot looks, and the data the platform stores on your behalf."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <Panel title="Account">
            <dl className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="truncate text-sm text-foreground">{user?.email ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-xs text-muted-foreground">Name</dt>
                <dd className="truncate text-sm text-foreground">{user?.name ?? "Not set"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-xs text-muted-foreground">Sign-in method</dt>
                <dd className="text-sm text-foreground">Email and password</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-xs text-muted-foreground">Session</dt>
                <dd className="text-sm text-foreground">Stateless JWT</dd>
              </div>
            </dl>

            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              CareerPilot authenticates against its own Spring Boot API. The token is stored in this
              browser and every request is scoped to your user id.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to="/profile">Edit my profile</Link>
              </Button>
              <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={handleSignOut}>
                <LogOut className="size-4" />
                Sign out
              </Button>
            </div>
          </Panel>

          <Panel title="Appearance">
            <p className="text-sm leading-relaxed text-muted-foreground">
              The theme is saved in this browser and applied before the first paint, so there is no
              flash of the wrong colours when you reload.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {THEME_OPTIONS.map((option) => {
                const active = theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "flex items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors",
                      active
                        ? "border-foreground bg-secondary text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <option.icon className="size-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="Your data">
            {stats.loading || resumes.loading ? (
              <Skeleton className="h-32 w-full" />
            ) : stats.error || resumes.error ? (
              <Alert variant="destructive" className="rounded-md">
                <AlertCircle className="size-4" />
                <AlertTitle className="text-sm">We could not load your data summary</AlertTitle>
                <AlertDescription className="text-sm leading-relaxed">
                  {(stats.error ?? resumes.error)?.message}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatTile
                    label="CVs stored"
                    value={stats.data?.totalResumes ?? 0}
                    hint={`${resumes.data?.length ?? 0} document${
                      (resumes.data?.length ?? 0) === 1 ? "" : "s"
                    } on file`}
                  />
                  <StatTile
                    label="Scans recorded"
                    value={stats.data?.totalAnalyses ?? 0}
                    hint={
                      (stats.data?.totalAnalyses ?? 0) > 0
                        ? `Average ${Math.round(stats.data?.averageScore ?? 0)}%`
                        : "Run a scan from My CV"
                    }
                  />
                  <StatTile
                    label="Best score"
                    value={
                      (stats.data?.totalAnalyses ?? 0) > 0 ? (stats.data?.bestScore ?? 0) : "—"
                    }
                    unit={(stats.data?.totalAnalyses ?? 0) > 0 ? "%" : undefined}
                    hint={
                      (stats.data?.totalAnalyses ?? 0) > 0
                        ? "Across every scan"
                        : "No scans recorded yet"
                    }
                  />
                </div>

                <p className="mt-6 border-t border-border/80 pt-5 text-xs leading-relaxed text-muted-foreground">
                  Each CV can be deleted individually from{" "}
                  <Link to="/cv" className="text-foreground underline underline-offset-4">
                    My CV
                  </Link>
                  , which also removes its full analysis history.
                </p>
              </>
            )}
          </Panel>

          <Panel title="Danger zone">
            <Alert variant="destructive" className="rounded-md">
              <AlertCircle className="size-4" />
              <AlertTitle className="text-sm">Delete everything, keep the account</AlertTitle>
              <AlertDescription className="text-sm leading-relaxed">
                A single action that wipes every CV and analysis is not implemented yet. Delete
                individual CVs from the CV library in the meantime.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              className="mt-5 gap-2 border-critical/40 text-critical hover:text-critical"
              onClick={() => showComingSoon("Deleting all account data")}
            >
              <Trash2 className="size-4" />
              Delete my CareerPilot data
            </Button>
          </Panel>
        </div>

        <div className="flex h-fit flex-col gap-6 lg:sticky lg:top-24">
          <Panel title="Session">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {user
                ? "You are signed in with a live JWT session. Private routes are scoped to your account only."
                : "Your session has ended. Sign in again to reach your data."}
            </p>
            {!user && (
              <Button className="mt-4 w-full" onClick={() => navigate("/auth?returnTo=%2Fdashboard")}>
                Sign in again
              </Button>
            )}
          </Panel>

          <Panel title="How your data is used">
            <ul className="flex flex-col gap-3 text-xs leading-relaxed text-muted-foreground">
              <li>· CV files are stored against your account and only readable by you.</li>
              <li>· Analysis runs entirely from your document; nothing is sent to a third party.</li>
              <li>· Deleting a CV removes its stored document and its full analysis history.</li>
              <li>· The deterministic engine never generates content on your behalf.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
