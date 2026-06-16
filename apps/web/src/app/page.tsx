"use client";

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
import { ProductGlimpse } from "@/components/marketing/ProductGlimpse";

const features = [
  {
    icon: "bx-id-card",
    title: "Passport Photo",
    desc: "Auto background removal, face crop, and A4 sheet — ready to print in seconds.",
    gradient: "from-[#3b82f6] to-[#06b6d4]",
    span: "md:col-span-2 md:row-span-2",
    big: true,
  },
  {
    icon: "bx-calculator",
    title: "Bill Calculator",
    desc: "Instant billing from your rate card. One tap to reset.",
    gradient: "from-[#10b981] to-[#14b8a6]",
    span: "",
  },
  {
    icon: "bx-file",
    title: "Fix & Print",
    desc: "PDF formatting, 2-up / 4-up layouts, presets for notes and resumes.",
    gradient: "from-[#f59e0b] to-[#f97316]",
    span: "",
  },
  {
    icon: "bx-qr",
    title: "QR Print Queue",
    desc: "Customers upload print jobs from their phone. You approve, then print.",
    gradient: "from-[#a855f7] to-[#ec4899]",
    span: "md:col-span-2",
  },
];

const steps = [
  {
    icon: "bx-qr-scan",
    title: "Customer scans your QR",
    desc: "They open your shop page on their phone and upload files or request a passport photo.",
  },
  {
    icon: "bx-list-check",
    title: "You review the queue",
    desc: "Every job lands in one control center — formatted, priced, and ready to approve.",
  },
  {
    icon: "bx-printer",
    title: "Approve & print",
    desc: "Send straight to your printer. Bills calculated, sheets laid out, done.",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--ps-canvas)] text-[var(--ps-ink)]">
      {/* Floating glass nav */}
      <header className="sticky top-0 z-50 px-4 pt-4">
        <nav className="glass-nav mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="clay-accent flex h-10 w-10 items-center justify-center rounded-xl">
              <i className="bx bx-printer text-xl text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight">Print Sathi</span>
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ variant: "glass", size: "sm" })}
          >
            Shop Login
            <i className="bx bx-right-arrow-alt text-base" />
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <AmbientBackground />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-16 lg:grid-cols-2 lg:gap-8 lg:pb-32 lg:pt-24">
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="text-center lg:text-left"
            >
              <motion.div variants={fadeUp} className="mb-6 flex justify-center lg:justify-start">
                <span className="shimmer-border glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-[var(--ps-ink-muted)]">
                  <i className="bx bx-rocket text-[var(--ps-primary)]" />
                  Smart automation for print shops
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-display mb-6 text-balance"
              >
                Your print shop,{" "}
                <span className="text-gradient">automated</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-body mx-auto mb-10 max-w-xl text-[var(--ps-ink-muted)] lg:mx-0"
              >
                Passport photos in seconds. Bills calculated instantly. Customers
                submit print jobs from their phone. All from one dashboard.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex flex-wrap items-center justify-center gap-4 lg:justify-start"
              >
                <Link
                  href="/login"
                  className={`${buttonVariants({ variant: "primary", size: "lg" })} animate-glow-pulse`}
                >
                  Get Started Free
                  <i className="bx bx-right-arrow-alt text-lg" />
                </Link>
                <a
                  href="#features"
                  className={buttonVariants({ variant: "glass", size: "lg" })}
                >
                  See Features
                </a>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[var(--ps-ink-subtle)] lg:justify-start"
              >
                <span className="inline-flex items-center gap-1.5">
                  <i className="bx bx-check-circle text-[var(--ps-success)]" />
                  No card required
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="bx bx-check-circle text-[var(--ps-success)]" />
                  Built for Indian shops
                </span>
              </motion.div>
            </motion.div>

            {/* Floating product glimpse */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="flex justify-center lg:justify-end"
            >
              <ProductGlimpse />
            </motion.div>
          </div>
        </section>

        {/* Features — bento grid */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <span className="text-caption uppercase tracking-wider text-[var(--ps-primary)]">
              Everything in one place
            </span>
            <h2 className="text-h1 mt-3">
              The print shop OS, <span className="text-gradient">reimagined</span>
            </h2>
          </Reveal>

          <div className="grid auto-rows-[minmax(0,1fr)] gap-5 md:grid-cols-4">
            {features.map((f, i) => {
              const Card = f.big ? GlassCard : ClayCard;
              return (
                <Reveal
                  key={f.title}
                  delay={i * 90}
                  className={`group ${f.span}`}
                >
                  <Card
                    className={`h-full ${f.big ? "p-8" : "p-6"} transition-transform duration-300 ease-spring hover:-translate-y-1`}
                  >
                    <div
                      className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}
                    >
                      <i className={`bx ${f.icon} text-2xl text-white`} />
                    </div>
                    <h3 className={`${f.big ? "text-h3" : "text-lg font-semibold"} mb-2`}>
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--ps-ink-muted)]">
                      {f.desc}
                    </p>
                    {f.big && (
                      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--ps-primary)]">
                        Most loved feature
                        <i className="bx bx-heart" />
                      </div>
                    )}
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-6 py-12 lg:py-20">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <span className="text-caption uppercase tracking-wider text-[var(--ps-primary)]">
              How it works
            </span>
            <h2 className="text-h1 mt-3">Live in three steps</h2>
          </Reveal>

          <div className="relative grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 110}>
                <ClayCard className="relative h-full p-7">
                  <span className="text-mono absolute right-5 top-5 text-4xl font-bold text-[var(--ps-ink-subtle)] opacity-40">
                    0{i + 1}
                  </span>
                  <span className="clay-accent mb-5 flex h-12 w-12 items-center justify-center rounded-xl">
                    <i className={`bx ${s.icon} text-2xl text-white`} />
                  </span>
                  <h3 className="text-h3 mb-2">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--ps-ink-muted)]">
                    {s.desc}
                  </p>
                </ClayCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Final CTA band */}
        <section className="px-6 py-20 lg:py-28">
          <Reveal className="mx-auto max-w-5xl">
            <div className="mesh-bg grain relative overflow-hidden rounded-clay">
              <GlassCard className="glass-strong relative flex flex-col items-center gap-6 rounded-clay px-8 py-16 text-center sm:px-12">
                <h2 className="text-h1 max-w-2xl text-balance">
                  Run your whole shop from{" "}
                  <span className="text-gradient">one screen</span>
                </h2>
                <p className="text-body max-w-xl text-[var(--ps-ink-muted)]">
                  Join print shops across India already saving hours every day.
                  Set up in minutes — no card required.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/login"
                    className={`${buttonVariants({ variant: "primary", size: "lg" })} animate-glow-pulse`}
                  >
                    Get Started Free
                    <i className="bx bx-right-arrow-alt text-lg" />
                  </Link>
                  <Link
                    href="/download"
                    className={buttonVariants({ variant: "glass", size: "lg" })}
                  >
                    <i className="bx bxl-windows text-lg" />
                    Download Desktop
                  </Link>
                </div>
              </GlassCard>
            </div>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--ps-hairline)] px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-[var(--ps-ink-subtle)] sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="clay-accent flex h-8 w-8 items-center justify-center rounded-lg">
              <i className="bx bx-printer text-white" />
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
