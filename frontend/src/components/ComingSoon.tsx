import { AppShell, PageHeader } from "@/components/AppShell";
import { Panel } from "@/components/Panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { COMING_SOON_MESSAGE, type PlannedFeature } from "@/lib/features";
import { Reveal } from "@/lib/motion";
import { ArrowLeft, Check, Clock } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "react-router";

/**
 * One consistent, explicit message for every feature the backend does not
 * implement yet. Rendering it from a single component guarantees the wording
 * never drifts between the navigation, inline actions and full pages.
 */
export function ComingSoonNotice({ className }: { className?: string }) {
  return (
    <div
      role="status"
      className={
        "flex items-start gap-3 rounded-md border border-warning/40 bg-warning/5 px-4 py-3 " +
        (className ?? "")
      }
    >
      <Clock className="mt-0.5 size-4 shrink-0 text-warning" />
      <p className="text-sm leading-relaxed text-foreground">{COMING_SOON_MESSAGE}</p>
    </div>
  );
}

type ComingSoonContextValue = {
  /** Open the dialog, optionally naming what the user just clicked. */
  showComingSoon: (label?: string) => void;
};

const ComingSoonContext = createContext<ComingSoonContextValue | null>(null);

export function ComingSoonProvider({ children }: { children: ReactNode }) {
  const [label, setLabel] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const showComingSoon = useCallback((next?: string) => {
    setLabel(next ?? null);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ showComingSoon }), [showComingSoon]);

  return (
    <ComingSoonContext.Provider value={value}>
      {children}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-medium tracking-tight">
              {label ? `${label} is coming soon` : "Coming Soon"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              {COMING_SOON_MESSAGE}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ComingSoonContext.Provider>
  );
}

/** Hook for inline actions that are visible but not implemented yet. */
export function useComingSoon(): ComingSoonContextValue {
  const context = useContext(ComingSoonContext);
  if (!context) throw new Error("useComingSoon must be used within a ComingSoonProvider");
  return context;
}

/**
 * Full-screen placeholder for a planned feature. The route and navigation entry
 * remain in place so the roadmap is visible, but nothing pretends to work.
 */
export function ComingSoonPage({ feature }: { feature: PlannedFeature }) {
  const navigate = useNavigate();

  return (
    <AppShell area={feature.title}>
      <PageHeader
        eyebrow="Planned feature"
        title={feature.title}
        description={feature.description}
        actions={
          <Button variant="outline" className="gap-2" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Button>
        }
      />

      <div className="mt-10 flex flex-col gap-6">
        <Alert className="rounded-md border-warning/40 bg-warning/5">
          <Clock className="size-4 text-warning" />
          <AlertTitle className="text-sm">{COMING_SOON_MESSAGE}</AlertTitle>
          <AlertDescription className="text-sm leading-relaxed">
            The CareerPilot backend does not expose this feature yet, so there is nothing to
            connect it to. The screen is intentionally read-only rather than showing placeholder
            data.
          </AlertDescription>
        </Alert>

        <Reveal>
          <Panel title="What this screen will do">
            <ul className="flex flex-col gap-3">
              {feature.capabilities.map((capability) => (
                <li key={capability} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm leading-relaxed text-muted-foreground">{capability}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </Reveal>

        <Reveal>
          <Panel title="Available today">
            <p className="text-sm leading-relaxed text-muted-foreground">
              The working parts of CareerPilot are the CV scan, the seven-dimension ATS report, the
              dashboard and your account settings.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/cv">My CV</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link to="/profile">Profile</Link>
              </Button>
            </div>
          </Panel>
        </Reveal>
      </div>
    </AppShell>
  );
}
