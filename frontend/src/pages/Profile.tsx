import { api } from "@/api/endpoints";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useComingSoon } from "@/components/ComingSoon";
import { Panel } from "@/components/Panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { describeError } from "@/lib/cv/report";
import { formatDate } from "@/lib/format";
import { AlertCircle, Loader2, Mail, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

/**
 * Account profile.
 *
 * The backend stores a username, email and creation date for each user, so that
 * is exactly what this screen edits. The richer career profile from the
 * reference frontend is listed as planned rather than rendered as dead inputs.
 */
export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { showComingSoon } = useComingSoon();

  const [username, setUsername] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.users.update(username.trim());
      await refreshUser();
      toast.success("Profile updated.");
    } catch (cause) {
      setError(describeError(cause, "We could not update your profile."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell area="Profile">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="How you appear in CareerPilot, and the account details your CVs and reports are scoped to."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <Panel title="Account details">
            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-username">Name</Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="profile-username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="pl-9"
                    minLength={3}
                    maxLength={50}
                    required
                    disabled={saving}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Between 3 and 50 characters.</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="profile-email"
                    value={user?.email ?? ""}
                    className="pl-9"
                    readOnly
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  The email is your sign-in identity and cannot be changed here yet.
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="rounded-md">
                  <AlertCircle className="size-4" />
                  <AlertTitle className="text-sm">Update failed</AlertTitle>
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={saving || username.trim() === (user?.name ?? "")}>
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setUsername(user?.name ?? "")}
                  disabled={saving}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Panel>

          <Panel title="Career profile">
            <p className="text-sm leading-relaxed text-muted-foreground">
              The career profile that feeds job matching — target role, skills, work mode, locations
              and links — belongs to a feature the backend does not implement yet.
            </p>
            <ul className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              {[
                "Headline and target role",
                "Skills and languages",
                "Preferred locations and work mode",
                "Portfolio, GitHub and LinkedIn links",
                "Years of experience and job types",
                "Profile completeness score",
              ].map((field) => (
                <li key={field} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                  {field}
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              size="sm"
              className="mt-5"
              onClick={() => showComingSoon("The career profile")}
            >
              Career profile — coming soon
            </Button>
          </Panel>
        </div>

        <div className="flex h-fit flex-col gap-6 lg:sticky lg:top-24">
          <Panel title="Membership">
            <dl className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-xs text-muted-foreground">Member since</dt>
                <dd className="text-sm text-foreground">
                  {user?.createdAt ? formatDate(Date.parse(user.createdAt)) : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-xs text-muted-foreground">Account ID</dt>
                <dd className="text-sm tabular-nums text-foreground">{user?.id ?? "—"}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Security">
            <ul className="flex flex-col gap-3 text-xs leading-relaxed text-muted-foreground">
              <li>· Sign-in uses your email and a BCrypt-hashed password.</li>
              <li>· Every request carries a signed JWT; the session is stateless.</li>
              <li>· Your CVs, analyses and recommendations are scoped to your user id.</li>
            </ul>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 text-muted-foreground"
              onClick={() => showComingSoon("Password change")}
            >
              Change password — coming soon
            </Button>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
