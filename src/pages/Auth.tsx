import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "login" | "signup";

export function Auth({ mode }: { mode: AuthMode }) {
  const { user, loading, configured, error: sessionError, signIn, signUp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isSignup = mode === "signup";
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const destination = from?.startsWith("/app") ? from : "/app";

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500" aria-busy="true">Checking your account…</div>;
  }

  if (user) return <Navigate to="/app" replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      if (isSignup) {
        const hasSession = await signUp(name.trim(), email.trim(), password);
        if (hasSession) navigate(destination, { replace: true });
        else setNotice("Your account is ready. Check your email to confirm it, then sign in.");
      } else {
        await signIn(email.trim(), password);
        navigate(destination, { replace: true });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Authentication failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-12">
      <div className="ambient pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative w-full max-w-[420px]">
        <Link to="/" className="mb-8 inline-flex items-center gap-2.5">
          <LogoMark />
          <span className="text-[15px] font-semibold tracking-[-0.03em] text-slate-900">RetailMind</span>
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-pop sm:p-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to site
          </Link>
          <h1 className="mt-6 text-[26px] font-semibold tracking-[-0.035em] text-slate-950">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {isSignup ? "Sign up to open your RetailMind workspace." : "Sign in to continue to your workspace."}
          </p>

          {!configured && (
            <div role="alert" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[13px] leading-relaxed text-amber-900">
              Supabase is not configured. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code>; see the README setup instructions.
            </div>
          )}
          {sessionError && (
            <div role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-[13px] text-rose-800">
              Could not check your session: {sessionError}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="full-name">Name</Label>
                <Input id="full-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} disabled={!configured || submitting} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} disabled={!configured || submitting} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={isSignup ? 8 : undefined} disabled={!configured || submitting} />
              {isSignup && <p className="text-[11px] text-slate-400">Use at least 8 characters.</p>}
            </div>

            {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-[13px] text-rose-800">{error}</p>}
            {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[13px] text-emerald-800">{notice}</p>}

            <Button type="submit" className="h-10 w-full" disabled={!configured || submitting}>
              {submitting ? <LoaderCircle className="animate-spin" /> : <>{isSignup ? "Create account" : "Sign in"} <ArrowRight /></>}
            </Button>
          </form>

          <p className="mt-6 text-center text-[13px] text-slate-500">
            {isSignup ? "Already have an account?" : "New to RetailMind?"}{" "}
            <Link to={isSignup ? "/login" : "/signup"} state={location.state} className="font-medium text-ink-700 hover:underline">
              {isSignup ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </section>
        <p className="mt-5 text-center text-[11px] text-slate-400">Demo analytics are sample data and are not private customer records.</p>
      </div>
    </main>
  );
}
