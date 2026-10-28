import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { describeError } from "@/lib/cv/report";
import { ArrowRight, Loader2, Lock, Mail, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return fallback;
}

/**
 * Sign in / create account.
 *
 * CareerPilot authenticates with email + password and receives a stateless JWT.
 * The reference OTP and guest flows are not part of this backend, so they are
 * deliberately absent rather than simulated.
 */
export default function Auth({ redirectAfterAuth }: AuthProps) {
  const { isLoading: authLoading, isAuthenticated, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(searchParams.get("returnTo"), redirectAfterAuth);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate(redirect, { replace: true });
  }, [authLoading, isAuthenticated, navigate, redirect]);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsLoading(true);
    setError(null);
    try {
      await signIn(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
      navigate(redirect, { replace: true });
    } catch (cause) {
      setError(describeError(cause, "We could not sign you in with those details."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsLoading(true);
    setError(null);
    try {
      await signUp(
        String(formData.get("username") ?? ""),
        String(formData.get("email") ?? ""),
        String(formData.get("password") ?? ""),
      );
      navigate(redirect, { replace: true });
    } catch (cause) {
      setError(describeError(cause, "We could not create that account."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="absolute right-3 top-3 z-10 sm:right-6 sm:top-5">
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-[400px] rounded-md border border-border pb-0 shadow-none">
          <CardHeader className="text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mx-auto mb-2 flex w-fit items-center"
              aria-label="Back to the CareerPilot home page"
            >
              <Brand />
            </button>
            <CardTitle className="text-lg font-medium tracking-tight">
              {mode === "signin" ? "Sign in to CareerPilot" : "Create your account"}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {mode === "signin"
                ? "Use the email address and password you registered with."
                : "Your account keeps every CV and analysis private to you."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs
              value={mode}
              onValueChange={(value) => {
                setMode(value as "signin" | "signup");
                setError(null);
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-5">
                <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        className="pl-9"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="pl-9"
                        required
                        minLength={6}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm text-critical">{error}</p>}

                  <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-5">
                <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="signup-username">Name</Label>
                    <div className="relative">
                      <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-username"
                        name="username"
                        autoComplete="username"
                        placeholder="Your name"
                        className="pl-9"
                        required
                        minLength={3}
                        maxLength={50}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        className="pl-9"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        className="pl-9"
                        required
                        minLength={6}
                        maxLength={100}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm text-critical">{error}</p>}

                  <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Creating account…
                      </>
                    ) : (
                      <>
                        Create account
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <div className="rounded-b-md border-t bg-muted px-6 py-4 text-center text-xs text-muted-foreground">
            Secured with a JWT session · CareerPilot API
          </div>
        </Card>
      </div>
    </div>
  );
}
