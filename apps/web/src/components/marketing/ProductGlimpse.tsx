"use client";

import { GlassCard, Badge, ClientIcon } from "@/components/ui";
import { TrendingUp } from "lucide-react";

type QueueRow = {
  id: string;
  name: string;
  detail: string;
  tone: "pending" | "printing" | "done";
  label: string;
};

const rows: QueueRow[] = [
  { id: "#A-204", name: "Passport · 6 copies", detail: "A4 sheet · matte", tone: "printing", label: "Printing" },
  { id: "#A-203", name: "Resume.pdf · 2-up", detail: "12 pages · duplex", tone: "pending", label: "Pending" },
  { id: "#A-202", name: "ID Card scan", detail: "Color · glossy", tone: "done", label: "Done" },
];

/**
 * Floating faux dashboard glimpse for the hero — a live-feeling queue + spec panel.
 * Purely presentational; no routing or data.
 */
export function ProductGlimpse() {
  return (
    <div className="animate-float [transform-style:preserve-3d]">
      <GlassCard className="glass-strong w-full max-w-md p-1.5 shadow-elev-5">
        {/* Window chrome */}
        <div className="flex items-center justify-between rounded-t-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--ps-danger)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--ps-warning)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--ps-success)]" />
          </div>
          <span className="text-mono text-[11px] text-[var(--ps-ink-subtle)]">
            print-queue · live
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--ps-success)]">
            <span className="h-1.5 w-1.5 animate-glow-pulse rounded-full bg-[var(--ps-success)]" />
            online
          </span>
        </div>

        {/* Queue list */}
        <div className="space-y-2 px-3 pb-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="neu-inset flex items-center justify-between gap-3 rounded-xl px-3.5 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-mono text-[11px] text-[var(--ps-ink-subtle)]">
                    {r.id}
                  </span>
                  <span className="truncate text-sm font-semibold text-[var(--ps-ink)]">
                    {r.name}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-[var(--ps-ink-muted)]">
                  {r.detail}
                </p>
              </div>
              <Badge tone={r.tone}>{r.label}</Badge>
            </div>
          ))}

          {/* Spec panel */}
          <div className="clay mt-3 rounded-2xl p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-caption uppercase tracking-wide text-[var(--ps-ink-subtle)]">
                Today
              </span>
              <ClientIcon icon={TrendingUp} className="w-4 h-4 text-[var(--ps-success)]" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { k: "Jobs", v: "128" },
                { k: "Sheets", v: "642" },
                { k: "₹ Billed", v: "8.4k" },
              ].map((s) => (
                <div key={s.k}>
                  <div className="text-mono text-lg font-bold text-[var(--ps-ink)]">
                    {s.v}
                  </div>
                  <div className="text-[11px] text-[var(--ps-ink-muted)]">{s.k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
