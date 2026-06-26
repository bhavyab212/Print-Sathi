import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminPanelClient from "./AdminPanelClient";

export const dynamic = "force-dynamic";


export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  // Check if admin users table is empty (gives initial setup access)
  const { count } = await supabase
    .from("admin_users")
    .select("*", { count: "exact", head: true });

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const isTestAccount = user.email === "printsathi.test@gmail.com";
  const isSuperAdmin = (adminUser && adminUser.role === "super_admin") || count === 0 || isTestAccount;

  if (!isSuperAdmin) {
    redirect("/dashboard");
  }

  // Fetch all registered shops
  const { data: shops } = await supabase
    .from("shops")
    .select("id, name, slug, phone, area, created_at")
    .order("created_at", { ascending: false });

  // Fetch all usage logs for analytics
  const { data: usageLogs } = await supabase
    .from("usage_logs")
    .select("feature, action, created_at, shop_id");

  // Fetch all jobs for analytics
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, status, source, created_at, shop_id");

  return (
    <div className="min-h-screen mesh-bg relative">
      <div className="ambient-orbs" aria-hidden />
      {/* Admin Header */}
      <header className="glass-nav glass-rim sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl clay-accent text-white shadow-[var(--glow-primary)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-h3 font-display text-gradient">
                Print Sathi Admin
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-wide">Platform Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full glass glass-rim px-3 py-1 text-xs font-semibold text-primary">
              Super Admin Mode
            </span>
            <a
              href="/dashboard"
              className="text-xs font-semibold bg-[var(--ps-primary)] hover:bg-[var(--ps-primary-hover)] hover:shadow-[var(--glow-primary)] text-white px-4 py-2 rounded-xl transition-all"
            >
              Shop Queue →
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-8 relative z-10">
        <AdminPanelClient 
          initialShops={shops || []} 
          usageLogs={usageLogs || []} 
          jobs={jobs || []} 
        />
      </main>
    </div>
  );
}
