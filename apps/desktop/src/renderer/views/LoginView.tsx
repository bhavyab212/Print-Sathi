import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth.store';
import { useNavigationLoading } from '../components/navigation/NavigationProvider';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { session } = useAuthStore();
  const { startNavigation } = useNavigationLoading();

  if (session) {
    return <Navigate to="/queue" replace />;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      
      // Store will handle the rest via onAuthStateChange
      startNavigation();
      navigate('/queue');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to login';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      {/* Left panel - Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-gray-900 p-12 text-white lg:flex relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 mix-blend-overlay"></div>
        <div className="relative z-10" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
              <i className="bx bx-printer text-xl"></i>
            </div>
            <span className="text-xl font-bold tracking-tight">Print Sathi</span>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            The smart OS for your print shop
          </h1>
          <p className="text-lg text-gray-400">
            Manage your queue, auto-generate passport photos, and calculate bills—all from your desktop.
          </p>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex w-full flex-col justify-center bg-white px-8 lg:w-1/2 lg:px-16 relative">
        {/* Window controls area for dragging the right side if needed */}
        <div className="absolute top-0 right-0 left-0 h-10" />

        <div className="mx-auto w-full max-w-md" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-500">
              Sign in to access your shop dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <i className="bx bx-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  placeholder="shop@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <i className="bx bx-lock-alt absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600">
                <i className="bx bx-error-circle"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 focus:ring-4 focus:ring-gray-900/10 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <>
                  <i className="bx bx-loader-alt animate-spin text-lg"></i>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
