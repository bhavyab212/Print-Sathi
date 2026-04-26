import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg shadow-blue-500/25">
            <i className="bx bx-printer text-xl text-white"></i>
          </div>
          <span className="text-xl font-bold">Print Sathi</span>
        </div>
        <Link
          href="/login"
          className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition-all hover:bg-white/20"
        >
          Shop Login
        </Link>
      </nav>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6 pt-20 pb-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300 backdrop-blur-sm">
            <i className="bx bx-rocket"></i>
            Smart automation for print shops
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Your print shop,{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              automated
            </span>
          </h1>
          <p className="mb-10 text-lg text-gray-300 md:text-xl">
            Passport photos in seconds. Bills calculated instantly. Customers
            submit print jobs from their phone. All from one dashboard.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3.5 text-sm font-semibold shadow-2xl shadow-blue-500/30 transition-all hover:shadow-3xl hover:shadow-blue-500/40"
            >
              Get Started Free
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-white/20 px-8 py-3.5 text-sm font-semibold backdrop-blur-sm transition-all hover:bg-white/10"
            >
              See Features
            </a>
          </div>
        </div>

        {/* Feature cards */}
        <div
          id="features"
          className="mt-32 grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {[
            {
              icon: "bx-id-card",
              title: "Passport Photo",
              desc: "Auto background removal, face crop, and A4 sheet — ready to print.",
              color: "from-blue-500 to-cyan-500",
            },
            {
              icon: "bx-calculator",
              title: "Bill Calculator",
              desc: "Instant billing from your rate card. One tap to reset.",
              color: "from-emerald-500 to-teal-500",
            },
            {
              icon: "bx-file",
              title: "Fix & Print",
              desc: "PDF formatting, 2-up/4-up layouts, presets for notes and resumes.",
              color: "from-amber-500 to-orange-500",
            },
            {
              icon: "bx-qr",
              title: "QR Print Queue",
              desc: "Customers upload from their phone. You approve and print.",
              color: "from-purple-500 to-pink-500",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}
              >
                <i className={`bx ${feature.icon} text-2xl text-white`}></i>
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-500">
        Print Sathi © {new Date().getFullYear()} — Made for Indian print shops
      </footer>
    </div>
  );
}
