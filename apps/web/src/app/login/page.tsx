"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

const inputClass =
  "w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [resetSent, setResetSent] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(redirectTo);
      router.refresh();
    }
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
    setLoading(false);
  }

  function fillTestCredentials() {
    setEmail("printsathi.test@gmail.com");
    setPassword("PrintSathi@123");
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
          <i className="bx bx-printer text-3xl text-white"></i>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Print Sathi</h1>
        <p className="mt-1 text-sm text-muted-foreground">Smart Print Shop Manager</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/20">
        {mode === "login" ? (
          <>
            <h2 className="mb-1 text-lg font-semibold text-foreground">Welcome back</h2>
            <p className="mb-6 text-sm text-muted-foreground">Sign in to your shopkeeper account.</p>

            {/* Test credentials banner */}
            <button
              type="button"
              onClick={fillTestCredentials}
              className="mb-5 flex w-full items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-left text-sm transition-all hover:bg-primary/10"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <i className="bx bx-key text-primary text-base"></i>
              </div>
              <div>
                <p className="font-semibold text-primary">Use test credentials</p>
                <p className="text-xs text-muted-foreground">printsathi.test@gmail.com / PrintSathi@123</p>
              </div>
              <i className="bx bx-chevron-right ml-auto text-muted-foreground"></i>
            </button>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="shop@example.com"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputClass}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <i className="bx bx-error-circle mr-1"></i>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="bx bx-loader-alt animate-spin"></i>
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <button
              onClick={() => setMode("reset")}
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot your password?
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Reset password</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Enter your email and we&apos;ll send a reset link.
            </p>

            {resetSent ? (
              <div className="rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-400">
                <i className="bx bx-check-circle mr-1"></i>
                Check your email for the reset link!
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="shop@example.com"
                    required
                    className={inputClass}
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <i className="bx bx-error-circle mr-1"></i>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>
            )}

            <button
              onClick={() => { setMode("login"); setResetSent(false); setError(null); }}
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to sign in
            </button>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Print Sathi © {new Date().getFullYear()}
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-muted-foreground">
            <i className="bx bx-loader-alt animate-spin text-xl"></i>
            Loading...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
