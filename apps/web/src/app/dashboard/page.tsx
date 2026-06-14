export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <i className="bx bx-inbox text-5xl text-primary"></i>
        </div>
        <h3 className="mb-2 text-xl font-semibold text-foreground">
          No jobs in queue
        </h3>
        <p className="mb-8 text-sm text-muted-foreground">
          When customers submit print jobs via your QR code, they&apos;ll appear
          here. Use the tools in the sidebar to get started.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/dashboard/passport"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl"
          >
            <i className="bx bx-id-card text-lg"></i>
            Passport Photo
          </a>
          <a
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-accent"
          >
            <i className="bx bx-calculator text-lg"></i>
            Bill Calculator
          </a>
        </div>
      </div>
    </div>
  );
}
