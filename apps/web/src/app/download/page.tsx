"use client";
import { Boxicon } from "@/components/ui";


import Link from "next/link";
import { motion } from "motion/react";
import {
  AmbientBackground,
  GlassCard,
  ClayCard,
  Reveal,
  buttonVariants,
} from "@/components/ui";
import { fadeUp, stagger } from "@/lib/motion";

const highlights = [
  {
    icon: "bx-bolt-circle",
    title: "Real-time Queue",
    desc: "Get instant desktop notifications when customers submit print jobs.",
    gradient: "from-[#3b82f6] to-[#06b6d4]",
  },
  {
    icon: "bx-id-card",
    title: "1-Click Passports",
    desc: "Auto-remove backgrounds and print perfect A4 sheets directly from the app.",
    gradient: "from-[#10b981] to-[#14b8a6]",
  },
  {
    icon: "bx-printer",
    title: "Direct Printing",
    desc: "Bypass browser print dialogs. Send jobs straight to your configured printers.",
    gradient: "from-[#a855f7] to-[#ec4899]",
  },
];

export default function DownloadPage() {
  const downloadUrl = process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL || "#";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--ps-canvas)] text-[var(--ps-ink)]">
      {/* Floating glass nav */}
      <header className="sticky top-0 z-50 px-4 pt-4">
        <nav className="glass-nav mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="clay-accent flex h-9 w-9 items-center justify-center rounded-xl">
              <Boxicon className="bx bx-printer text-lg text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight">Print Sathi</span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--ps-ink-muted)] transition-colors hover:text-[var(--ps-ink)]"
          >
            Web Login (Backup)
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <AmbientBackground />
          <div className="mx-auto max-w-3xl px-6 pb-20 pt-16 text-center lg:pt-24">
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.div
                variants={fadeUp}
                className="mb-8 flex justify-center"
              >
                <span className="clay-accent flex h-20 w-20 items-center justify-center rounded-3xl shadow-glow-primary">
                  <Boxicon className="bx bxl-windows text-4xl text-white" />
                </span>
              </motion.div>

              <motion.div variants={fadeUp} className="mb-6 flex justify-center">
                <span className="shimmer-border glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-[var(--ps-ink-muted)]">
                  <Boxicon className="bx bx-desktop text-[var(--ps-primary)]" />
                  Desktop app for Windows
                </span>
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-h1 mb-6 text-balance">
                Download Print Sathi for{" "}
                <span className="text-gradient">Windows</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-body mx-auto mb-10 max-w-xl text-[var(--ps-ink-muted)]"
              >
                The ultimate desktop OS for your print shop. Manage queues,
                auto-print passports, and calculate bills seamlessly.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <a
                  href={downloadUrl}
                  className={`${buttonVariants({ variant: "primary", size: "lg" })} animate-glow-pulse`}
                >
                  <Boxicon className="bx bx-download text-xl" />
                  Download for Windows (x64)
                </a>
              </motion.div>
              <motion.p
                variants={fadeUp}
                className="mt-4 text-sm text-[var(--ps-ink-subtle)]"
              >
                Requires Windows 10 or 11.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Feature highlights */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <Reveal>
            <GlassCard className="glass-strong rounded-clay p-8 sm:p-12">
              <div className="grid gap-8 md:grid-cols-3">
                {highlights.map((h, i) => (
                  <Reveal key={h.title} delay={i * 90} className="group">
                    <div
                      className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${h.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}
                    >
                      <i className={`bx ${h.icon} text-2xl text-white`} />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{h.title}</h3>
                    <p className="text-sm leading-relaxed text-[var(--ps-ink-muted)]">
                      {h.desc}
                    </p>
                  </Reveal>
                ))}
              </div>
            </GlassCard>
          </Reveal>

          {/* Secondary CTA */}
          <Reveal delay={120} className="mt-10">
            <ClayCard className="flex flex-col items-center justify-between gap-4 p-7 text-center sm:flex-row sm:text-left">
              <div>
                <h3 className="text-h3 mb-1">Prefer the web app?</h3>
                <p className="text-sm text-[var(--ps-ink-muted)]">
                  Run Print Sathi in your browser — no install needed.
                </p>
              </div>
              <Link
                href="/login"
                className={buttonVariants({ variant: "glass", size: "lg" })}
              >
                Open Web App
                <Boxicon className="bx bx-right-arrow-alt text-lg" />
              </Link>
            </ClayCard>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--ps-hairline)] px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-[var(--ps-ink-subtle)] sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="clay-accent flex h-8 w-8 items-center justify-center rounded-lg">
              <Boxicon className="bx bx-printer text-white" />
            </span>
            <span className="font-semibold text-[var(--ps-ink-muted)]">Print Sathi</span>
          </div>
          <p>
            © {new Date().getFullYear()} Print Sathi — Made for Indian print shops
          </p>
        </div>
      </footer>
    </div>
  );
}
