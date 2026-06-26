"use client";

import { NavLink } from "@/components/navigation/NavLink";
import {
  GlassCard,
  ClayCard,
  Reveal,
  buttonVariants,
  ClientIcon,
} from "@/components/ui";
import { ProductGlimpse } from "@/components/marketing/ProductGlimpse";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Contact,
  Download,
  FileText,
  Heart,
  ListChecks,
  Printer,
  QrCode,
  Rocket,
} from "lucide-react";

const features = [
  {
    Icon: Contact,
    title: "Passport Photo",
    desc: "Auto background removal, face crop, and A4 sheet — ready to print in seconds.",
    gradient: "from-[#3b82f6] to-[#06b6d4]",
    span: "md:col-span-2 md:row-span-2",
    big: true,
  },
  {
    Icon: Calculator,
    title: "Bill Calculator",
    desc: "Instant billing from your rate card. One tap to reset.",
    gradient: "from-[#10b981] to-[#14b8a6]",
    span: "",
  },
  {
    Icon: FileText,
    title: "Fix & Print",
    desc: "PDF formatting, 2-up / 4-up layouts, presets for notes and resumes.",
    gradient: "from-[#f59e0b] to-[#f97316]",
    span: "",
  },
  {
    Icon: QrCode,
    title: "QR Print Queue",
    desc: "Customers upload print jobs from their phone. You approve, then print.",
    gradient: "from-[#a855f7] to-[#ec4899]",
    span: "md:col-span-2",
  },
];

const steps = [
  {
    Icon: QrCode,
    title: "Customer scans your QR",
    desc: "They open your shop page on their phone and upload files or request a passport photo.",
  },
  {
    Icon: ListChecks,
    title: "You review the queue",
    desc: "Every job lands in one control center — formatted, priced, and ready to approve.",
  },
  {
    Icon: Printer,
    title: "Approve & print",
    desc: "Send straight to your printer. Bills calculated, sheets laid out, done.",
  },
];

const trustPoints = [
  { Icon: CheckCircle2, label: "No card required", color: "text-[var(--ps-success)]" },
  { Icon: CheckCircle2, label: "Built for Indian shops", color: "text-[var(--ps-success)]" },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05070d] text-white">
      <div
        className="pointer-events-none fixed inset-0 -z-30"
        style={{
          background:
            "radial-gradient(circle at 15% 10%, rgba(79,70,229,0.32), transparent 32%), radial-gradient(circle at 85% 12%, rgba(6,182,212,0.20), transparent 30%), radial-gradient(circle at 50% 95%, rgba(34,197,94,0.16), transparent 34%), linear-gradient(180deg, #05070d 0%, #0a1020 48%, #05070d 100%)",
        }}
      />
      <div className="pointer-events-none fixed inset-0 -z-20 opacity-30 mix-blend-screen">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero_dark_network.svg')" }}
        />
      </div>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />

      <header className="sticky top-0 z-50 px-4 pt-4">
        <nav className="glass-nav mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 sm:px-6">
          <NavLink href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.png" alt="Print Sathi" className="h-full w-full object-contain" />
            </span>
            <span className="text-lg font-bold tracking-tight">Print Sathi</span>
          </NavLink>
          <NavLink
            href="/login"
            className={buttonVariants({ variant: "glass", size: "sm" })}
          >
            Shop Login
            <ClientIcon icon={ArrowRight} className="ml-1.5 h-4 w-4" />
          </NavLink>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 z-0 opacity-40 blur-3xl bg-[radial-gradient(circle_at_40%_30%,rgba(99,102,241,0.35),transparent_42%),radial-gradient(circle_at_70%_65%,rgba(20,184,166,0.22),transparent_36%)]" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-16 lg:grid-cols-2 lg:gap-10 lg:pb-32 lg:pt-24">
            <div className="relative z-10 text-center lg:text-left">
              <div className="mb-6 flex justify-center lg:justify-start">
                <span className="shimmer-border glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-white/75">
                  <ClientIcon icon={Rocket} className="h-4 w-4 text-[var(--ps-primary)]" />
                  Smart automation for print shops
                </span>
              </div>

              <h1 className="text-display mb-6 text-balance">
                Your print shop,{" "}
                <span className="text-gradient">automated</span>
              </h1>

              <p className="text-body mx-auto mb-10 max-w-xl text-white/68 lg:mx-0">
                Passport photos in seconds. Bills calculated instantly. Customers
                submit print jobs from their phone. All from one dashboard.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <NavLink
                  href="/login"
                  className={`${buttonVariants({ variant: "primary", size: "lg" })} animate-glow-pulse`}
                >
                  Get Started Free
                  <ClientIcon icon={ArrowRight} className="ml-2 h-5 w-5" />
                </NavLink>
                <a
                  href="#features"
                  className={buttonVariants({ variant: "glass", size: "lg" })}
                >
                  See Features
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/58 lg:justify-start">
                {trustPoints.map((point) => (
                  <span key={point.label} className="inline-flex items-center gap-1.5">
                    <ClientIcon icon={point.Icon} className={`h-4 w-4 ${point.color}`} />
                    {point.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative z-10 flex w-full flex-col items-center justify-center lg:items-end">
              <div className="absolute -inset-8 rounded-full bg-gradient-to-tr from-indigo-500/20 via-cyan-400/12 to-emerald-400/20 blur-3xl" />
              <div className="relative z-10 flex w-full flex-col gap-6 sm:flex-row lg:flex-col xl:flex-row items-center justify-center lg:justify-end">
                <div className="w-full max-w-sm sm:max-w-md">
                  <ProductGlimpse />
                </div>

                <div
                  className="relative hidden h-64 w-64 shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-2xl sm:block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/print_automation_mockup.svg" alt="Print Sathi AI Automation" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 backdrop-blur-[2px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      AI Layout Engine
                    </span>
                    <p className="mt-0.5 text-xs font-medium text-white/80">
                      Automates file formats, color, & sizing in seconds
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

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
            {features.map((feature, index) => {
              const Card = feature.big ? GlassCard : ClayCard;
              const Icon = feature.Icon;
              return (
                <Reveal
                  key={feature.title}
                  delay={index * 90}
                  className={`group ${feature.span}`}
                >
                  <Card
                    className={`relative h-full overflow-hidden p-6 transition-transform duration-300 ease-spring hover:-translate-y-1 sm:p-8 ${feature.big ? "md:p-10" : ""}`}
                  >
                    <div className="absolute inset-0 opacity-0 bg-gradient-to-br from-white/10 via-transparent to-transparent transition-opacity duration-300 group-hover:opacity-100" />
                    <div
                      className={`relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}
                    >
                      <ClientIcon icon={Icon} className="h-6 w-6 text-white" />
                    </div>
                    <h3 className={`relative mb-2 ${feature.big ? "text-h3" : "text-lg font-semibold"}`}>
                      {feature.title}
                    </h3>
                    <p className="relative text-sm leading-relaxed text-white/62">
                      {feature.desc}
                    </p>
                    {feature.big && (
                      <div className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--ps-primary)]">
                        Most loved feature
                        <ClientIcon icon={Heart} className="ml-1 h-4 w-4 text-rose-500 fill-rose-500/20" />
                      </div>
                    )}
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12 lg:py-20">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <span className="text-caption uppercase tracking-wider text-[var(--ps-primary)]">
              How it works
            </span>
            <h2 className="text-h1 mt-3">Live in three steps</h2>
          </Reveal>

          <div className="relative grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.Icon;
              return (
                <Reveal key={step.title} delay={index * 110}>
                  <ClayCard className="relative h-full overflow-hidden p-7">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                    <span className="text-mono absolute right-5 top-5 text-4xl font-bold text-white/10">
                      0{index + 1}
                    </span>
                    <span className="clay-accent relative z-10 mb-5 flex h-12 w-12 items-center justify-center rounded-xl shadow-lg shadow-indigo-500/20">
                      <ClientIcon icon={Icon} className="h-6 w-6 text-white" />
                    </span>
                    <h3 className="relative z-10 text-h3 mb-2">{step.title}</h3>
                    <p className="relative z-10 text-sm leading-relaxed text-white/62">
                      {step.desc}
                    </p>
                  </ClayCard>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className="px-6 py-20 lg:py-28">
          <Reveal className="mx-auto max-w-5xl">
            <div className="mesh-bg grain relative overflow-hidden rounded-clay">
              <GlassCard className="glass-strong relative flex flex-col items-center gap-6 rounded-clay px-8 py-16 text-center sm:px-12">
                <h2 className="text-h1 max-w-2xl text-balance">
                  Run your whole shop from{" "}
                  <span className="text-gradient">one screen</span>
                </h2>
                <p className="text-body max-w-xl text-white/62">
                  Join print shops across India already saving hours every day.
                  Set up in minutes — no card required.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <NavLink
                    href="/login"
                    className={`${buttonVariants({ variant: "primary", size: "lg" })} animate-glow-pulse`}
                  >
                    Get Started Free
                    <ClientIcon icon={ArrowRight} className="ml-2 h-5 w-5" />
                  </NavLink>
                  <NavLink
                    href="/download"
                    className={buttonVariants({ variant: "glass", size: "lg" })}
                  >
                    <ClientIcon icon={Download} className="mr-2 h-5 w-5" />
                    Download Desktop
                  </NavLink>
                </div>
              </GlassCard>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-white/52 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.png" alt="Print Sathi" className="h-full w-full object-contain" />
            </span>
            <span className="font-semibold text-white/70">Print Sathi</span>
          </div>
          <p>
            © 2026 Print Sathi — Made for Indian print shops
          </p>
        </div>
      </footer>
    </div>
  );
}
