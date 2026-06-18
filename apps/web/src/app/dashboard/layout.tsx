"use client";
import { Boxicon } from "@/components/ui";


import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { AmbientBackground } from "@/components/ui";
import dynamic from "next/dynamic";
import loadingAnimation from "../../../public/animations/loading.json";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });


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

  const dotColor =
    connectionState === "connected" ? "var(--ps-success)" :
    connectionState === "connecting" ? "var(--ps-warning)" : "var(--ps-danger)";
  const label =
    connectionState === "connected" ? "AI Connected" :
    connectionState === "connecting" ? "Connecting..." : "AI Offline";

  return (
    <div className="relative group glass glass-rim flex items-center gap-2 rounded-full px-3 py-1.5 text-xs cursor-default transition-all hover:-translate-y-0.5">
      {/* Live pulse */}
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
          style={{ background: dotColor }}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: dotColor }} />
      </span>
      <span className="font-semibold text-[11px] font-mono tracking-tight" style={{ color: "var(--ps-ink)" }}>
        {label}
      </span>

      {/* Details Tooltip */}
      {connectionState === "connected" && healthInfo && (
        <div className="absolute right-0 top-full mt-2 z-50 hidden group-hover:block w-56 glass-strong glass-rim rounded-2xl p-3.5 shadow-glass text-left">
          <p className="text-[10px] uppercase font-bold mb-2 tracking-wider" style={{ color: "var(--ps-ink-muted)" }}>Server Health Metrics</p>
          <div className="space-y-2 text-xs" style={{ color: "var(--ps-ink)" }}>
            <div className="flex justify-between">
              <span style={{ color: "var(--ps-ink-muted)" }}>Total Tasks:</span>
              <span className="font-mono font-semibold text-gradient">{healthInfo.total_tasks_processed}</span>
            </div>
            <div className="flex flex-col">
              <span style={{ color: "var(--ps-ink-muted)" }}>Active Model Sessions:</span>
              <span className="font-mono text-[10px] mt-1 truncate rounded-lg px-2 py-1" style={{ background: "var(--ps-surface-2)", color: "var(--ps-primary)" }}>
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
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  async function handleLogout() {
    setIsNavigating(true);
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
            <img src="/images/logo.png" alt="Print Sathi" className="w-full h-full object-contain" />
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
                    setIsNavigating(true);
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

      {/* Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md transition-all duration-300">
          <div className="w-28 h-28">
            <Lottie animationData={loadingAnimation} loop={true} />
          </div>
        </div>
      )}
    </div>
  );
}
