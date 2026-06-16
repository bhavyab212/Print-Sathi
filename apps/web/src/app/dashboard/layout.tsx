"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

const PROCESSING_URL =
  process.env.NEXT_PUBLIC_PROCESSING_URL ?? "http://localhost:8000";

interface HealthInfo {
  status: string;
  total_tasks_processed: number;
  active_model_sessions: string[];
}

function ConnectionStatusBadge() {
  const [connectionState, setConnectionState] = useState<"connected" | "connecting" | "disconnected">("connecting");
  const [healthInfo, setHealthInfo] = useState<HealthInfo | null>(null);

  useEffect(() => {
    let active = true;
    const checkHealth = async () => {
      try {
        const res = await fetch(`${PROCESSING_URL}/health`);
        if (!res.ok) throw new Error("Offline");
        const data = await res.json();
        if (active) {
          setHealthInfo(data);
          setConnectionState("connected");
        }
      } catch {
        if (active) {
          setConnectionState("disconnected");
          setHealthInfo(null);
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative group flex items-center gap-1.5 rounded-full bg-muted/65 border border-border/50 px-2.5 py-1 text-xs backdrop-blur-sm cursor-default">
      <span className={`h-2 w-2 rounded-full ${
        connectionState === "connected" ? "bg-emerald-500 animate-pulse" :
        connectionState === "connecting" ? "bg-amber-500 animate-pulse" : "bg-rose-500 animate-pulse"
      }`} />
      <span className="font-semibold text-foreground text-[11px]">
        {connectionState === "connected" ? "AI Connected" :
         connectionState === "connecting" ? "Connecting..." : "AI Offline"}
      </span>

      {/* Details Tooltip */}
      {connectionState === "connected" && healthInfo && (
        <div className="absolute right-0 top-full mt-2 z-50 hidden group-hover:block w-52 rounded-xl border border-border bg-card p-3 shadow-xl text-left">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5">Server Health Metrics</p>
          <div className="space-y-1.5 text-xs text-foreground">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Tasks:</span>
              <span className="font-mono font-semibold">{healthInfo.total_tasks_processed}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Active Model Sessions:</span>
              <span className="font-mono text-[10px] mt-1 truncate bg-muted px-1.5 py-0.5 rounded text-primary">
                {healthInfo.active_model_sessions.join(", ") || "none"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
      className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/65 border border-border/50 text-foreground transition-all hover:bg-accent backdrop-blur-sm shadow-sm active:scale-95"
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      <i className={`bx ${theme === "dark" ? "bx-sun" : "bx-moon"} text-lg`} />
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

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <i className="bx bx-printer text-lg text-white"></i>
          </div>
          <span className="text-lg font-bold text-foreground">Print Sathi</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <i className={`bx ${item.icon} text-xl`}></i>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
          >
            <i className="bx bx-log-out text-xl"></i>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden"
            >
              <i className="bx bx-menu text-xl"></i>
            </button>
            <h2 className="text-lg font-semibold text-foreground">
              {navItems.find((item) => item.href === pathname)?.label || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ConnectionStatusBadge />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
      </div>
    </div>
  );
}
