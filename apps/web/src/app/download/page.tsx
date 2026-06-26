"use client";
import { Boxicon } from "@/components/ui";

import { NavLink } from "@/components/navigation/NavLink";
import { motion } from "motion/react";
import {
  AmbientBackground,
  GlassCard,
  ClayCard,
  Reveal,
  buttonVariants,
} from "@/components/ui";
import { fadeUp, stagger } from "@/lib/motion";

const comingFeatures = [
  {
    icon: "bx-mobile-alt",
    title: "Mobile App",
    desc: "Manage your queue, approve jobs, and get notified — right from your phone.",
    gradient: "from-[#3b82f6] to-[#06b6d4]",
  },
  {
    icon: "bx-desktop",
    title: "Desktop App",
    desc: "Windows app with direct printer integration — no browser, no dialogs.",
    gradient: "from-[#a855f7] to-[#ec4899]",
  },
  {
    icon: "bx-bell",
    title: "Push Notifications",
    desc: "Instant alerts when a customer submits a job to your print queue.",
    gradient: "from-[#10b981] to-[#14b8a6]",
  },
];

export default function DownloadPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--ps-canvas)] text-[var(--ps-ink)]">
      {/* Floating glass nav */}
      <header className="sticky top-0 z-50 px-4 pt-4">
        <nav className="glass-nav mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-4 py-3 sm:px-6">
          <NavLink href="/" className="flex items-center gap-3">
            <span className="clay-accent flex h-9 w-9 items-center justify-center rounded-xl">
              <Boxicon className="bx bx-printer text-lg text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight">Print Sathi</span>
          </NavLink>
          <NavLink
            href="/login"
            className={buttonVariants({ variant: "glass", size: "sm" })}
          >
            Open Web App
            <Boxicon className="bx bx-right-arrow-alt text-lg" />
          </NavLink>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <AmbientBackground />
          <div className="mx-auto max-w-3xl px-6 pb-20 pt-16 text-center lg:pt-24">
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.div variants={fadeUp} className="mb-8 flex justify-center">
                <span className="clay-accent flex h-20 w-20 items-center justify-center rounded-3xl shadow-glow-primary">
                  <Boxicon className="bx bx-rocket text-4xl text-white" />
                </span>
              </motion.div>

              <motion.div variants={fadeUp} className="mb-6 flex justify-center">
                <span className="shimmer-border glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-[var(--ps-ink-muted)]">
                  <Boxicon className="bx bx-time text-[var(--ps-primary)]" />
                  Apps coming soon
                </span>
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-h1 mb-6 text-balance">
                The Print Sathi app is{" "}
                <span className="text-gradient">on the way</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-body mx-auto mb-10 max-w-xl text-[var(--ps-ink-muted)]"
              >
                We&apos;re going web-first so you can use Print Sathi on any device right now.
                Native apps for mobile and desktop are planned for a future release.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <NavLink
                  href="/login"
                  className={`${buttonVariants({ variant: "primary", size: "lg" })} animate-glow-pulse`}
                >
                  <Boxicon className="bx bx-globe text-xl" />
                  Use the Web App Now
                </NavLink>
              </motion.div>
              <motion.p
                variants={fadeUp}
                className="mt-4 text-sm text-[var(--ps-ink-subtle)]"
              >
                Works on any browser — phone, tablet, or laptop.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* What's coming */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <Reveal>
            <GlassCard className="glass-strong rounded-clay p-8 sm:p-12">
              <p className="text-caption mb-8 text-center uppercase tracking-wider text-[var(--ps-primary)]">
                Planned for future releases
              </p>
              <div className="grid gap-8 md:grid-cols-3">
                {comingFeatures.map((h, i) => (
                  <Reveal key={h.title} delay={i * 90} className="group">
                    <div
                      className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${h.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110 opacity-80`}
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

          {/* CTA back to web app */}
          <Reveal delay={120} className="mt-10">
            <ClayCard className="flex flex-col items-center justify-between gap-4 p-7 text-center sm:flex-row sm:text-left">
              <div>
                <h3 className="text-h3 mb-1">Ready to get started?</h3>
                <p className="text-sm text-[var(--ps-ink-muted)]">
                  The web app is fully featured and works on every device right now.
                </p>
              </div>
              <NavLink
                href="/login"
                className={buttonVariants({ variant: "glass", size: "lg" })}
              >
                Open Web App
                <Boxicon className="bx bx-right-arrow-alt text-lg" />
              </NavLink>
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
          <p>© 2026 Print Sathi — Made for Indian print shops</p>
        </div>
      </footer>
    </div>
  );
}
