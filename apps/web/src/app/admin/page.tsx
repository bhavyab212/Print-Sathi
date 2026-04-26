import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  // TODO: Check admin role from DB
  // For now, any authenticated user can see the skeleton

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
              <i className="bx bx-shield-quarter text-lg text-white"></i>
            </div>
            <h1 className="text-lg font-bold text-gray-900">
              Print Sathi Admin
            </h1>
          </div>
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-600">
            Super Admin
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="text-center py-20">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-50">
            <i className="bx bx-bar-chart-alt-2 text-4xl text-purple-400"></i>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Admin Panel
          </h2>
          <p className="text-sm text-gray-500">
            Shop management, analytics, and platform controls. Coming in Phase
            5.
          </p>
        </div>
      </main>
    </div>
  );
}
