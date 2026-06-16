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
              <i className="bx bx-shield-quarter text-lg"></i>
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
