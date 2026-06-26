"use client";
import { Boxicon } from "@/components/ui";


import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui";
import { fadeUp } from "@/lib/motion";
import {
  AuthShell,
  AuthBrand,
  AuthCard,
  AuthInput,
  AuthAlert,
  AuthFooter,
} from "@/components/auth/AuthShell";
import { useNavigationLoading } from "@/components/navigation/NavigationProvider";

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
  const { startNavigation } = useNavigationLoading();

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
      startNavigation();
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


  return (
    <>
      <AuthBrand />

      <AuthCard>
        <AnimatePresence mode="wait" initial={false}>
          {mode === "login" ? (
            <motion.div
              key="login"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -12 }}
            >
              <h2 className="text-h3 font-display text-[var(--ps-ink)]">Welcome back</h2>
              <p className="text-caption mb-6 mt-1 text-[var(--ps-ink-muted)]">
                Sign in to your shopkeeper account.
              </p>


              <form onSubmit={handleLogin} className="space-y-4">
                <AuthInput
                  id="email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="shop@example.com"
                  required
                />
                <AuthInput
                  id="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                {error && <AuthAlert>{error}</AuthAlert>}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="w-full hover:animate-glow-pulse"
                >
                  {loading ? (
                    <>
                      <Boxicon className="bx bx-loader-alt animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              <button
                onClick={() => setMode("reset")}
                className="text-caption mt-4 w-full text-center text-[var(--ps-ink-muted)] transition-colors hover:text-[var(--ps-primary)]"
              >
                Forgot your password?
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="reset"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -12 }}
            >
              <h2 className="text-h3 font-display text-[var(--ps-ink)]">Reset password</h2>
              <p className="text-caption mb-6 mt-1 text-[var(--ps-ink-muted)]">
                Enter your email and we&apos;ll send a reset link.
              </p>

              {resetSent ? (
                <AuthAlert tone="success">Check your email for the reset link!</AuthAlert>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <AuthInput
                    id="reset-email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="shop@example.com"
                    required
                  />

                  {error && <AuthAlert>{error}</AuthAlert>}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={loading}
                    className="w-full hover:animate-glow-pulse"
                  >
                    {loading ? "Sending..." : "Send reset link"}
                  </Button>
                </form>
              )}

              <button
                onClick={() => {
                  setMode("login");
                  setResetSent(false);
                  setError(null);
                }}
                className="text-caption mt-4 w-full text-center text-[var(--ps-ink-muted)] transition-colors hover:text-[var(--ps-primary)]"
              >
                ← Back to sign in
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </AuthCard>

      <AuthFooter />
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="flex items-center justify-center gap-2 text-[var(--ps-ink-muted)]">
            <Boxicon className="bx bx-loader-alt animate-spin text-xl" />
            Loading...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
