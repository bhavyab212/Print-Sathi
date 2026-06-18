"use client";
import { Boxicon } from "@/components/ui";


import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AnalyticsTab({ shopId }: { shopId: string }) {
  const [stats, setStats] = useState({
    totalJobsToday: 0,
    bwPages: 0,
    colorPages: 0,
    revenueEstimate: 0, // Placeholder if no explicit price is stored
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!shopId) return;

      const startOfDay = new Date();
      startOfDay.setUTCHours(0,0,0,0);

      // Fetch all jobs for today
      const { data: jobs } = await supabase
        .from('jobs')
        .select(`
          id, status, created_at,
          job_items ( settings )
        `)
        .eq('shop_id', shopId)
        .gte('created_at', startOfDay.toISOString());

      if (jobs) {
        let bw = 0;
        let color = 0;
        
        jobs.forEach((job: any) => {
          if (job.job_items) {
            job.job_items.forEach((item: any) => {
              const copies = item.settings?.copies || 1;
              if (item.settings?.color === 'color') {
                color += copies;
              } else {
                bw += copies;
              }
            });
          }
        });

        // Rough estimate: 2 rs per bw, 10 rs per color
        const revenue = (bw * 2) + (color * 10);

        setStats({
          totalJobsToday: jobs.length,
          bwPages: bw,
          colorPages: color,
          revenueEstimate: revenue,
        });
      }
      
      setLoading(false);
    };

    fetchAnalytics();
  }, [shopId, supabase]);

  if (loading) {
    return <div className="p-8 text-center"><i className="bx bx-loader-alt animate-spin text-4xl" style={{ color: "var(--ps-primary)" }}></i></div>;
  }

  const statCards = [
    { label: "Today's Jobs", value: `${stats.totalJobsToday}`, icon: "bx-receipt", glow: "glow-primary", iconColor: "var(--ps-primary)", iconBg: "rgba(92,107,200,0.14)" },
    { label: "Est. Revenue", value: `₹${stats.revenueEstimate}`, icon: "bx-rupee", glow: "glow-success", iconColor: "var(--ps-success)", iconBg: "var(--ps-success-muted)" },
    { label: "B&W Pages", value: `${stats.bwPages}`, icon: "bx-file-blank", glow: "", iconColor: "var(--ps-ink-secondary)", iconBg: "var(--ps-surface-3)" },
    { label: "Color Pages", value: `${stats.colorPages}`, icon: "bx-palette", glow: "", iconColor: "#c084fc", iconBg: "rgba(192,132,252,0.16)" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Cards */}
        {statCards.map((c) => (
          <div
            key={c.label}
            className={`glass glass-rim rounded-2xl p-6 flex items-center gap-4 transition-all hover:-translate-y-1 ${c.glow}`}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: c.iconBg, color: c.iconColor }}
            >
              <i className={`bx ${c.icon}`}></i>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--ps-ink-muted)" }}>{c.label}</p>
              <p className="text-3xl font-bold font-mono text-gradient leading-tight">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass glass-rim rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 font-display" style={{ color: "var(--ps-ink)" }}>
            <i className="bx bx-bar-chart-alt-2" style={{ color: "var(--ps-primary)" }}></i> Settings Breakdown
        </h3>
        <div className="flex gap-4 items-end h-32 mt-8">
            <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full rounded-t-lg transition-all duration-1000 ease-out flex items-end justify-center pb-2 text-xs font-bold font-mono"
                     style={{ height: `${stats.bwPages + stats.colorPages === 0 ? 0 : (stats.bwPages / (stats.bwPages + stats.colorPages)) * 100}%`, minHeight: '20px', background: 'linear-gradient(to top, var(--ps-surface-3), var(--ps-surface-4))', color: 'var(--ps-ink)' }}>
                     {stats.bwPages}
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--ps-ink-muted)" }}>B&W</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full rounded-t-lg transition-all duration-1000 ease-out flex items-end justify-center pb-2 text-xs font-bold font-mono text-white"
                     style={{ height: `${stats.bwPages + stats.colorPages === 0 ? 0 : (stats.colorPages / (stats.bwPages + stats.colorPages)) * 100}%`, minHeight: '20px', background: 'linear-gradient(to top, rgba(192,132,252,0.5), #c084fc)' }}>
                     {stats.colorPages}
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--ps-ink-muted)" }}>Color</span>
            </div>
        </div>
      </div>
    </div>
  );
}
