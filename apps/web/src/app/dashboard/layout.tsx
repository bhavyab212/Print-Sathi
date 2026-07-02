"use client";
import { Boxicon } from "@/components/ui";
import { ConnectionStatusBadge } from "@/components/navigation/ConnectionStatusBadge";


import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { AmbientBackground } from "@/components/ui";
import { useNavigationLoading } from "@/components/navigation/NavigationProvider";


// ConnectionStatusBadge moved to @/components/navigation/ConnectionStatusBadge

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="neu flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:-translate-y-0.5 active:scale-95 active:[box-shadow:inset_2px_2px_6px_var(--neu-dark),inset_-2px_-2px_6px_var(--neu-light)]"
      style={{ color: "var(--ps-ink)" }}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      <Boxicon className={`bx ${theme === "dark" ? "bx-sun" : "bx-moon"} text-lg`} />
    </button>
  );
}

const navItems = [
  { label: "Queue", href: "/dashboard", icon: "bx-list-ul" },
  { label: "Passport Photo", href: "/dashboard/passport", icon: "bx-id-card" },
  { label: "Bg Remover", href: "/dashboard/bg-remove", icon: "bx-eraser" },
  { label: "Bill Calculator", href: "/dashboard/billing", icon: "bx-calculator" },
  { label: "Fix & Print", href: "/dashboard/fix-print", icon: "bx-file" },
  { label: "Settings", href: "/dashboard/settings", icon: "bx-cog" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { startNavigation } = useNavigationLoading();

  async function handleLogout() {
    startNavigation();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }


  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--ps-canvas)" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`sidebar-brand-stripe sidebar-depth fixed inset-y-0 left-0 z-40 flex w-64 flex-col glass-nav bg-toolpanel-gradient transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ borderRight: "1px solid var(--ps-hairline)" }}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 px-5" style={{ borderBottom: "1px solid var(--ps-hairline)" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0 overflow-hidden">
            <img /* eslint-disable-next-line @next/next/no-img-element */ src="/images/logo.png" alt="Print Sathi" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <span className="block text-lg font-bold text-gradient font-display leading-tight">Print Sathi</span>
            <span className="block text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: "var(--ps-ink-subtle)" }}>Control Center</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1.5 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (!isActive) {
                    startNavigation();
                  }
                  setSidebarOpen(false);
                }}
                className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive ? "nav-chip-active" : "nav-chip hover:-translate-y-px"
                }`}
                style={
                  isActive
                    ? undefined
                    : { color: "var(--ps-ink-muted)" }
                }
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full"
                    style={{ background: "var(--ps-primary)" }}
                  />
                )}
                <i
                  className={`bx ${item.icon} text-xl transition-colors ${isActive ? "" : "group-hover:scale-110"}`}
                  style={{ color: isActive ? "var(--ps-primary)" : "var(--ps-ink-muted)" }}
                ></i>
                <span className={isActive ? "text-gradient font-semibold" : "group-hover:text-[var(--ps-ink)]"}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3" style={{ borderTop: "1px solid var(--ps-hairline)" }}>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:-translate-y-px"
            style={{ color: "var(--ps-ink-muted)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ps-danger)"; e.currentTarget.style.background = "var(--ps-danger-muted)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ps-ink-muted)"; e.currentTarget.style.background = "transparent"; }}
          >
            <Boxicon className="bx bx-log-out text-xl" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="header-depth relative z-20 flex h-16 items-center justify-between glass-nav bg-header-gradient px-6" style={{ borderBottom: "1px solid var(--ps-hairline)" }}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="neu rounded-lg p-2 lg:hidden active:scale-95"
              style={{ color: "var(--ps-ink-muted)" }}
            >
              <Boxicon className="bx bx-menu text-xl" />
            </button>
            <h2 className="text-lg font-semibold font-display" style={{ color: "var(--ps-ink)", letterSpacing: "-0.02em" }}>
              {navItems.find((item) => item.href === pathname)?.label || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ConnectionStatusBadge />
          </div>
        </header>

        {/* Page content */}
        <main className="main-depth relative flex-1 overflow-y-auto p-6">
          <AmbientBackground orbs grain={false} />
          {children}
        </main>
      </div>
    </div>
  );
}
