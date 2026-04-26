"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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

  return (
    <div className="w-full max-w-md">
      {/* Logo / Brand */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
          <i className="bx bx-printer text-3xl text-white"></i>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Print Sathi</h1>
        <p className="mt-1 text-sm text-gray-500">Smart Print Shop Manager</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50">
        {mode === "login" ? (
          <>
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Welcome back
            </h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="shop@example.com"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
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
              className="mt-4 w-full text-center text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              Forgot your password?
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              Reset password
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Enter your email and we&apos;ll send a reset link.
            </p>

            {resetSent ? (
              <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
                <i className="bx bx-check-circle mr-1"></i>
                Check your email for the reset link!
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="shop@example.com"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
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
              onClick={() => {
                setMode("login");
                setResetSent(false);
                setError(null);
              }}
              className="mt-4 w-full text-center text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              ← Back to sign in
            </button>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">
        Print Sathi © {new Date().getFullYear()}
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-gray-400">
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
