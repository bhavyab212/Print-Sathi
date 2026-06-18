"use client";
import { Boxicon } from "@/components/ui";


import { useState, useEffect, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@/lib/supabase/client";
import { usePresence, PresencePayload } from "@/hooks/usePresence";
import { Button, Badge } from "@/components/ui";
import toast from 'react-hot-toast';

interface Shop {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  area: string | null;
  created_at: string | null;
}

interface UsageLog {
  feature: string;
  action: string;
  created_at: string;
  shop_id: string;
}

interface Job {
  id: string;
  status: string;
  source: string;
  created_at: string;
  shop_id: string;
}

interface AdminPanelClientProps {
  initialShops: Shop[];
  usageLogs: UsageLog[];
  jobs: Job[];
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const suffix = Math.floor(10 + Math.random() * 90); // Generates 10-99
  return `${base}-${suffix}`;
}

export default function AdminPanelClient({ initialShops, usageLogs, jobs }: AdminPanelClientProps) {
  const [activeTab, setActiveTab] = useState<'shops' | 'analytics'>('analytics');
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [usageLogsData, setUsageLogsData] = useState<UsageLog[]>(usageLogs);
  const [jobsData, setJobsData] = useState<Job[]>(jobs);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [customSlug, setCustomSlug] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const presencePayload = useMemo<PresencePayload>(() => ({ id: Math.random().toString(), role: 'admin' }), []);
  const { onlineUsers } = usePresence('printo_global', presencePayload);
  const activeShopkeepersCount = new Set(onlineUsers.filter(u => u.role === 'shopkeeper').map(u => u.shopId)).size;
  const activeCustomersCount = onlineUsers.filter(u => u.role === 'customer').length;

  const supabase = createClient();

  const fetchAdminData = async () => {
    setIsRefreshing(true);
    const { data: s } = await supabase.from('shops').select('id, name, slug, phone, area, created_at').order('created_at', { ascending: false });
    const { data: ul } = await supabase.from('usage_logs').select('feature, action, created_at, shop_id');
    const { data: j } = await supabase.from('jobs').select('id, status, source, created_at, shop_id');
    if (s) setShops(s);
    if (ul) setUsageLogsData(ul);
    if (j) setJobsData(j);
    setIsRefreshing(false);
  };

  useEffect(() => {
    const interval = setInterval(fetchAdminData, 30000);
    return () => clearInterval(interval);
  }, [supabase]);

  useEffect(() => {
    if (!customSlug && shopName) {
      setSlug(generateSlug(shopName));
    }
  }, [shopName, customSlug]);

  const handleCopyLink = (shopSlug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/s/${shopSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(shopSlug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    

    try {
      const tempSupabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      );

      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to register shopkeeper auth account.");

      const newUserId = authData.user.id;

      const { data: rpcData, error: rpcError } = await supabase.rpc("admin_create_shop", {
        owner_uuid: newUserId,
        shop_name: shopName,
        shop_slug: slug,
        shop_phone: phone,
        shop_area: area,
      });

      if (rpcError) throw rpcError;
      
      const result = rpcData as any;
      if (result && !result.success) {
        throw new Error(result.error || "Failed to create shop in DB.");
      }

      toast.success(`Shop "${shopName}" and shopkeeper "${email}" successfully created!`);
      
      setEmail("");
      setPassword("");
      setShopName("");
      setSlug("");
      setPhone("");
      setArea("");
      setCustomSlug(false);

      const { data: updatedShops } = await supabase
        .from("shops")
        .select("id, name, slug, phone, area, created_at")
        .order("created_at", { ascending: false });

      if (updatedShops) {
        setShops(updatedShops);
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during shop creation.");
    } finally {
      setLoading(false);
    }
  };

  // --- Analytics Computations ---
  const analyticsData = useMemo(() => {
    const totalShops = shops.length;
    const totalJobs = jobsData.length;
    
    const jobsByStatus = jobsData.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Merge QR Queue jobs into feature usage artificially since jobs represent QR queue
    const featureUsage = usageLogsData.reduce((acc, log) => {
      acc[log.feature] = (acc[log.feature] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // QR Queue is represented by jobs source
    const qrQueueCount = jobsData.filter(j => j.source === 'qr').length;
    featureUsage['qr_queue'] = (featureUsage['qr_queue'] || 0) + qrQueueCount;

    const shopsByArea = shops.reduce((acc, shop) => {
      const a = shop.area || 'Unknown';
      acc[a] = (acc[a] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { totalShops, totalJobs, jobsByStatus, featureUsage, shopsByArea };
  }, [shops, usageLogsData, jobsData]);

  return (
    <div>
      {/* Tabs and Actions */}
      <div className="flex items-center mb-8 gap-3 justify-between flex-wrap">
        <div className="glass glass-rim flex p-1.5 rounded-2xl gap-1">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'analytics' ? 'bg-[var(--ps-primary)] text-white shadow-[var(--glow-primary)]' : 'text-muted-foreground hover:text-foreground hover:bg-[var(--ps-surface-2)]'}`}
        >
          <Boxicon className="bx bx-bar-chart-alt-2 mr-2" />
          Deep Analytics
        </button>
        <button
          onClick={() => setActiveTab('shops')}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'shops' ? 'bg-[var(--ps-primary)] text-white shadow-[var(--glow-primary)]' : 'text-muted-foreground hover:text-foreground hover:bg-[var(--ps-surface-2)]'}`}
        >
          <Boxicon className="bx bx-store mr-2" />
          Shop Management
        </button>
        </div>
        <Button variant="glass" size="sm" onClick={fetchAdminData} disabled={isRefreshing}>
          <Boxicon className={`bx bx-refresh text-lg ${isRefreshing ? "animate-spin" : ""}`} /> Refresh Data
        </Button>
      </div>

      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass glass-rim rounded-3xl p-6 shadow-glass flex items-center gap-4 transition-all hover:shadow-[var(--elev-3)] hover:-translate-y-0.5">
              <div className="w-14 h-14 neu text-primary rounded-2xl flex items-center justify-center">
                <Boxicon className="bx bx-store-alt text-3xl" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Total Active Shops</p>
                <h3 className="text-display font-display text-gradient leading-none">{analyticsData.totalShops}</h3>
              </div>
            </div>

            <div className="glass glass-rim rounded-3xl p-6 shadow-glass flex items-center gap-4 transition-all hover:shadow-[var(--elev-3)] hover:-translate-y-0.5">
              <div className="w-14 h-14 neu text-primary rounded-2xl flex items-center justify-center">
                <Boxicon className="bx bx-user-voice text-3xl" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Live Traffic</p>
                <div className="flex gap-3 items-baseline">
                  <h3 className="text-display font-display text-gradient leading-none">{onlineUsers.length}</h3>
                  <span className="text-xs text-[var(--ps-success)] font-semibold animate-pulse">Online Now</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{activeShopkeepersCount} shops · {activeCustomersCount} customers</p>
              </div>
            </div>

            <div className="glass glass-rim rounded-3xl p-6 shadow-glass flex items-center gap-4 transition-all hover:shadow-[var(--elev-3)] hover:-translate-y-0.5">
              <div className="w-14 h-14 neu text-[var(--ps-success)] rounded-2xl flex items-center justify-center">
                <Boxicon className="bx bx-check-double text-3xl" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Jobs Completed</p>
                <h3 className="text-display font-display text-gradient leading-none">{analyticsData.jobsByStatus['done'] || 0}</h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service Usage Breakdown */}
            <div className="glass glass-rim rounded-3xl p-6 shadow-glass">
               <h3 className="text-h3 font-display text-foreground mb-4 flex items-center gap-2">
                 <Boxicon className="bx bx-pie-chart-alt-2 text-primary" /> Service Usage Tracking
               </h3>
               <div className="space-y-4">
                 {Object.entries(analyticsData.featureUsage).sort((a,b) => b[1] - a[1]).map(([feature, count]) => (
                   <div key={feature}>
                     <div className="flex justify-between text-sm mb-1">
                       <span className="font-semibold text-foreground capitalize">{feature.replace('_', ' ')}</span>
                       <span className="font-bold font-mono text-muted-foreground">{count} times</span>
                     </div>
                     <div className="w-full neu-inset rounded-full h-2.5">
                       <div className="bg-[var(--ps-primary)] h-2.5 rounded-full shadow-[var(--glow-primary)] transition-all" style={{ width: `${Math.min(100, (count / Math.max(1, analyticsData.totalJobs)) * 100)}%` }}></div>
                     </div>
                   </div>
                 ))}
                 {Object.keys(analyticsData.featureUsage).length === 0 && (
                   <p className="text-sm text-muted-foreground text-center py-4">No service usage logged yet.</p>
                 )}
               </div>
            </div>

            {/* Geographical Spread */}
            <div className="glass glass-rim rounded-3xl p-6 shadow-glass">
               <h3 className="text-h3 font-display text-foreground mb-4 flex items-center gap-2">
                 <Boxicon className="bx bx-map-alt text-primary" /> Operations By Area
               </h3>
               <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                 {Object.entries(analyticsData.shopsByArea).sort((a,b) => b[1] - a[1]).map(([area, count]) => (
                   <div key={area} className="flex justify-between items-center p-3 neu rounded-xl">
                     <span className="font-medium text-sm text-foreground">{area}</span>
                     <Badge tone="printing" className="font-mono">{count} Shops</Badge>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'shops' && (
        <div className="grid gap-8 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Left Column: Form */}
          <div className="lg:col-span-4 glass glass-rim rounded-3xl p-6 shadow-glass h-fit sticky top-24">
            <h2 className="text-h3 font-display text-foreground mb-1 flex items-center gap-2">
              <Boxicon className="bx bx-plus-circle text-primary text-xl" />
              Register New Shop
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              This registers a new shopkeeper account in auth and provisions their shop with default rate cards.
            </p>



            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border-b border-[var(--ps-hairline)] pb-3 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Shopkeeper Credentials</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@email.com"
                      required
                      className="w-full px-4 py-2.5 rounded-xl neu-inset text-sm outline-none focus:ring-2 focus:ring-[var(--ps-primary)]/40 focus:shadow-[var(--glow-primary)] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Password *</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 rounded-xl neu-inset text-sm outline-none focus:ring-2 focus:ring-[var(--ps-primary)]/40 focus:shadow-[var(--glow-primary)] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Shop Details</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Shop Name *</label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="e.g. Royal Prints"
                      required
                      minLength={3}
                      maxLength={50}
                      title="Shop name must be between 3 and 50 characters"
                      className="w-full px-4 py-2.5 rounded-xl neu-inset text-sm outline-none focus:ring-2 focus:ring-[var(--ps-primary)]/40 focus:shadow-[var(--glow-primary)] transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-foreground">Custom Link Slug *</label>
                      <button
                        type="button"
                        onClick={() => setCustomSlug(!customSlug)}
                        className="text-[10px] text-primary hover:underline font-bold"
                      >
                        {customSlug ? "Auto-generate" : "Customize"}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                        setCustomSlug(true);
                      }}
                      placeholder="royal-prints"
                      required
                      minLength={3}
                      maxLength={30}
                      title="Slug must be between 3 and 30 characters (alphanumeric and hyphens only)"
                      className="w-full px-4 py-2.5 rounded-xl neu-inset text-sm outline-none focus:ring-2 focus:ring-[var(--ps-primary)]/40 focus:shadow-[var(--glow-primary)] transition-all font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Customer URL: /s/{slug || "slug"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9876543210"
                        required
                        pattern="[0-9]{10}"
                        title="Please enter a valid 10-digit mobile number (e.g., 9876543210)"
                        className="w-full px-4 py-2.5 rounded-xl neu-inset text-sm outline-none focus:ring-2 focus:ring-[var(--ps-primary)]/40 focus:shadow-[var(--glow-primary)] transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Area *</label>
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="Sector 62, Noida"
                        required
                        minLength={3}
                        maxLength={80}
                        title="Area must be between 3 and 80 characters"
                        className="w-full px-4 py-2.5 rounded-xl neu-inset text-sm outline-none focus:ring-2 focus:ring-[var(--ps-primary)]/40 focus:shadow-[var(--glow-primary)] transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading}
                className="w-full mt-4 py-3"
              >
                {loading ? (
                  <>
                    <Boxicon className="bx bx-loader-alt animate-spin text-lg" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Boxicon className="bx bx-store-alt text-lg" />
                    Create Shop
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Right Column: Existing Shops Data Table */}
          <div className="lg:col-span-8 glass glass-rim rounded-3xl p-6 shadow-glass flex flex-col">
            <h2 className="text-h3 font-display text-foreground mb-1 flex items-center gap-2">
              <Boxicon className="bx bx-table text-primary text-xl" />
              Manage Shops ({shops.length})
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              Complete management tools for all tenants.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[var(--ps-hairline-strong)] text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">Shop Details</th>
                    <th className="px-4 py-3 font-semibold">Location</th>
                    <th className="px-4 py-3 font-semibold">Queue Link</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ps-hairline)]">
                  {shops.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted-foreground">
                        No shops found.
                      </td>
                    </tr>
                  ) : (
                    shops.map((shop) => (
                      <tr key={shop.id} className="hover:bg-[var(--ps-surface-2)] transition-colors">
                        <td className="px-4 py-4">
                          <p className="font-bold text-foreground">{shop.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">ID: {shop.id.split('-')[0]}...</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-foreground text-xs flex items-center gap-1">
                            <Boxicon className="bx bx-map-pin text-muted-foreground" /> {shop.area || "N/A"}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{shop.phone}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Badge tone="printing" className="font-mono normal-case tracking-normal">
                              /s/{shop.slug}
                            </Badge>
                            <button
                              onClick={() => handleCopyLink(shop.slug)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-1"
                              title="Copy Link"
                            >
                              <Boxicon className={`bx ${copiedSlug === shop.slug ? "bx-check text-[var(--ps-success)]" : "bx-copy"}`} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <a
                                href={`/dashboard?shopId=${shop.id}`}
                                target="_blank"
                                className="px-3 py-1.5 rounded-lg bg-[var(--ps-success-muted)] hover:shadow-[var(--glow-success)] text-[var(--ps-success)] text-[11px] font-bold transition-all"
                                title="Open Shop Dashboard"
                              >
                                Dashboard
                              </a>
                             <a
                                href={`/s/${shop.slug}`}
                                target="_blank"
                                className="px-3 py-1.5 rounded-lg bg-[var(--ps-info-muted)] hover:shadow-[var(--elev-2)] text-[var(--ps-info)] text-[11px] font-bold transition-all"
                                title="Open QR Upload Page"
                              >
                                Upload Page
                              </a>
                             <button className="p-1.5 text-muted-foreground hover:text-primary hover:bg-[var(--ps-surface-2)] rounded-lg transition-colors" title="Edit Shop (Coming Soon)">
                               <Boxicon className="bx bx-edit text-lg" />
                             </button>
                             <button className="p-1.5 text-muted-foreground hover:text-[var(--ps-danger)] hover:bg-[var(--ps-danger-muted)] rounded-lg transition-colors" title="Delete Shop (Coming Soon)">
                               <Boxicon className="bx bx-trash text-lg" />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
