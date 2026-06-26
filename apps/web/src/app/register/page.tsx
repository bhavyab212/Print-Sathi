"use client";
import { Boxicon } from "@/components/ui";


import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui";
import { spring } from "@/lib/motion";
import {
  AuthShell,
  AuthBrand,
  AuthCard,
  AuthInput,
  AuthAlert,
  AuthFooter,
} from "@/components/auth/AuthShell";
import { useNavigationLoading } from "@/components/navigation/NavigationProvider";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const router = useRouter();
  const { startNavigation } = useNavigationLoading();
  const supabase = createClient();

  // Feature Flag: Public signups can be toggled via environment variables.
  // Defaults to true for local testing unless explicitly set to 'false'.
  const isPublicSignupEnabled = process.env.NEXT_PUBLIC_ENABLE_PUBLIC_SIGNUP !== "false";

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setRegistered(true);
        // Wait 2 seconds, then redirect to dashboard (which redirects to /onboarding)
        setTimeout(() => {
          startNavigation();
          router.push("/dashboard");
          router.refresh();
        }, 2000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to register account.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <AuthBrand />

      <AuthCard>
        {!isPublicSignupEnabled ? (
          <div className="py-4 text-center">
            <div className="clay mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-clay text-[var(--ps-warning)]">
              <Boxicon className="bx bx-lock-alt text-2xl" />
            </div>
            <h2 className="text-h3 font-display mb-1 text-[var(--ps-ink)]">Registration Disabled</h2>
            <p className="text-caption mb-6 text-[var(--ps-ink-muted)]">
              Self-serve registration is currently disabled. Please contact the super admin to set up
              your account.
            </p>
            <a href="/login">
              <Button variant="glass" size="lg" className="w-full">
                Go to Sign In
              </Button>
            </a>
          </div>
        ) : registered ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring}
            className="space-y-3 py-4 text-center"
          >
            <div className="clay glow-success mx-auto flex h-14 w-14 animate-bounce items-center justify-center rounded-clay text-[var(--ps-success)]">
              <Boxicon className="bx bx-check-circle text-3xl" />
            </div>
            <h2 className="text-h3 font-display text-[var(--ps-ink)]">Account Created!</h2>
            <p className="text-caption text-[var(--ps-ink-muted)]">
              Redirecting you to complete your shop setup...
            </p>
          </motion.div>
        ) : (
          <>
            <h2 className="text-h3 font-display text-[var(--ps-ink)]">Create shopkeeper account</h2>
            <p className="text-caption mb-6 mt-1 text-[var(--ps-ink-muted)]">
              Get started by setting up your manager account.
            </p>

            <form onSubmit={handleRegister} className="space-y-4">
              <AuthInput
                id="email"
                label="Email Address"
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
                placeholder="Min 6 characters"
                required
                minLength={6}
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
                    <Boxicon className="bx bx-loader-alt animate-spin text-base" />
                    Creating account...
                  </>
                ) : (
                  "Register & Continue"
                )}
              </Button>
            </form>

            <div className="text-caption mt-6 text-center text-[var(--ps-ink-muted)]">
              Already have an account?{" "}
              <a href="/login" className="font-semibold text-[var(--ps-primary)] hover:underline">
                Sign In
              </a>
            </div>
          </>
        )}
      </AuthCard>

      <AuthFooter />
    </AuthShell>
  );
}
