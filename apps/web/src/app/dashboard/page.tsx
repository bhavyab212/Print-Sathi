"use client";

import { useEffect, useState, useCallback, Suspense, useRef, useMemo } from "react";
import { usePresence, PresencePayload } from "@/hooks/usePresence";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { playSound } from "@/lib/audio";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import AnalyticsTab from "./AnalyticsTab";
import toast from 'react-hot-toast';

interface JobItem {
  id: string;
  file_name: string;
  file_url: string;
  file_size_bytes: number;
  file_type?: string;
  settings: any;
}

interface PrintJob {
  id: string;
  word_token: string;
  customer_name: string;
  status: 'pending' | 'approved' | 'printing' | 'done' | 'rejected';
  created_at: string;
  notes?: string;
  job_items: JobItem[];
}

interface PreviewModal {
  fileUrl: string;
  signedUrl: string;
  fileName: string;
  opensInBrowser: boolean;
}

function getFileInfo(fileName: string, fileType?: string): { label: string; icon: string; color: string; emoji: string; opensInBrowser: boolean } {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const t = fileType ?? '';
  if (t === 'pdf' || ext === 'pdf') return { label: 'PDF', icon: 'bxs-file-pdf', color: 'var(--ps-info)', emoji: '📄', opensInBrowser: true };
  if (t === 'image' || ['jpg','jpeg','png','gif','webp','bmp','svg'].includes(ext)) return { label: 'Image', icon: 'bxs-image', color: 'var(--ps-success)', emoji: '🖼️', opensInBrowser: true };
  if (['docx','doc'].includes(ext) || t.includes('word')) return { label: 'Word', icon: 'bxs-file-doc', color: 'var(--ps-warning)', emoji: '📝', opensInBrowser: false };
  if (['xlsx','xls'].includes(ext) || t.includes('excel')) return { label: 'Excel', icon: 'bxs-spreadsheet', color: 'var(--ps-accent-emerald)', emoji: '📊', opensInBrowser: false };
  if (['pptx','ppt'].includes(ext)) return { label: 'PPT', icon: 'bxs-slideshow', color: 'var(--ps-accent-rose)', emoji: '📑', opensInBrowser: false };
  if (ext === 'txt') return { label: 'Text', icon: 'bxs-file-txt', color: 'var(--ps-ink-muted)', emoji: '📃', opensInBrowser: true };
  return { label: 'File', icon: 'bxs-file', color: 'var(--ps-ink-muted)', emoji: '📎', opensInBrowser: false };
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const STATUS_CONFIG: Record<string, { label: string; stripe: string; badgeClass: string; dot: string }> = {
  pending:  { label: 'Pending',   stripe: 'var(--ps-warning)',  badgeClass: 'badge badge-pending',  dot: 'var(--ps-warning)' },
  approved: { label: 'Approved',  stripe: 'var(--ps-info)',     badgeClass: 'badge badge-approved', dot: 'var(--ps-info)' },
  printing: { label: 'Printing',  stripe: 'var(--ps-primary)',  badgeClass: 'badge badge-printing', dot: 'var(--ps-primary)' },
  done:     { label: 'Completed', stripe: 'var(--ps-success)',  badgeClass: 'badge badge-done',     dot: 'var(--ps-success)' },
  rejected: { label: 'Rejected',  stripe: 'var(--ps-danger)',   badgeClass: 'badge badge-rejected', dot: 'var(--ps-danger)' },
};

// ── Loading Skeleton ───────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--ps-canvas)' }}>
      <div className="h-14 flex items-center gap-3 px-4 shrink-0" style={{ background: 'var(--ps-canvas-soft)', borderBottom: '1px solid var(--ps-hairline)' }}>
        <div className="skeleton w-9 h-9 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 shrink-0 flex flex-col gap-0" style={{ background: 'var(--ps-canvas-soft)', borderRight: '1px solid var(--ps-hairline)' }}>
          <div className="p-3">
            <div className="skeleton h-9 w-full rounded-full" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-l-4" style={{ borderLeftColor: 'var(--ps-hairline)' }}>
              <div className="skeleton w-11 h-11 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3.5 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--ps-canvas)' }}>
          <div className="text-center space-y-3">
            <div className="skeleton w-20 h-20 rounded-2xl mx-auto" />
            <div className="skeleton h-4 w-32 rounded mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
function QueueDashboardContent() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopSlug, setShopSlug] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const presencePayload = useMemo<PresencePayload>(() => ({ id: shopId || Math.random().toString(), role: 'shopkeeper', shopId: shopId || undefined, name: shopName || undefined }), [shopId, shopName]);
  const { onlineUsers } = usePresence('printo_global', presencePayload);
  const onlineCustomers = onlineUsers.filter(u => u.role === 'customer' && u.shopId === shopId).length;
  const [activeTab, setActiveTab] = useState<'queue' | 'analytics'>('queue');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewModal | null>(null);
  const [editingItem, setEditingItem] = useState<JobItem | null>(null);
  const [editSettings, setEditSettings] = useState<any>({});
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [newJobIds, setNewJobIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const overrideShopId = searchParams.get('shopId');
  const supabase = createClient();

  // ── Data Fetching ──────────────────────────────────────────────────────
  const fetchJobs = useCallback(async (sid: string, manual = false) => {
    if (manual) setIsRefreshing(true);
    const { data, error } = await supabase
      .from('jobs')
      .select(`id, word_token, customer_name, status, created_at, notes, job_items ( id, file_name, file_url, file_size_bytes, file_type, settings )`)
      .eq('shop_id', sid)
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .order('created_at', { ascending: false });
    if (!error && data) setJobs(data as unknown as PrintJob[]);
    setIsInitialLoad(false);
    if (manual) setTimeout(() => setIsRefreshing(false), 500);
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      let shopQuery = supabase.from('shops').select('id, name, slug');
      if (overrideShopId) shopQuery = shopQuery.eq('id', overrideShopId);
      else shopQuery = shopQuery.eq('owner_id', user.id);
      const { data: shop } = await shopQuery.single();
      if (shop) {
        setShopId(shop.id); setShopSlug(shop.slug); setShopName(shop.name);
        await fetchJobs(shop.id);
      }
      setLoading(false);
    };
    init();
  }, [fetchJobs, supabase, overrideShopId]);

  useEffect(() => {
    if (!shopSlug) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    QRCode.toDataURL(`${origin}/s/${shopSlug}`, { width: 512, margin: 1, color: { dark: '#5c6bc8', light: '#ffffff' } })
      .then(url => setQrDataUrl(url)).catch(console.error);
  }, [shopSlug]);

  useEffect(() => {
    if (!shopId) return;
    const channel = supabase.channel('public:jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs', filter: `shop_id=eq.${shopId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newId = (payload.new as any).id;
          playSound('notification');
          setNewJobIds(prev => new Set(Array.from(prev).concat(newId)));
          setTimeout(() => setNewJobIds(prev => { const s = new Set(prev); s.delete(newId); return s; }), 3000);
        }
        fetchJobs(shopId);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [shopId, fetchJobs, supabase]);

  useEffect(() => {
    if (!shopId) return;
    const interval = setInterval(() => { fetchJobs(shopId); }, 30000);
    return () => clearInterval(interval);
  }, [shopId, fetchJobs]);

  // ── Actions ────────────────────────────────────────────────────────────
  const updateStatus = async (jobId: string, newStatus: string) => {
    playSound('pop');
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus as any } : j));
    await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId);
  };

  const handlePrint = async (job: PrintJob) => {
    setActionLoading(prev => ({ ...prev, [job.id]: 'print' }));
    if (!job.job_items || job.job_items.length === 0) { alert('This print job has no files attached.'); return; }
    await updateStatus(job.id, 'printing');
    if (job.job_items.length === 1) {
      const printWindow = window.open('', '_blank');
      const item = job.job_items[0];
      const { data, error } = await supabase.storage.from('customer_uploads').createSignedUrl(item.file_url, 3600);
      if (error) { alert('Could not access file: ' + error.message); if (printWindow) printWindow.close(); return; }
      if (data?.signedUrl && printWindow) printWindow.location.href = data.signedUrl;
      else if (data?.signedUrl) window.location.href = data.signedUrl;
      else if (printWindow) printWindow.close();
      return;
    }
    alert(`This job has ${job.job_items.length} files. Please ensure your browser allows multiple popups to print them all.`);
    for (const item of job.job_items) {
      const { data } = await supabase.storage.from('customer_uploads').createSignedUrl(item.file_url, 3600);
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  };

  const handleEditClick = (e: React.MouseEvent, item: JobItem) => {
    e.stopPropagation();
    setEditingItem(item);
    setEditSettings(item.settings || { color: 'bw', copies: 1, page_range: 'all', paper_size: 'A4' });
  };

  const handleSaveSettings = async () => {
    if (!editingItem) return;
    setJobs(prev => prev.map(job => ({
      ...job,
      job_items: job.job_items.map(ji => ji.id === editingItem.id ? { ...ji, settings: editSettings } : ji)
    })));
    const targetId = editingItem.id;
    setEditingItem(null);
    await supabase.from('job_items').update({ settings: editSettings }).eq('id', targetId);
  };

  const openPassportTool = async (e: React.MouseEvent, item: JobItem, tool: 'bg-remove' | 'quick' | 'custom') => {
    e.stopPropagation();
    try {
      const { data } = await supabase.storage.from('customer_uploads').createSignedUrl(item.file_url, 3600);
      if (!data?.signedUrl) throw new Error("Could not access file");
      let url = '';
      if (tool === 'bg-remove') url = `/dashboard/bg-remove?imageUrl=${encodeURIComponent(data.signedUrl)}&jobId=${selectedJob?.id}&itemId=${item.id}`;
      else if (tool === 'quick') url = `/dashboard/passport?mode=quick&imageUrl=${encodeURIComponent(data.signedUrl)}&jobId=${selectedJob?.id}&itemId=${item.id}`;
      else if (tool === 'custom') url = `/dashboard/passport?mode=custom&imageUrl=${encodeURIComponent(data.signedUrl)}&jobId=${selectedJob?.id}&itemId=${item.id}`;
      window.open(url, '_self');
    } catch (err: any) {
      toast.error("Error opening tool: " + err.message);
    }
  };

  const handleView = async (item: JobItem) => {
    const fi = getFileInfo(item.file_name, item.file_type || item.settings?.file_type);
    const { data, error } = await supabase.storage.from('customer_uploads').createSignedUrl(item.file_url, 3600);
    if (error) { alert('Error opening file: ' + error.message); return; }
    if (data?.signedUrl) setPreview({ fileUrl: item.file_url, signedUrl: data.signedUrl, fileName: item.file_name, opensInBrowser: fi.opensInBrowser });
  };

  const handleCopy = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${origin}/s/${shopSlug}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintQr = () => {
    if (!qrDataUrl) return;
    const w = window.open('', '_blank'); if (!w) return;
    w.document.write(`<html><head><title>QR - ${shopName}</title><style>body{font-family:sans-serif;text-align:center;padding:40px;background:#fff}.card{border:3px solid #5c6bc8;border-radius:24px;padding:40px;max-width:400px;margin:auto}h1{color:#0a0a0b;font-size:28px;margin:0 0 8px}p{color:#6b7280;margin:0 0 24px}img{width:240px;height:240px}.foot{margin-top:32px;font-size:12px;color:#9ca3af;border-top:1px dashed #e5e7eb;padding-top:16px}@media print{body{padding:0}.card{border:3px solid #000;box-shadow:none}}</style></head><body><div class="card"><h1>${shopName}</h1><p>Scan to send files directly to our printer!</p><img src="${qrDataUrl}" /><p style="margin-top:20px;font-weight:700;color:#5c6bc8">Scan QR Code to Start</p><div class="foot">Powered by <strong style="color:#5c6bc8">Print Sathi</strong></div></div><script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}</script></body></html>`);
    w.document.close();
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId) || null;
  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const activeJobs = jobs.filter(j => j.status === 'approved' || j.status === 'printing');
  const completedJobs = jobs.filter(j => j.status === 'done' || j.status === 'rejected');

  useEffect(() => {
    if (selectedJob) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
    }
  }, [selectedJob]);

  if (loading) return <DashboardSkeleton />;

  // ── Job Row Component ─────────────────────────────────────────────────
  const JobRow = ({ job }: { job: PrintJob }) => {
    const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
    const isSelected = job.id === selectedJobId;
    const isNew = newJobIds.has(job.id);
    const fileCount = job.job_items?.length ?? 0;
    const fileSummary = job.job_items?.slice(0, 2).map(i => getFileInfo(i.file_name, i.file_type).emoji).join('') ?? '';
    return (
      <button
        onClick={() => { setSelectedJobId(job.id); setMobileView('detail'); }}
        className={`w-full text-left flex items-center gap-3 px-4 py-3 relative transition-all duration-150 group animate-slide-in-row ${isNew ? 'animate-new-job-pulse' : ''}`}
        style={{
          background: isSelected ? 'var(--ps-surface-2)' : 'transparent',
          borderLeft: `3px solid ${isSelected ? 'var(--ps-primary)' : cfg.stripe}`,
        }}
        aria-selected={isSelected}
        aria-label={`Job from ${job.customer_name}, status: ${cfg.label}`}
      >
        {/* Hover overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none" style={{ background: 'var(--ps-surface-1)' }} />

        {/* Token Avatar */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 relative z-10"
          style={{
            background: isSelected ? 'var(--ps-primary)' : 'var(--ps-surface-2)',
            color: isSelected ? 'var(--ps-on-primary)' : cfg.stripe,
            border: `2px solid ${cfg.stripe}`,
          }}
        >
          #{job.word_token}
        </div>

        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--ps-ink)' }}>{job.customer_name}</p>
            <span className="text-xs shrink-0" style={{ color: 'var(--ps-ink-muted)' }}>{formatTime(job.created_at)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-xs truncate" style={{ color: 'var(--ps-ink-secondary)' }}>
              {fileSummary} {fileCount} file{fileCount !== 1 ? 's' : ''}{job.notes ? ' · 📝' : ''}
            </p>
            {job.status === 'pending' && (
              <span
                className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                style={{ background: 'var(--ps-warning)', color: '#000' }}
              >
                {fileCount}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  // ── Section Divider ───────────────────────────────────────────────────
  const SectionDivider = ({ label, count }: { label: string; count: number }) => (
    <div className="flex items-center gap-2 px-4 py-2 sticky top-0 z-10" style={{ background: 'var(--ps-canvas-soft)' }}>
      <div className="flex-1 h-px" style={{ background: 'var(--ps-hairline)' }} />
      <span className="text-xs font-semibold whitespace-nowrap uppercase tracking-wider" style={{ color: 'var(--ps-ink-muted)', letterSpacing: '0.6px' }}>
        {label} · {count}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--ps-hairline)' }} />
    </div>
  );

  // ── Detail / Right Panel ──────────────────────────────────────────────
  const DetailView = () => {
    if (!selectedJob) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 chat-wallpaper animate-fade-in">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'var(--ps-surface-2)', border: '1px solid var(--ps-hairline)' }}
          >
            <i className="bx bx-message-dots text-5xl" style={{ color: 'var(--ps-ink-subtle)' }}></i>
          </div>
          <h3 className="font-semibold text-lg" style={{ color: 'var(--ps-ink-muted)' }}>Select a job to review</h3>
          <p className="text-sm mt-2" style={{ color: 'var(--ps-ink-subtle)' }}>Choose any job from the left panel to view its details and take action</p>
        </div>
      );
    }

    const cfg = STATUS_CONFIG[selectedJob.status] || STATUS_CONFIG.pending;
    const statusEvents: { label: string; time: string }[] = [
      { label: `📋 Job created by ${selectedJob.customer_name}`, time: formatTime(selectedJob.created_at) },
      ...(selectedJob.status !== 'pending' ? [{ label: `✅ Approved by shopkeeper`, time: formatTime(selectedJob.created_at) }] : []),
      ...(selectedJob.status === 'printing' ? [{ label: `🖨️ Sent to printer`, time: formatTime(selectedJob.created_at) }] : []),
      ...(selectedJob.status === 'done' ? [{ label: `🎉 Print job completed`, time: formatTime(selectedJob.created_at) }] : []),
      ...(selectedJob.status === 'rejected' ? [{ label: `❌ Job rejected`, time: formatTime(selectedJob.created_at) }] : []),
    ];

    return (
      <div className="flex-1 flex flex-col overflow-hidden animate-fade-in" style={{ background: 'var(--ps-canvas)' }}>

        {/* ── Detail Header ─────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ background: 'var(--ps-canvas-soft)', borderBottom: '1px solid var(--ps-hairline)' }}
        >
          <button
            onClick={() => setMobileView('list')}
            className="lg:hidden p-2 rounded-lg transition-all duration-150 hover:scale-110 active:scale-95"
            style={{ color: 'var(--ps-ink-muted)', background: 'var(--ps-surface-1)' }}
            aria-label="Back to list"
          >
            <i className="bx bx-arrow-back text-xl"></i>
          </button>

          {/* Token */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
            style={{ background: 'var(--ps-primary)', color: 'var(--ps-on-primary)' }}
          >
            #{selectedJob.word_token}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate" style={{ color: 'var(--ps-ink)' }}>{selectedJob.customer_name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`${cfg.badgeClass} ${selectedJob.status === 'printing' ? 'badge-printing-live' : ''}`}>
                {cfg.label}
              </span>
              <span className="text-xs" style={{ color: 'var(--ps-ink-muted)' }}>{formatTime(selectedJob.created_at)}</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (!window.confirm('Delete this job?')) return;
              setJobs(prev => prev.filter(j => j.id !== selectedJob.id));
              setSelectedJobId(null);
              supabase.from('jobs').delete().eq('id', selectedJob.id);
            }}
            className="p-2 rounded-lg transition-all duration-150 hover:scale-110 active:scale-95"
            style={{ color: 'var(--ps-ink-subtle)', background: 'var(--ps-surface-1)' }}
            aria-label="Delete job"
            title="Delete job"
          >
            <i className="bx bx-trash text-lg"></i>
          </button>
        </div>

        {/* ── Chat Thread Area ──────────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 chat-wallpaper"
        >
          {/* Status events (center pills) */}
          {statusEvents.map((ev, i) => (
            <div key={i} className="flex justify-center animate-slide-in-bottom" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="bubble-system text-xs">{ev.label} · {ev.time}</div>
            </div>
          ))}

          {/* Customer note bubble (right side — from customer) */}
          {selectedJob.notes && (
            <div className="flex justify-end animate-slide-in-right">
              <div className="max-w-[75%]">
                <div className="bubble-customer">
                  <p className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: 'rgba(232,234,255,0.5)' }}>📝 Note from customer</p>
                  <p className="text-sm">{selectedJob.notes}</p>
                </div>
                <p className="text-[10px] text-right mt-1 pr-1" style={{ color: 'var(--ps-ink-subtle)' }}>
                  {formatTime(selectedJob.created_at)} <i className="bx bx-check-double" style={{ color: 'var(--ps-primary)' }}></i>
                </p>
              </div>
            </div>
          )}

          {/* File bubbles (left side — from customer, shopkeeper views them) */}
          {selectedJob.job_items?.map((item, idx) => {
            const fi = getFileInfo(item.file_name, item.file_type || item.settings?.file_type);
            const copies = item.settings?.copies ?? 1;
            const color = item.settings?.color ?? 'bw';
            const pageRange = item.settings?.page_range;
            return (
              <div key={item.id} className="flex justify-start animate-slide-in-left" style={{ animationDelay: `${idx * 80}ms` }}>
                <div className="max-w-[80%]">
                  {/* File bubble */}
                  <div
                    className="overflow-hidden cursor-pointer transition-all duration-150 hover:brightness-110 active:scale-98"
                    style={{
                      background: 'var(--ps-surface-2)',
                      border: '1px solid var(--ps-hairline)',
                      borderRadius: '2px 16px 16px 16px',
                      boxShadow: 'var(--ps-shadow-soft)',
                    }}
                    onClick={() => handleView(item)}
                  >
                    {/* File header */}
                    <div className="flex items-center gap-3 p-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'var(--ps-surface-3)', color: fi.color }}
                      >
                        <i className={`bx ${fi.icon} text-xl`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--ps-ink)' }}>{item.file_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--ps-ink-muted)' }}>{fi.label} · {formatSize(item.file_size_bytes || 0)}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={(e) => handleEditClick(e, item)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
                          style={{ color: 'var(--ps-ink-muted)', background: 'var(--ps-surface-3)' }}
                          aria-label="Edit settings"
                        >
                          <i className="bx bx-cog text-base"></i>
                        </button>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--ps-ink-muted)', background: 'var(--ps-surface-3)' }}>
                          <i className="bx bx-show text-base"></i>
                        </div>
                      </div>
                    </div>

                    {/* Settings chips */}
                    <div className="flex gap-1.5 px-3 pb-3 flex-wrap">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          background: color === 'color' ? 'rgba(168,85,247,0.15)' : 'var(--ps-surface-3)',
                          color: color === 'color' ? '#c084fc' : 'var(--ps-ink-secondary)',
                        }}
                      >
                        {color === 'color' ? '🎨 Color' : '⬛ B&W'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--ps-surface-3)', color: 'var(--ps-ink-secondary)' }}>
                        ×{copies} copies
                      </span>
                      {pageRange && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--ps-surface-3)', color: 'var(--ps-ink-secondary)' }}>
                          📄 pp. {pageRange}
                        </span>
                      )}
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          background: fi.opensInBrowser ? 'var(--ps-success-muted)' : 'var(--ps-warning-muted)',
                          color: fi.opensInBrowser ? 'var(--ps-success)' : 'var(--ps-warning)',
                        }}
                      >
                        {fi.opensInBrowser ? '👁️ Preview' : '⬇️ Download'}
                      </span>
                    </div>

                    {/* Passport Toolset */}
                    {item.settings?.action === 'passport_photo' && (
                      <div
                        className="border-t mt-1 p-3 space-y-2"
                        style={{ background: 'var(--ps-surface-1)', borderColor: 'var(--ps-hairline)' }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ps-warning)' }}>
                            <i className="bx bx-id-card mr-1"></i>Passport Tools
                          </p>
                          {item.settings?.passport_config && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--ps-surface-3)', color: 'var(--ps-ink-muted)' }}>
                              {item.settings.passport_config.copiesPerPage} copies ({item.settings.passport_config.size})
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => openPassportTool(e, item, 'quick')}
                            className="flex-1 py-2 rounded-lg text-[11px] font-bold transition-all duration-150 hover:brightness-110 active:scale-95 flex items-center justify-center gap-1"
                            style={{ background: 'var(--ps-warning)', color: '#000' }}
                          >
                            <i className="bx bx-bolt-circle text-sm"></i> Quick
                          </button>
                          <button
                            onClick={(e) => openPassportTool(e, item, 'custom')}
                            className="flex-1 py-2 rounded-lg text-[11px] font-bold transition-all duration-150 hover:brightness-110 active:scale-95 flex items-center justify-center gap-1"
                            style={{ background: 'var(--ps-primary)', color: 'var(--ps-on-primary)' }}
                          >
                            <i className="bx bx-slider text-sm"></i> Custom
                          </button>
                        </div>
                        <button
                          onClick={(e) => openPassportTool(e, item, 'bg-remove')}
                          className="w-full py-1.5 rounded-lg text-[10px] font-bold transition-all duration-150 hover:brightness-110 active:scale-95 flex items-center justify-center gap-1"
                          style={{ background: 'var(--ps-surface-3)', color: 'var(--ps-ink-secondary)', border: '1px solid var(--ps-hairline)' }}
                        >
                          <i className="bx bx-cut"></i> Remove BG (AI)
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] mt-1 pl-1" style={{ color: 'var(--ps-ink-subtle)' }}>
                    {formatTime(selectedJob.created_at)}
                  </p>
                </div>
              </div>
            );
          })}

          {selectedJob.job_items?.length === 0 && (
            <div className="flex justify-center animate-fade-in">
              <div className="text-xs px-4 py-2 rounded-full" style={{ background: 'var(--ps-danger-muted)', color: 'var(--ps-danger)', border: '1px solid rgba(229,83,75,0.2)' }}>
                ⚠️ No files attached — job may have failed during upload
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── Action Tray (BMW-precision flat bar) ─────────────────── */}
        <div
          className="shrink-0 flex gap-3 px-4 py-3"
          style={{
            background: 'var(--ps-canvas-soft)',
            borderTop: '1px solid var(--ps-hairline)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {selectedJob.status === 'pending' && (
            <>
              <button
                onClick={() => updateStatus(selectedJob.id, 'rejected')}
                disabled={actionLoading[selectedJob.id] === 'rejected'}
                className="btn-danger flex-1 justify-center py-3 text-sm font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Reject job"
              >
                {actionLoading[selectedJob.id] === 'rejected'
                  ? <i className="bx bx-loader-alt animate-spin text-xl"></i>
                  : <><i className="bx bx-x text-xl"></i> Reject</>
                }
              </button>
              <button
                onClick={() => updateStatus(selectedJob.id, 'approved')}
                disabled={actionLoading[selectedJob.id] === 'approved'}
                className="btn-success flex-1 justify-center py-3 text-sm font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Approve job"
              >
                {actionLoading[selectedJob.id] === 'approved'
                  ? <i className="bx bx-loader-alt animate-spin text-xl"></i>
                  : <><i className="bx bx-check text-xl"></i> Approve ✓</>
                }
              </button>
            </>
          )}
          {selectedJob.status === 'approved' && (
            <button
              onClick={() => handlePrint(selectedJob)}
              disabled={actionLoading[selectedJob.id] === 'print'}
              className="btn-primary w-full justify-center py-4 text-base font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontSize: '15px', boxShadow: '0 4px 16px rgba(92,107,200,0.35)' }}
              aria-label="Print job now"
            >
              {actionLoading[selectedJob.id] === 'print'
                ? <i className="bx bx-loader-alt animate-spin text-2xl"></i>
                : <><i className="bx bx-printer text-2xl"></i> Print Now 🖨️</>
              }
            </button>
          )}
          {selectedJob.status === 'printing' && (
            <>
              <button
                onClick={() => handlePrint(selectedJob)}
                className="btn-secondary flex-1 justify-center py-3 text-sm font-semibold rounded-xl"
                aria-label="Reprint job"
              >
                <i className="bx bx-refresh text-xl"></i> Reprint
              </button>
              <button
                onClick={() => updateStatus(selectedJob.id, 'done')}
                className="btn-success flex-1 justify-center py-3 text-sm font-semibold rounded-xl"
                aria-label="Mark job done"
              >
                <i className="bx bx-check-double text-xl"></i> Done ✅
              </button>
            </>
          )}
          {(selectedJob.status === 'done' || selectedJob.status === 'rejected') && (
            <div className="w-full py-3 text-center text-sm font-medium" style={{ color: 'var(--ps-ink-subtle)' }}>
              {selectedJob.status === 'done' ? '✅ Job completed' : '❌ Job rejected'}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col relative" style={{ background: 'var(--ps-canvas)' }}>
      <header
        className="flex items-center gap-3 px-4 shrink-0 z-20"
        style={{
          background: 'var(--ps-canvas-soft)',
          borderBottom: '1px solid var(--ps-hairline)',
          height: '56px',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--ps-primary)' }}
          >
            <i className="bx bx-printer text-white text-lg"></i>
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-base truncate" style={{ color: 'var(--ps-ink)', letterSpacing: '-0.3px' }}>
              {shopName || 'Print Shop'}
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--ps-success)' }}></span>
              <p className="text-xs" style={{ color: 'var(--ps-ink-muted)' }}>
                Queue · {onlineCustomers > 0 ? <span style={{ color: 'var(--ps-success)' }}>{onlineCustomers} online</span> : 'no customers online'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div
          className="flex items-center rounded-lg p-1 gap-1"
          style={{ background: 'var(--ps-surface-1)', border: '1px solid var(--ps-hairline)' }}
        >
          <button
            onClick={() => setActiveTab('queue')}
            className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150"
            style={{
              background: activeTab === 'queue' ? 'var(--ps-primary)' : 'transparent',
              color: activeTab === 'queue' ? 'var(--ps-on-primary)' : 'var(--ps-ink-muted)',
            }}
            aria-pressed={activeTab === 'queue'}
          >
            Queue {pendingJobs.length > 0 && (
              <span
                className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: 'var(--ps-warning)', color: '#000' }}
              >
                {pendingJobs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150"
            style={{
              background: activeTab === 'analytics' ? 'var(--ps-primary)' : 'transparent',
              color: activeTab === 'analytics' ? 'var(--ps-on-primary)' : 'var(--ps-ink-muted)',
            }}
            aria-pressed={activeTab === 'analytics'}
          >
            Analytics
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => shopId && fetchJobs(shopId, true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
            style={{ color: 'var(--ps-ink-muted)', background: 'var(--ps-surface-1)' }}
            title="Refresh"
            aria-label="Refresh jobs"
          >
            <i className={`bx bx-refresh text-lg ${isRefreshing ? 'animate-spin' : ''}`}></i>
          </button>
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
            style={{ color: 'var(--ps-ink-muted)', background: 'var(--ps-surface-1)' }}
            title="Show QR code"
            aria-label="Show QR code"
          >
            <i className="bx bx-qr-scan text-lg"></i>
          </button>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      {activeTab === 'analytics' ? (
        <div className="flex-1 overflow-y-auto p-4" style={{ background: 'var(--ps-canvas)' }}>
          {shopId && <AnalyticsTab shopId={shopId} />}
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">

          {/* Left Panel — Job Sidebar */}
          <aside
            className={`flex flex-col ${mobileView === 'detail' ? 'hidden lg:flex' : 'flex'} lg:w-80 xl:w-96 shrink-0 overflow-hidden`}
            style={{ background: 'var(--ps-canvas-soft)', borderRight: '1px solid var(--ps-hairline)' }}
          >
            {/* Search bar */}
            <div className="px-3 py-2 shrink-0 flex items-center gap-2" style={{ borderBottom: '1px solid var(--ps-hairline-soft)' }}>
              <div
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full"
                style={{ background: 'var(--ps-surface-1)', border: '1px solid var(--ps-hairline)' }}
              >
                <i className="bx bx-search text-base" style={{ color: 'var(--ps-ink-subtle)' }}></i>
                <span className="text-sm" style={{ color: 'var(--ps-ink-subtle)' }}>Search jobs...</span>
              </div>
              <button
                onClick={() => setShowPendingOnly(!showPendingOnly)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
                style={{
                  background: showPendingOnly ? 'var(--ps-warning-muted)' : 'var(--ps-surface-1)',
                  color: showPendingOnly ? 'var(--ps-warning)' : 'var(--ps-ink-muted)',
                  border: `1px solid ${showPendingOnly ? 'rgba(245,158,11,0.3)' : 'var(--ps-hairline)'}`,
                }}
                title="Filter pending only"
                aria-label="Filter pending jobs"
                aria-pressed={showPendingOnly}
              >
                <i className="bx bx-filter-alt text-lg"></i>
              </button>
            </div>

            {/* Job list */}
            <div className="flex-1 overflow-y-auto">
              {jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'var(--ps-surface-1)', border: '1px solid var(--ps-hairline)' }}
                  >
                    <i className="bx bx-qr-scan text-3xl" style={{ color: 'var(--ps-ink-subtle)' }}></i>
                  </div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--ps-ink-muted)' }}>Queue is empty</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--ps-ink-subtle)' }}>Waiting for customers to scan QR code</p>
                </div>
              ) : (
                <>
                  {pendingJobs.length > 0 && (
                    <>
                      <SectionDivider label="🟡 Action Needed" count={pendingJobs.length} />
                      {pendingJobs.map(job => <JobRow key={job.id} job={job} />)}
                    </>
                  )}
                  {!showPendingOnly && activeJobs.length > 0 && (
                    <>
                      <SectionDivider label="🔵 In Progress" count={activeJobs.length} />
                      {activeJobs.map(job => <JobRow key={job.id} job={job} />)}
                    </>
                  )}
                  {!showPendingOnly && completedJobs.length > 0 && (
                    <>
                      <SectionDivider label="✅ Completed Today" count={completedJobs.length} />
                      {completedJobs.map(job => <JobRow key={job.id} job={job} />)}
                    </>
                  )}
                </>
              )}
            </div>
          </aside>

          {/* Right Panel — Detail View */}
          <main className={`flex-1 flex flex-col overflow-hidden ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}`}>
            <DetailView />
          </main>
        </div>
      )}

      {/* ── Edit Settings Modal ───────────────────────────────────────── */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setEditingItem(null)}
        >
          <div
            className="card-modal w-full max-w-sm animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg" style={{ color: 'var(--ps-ink)', letterSpacing: '-0.3px' }}>Edit Print Settings</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
                style={{ color: 'var(--ps-ink-muted)', background: 'var(--ps-surface-4)' }}
                aria-label="Close"
              >
                <i className="bx bx-x text-xl"></i>
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ps-ink-muted)', letterSpacing: '0.6px' }}>
                  Color Mode
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditSettings({ ...editSettings, color: 'bw' })}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150"
                    style={{
                      background: editSettings.color === 'bw' ? 'var(--ps-ink)' : 'var(--ps-surface-4)',
                      color: editSettings.color === 'bw' ? 'var(--ps-canvas)' : 'var(--ps-ink-secondary)',
                    }}
                    aria-pressed={editSettings.color === 'bw'}
                  >
                    B&W
                  </button>
                  <button
                    onClick={() => setEditSettings({ ...editSettings, color: 'color' })}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150"
                    style={{
                      background: editSettings.color === 'color' ? 'rgba(192,132,252,0.2)' : 'var(--ps-surface-4)',
                      color: editSettings.color === 'color' ? '#c084fc' : 'var(--ps-ink-secondary)',
                      border: editSettings.color === 'color' ? '1px solid rgba(192,132,252,0.4)' : '1px solid transparent',
                    }}
                    aria-pressed={editSettings.color === 'color'}
                  >
                    Color
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ps-ink-muted)', letterSpacing: '0.6px' }}>
                  Copies
                </label>
                <div className="flex items-center gap-4 rounded-xl p-2" style={{ background: 'var(--ps-surface-4)' }}>
                  <button
                    onClick={() => setEditSettings({ ...editSettings, copies: Math.max(1, (editSettings.copies || 1) - 1) })}
                    className="w-8 h-8 rounded-lg font-bold transition-all duration-150 hover:scale-110 active:scale-95 flex items-center justify-center"
                    style={{ background: 'var(--ps-surface-3)', color: 'var(--ps-ink)' }}
                    aria-label="Decrease copies"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center font-bold text-lg" style={{ color: 'var(--ps-ink)' }}>{editSettings.copies || 1}</span>
                  <button
                    onClick={() => setEditSettings({ ...editSettings, copies: (editSettings.copies || 1) + 1 })}
                    className="w-8 h-8 rounded-lg font-bold transition-all duration-150 hover:scale-110 active:scale-95 flex items-center justify-center"
                    style={{ background: 'var(--ps-surface-3)', color: 'var(--ps-ink)' }}
                    aria-label="Increase copies"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ps-ink-muted)', letterSpacing: '0.6px' }}>
                  Paper Size
                </label>
                <select
                  value={editSettings.paper_size || 'A4'}
                  onChange={e => setEditSettings({ ...editSettings, paper_size: e.target.value })}
                  className="input"
                  style={{ background: 'var(--ps-surface-4)', color: 'var(--ps-ink)', borderColor: 'var(--ps-hairline)' }}
                >
                  <option value="A4" style={{ background: 'var(--ps-surface-3)' }}>A4 (Standard)</option>
                  <option value="A3" style={{ background: 'var(--ps-surface-3)' }}>A3 (Large)</option>
                  <option value="Letter" style={{ background: 'var(--ps-surface-3)' }}>US Letter</option>
                </select>
              </div>

              <button
                onClick={handleSaveSettings}
                className="btn-primary w-full justify-center py-3 text-sm font-semibold rounded-xl mt-2"
              >
                <i className="bx bx-save text-lg"></i> Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── File Preview Modal ─────────────────────────────────────────── */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex flex-col animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setPreview(null)}
        >
          {/* Preview header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: 'var(--ps-canvas-soft)', borderBottom: '1px solid var(--ps-hairline)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <i className="bx bxs-file-blank text-2xl shrink-0" style={{ color: 'var(--ps-primary)' }}></i>
              <div className="overflow-hidden">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--ps-ink)' }}>{preview.fileName}</p>
                <p className="text-xs" style={{ color: 'var(--ps-ink-muted)' }}>
                  {preview.opensInBrowser ? 'Previewing in browser' : 'Cannot preview — download to open'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {preview.opensInBrowser && (
                <a
                  href={preview.signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary px-3 py-1.5 text-xs rounded-lg"
                >
                  <i className="bx bx-fullscreen"></i> Full
                </a>
              )}
              <a
                href={preview.signedUrl}
                download={preview.fileName}
                className="btn-primary px-3 py-1.5 text-xs rounded-lg"
              >
                <i className="bx bx-download"></i> Download
              </a>
              <button
                onClick={() => setPreview(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
                style={{ color: 'var(--ps-ink-muted)', background: 'var(--ps-surface-2)' }}
                aria-label="Close preview"
              >
                <i className="bx bx-x text-xl"></i>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden" onClick={e => e.stopPropagation()}>
            {preview.opensInBrowser ? (
              <iframe src={preview.signedUrl} className="w-full h-full border-0" title={preview.fileName}></iframe>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center" style={{ background: 'var(--ps-warning-muted)' }}>
                  <i className="bx bxs-file-doc text-5xl" style={{ color: 'var(--ps-warning)' }}></i>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-2" style={{ color: 'var(--ps-ink)' }}>{preview.fileName}</h3>
                  <p className="text-sm max-w-sm" style={{ color: 'var(--ps-ink-muted)' }}>
                    This file type cannot be previewed in the browser. Download it and open with the appropriate app to print.
                  </p>
                </div>
                <a
                  href={preview.signedUrl}
                  download={preview.fileName}
                  className="btn-primary px-8 py-3 rounded-xl text-sm font-semibold"
                >
                  <i className="bx bx-download text-xl"></i> Download &amp; Print
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── QR Modal ──────────────────────────────────────────────────── */}
      {isQrModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden animate-scale-up"
            style={{
              background: 'var(--ps-surface-2)',
              borderRadius: '20px',
              border: '1px solid var(--ps-hairline-strong)',
              boxShadow: 'var(--ps-shadow-modal)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* QR Header */}
            <div
              className="p-6 text-center"
              style={{ background: 'linear-gradient(135deg, var(--ps-primary) 0%, var(--ps-primary-hover) 100%)' }}
            >
              <h2 className="font-bold text-xl" style={{ color: 'var(--ps-on-primary)', letterSpacing: '-0.3px' }}>
                {shopName}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Scan to upload documents &amp; photos</p>
              <div className="mt-5 p-4 bg-white rounded-2xl inline-block" style={{ boxShadow: 'var(--ps-shadow-raised)' }}>
                {qrDataUrl
                  ? <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 object-contain" />
                  : <div className="w-48 h-48 flex items-center justify-center"><i className="bx bx-loader-alt animate-spin text-3xl" style={{ color: 'var(--ps-primary)' }}></i></div>
                }
              </div>
            </div>

            {/* QR Actions */}
            <div className="p-5 space-y-3">
              {/* Link row */}
              <div
                className="flex items-center justify-between rounded-xl px-4 py-2.5"
                style={{ background: 'var(--ps-surface-3)', border: '1px solid var(--ps-hairline)' }}
              >
                <span className="text-xs font-mono truncate mr-2" style={{ color: 'var(--ps-ink-muted)' }}>
                  {typeof window !== 'undefined' ? `${window.location.origin}/s/${shopSlug}` : ''}
                </span>
                <button
                  onClick={handleCopy}
                  className="text-xs font-semibold shrink-0 transition-all duration-150 hover:scale-110 flex items-center gap-1"
                  style={{ color: copied ? 'var(--ps-success)' : 'var(--ps-primary)' }}
                >
                  <i className={`bx ${copied ? 'bx-check' : 'bx-copy'}`}></i>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsQrModalOpen(false)}
                  className="btn-secondary py-3 text-sm font-semibold rounded-xl justify-center"
                >
                  Close
                </button>
                <button
                  onClick={handlePrintQr}
                  className="btn-primary py-3 text-sm font-semibold rounded-xl justify-center"
                >
                  <i className="bx bx-printer"></i> Print Flyer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QueueDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <QueueDashboardContent />
    </Suspense>
  );
}
