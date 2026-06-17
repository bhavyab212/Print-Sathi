"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { usePresence, PresencePayload } from "@/hooks/usePresence";
import toast from 'react-hot-toast';
import { jsPDF } from "jspdf";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { PASSPORT_SIZES } from "@/components/passport/PassportConfig";
import { motion, AnimatePresence } from "motion/react";

type PrintAction = 'direct_print' | 'edit' | 'passport_photo';
type PrintColor = 'bw' | 'color';
type ChatStep = 'intro' | 'greeting' | 'name' | 'files' | 'notes' | 'confirm' | 'uploading' | 'success';

const BROWSER_DISPLAYABLE = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml', 'text/plain'];
const BLOCKED_EXTENSIONS = ['exe', 'bat', 'sh', 'cmd', 'js', 'ts', 'php', 'py', 'rb', 'go', 'c', 'cpp', 'h', 'jar', 'zip', 'rar', '7z', 'tar', 'gz'];
const MAX_FILE_SIZE_MB = 25;
const MAX_TOTAL_SIZE_MB = 50;

// ── Multi-group PDF combining ──────────────────────────────────────────────
const GROUP_SLOTS = [
  { id: 'A', label: 'Group A', color: '#818cf8', bg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.4)'  },
  { id: 'B', label: 'Group B', color: '#34d399', bg: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.4)'   },
  { id: 'C', label: 'Group C', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)'   },
  { id: 'D', label: 'Group D', color: '#f472b6', bg: 'rgba(244,114,182,0.15)',border: 'rgba(244,114,182,0.4)'  },
] as const;
type GroupId = typeof GROUP_SLOTS[number]['id'];

interface Toast { id: string; msg: string; icon: string; }

interface FileWithSettings {
  id: string;
  file: File;
  action: PrintAction;
  color: PrintColor;
  copies: number;
  pageRange: string;
  paperSize: string;
  previewUrl?: string;
  validationWarning?: string;
  passportConfig?: { size: string; copiesPerPage: number };
  groupId?: GroupId | null;
}

interface ChatMessage {
  id: string;
  type: 'bot' | 'user' | 'system';
  content: string;
  timestamp: Date;
  fileItem?: FileWithSettings;
  isTyping?: boolean;
}

// helper: FileReader → data URL
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
}

async function getCroppedImg(imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }, rotation = 0): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = imageSrc;
  });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));
  canvas.width = safeArea; canvas.height = safeArea;
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);
  ctx.drawImage(image, safeArea / 2 - image.width / 2, safeArea / 2 - image.height / 2);
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d')!;
  croppedCanvas.width = pixelCrop.width; croppedCanvas.height = pixelCrop.height;
  croppedCtx.drawImage(canvas, pixelCrop.x + safeArea / 2 - image.width / 2, pixelCrop.y + safeArea / 2 - image.height / 2, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => { croppedCanvas.toBlob((blob) => { resolve(new File([blob!], 'cropped.jpg', { type: 'image/jpeg' })); }, 'image/jpeg', 0.92); });
}

function getFileTypeBadge(file: File): { label: string; icon: string; emoji: string } {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const type = file.type;
  if (type === 'application/pdf') return { label: 'PDF', icon: 'bxs-file-pdf', emoji: '📄' };
  if (type.startsWith('image/')) return { label: 'Image', icon: 'bxs-image', emoji: '🖼️' };
  if (type.includes('word') || ext === 'docx' || ext === 'doc') return { label: 'Word', icon: 'bxs-file-doc', emoji: '📝' };
  if (type.includes('spreadsheet') || type.includes('excel') || ext === 'xlsx' || ext === 'xls') return { label: 'Excel', icon: 'bxs-spreadsheet', emoji: '📊' };
  if (type.includes('presentation') || ext === 'pptx' || ext === 'ppt') return { label: 'PPT', icon: 'bxs-slideshow', emoji: '📑' };
  return { label: 'File', icon: 'bxs-file', emoji: '📎' };
}

function validateFile(file: File): { ok: boolean; error?: string; warning?: string } {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (BLOCKED_EXTENSIONS.includes(ext)) return { ok: false, error: `"${file.name}" is not allowed.` };
  if (file.size / 1024 / 1024 > MAX_FILE_SIZE_MB) return { ok: false, error: `"${file.name}" exceeds ${MAX_FILE_SIZE_MB}MB.` };
  return { ok: true };
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ShopLandingPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [step, setStep] = useState<ChatStep>('intro');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<FileWithSettings[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [tokenNumber, setTokenNumber] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success_tick'>('idle');
  const [animateRocketFly, setAnimateRocketFly] = useState(false);
  const [rocketPhase, setRocketPhase] = useState<'entering' | 'wobble' | 'thrust' | 'liftoff'>('entering');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [organiserOpen, setOrganiserOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [guideDismissed, setGuideDismissed] = useState(false);
  // Tracks which one-time coach-mark hints have been dismissed
  const [seenHints, setSeenHints] = useState<Set<string>>(new Set());
  const markSeen = (id: string) => setSeenHints(prev => { const n = new Set(prev); n.add(id); return n; });

  const [activeCrop, setActiveCrop] = useState<{ fileId: string; crop: Point; zoom: number; rotation: number; croppedAreaPixels: Area | null } | null>(null);
  const [cropFileId, setCropFileId] = useState<string | null>(null);
  const [passportModalFileId, setPassportModalFileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId] = useState(() => Math.random().toString(36).slice(2));

  const presencePayload = useMemo<PresencePayload>(() => ({ id: userId, role: 'customer', shopId: shopId || undefined, name }), [userId, shopId, name]);
  const { onlineUsers } = usePresence('printo_global', presencePayload);
  const isShopkeeperOnline = onlineUsers.some(u => u.role === 'shopkeeper' && u.shopId === shopId);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const addToast = useCallback((msg: string, icon = 'bx-check-circle') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, msg, icon }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500);
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: ChatMessage = { ...msg, id: Math.random().toString(36).slice(2), timestamp: new Date() };
    setMessages(prev => [...prev, newMsg]);
    scrollToBottom();
    return newMsg;
  }, [scrollToBottom]);

  const botSay = useCallback(async (content: string, delay = 800) => {
    setIsBotTyping(true);
    await new Promise(r => setTimeout(r, delay));
    setIsBotTyping(false);
    addMessage({ type: 'bot', content });
  }, [addMessage]);

  // Initialize
  useEffect(() => {
    const fetchShop = async () => {
      try {
        const { data, error } = await supabase.from('shops').select('id, name').eq('slug', params.slug).single();
        if (error || !data) { setError("Shop not found. Please check the QR code."); }
        else { setShopId(data.id); setShopName(data.name); }
      } catch { setError("Error connecting to the shop."); }
      finally { setIsInitializing(false); }
    };
    fetchShop();
  }, [params.slug]);

  // Start greeting once shop loaded
  useEffect(() => {
    if (isInitializing || error || step !== 'greeting') return;
    const startGreeting = async () => {
      await botSay(`👋 Hey! Welcome to **${shopName || 'Print Shop'}**.\n\nI'm your print assistant. How can I help you today?`, 600);
      setStep('files');
    };
    startGreeting();
  }, [isInitializing, error, shopName, step]);

  const handleStartChat = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) return;
    setStep('greeting');
  };

  const handleSendNotes = async () => {
    const trimmed = inputValue.trim();
    addMessage({ type: 'user', content: trimmed || '(No special instructions)' });
    setNotes(trimmed);
    setInputValue('');
    setStep('confirm');
    await botSay(`Got it! Here's a summary of your print job:`);
  };

  const addFiles = useCallback(async (newRawFiles: File[]) => {
    if (!shopId) return;
    const errors: string[] = [];
    let heic2any: any = null;
    let hasImages = false;
    let isFirstBatch = false;

    setFiles(prev => { isFirstBatch = prev.length === 0; return prev; });

    for (let file of newRawFiles) {
      const validation = validateFile(file);
      if (!validation.ok) { errors.push(validation.error!); continue; }
      let previewUrl: string | undefined;
      const isHeic = file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
      if (isHeic) {
        try {
          if (!heic2any) heic2any = (await import('heic2any')).default;
          const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 }) as Blob | Blob[];
          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          file = new File([blob], file.name.replace(/\.hei[cf]$/i, '.jpg'), { type: 'image/jpeg' });
          previewUrl = URL.createObjectURL(file);
        } catch { errors.push(`Failed to process HEIC file "${file.name}".`); continue; }
      } else if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
        hasImages = true;
      }

      const newItem: FileWithSettings = {
        id: Math.random().toString(36).slice(2),
        file, action: 'direct_print', color: 'bw', copies: 1, pageRange: 'all', paperSize: 'A4',
        previewUrl, validationWarning: validation.warning,
        groupId: null,
      };
      setFiles(prev => [...prev, newItem]);
      addToast(`📎 ${file.name.length > 22 ? file.name.slice(0, 20) + '…' : file.name} added`, 'bx-paperclip');

      addMessage({ type: 'user', content: `Attached: ${file.name}`, fileItem: newItem });
      setIsBotTyping(true);
      await new Promise(r => setTimeout(r, 500));
      setIsBotTyping(false);
      addMessage({ type: 'bot', content: `Got your file! Configure the print settings below:`, fileItem: newItem });
      scrollToBottom();
    }

    // Auto-open guide on first image batch
    if (hasImages && isFirstBatch && !guideDismissed) {
      setTimeout(() => {
        setGuideOpen(true);
        setGuideStep(0);
      }, 900);
    }

    if (errors.length > 0) setError(errors.join('\n'));
  }, [shopId, addMessage, addToast, scrollToBottom, guideDismissed]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await addFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Revoke all preview object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      files.forEach(f => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => {
      const toRemove = prev.find(f => f.id === id);
      if (toRemove?.previewUrl) URL.revokeObjectURL(toRemove.previewUrl);
      return prev.filter(f => f.id !== id);
    });
    addToast('File removed', 'bx-x-circle');
  };

  const updateFileSetting = (id: string, key: keyof FileWithSettings, value: unknown) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const assignGroup = (fileId: string, groupId: GroupId | null) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;
      if (groupId) return { ...f, groupId, action: 'direct_print', passportConfig: undefined };
      return { ...f, groupId: null };
    }));
    const slot = groupId ? GROUP_SLOTS.find(g => g.id === groupId) : null;
    addToast(slot ? `Moved to ${slot.label}` : 'Moved to Separate', slot ? 'bx-layer' : 'bx-minus-circle');
  };

  const handleDoneWithFiles = async () => {
    if (files.length === 0) { toast.error('Please attach at least one file.'); return; }
    setStep('notes');
    addMessage({ type: 'user', content: `${files.length} file(s) ready to send` });
    await botSay('📝 Any special instructions for the shop?\n\n(e.g. staple, double-sided, only first 3 pages...)\n\nOr tap **Skip** to continue.');
  };

  const uploadFileWithProgress = (
    file: File,
    filePath: string,
    onProgress: (percent: number) => void
  ): Promise<{ path: string }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
  
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ path: filePath });
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.message || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        }
      };
  
      xhr.onerror = () => reject(new Error('Network error during upload'));
  
      xhr.open('POST', `${supabaseUrl}/storage/v1/object/customer_uploads/${filePath}`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${anonKey}`);
      xhr.setRequestHeader('apikey', anonKey!);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.send(file);
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if (!shopId || !name || files.length === 0) {
      setIsSubmitting(false);
      return;
    }
    const totalMB = files.reduce((acc, f) => acc + f.file.size, 0) / 1024 / 1024;
    if (totalMB > MAX_TOTAL_SIZE_MB) {
      setError(`Total size (${totalMB.toFixed(1)} MB) exceeds ${MAX_TOTAL_SIZE_MB} MB limit.`);
      setIsSubmitting(false);  // fix: was missing — submit stayed permanently disabled
      return;
    }

    setStep('uploading');
    setUploadStatus('uploading');
    setAnimateRocketFly(false);
    setError(null);
    addMessage({ type: 'user', content: '✅ Confirmed! Sending to shop...' });

    let jobData: { id: string } | null = null;

    try {
      let finalFiles = [...files];
      // Build one PDF per group that has 2+ images
      for (const slot of GROUP_SLOTS) {
        const grouped = finalFiles.filter(f => f.groupId === slot.id && f.file.type.startsWith('image/'));
        if (grouped.length < 2) continue; // 1 file in a group = just print it normally
        setUploadProgress(`Building PDF for ${slot.label} (${grouped.length} photos)…`);
        const pdf = new jsPDF();
        for (let i = 0; i < grouped.length; i++) {
          if (i > 0) pdf.addPage();
          const dataUrl = await readFileAsDataUrl(grouped[i].file);
          const props = pdf.getImageProperties(dataUrl);
          const w = pdf.internal.pageSize.getWidth();
          pdf.addImage(dataUrl, 'JPEG', 0, 0, w, (props.height * w) / props.width);
        }
        const pdfBlob = pdf.output('blob');
        const pdfFile = new File([pdfBlob], `${slot.label}.pdf`, { type: 'application/pdf' });
        finalFiles = [
          ...finalFiles.filter(f => !(f.groupId === slot.id && f.file.type.startsWith('image/'))),
          { id: slot.id, file: pdfFile, action: grouped[0].action, color: grouped[0].color, copies: grouped[0].copies, pageRange: 'all', paperSize: grouped[0].paperSize, groupId: null },
        ];
      }

      setUploadProgress('Creating your print job...');
      setUploadPercent(0);
      setRocketPhase('entering');
      // Pass notes into the RPC directly — avoids a separate UPDATE that requires auth
      const { data: rpcResult, error: rpcErr } = await supabase.rpc('create_job_with_sequence', {
        p_shop_id: shopId,
        p_customer_name: name.trim(),
        p_source: 'qr',
        p_customer_phone: null,
        p_notes: notes.trim() || null,
      });
      if (rpcErr || !rpcResult || rpcResult.length === 0) {
        // Extract real message from PostgrestError (not an Error instance)
        const detail = (rpcErr as any)?.message || (rpcErr as any)?.details || (rpcErr as any)?.hint;
        throw new Error(detail || 'Failed to create job — check RPC permissions (GRANT EXECUTE TO anon)');
      }
      const { id: rpcJobId, word_token: rpcToken } = rpcResult[0];
      jobData = { id: rpcJobId };
      const tokenNum = rpcToken;

      for (let i = 0; i < finalFiles.length; i++) {
        const item = finalFiles[i];
        const fileSizeMB = (item.file.size / (1024 * 1024)).toFixed(1);
        setUploadPercent(0);
        setUploadProgress(`Uploading file ${i + 1} of ${finalFiles.length} (0%) - ${fileSizeMB}MB`);
        const fileExt = item.file.name.split('.').pop();
        const filePath = `${shopId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        
        const uploadData = await uploadFileWithProgress(item.file, filePath, (percent) => {
          setUploadPercent(percent);
          setUploadProgress(`Uploading file ${i + 1} of ${finalFiles.length} (${percent}%) - ${fileSizeMB}MB`);
          if (percent > 0 && rocketPhase !== 'thrust') setRocketPhase('thrust');
        });
        const fileType = item.file.type.includes('pdf') ? 'pdf' : item.file.type.startsWith('image/') ? 'image' : 'document';
        const { error: itemErr } = await supabase.from('job_items').insert({
          job_id: jobData.id, file_url: uploadData.path, file_name: item.file.name,
          file_type: fileType, file_size_bytes: item.file.size,
          settings: { action: item.action, color: item.color, copies: item.copies, page_range: item.pageRange !== 'all' ? item.pageRange : null, paper_size: item.paperSize, passport_config: item.passportConfig },
        });
        if (itemErr) {
          const detail = (itemErr as any)?.message || (itemErr as any)?.details || (itemErr as any)?.hint;
          throw new Error(detail || 'Failed to save file record');
        }
      }

      setTokenNumber(String(tokenNum));
      setJobId(jobData.id);
      
      // Start rocket fly-away animation
      setRocketPhase('liftoff');
      setAnimateRocketFly(true);
      await new Promise(r => setTimeout(r, 800)); // wait for rocket to fly away

      // Transition to success tick
      setUploadStatus('success_tick');
      playSound('success');

      // Hold success animation for 1.8s
      await new Promise(r => setTimeout(r, 1800));

      // Auto redirect to tracking page
      window.location.href = `/s/${params.slug}/status/${jobData.id}`;

      // Reset states (for completion, though page redirects)
      setIsSubmitting(false);
      setUploadStatus('idle');
      setStep('success');
      
      setIsBotTyping(true);
      await new Promise(r => setTimeout(r, 800));
      setIsBotTyping(false);
      addMessage({ type: 'bot', content: `✅ **You're #${String(tokenNum)} in queue!**\n\nYour files have been sent to **${shopName}**. Show your token number to the shopkeeper.\n\n🎫 **Token: #${String(tokenNum)}**` });
    } catch (err: unknown) {
      if (jobData?.id) {
        try { await supabase.from('jobs').delete().eq('id', jobData.id); } catch {}
      }
      // PostgrestError is NOT an instanceof Error — extract .message explicitly
      const msg = err instanceof Error
        ? err.message
        : (err as any)?.message || (err as any)?.details || (err as any)?.error_description || "Upload failed. Please try again.";
      setError(msg);
      setStep('confirm');
      setUploadStatus('idle');
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="bx bx-printer text-3xl text-slate-800 dark:text-white"></i>
          </div>
          <p className="text-slate-600 dark:text-white/60 text-sm">Connecting to shop...</p>
        </div>
      </div>
    );
  }

  if (error && step === 'greeting') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0d1117' }}>
        <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-8 text-center max-w-sm">
          <i className="bx bx-error-circle text-5xl text-red-400 mb-4"></i>
          <h2 className="text-slate-800 dark:text-white font-bold text-xl mb-2">Shop Not Found</h2>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const activeCropFile = files.find(f => f.id === cropFileId);



  const handleManualRefresh = async () => {
    if (!jobId) return;
    const { data } = await supabase.from('jobs').select('status').eq('id', jobId).single();
    if (data && data.status !== 'pending') {
      router.push(`/s/${params.slug}/status/${jobId}`);
    } else {
      addMessage({ type: 'bot', content: 'Status checked. Still pending shopkeeper approval.' });
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => {
        if (step !== 'intro' && step !== 'success' && step !== 'uploading') {
          e.preventDefault();
          setIsDragging(true);
        }
      }}
      className={`${isDarkMode ? 'dark' : ''} min-h-screen flex flex-col relative bg-[#f0f2f5] dark:bg-[#0b141a] text-slate-800 dark:text-white transition-colors duration-500`}
    >
      {/* ── Toast Notifications ──────────────────────────────────────── */}
      {toasts.length > 0 && (
        <div className="fixed top-16 inset-x-0 flex flex-col items-center gap-1.5 z-50 pointer-events-none px-4">
          {toasts.map(t => (
            <div
              key={t.id}
              className="glass-strong elev-3 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-slate-800 dark:text-white animate-in fade-in slide-in-from-top-3 duration-200"
            >
              <i className={`bx ${t.icon} text-sm text-emerald-400`}></i>
              {t.msg}
            </div>
          ))}
        </div>
      )}

      {/* Drag & Drop Glassmorphic Overlay */}
      {isDragging && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              await addFiles(Array.from(e.dataTransfer.files));
            }
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md border-4 border-dashed border-emerald-500 m-4 rounded-3xl animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="bg-[#1f2c34] p-8 rounded-full shadow-2xl mb-4 animate-bounce">
            <i className="bx bx-upload text-5xl text-emerald-400"></i>
          </div>
          <p className="text-slate-800 dark:text-white font-black text-xl">Drop files here to upload</p>
          <p className="text-slate-600 dark:text-white/60 text-sm mt-1">PDF, Word, Excel, Images (Max 25MB)</p>
        </div>
      )}

      {/* Crop Modal */}
      {cropFileId && activeCropFile && activeCropFile.previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="glass-nav flex items-center justify-between p-4">
            <button onClick={() => setCropFileId(null)} className="text-slate-600 dark:text-white/70 hover:text-slate-800 dark:text-white">
              <i className="bx bx-arrow-back text-2xl"></i>
            </button>
            <h3 className="text-slate-800 dark:text-white font-bold">Crop & Rotate</h3>
            <button onClick={() => setCropFileId(null)} className="text-slate-600 dark:text-white/70 hover:text-slate-800 dark:text-white text-sm">Cancel</button>
          </div>
          <div className="relative flex-1">
            {activeCrop && (
              <Cropper
                image={activeCropFile.previewUrl}
                crop={activeCrop.crop}
                zoom={activeCrop.zoom}
                rotation={activeCrop.rotation}
                onCropChange={(c) => setActiveCrop(prev => prev ? { ...prev, crop: c } : prev)}
                onZoomChange={(z) => setActiveCrop(prev => prev ? { ...prev, zoom: z } : prev)}
                onCropComplete={(_area, pixels) => setActiveCrop(prev => prev ? { ...prev, croppedAreaPixels: pixels } : prev)}
              />
            )}
          </div>
          <div className="glass-nav p-4 space-y-3">
            <div className="flex gap-2 justify-center">
              {[-90, -45, 45, 90].map(deg => (
                <button key={deg} onClick={() => setActiveCrop(prev => prev ? { ...prev, rotation: (prev.rotation + deg) % 360 } : prev)}
                  className="px-3 py-2 bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white text-sm rounded-xl hover:bg-slate-300 dark:bg-white/20 transition">{deg > 0 ? `+${deg}°` : `${deg}°`}</button>
              ))}
            </div>
            <button
              onClick={async () => {
                if (!activeCrop?.croppedAreaPixels || !activeCropFile.previewUrl) return;
                try {
                  const cropped = await getCroppedImg(activeCropFile.previewUrl, activeCrop.croppedAreaPixels, activeCrop.rotation);
                  const newUrl = URL.createObjectURL(cropped);
                  if (activeCropFile.previewUrl) URL.revokeObjectURL(activeCropFile.previewUrl);
                  setFiles(prev => prev.map(f => f.id === cropFileId ? { ...f, file: cropped, previewUrl: newUrl } : f));
                  setCropFileId(null); setActiveCrop(null);
                } catch (e) { console.error('Crop failed:', e); }
              }}
              className="clay-accent w-full py-3 text-slate-800 dark:text-white font-bold rounded-clay hover:brightness-110 transition shadow-glow-success"
            >✂️ Crop &amp; Done</button>
          </div>
        </div>
      )}

      {/* Passport Modal */}
      {passportModalFileId && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-end sm:justify-center items-center sm:p-4">
          <div className="glass-strong elev-5 w-full sm:max-w-sm sm:rounded-clay rounded-t-3xl p-6 animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-slate-800 dark:text-white font-bold text-lg">Passport Photo Setup</h3>
              <button onClick={() => setPassportModalFileId(null)} className="text-slate-500 dark:text-white/50 hover:text-slate-800 dark:text-white">
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            
            <p className="text-slate-600 dark:text-white/70 text-sm mb-4">Select the size of passport photo you need:</p>
            
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 mb-6">
              {PASSPORT_SIZES.map(size => {
                const copies = Math.floor(140 / size.widthMm) * Math.floor(90 / size.heightMm);
                return (
                  <button
                    key={size.id}
                    onClick={() => {
                      updateFileSetting(passportModalFileId, 'action', 'passport_photo');
                      updateFileSetting(passportModalFileId, 'passportConfig', { size: size.label, copiesPerPage: copies });
                      setPassportModalFileId(null);
                    }}
                    className="w-full text-left p-3 rounded-xl border border-white/5 hover:border-amber-500/50 hover:bg-amber-500/10 transition flex items-center justify-between"
                  >
                    <div>
                      <p className="text-slate-800 dark:text-white font-semibold text-sm">{size.label}</p>
                      <p className="text-slate-500 dark:text-white/50 text-xs mt-0.5">{size.widthMm} x {size.heightMm} mm</p>
                    </div>
                    <div className="bg-slate-200 dark:bg-white/5 px-2 py-1 rounded text-amber-400 font-bold text-xs">
                      {copies} copies
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Chat Header */}
      <div className="glass-nav sticky top-0 z-10 elev-3" style={{ background: 'linear-gradient(180deg, rgba(31,44,52,0.92), rgba(17,27,33,0.85))' }}>
        {/* Main header row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full clay-accent flex items-center justify-center shrink-0 shadow-glow-success">
            <i className="bx bx-printer text-slate-800 dark:text-white text-lg"></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-800 dark:text-white font-bold text-sm truncate">{shopName || 'Print Shop'}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-500 dark:text-white/50 text-xs">Print Bot · Online</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Help button */}
            <button
              onClick={() => { setGuideOpen(true); setGuideStep(0); }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-slate-200 dark:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              title="How to use"
            >
              <i className="bx bx-help-circle text-xl"></i>
            </button>
            <i className="bx bx-dots-vertical-rounded text-xl text-slate-500 dark:text-white/40 hover:text-slate-800 dark:text-white cursor-pointer transition"></i>
          </div>
        </div>

        {/* ── Step Progress Bar ────────────────────────────────────── */}
        {step !== 'intro' && step !== 'greeting' && (
          <div className="flex items-center px-4 pb-3 gap-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {[
              { id: 'files',   label: 'Upload',  icon: 'bx-paperclip',    active: step === 'files'   },
              { id: 'notes',   label: 'Notes',   icon: 'bx-edit',         active: step === 'notes'   },
              { id: 'confirm', label: 'Review',  icon: 'bx-check-double', active: step === 'confirm' || step === 'uploading' },
              { id: 'success', label: 'Done',    icon: 'bx-check-circle', active: step === 'success' },
            ].map((s, i, arr) => {
              const stepOrder = ['files','notes','confirm','uploading','success'];
              const done = stepOrder.indexOf(step) > stepOrder.indexOf(s.id);
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{
                        background: s.active ? '#25D366' : done ? 'rgba(37,211,102,0.25)' : 'rgba(255,255,255,0.07)',
                        border: s.active ? '2px solid #25D366' : done ? '2px solid rgba(37,211,102,0.4)' : '2px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <i className={`bx ${done ? 'bx-check' : s.icon} text-xs`}
                        style={{ color: s.active ? '#fff' : done ? '#25D366' : 'rgba(255,255,255,0.25)' }}></i>
                    </div>
                    <span className="text-[9px] mt-0.5 font-semibold" style={{ color: s.active ? '#25D366' : done ? 'rgba(37,211,102,0.6)' : 'rgba(255,255,255,0.2)' }}>
                      {s.label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="flex-1 h-px mx-1 transition-all duration-300"
                      style={{ background: done ? 'rgba(37,211,102,0.4)' : 'rgba(255,255,255,0.08)' }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Initial Welcome Overlay */}
      {step === 'intro' && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="glass-strong elev-5 w-full rounded-clay p-6 animate-in slide-in-from-bottom-8 duration-500 max-w-sm mb-20 sm:mb-0">
            <div className="w-16 h-16 rounded-full clay-accent flex items-center justify-center mb-6 mx-auto shadow-glow-success animate-float">
              <i className="bx bx-store text-4xl text-slate-800 dark:text-white"></i>
            </div>
            <h2 className="text-h2 font-black text-slate-800 dark:text-white text-center mb-2">Welcome to {shopName || 'Print Shop'}</h2>
            <p className="text-slate-600 dark:text-white/60 text-center text-sm mb-6">Enter your name to start your print order</p>

            <form onSubmit={(e) => { e.preventDefault(); handleStartChat(); }}>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your Name" autoFocus
                className="neu-inset w-full text-slate-800 dark:text-white px-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 mb-4 text-center font-bold text-lg bg-transparent"
              />
              <button type="submit" disabled={name.length < 2}
                className="clay-accent w-full py-4 disabled:opacity-50 text-slate-800 dark:text-white font-black rounded-clay transition active:scale-95 flex items-center justify-center gap-2 shadow-glow-success hover:brightness-110"
              >
                Start <i className="bx bx-right-arrow-alt text-xl"></i>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1" style={{ background: 'linear-gradient(180deg, #0b141a 0%, #0b141a 100%)' }}>
        {/* Wallpaper-style subtle grid */}
        <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '20px 20px', zIndex: 0 }}></div>

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            files={files}
            updateFileSetting={updateFileSetting}
            addToast={addToast}
            setCropFileId={(id) => {
              setCropFileId(id);
              const f = files.find(fi => fi.id === id);
              if (f) setActiveCrop({ fileId: id, crop: { x: 0, y: 0 }, zoom: 1, rotation: 0, croppedAreaPixels: null });
            }}
            setPassportModalFileId={setPassportModalFileId}
          />
        ))}

        {/* Typing indicator */}
        {isBotTyping && (
          <div className="flex items-end gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center shrink-0">
              <i className="bx bx-printer text-slate-800 dark:text-white text-xs"></i>
            </div>
            <div className="glass px-4 py-3 rounded-2xl rounded-bl-sm shadow-elev-1" style={{ maxWidth: '60px' }}>
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        {/* Upload progress */}
        {step === 'uploading' && uploadProgress && (
          <div className="flex justify-center my-3">
            <div className="bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/70 text-xs px-4 py-2 rounded-full flex items-center gap-2">
              <i className="bx bx-loader-alt animate-spin text-sm"></i>
              {uploadProgress}
            </div>
          </div>
        )}

        {/* Summary card (confirm step) */}
        {step === 'confirm' && (
          <div className="flex items-end gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center shrink-0">
              <i className="bx bx-printer text-slate-800 dark:text-white text-xs"></i>
            </div>
            <div className="glass-strong elev-3 rounded-2xl rounded-bl-sm overflow-hidden" style={{ maxWidth: '85%' }}>
              <div className="p-3 border-b border-slate-300 dark:border-white/10 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #075E54, #128C7E)' }}>
                <i className="bx bx-receipt text-slate-800 dark:text-white text-lg"></i>
                <span className="text-slate-800 dark:text-white font-bold text-sm">Print Job Summary</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-white/50">Customer</span>
                  <span className="text-slate-800 dark:text-white font-semibold">{name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-white/50">Files</span>
                  <span className="text-slate-800 dark:text-white font-semibold">{files.length} file(s)</span>
                </div>
                {/* Per-group summary */}
                {GROUP_SLOTS.filter(g => files.some(f => f.groupId === g.id)).map(g => {
                  const gFiles = files.filter(f => f.groupId === g.id);
                  return (
                    <div key={g.id} className="rounded-xl p-2.5 text-xs" style={{ background: g.bg, border: `1px solid ${g.border}` }}>
                      <p className="font-bold mb-1.5 flex items-center gap-1" style={{ color: g.color }}>
                        <i className="bx bxs-file-pdf text-sm"></i> {g.label} → PDF ({gFiles.length} files)
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-white/60">
                        {gFiles.map(f => <li key={f.id} className="truncate">{f.file.name}</li>)}
                      </ul>
                    </div>
                  );
                })}
                {/* Ungrouped files */}
                {files.filter(f => !f.groupId).map(f => (
                  <div key={f.id} className="bg-slate-200 dark:bg-white/5 rounded-xl p-2 text-xs">
                    <p className="text-slate-800 dark:text-white font-medium truncate">{f.file.name}</p>
                    <p className="text-slate-500 dark:text-white/40 mt-0.5">{f.color === 'bw' ? '⬛ B&W' : '🎨 Color'} · {f.paperSize} · {f.copies}× · {f.pageRange === 'all' ? 'All pages' : `Pages: ${f.pageRange}`}</p>
                  </div>
                ))}
                {notes && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 text-xs">
                    <span className="text-amber-300">📝 Note: {notes}</span>
                  </div>
                )}
                {error && (
                  <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-2 text-xs text-red-300">
                    {error}
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  className="clay-accent w-full py-3 font-bold text-sm text-slate-800 dark:text-white rounded-clay flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95 shadow-glow-success"
                >
                  <i className="bx bx-paper-plane text-lg"></i>
                  Submit Print Order
                </button>
                <button
                  onClick={() => { setStep('files'); setError(null); }}
                  className="w-full py-2 text-xs text-slate-500 dark:text-white/50 hover:text-slate-700 dark:text-white/80 transition"
                >← Edit files</button>
              </div>
            </div>
          </div>
        )}

        {/* Success step */}
        {step === 'success' && jobId && (
          <div className="flex justify-center my-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="glass-strong elev-5 rounded-clay overflow-hidden shadow-glow-success w-full max-w-xs">
              <div className="p-4 text-center" style={{ background: 'linear-gradient(135deg, #075E54, #128C7E)' }}>
                <div className="w-16 h-16 bg-slate-300 dark:bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 animate-float">
                  <span className="text-3xl">🎉</span>
                </div>
                <h3 className="text-slate-800 dark:text-white font-black text-xl">You're in queue!</h3>
                <p className="text-slate-600 dark:text-white/70 text-sm mt-1">Show this to the shopkeeper</p>
                <div className="mt-4 bg-slate-300 dark:bg-white/15 rounded-2xl py-4 shimmer-border">
                  <p className="text-slate-600 dark:text-white/60 text-xs uppercase tracking-widest">Your Token</p>
                  <p className="text-slate-800 dark:text-white font-black text-5xl mt-1 font-mono">#{tokenNumber}</p>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <button
                  onClick={() => { window.location.href = `/s/${params.slug}/status/${jobId}`; }}
                  className="clay-accent w-full py-3 text-sm font-bold rounded-clay transition-all hover:brightness-110 active:scale-95 text-slate-800 dark:text-white shadow-glow-success"
                >
                  📱 Track My Order →
                </button>
                <p className="text-center text-slate-400 dark:text-white/30 text-xs">Powered by Print Sathi</p>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      {/* Bottom Input Bar */}
      {step !== 'success' && step !== 'uploading' && step !== 'intro' && (
        <div className="glass-strong sticky bottom-0 z-10 elev-4" style={{ background: 'linear-gradient(0deg, rgba(31,44,52,0.94), rgba(17,27,33,0.82))' }}>

          {/* ── File indicator strip ──────────────────────────────────── */}
          {step === 'files' && files.length > 0 && (
            <div
              className="flex items-center gap-2 px-3 pt-2.5 pb-1 overflow-x-auto"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="shrink-0 text-[11px] font-bold text-slate-500 dark:text-white/40 whitespace-nowrap uppercase tracking-wider">
                {files.length} file{files.length !== 1 ? 's' : ''}:
              </span>
              {files.map(f => {
                const grp = f.groupId ? GROUP_SLOTS.find(g => g.id === f.groupId) : null;
                return (
                  <div
                    key={f.id}
                    className="shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={grp
                      ? { background: grp.bg, border: `1px solid ${grp.border}`, color: grp.color }
                      : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }
                    }
                  >
                    {grp && <span className="text-[9px] font-black">{grp.id}</span>}
                    <span>{getFileTypeBadge(f.file).emoji}</span>
                    <span className="max-w-[72px] truncate">{f.file.name}</span>
                    <button
                      onClick={() => removeFile(f.id)}
                      className="hover:text-red-400 transition ml-0.5 opacity-50 hover:opacity-100"
                      aria-label="Remove file"
                    >
                      <i className="bx bx-x text-sm"></i>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Group Summary Bar ─────────────────────────────────────── */}
          {step === 'files' && GROUP_SLOTS.some(g => files.some(f => f.groupId === g.id)) && (
            <div className="flex items-center gap-2 px-3 py-1.5 overflow-x-auto" style={{ background: '#111b21', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <i className="bx bxs-file-pdf text-xs text-slate-400 dark:text-white/30 shrink-0"></i>
              {GROUP_SLOTS.filter(g => files.some(f => f.groupId === g.id)).map(g => {
                const n = files.filter(f => f.groupId === g.id).length;
                return (
                  <span key={g.id} className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: g.bg, color: g.color, border: `1px solid ${g.border}` }}>
                    {g.label}: {n} → PDF
                  </span>
                );
              })}
              {files.filter(f => !f.groupId).length > 0 && (
                <span className="shrink-0 text-[10px] text-slate-400 dark:text-white/30 whitespace-nowrap">
                  +{files.filter(f => !f.groupId).length} separate
                </span>
              )}
            </div>
          )}

          <div className="px-3 py-3 flex items-end gap-2">
            {/* Hidden file input — always present for file steps */}
            {(step === 'files' || step === 'confirm') && (
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
            )}

            {/* Paperclip: show when no files yet, or on confirm step */}
            {(step === 'confirm' || (step === 'files' && files.length === 0)) && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-11 h-11 rounded-full flex items-center justify-center text-slate-600 dark:text-white/60 hover:text-slate-800 dark:text-white hover:bg-slate-200 dark:bg-white/10 transition-all shrink-0"
                aria-label="Attach files"
              >
                <i className="bx bx-paperclip text-2xl rotate-[-45deg]"></i>
              </button>
            )}

            {/* notes step */}
            {step === 'notes' && (
              <>
                <div className="flex-1 flex gap-2 items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendNotes()}
                    placeholder="Special instructions (optional)..."
                    maxLength={250}
                    className="flex-1 rounded-full px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                    style={{ background: '#2a3942' }}
                    autoFocus
                  />
                  <button
                    onClick={() => { setInputValue(''); handleSendNotes(); }}
                    className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 dark:text-white/70 hover:text-slate-800 dark:text-white transition-all"
                    style={{ background: '#2a3942' }}
                  >Skip</button>
                </div>
                <button
                  onClick={handleSendNotes}
                  className="clay-accent w-11 h-11 rounded-full flex items-center justify-center text-slate-800 dark:text-white transition-all active:scale-90 shrink-0 shadow-glow-success hover:brightness-110"
                >
                  <i className="bx bx-send text-lg"></i>
                </button>
              </>
            )}

            {/* files step */}
            {step === 'files' && (
              <div className="flex-1 flex gap-2">
                {files.length === 0 ? (
                  /* No files yet — prompt */
                  <div className="flex-1 flex items-center px-4 py-3 rounded-full text-sm text-slate-400 dark:text-white/30" style={{ background: '#2a3942' }}>
                    Tap 📎 to attach files...
                  </div>
                ) : (
                  /* Files attached — Add more | Organise | Done */
                  <>
                    <Tooltip text="Add more files">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="shrink-0 flex items-center gap-1 px-3 py-3 rounded-full text-sm font-bold text-slate-600 dark:text-white/60 hover:text-slate-800 dark:text-white transition-all active:scale-95"
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <i className="bx bx-plus text-lg"></i>
                      </button>
                    </Tooltip>

                    {/* Organise button with first-time coach mark */}
                    <div className="relative shrink-0">
                      {!seenHints.has('organise') && files.some(f => f.file.type.startsWith('image/')) && (
                        <CoachMark text="Tap to group photos into PDFs" direction="up" color="#818cf8" onDismiss={() => markSeen('organise')} />
                      )}
                      <Tooltip text="Group files into combined PDFs">
                        <button
                          onClick={() => { setOrganiserOpen(true); markSeen('organise'); }}
                          className="flex items-center gap-1.5 px-4 py-3 rounded-full text-sm font-bold transition-all active:scale-95"
                          style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.35)' }}
                        >
                          <i className="bx bx-layer text-lg"></i>
                          Organise
                        </button>
                      </Tooltip>
                    </div>

                    {/* Done button with coach mark when files ready */}
                    <div className="relative flex-1">
                      {!seenHints.has('done') && files.length > 0 && (
                        <CoachMark text="Tap when ready to send" direction="up" color="#25D366" onDismiss={() => markSeen('done')} />
                      )}
                      <button
                        onClick={() => { handleDoneWithFiles(); markSeen('done'); }}
                        className="clay-accent w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold text-slate-800 dark:text-white transition-all active:scale-95 hover:brightness-110 shadow-glow-success"
                      >
                        <i className="bx bx-check-circle text-lg"></i>
                        Done ({files.length})
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* confirm step */}
            {step === 'confirm' && (
              <div className="flex-1 flex items-center px-4 py-3 rounded-full text-sm text-slate-400 dark:text-white/30" style={{ background: '#2a3942' }}>
                Review your order above...
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Floating ? help button ───────────────────────────────────── */}
      {step === 'files' && files.length > 0 && !organiserOpen && !guideOpen && (
        <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2">
          {/* Coach mark on ? button — shows once */}
          {!seenHints.has('help-btn') && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-1000">
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl rounded-br-sm text-xs font-bold text-slate-800 dark:text-white shadow-2xl"
                style={{ background: 'rgba(129,140,248,0.95)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping absolute"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0 relative"></span>
                Need help? Tap me!
              </div>
              <div className="flex justify-end mr-2"><div className="w-0 h-0" style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(129,140,248,0.95)' }}></div></div>
            </div>
          )}
          <button
            onClick={() => { setGuideOpen(true); setGuideStep(0); markSeen('help-btn'); }}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 animate-in fade-in zoom-in-90 duration-300"
            style={{ background: 'rgba(129,140,248,0.92)', color: 'white', border: '2px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 24px rgba(129,140,248,0.5)' }}
            aria-label="How to use groups"
          >
            <i className="bx bx-help-circle text-2xl"></i>
          </button>
        </div>
      )}

      {/* ── Group Organiser Sheet ─────────────────────────────────────── */}
      <AnimatePresence>
        {organiserOpen && (
          <GroupOrganiserSheet
            files={files}
            onAssign={assignGroup}
            onClose={() => setOrganiserOpen(false)}
            onRemove={removeFile}
          />
        )}
      </AnimatePresence>

      {/* ── Floating Guide ────────────────────────────────────────────── */}
      <AnimatePresence>
        {guideOpen && (
          <FloatingGuide
            step={guideStep}
            onNext={() => setGuideStep(s => s + 1)}
            onClose={() => {
              setGuideOpen(false);
              setGuideDismissed(true);
            }}
            onOpenOrganiser={() => {
              setGuideOpen(false);
              setGuideDismissed(true);
              setOrganiserOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Custom Rocket Loading Overlay */}
      {uploadStatus !== 'idle' && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/75 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <div className="relative flex flex-col items-center justify-center p-8 rounded-clay glass-strong border border-slate-300 dark:border-white/10 shadow-elev-5 max-w-sm w-full mx-4 overflow-hidden">
            {/* Mesh background effect inside loader */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)]" />

            {uploadStatus === 'uploading' ? (
                <div className="flex flex-col items-center">
                  {/* Rocket Icon Container */}
                  <div className="w-24 h-24 mb-6 relative">
                    <div className="absolute inset-0 z-10" style={{
                      animation: rocketPhase === 'entering' ? 'rocketSlideIn 1s cubic-bezier(0.1, 0.9, 0.2, 1) forwards' : 
                                rocketPhase === 'liftoff' ? 'rocketLiftoff 1s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards' :
                                rocketPhase === 'thrust' ? 'rocketThrustShake 0.5s linear infinite, rocketThrustDrift 3s ease-out forwards' :
                                'rocketWobble 2s ease-in-out infinite'
                    }}>
                      {/* Thrust flames, only show when uploading */}
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ opacity: rocketPhase === 'thrust' ? 1 : 0, transition: 'opacity 0.3s' }}>
                        <div className="w-4 h-8 bg-gradient-to-b from-yellow-300 via-orange-500 to-red-600 rounded-full blur-[2px] animate-pulse"></div>
                        <div className="w-2 h-6 bg-yellow-200 rounded-full absolute top-1 blur-[1px]" style={{ animation: 'flameCore 0.3s infinite alternate' }}></div>
                        <div className="flex gap-2 absolute top-6">
                           <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" style={{ animationDuration: '0.4s' }}></span>
                           <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" style={{ animationDuration: '0.5s' }}></span>
                        </div>
                      </div>
                      
                      {/* SVG Rocket */}
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-1/2 -translate-x-1/2 z-10 drop-shadow-lg" style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.3))' }}>
                        <path d="M12.9839 21.0503L12.0125 18.0645C11.9567 17.8929 11.8928 17.7251 11.8211 17.5615C11.6248 17.1132 11.3789 16.6901 11.0898 16.3033L9.61057 14.3218L6.28913 13.0642C5.97541 12.9454 5.67269 12.8028 5.3831 12.6375C4.94582 12.3879 4.54228 12.0837 4.1824 11.7317L2 9.59868C2 9.59868 6.30545 8.16361 8.78311 6.32675C11.3651 4.41249 14.8398 2 14.8398 2C14.8398 2 13.9782 5.62688 14.8398 8.44199C15.6883 11.2144 19.4674 12.8753 19.4674 12.8753L16.2731 16.0378C15.7483 16.5574 15.3529 17.1856 15.1166 17.8769L14.0759 20.9197C14.0042 21.1293 13.9168 21.3328 13.8142 21.5287L12.9839 21.0503Z" fill="#CBD5E1"/>
                        <path d="M14.8398 2C14.8398 2 18.6657 5.75389 21.338 11.6376L22.1818 13.496C22.2536 13.6543 22.3168 13.8159 22.3712 13.9804L23 15.8817L19.4674 12.8753C19.4674 12.8753 15.6883 11.2144 14.8398 8.44199C13.9782 5.62688 14.8398 2 14.8398 2Z" fill="#F43F5E"/>
                        <path d="M11.6961 8.87786C12.3276 9.38714 13.2504 9.28621 13.7573 8.65239C14.2642 8.01857 14.1632 7.09139 13.5317 6.58211C12.9001 6.07284 11.9774 6.17376 11.4704 6.80758C10.9635 7.4414 11.0645 8.36858 11.6961 8.87786Z" fill="#3B82F6"/>
                      </svg>
                    </div>
                  </div>

                  <h3 className="text-slate-800 dark:text-white font-black text-xl mb-2 tracking-tight">Uploading Order...</h3>
                  <p className="text-slate-600 dark:text-white/60 text-xs font-mono text-center max-w-[240px] px-2 animate-pulse">
                    {uploadProgress}
                  </p>
                  
                  {/* Progress bar */}
                  <div className="w-48 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mt-4 overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadPercent}%` }}></div>
                  </div>
                </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                {/* Checked circular ring */}
                <div className="relative w-24 h-24 flex items-center justify-center mb-6 animate-scale-in">
                  <div className="absolute inset-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center">
                    <svg className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-tick-draw" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                       <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                </div>

                <h3 className="text-emerald-400 font-black text-2xl mb-1 tracking-tight animate-scale-in" style={{ animationDelay: '100ms' }}>Order Confirmed!</h3>
                <p className="text-slate-500 dark:text-white/40 text-xs font-semibold mb-3 mt-1 animate-scale-in" style={{ animationDelay: '200ms' }}>Token: #{tokenNumber}</p>
                <p className="text-slate-600 dark:text-white/60 text-xs animate-scale-in px-4" style={{ animationDelay: '300ms' }}>
                  Redirecting to live status tracker...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Coach Mark — tiny floating callout pointing at a UI element ─────────────
function CoachMark({ text, direction = 'up', color = '#25D366', onDismiss }: {
  text: string;
  direction?: 'up' | 'down';
  color?: string;
  onDismiss?: () => void;
}) {
  return (
    <div className={`absolute ${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in-90 duration-200`} style={{ whiteSpace: 'nowrap' }}>
      {direction === 'down' && <div className="flex justify-center"><div className="w-0 h-0" style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: `6px solid ${color}` }}></div></div>}
      <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 dark:text-white shadow-2xl" style={{ background: color }}>
        <span className="w-2 h-2 rounded-full bg-white/50 animate-ping absolute left-2.5"></span>
        <span className="w-2 h-2 rounded-full bg-white shrink-0 relative"></span>
        {text}
        {onDismiss && <button onClick={onDismiss} className="ml-1 opacity-60 hover:opacity-100"><i className="bx bx-x text-sm"></i></button>}
      </div>
      {direction === 'up' && <div className="flex justify-center"><div className="w-0 h-0" style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `6px solid ${color}` }}></div></div>}
    </div>
  );
}

// ── Tooltip — hover/tap info on a button ─────────────────────────────────────
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onTouchStart={() => setShow(s => !s)}>
      {children}
      {show && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in duration-150" style={{ whiteSpace: 'nowrap' }}>
          <div className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-800 dark:text-white" style={{ background: 'rgba(10,20,30,0.95)', border: '1px solid rgba(255,255,255,0.12)' }}>{text}</div>
          <div className="flex justify-center"><div className="w-0 h-0" style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid rgba(10,20,30,0.95)' }}></div></div>
        </div>
      )}
    </div>
  );
}

// ── GUIDE STEPS ─────────────────────────────────────────────────────────────
const GUIDE_STEPS = [
  {
    icon: 'bx-layer',
    iconColor: '#818cf8',
    title: 'Combine photos into PDFs',
    body: 'You can group multiple photos together and they\'ll be merged into a single PDF — great for printing 3 photos as one document.',
    visual: (
      <div className="flex gap-2 justify-center my-3">
        {['📷','📷','📷'].map((e,i) => (
          <div key={i} className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.4)' }}>{e}</div>
        ))}
        <div className="flex items-center text-slate-500 dark:text-white/40"><i className="bx bx-right-arrow-alt text-2xl"></i></div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'rgba(129,140,248,0.2)', border: '1px solid rgba(129,140,248,0.5)' }}>📄</div>
      </div>
    ),
  },
  {
    icon: 'bx-grid-alt',
    iconColor: '#34d399',
    title: 'Multiple groups at once',
    body: 'You can have up to 4 separate groups. Group A → one PDF, Group B → another PDF. Perfect for sending "3 passport photos + 4 other photos" in one order.',
    visual: (
      <div className="my-3 space-y-1.5">
        {[
          { id: 'A', color: '#818cf8', bg: 'rgba(129,140,248,0.15)', label: 'Group A', files: ['📷','📷','📷'] },
          { id: 'B', color: '#34d399', bg: 'rgba(52,211,153,0.15)',  label: 'Group B', files: ['📷','📷'] },
        ].map(g => (
          <div key={g.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: g.bg, border: `1px solid ${g.color}40` }}>
            <span className="text-xs font-black" style={{ color: g.color }}>{g.label}</span>
            <span className="text-slate-400 dark:text-white/30 text-xs mx-1">→</span>
            {g.files.map((e,i) => <span key={i} className="text-base">{e}</span>)}
            <span className="text-slate-400 dark:text-white/30 text-xs mx-1">→</span>
            <span style={{ color: g.color }} className="text-xs font-bold">1 PDF</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: 'bxs-hand-right',
    iconColor: '#f59e0b',
    title: 'Tap Organise to manage groups',
    body: 'Tap the **Organise** button at the bottom to open the group manager. Drag or tap files into groups — or leave them in "Print Separately" to print individually.',
    visual: (
      <div className="my-3 flex justify-center">
        <div className="flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm" style={{ background: 'rgba(129,140,248,0.2)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.4)' }}>
          <i className="bx bx-layer text-lg"></i> Organise
        </div>
      </div>
    ),
  },
];

// ── Floating Guide ───────────────────────────────────────────────────────────
function FloatingGuide({ step, onNext, onClose, onOpenOrganiser }: {
  step: number;
  onNext: () => void;
  onClose: () => void;
  onOpenOrganiser: () => void;
}) {
  const s = GUIDE_STEPS[step];
  const isLast = step === GUIDE_STEPS.length - 1;
  if (!s) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-6"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="glass-strong elev-5 w-full max-w-sm rounded-clay overflow-hidden"
        initial={{ y: 40, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pt-4">
          {GUIDE_STEPS.map((_, i) => (
            <div key={i} className="h-1 rounded-full transition-all duration-300"
              style={{ width: i === step ? '20px' : '6px', background: i === step ? s.iconColor : 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>

        <div className="px-6 pt-4 pb-2">
          {/* Icon */}
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 mx-auto"
            style={{ background: `${s.iconColor}20`, border: `1.5px solid ${s.iconColor}50` }}>
            <i className={`bx ${s.icon} text-2xl`} style={{ color: s.iconColor }}></i>
          </div>

          <h3 className="text-slate-800 dark:text-white font-black text-lg text-center leading-snug mb-2">{s.title}</h3>
          <p className="text-slate-600 dark:text-white/60 text-sm text-center leading-relaxed"
            dangerouslySetInnerHTML={{ __html: s.body.replace(/\*\*(.*?)\*\*/g, '<strong style="color:white">$1</strong>') }} />

          {/* Visual illustration */}
          {s.visual}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all hover:bg-slate-200 dark:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Skip
          </button>
          {isLast ? (
            <button onClick={onOpenOrganiser}
              className="flex-2 flex-[2] py-3 px-6 rounded-2xl text-sm font-black transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
              style={{ background: s.iconColor, color: '#fff' }}>
              <i className="bx bx-layer text-lg"></i> Open Organiser
            </button>
          ) : (
            <button onClick={onNext}
              className="flex-2 flex-[2] py-3 px-6 rounded-2xl text-sm font-black transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
              style={{ background: s.iconColor, color: '#fff' }}>
              Next <i className="bx bx-right-arrow-alt text-lg"></i>
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Group Organiser Sheet ────────────────────────────────────────────────────
function GroupOrganiserSheet({ files, onAssign, onClose, onRemove }: {
  files: FileWithSettings[];
  onAssign: (fileId: string, groupId: GroupId | null) => void;
  onClose: () => void;
  onRemove: (fileId: string) => void;
}) {
  const [dragFileId, setDragFileId] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const containers: { id: GroupId | null; label: string; color: string; bg: string; border: string; icon: string }[] = [
    ...GROUP_SLOTS.map(g => ({ ...g, icon: 'bxs-file-pdf' })),
    { id: null, label: 'Print Separately', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.12)', icon: 'bx-printer' },
  ];

  const FileThumbnail = ({ f, compact = false }: { f: FileWithSettings; compact?: boolean }) => {
    const grp = f.groupId ? GROUP_SLOTS.find(g => g.id === f.groupId) : null;
    return (
      <div
        draggable
        onDragStart={() => setDragFileId(f.id)}
        onDragEnd={() => setDragFileId(null)}
        className={`relative rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none transition-all ${dragFileId === f.id ? 'opacity-40 scale-95' : 'opacity-100'} ${compact ? 'w-16 h-16' : 'w-20 h-20'}`}
        style={{ border: `1.5px solid ${grp ? grp.border : 'rgba(255,255,255,0.1)'}`, background: '#1a2733', flexShrink: 0 }}
      >
        {f.previewUrl ? (
          <img src={f.previewUrl} alt={f.file.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <i className={`bx ${getFileTypeBadge(f.file).icon} text-2xl text-slate-500 dark:text-white/40`}></i>
            <span className="text-[8px] text-slate-400 dark:text-white/30 text-center px-1 leading-tight truncate w-full text-center">{f.file.name.split('.').pop()?.toUpperCase()}</span>
          </div>
        )}
        {/* Remove button */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(f.id); }}
          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-100"
          style={{ zIndex: 10 }}
        >
          <i className="bx bx-x text-xs text-slate-600 dark:text-white/70"></i>
        </button>
        {/* File name tooltip on hover */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 py-0.5 text-[8px] text-slate-600 dark:text-white/60 text-center truncate px-1">
          {f.file.name.length > 10 ? f.file.name.slice(0, 9) + '…' : f.file.name}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Sheet */}
      <motion.div
        className="glass-strong elev-5 mt-auto w-full rounded-t-3xl flex flex-col"
        style={{ maxHeight: '88vh' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      >
        {/* Handle + header */}
        <div className="flex flex-col items-center pt-3 pb-1 px-5 shrink-0">
          <div className="w-10 h-1 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.2)' }}></div>
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-slate-800 dark:text-white font-black text-lg">Organise Files</h2>
              <p className="text-slate-500 dark:text-white/40 text-xs mt-0.5">Files in the same group get combined into 1 PDF</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:bg-slate-200 dark:bg-white/10" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <i className="bx bx-x text-2xl"></i>
            </button>
          </div>

          {/* How-to callout inside the sheet */}
          <div className="mt-3 flex items-start gap-3 px-4 py-3 rounded-2xl" style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)' }}>
            <i className="bx bx-info-circle text-lg shrink-0 mt-0.5" style={{ color: '#818cf8' }}></i>
            <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <strong className="text-slate-700 dark:text-white/80">How to use:</strong> Tap the <strong className="text-slate-600 dark:text-white/70">[A] [B] [C] [D]</strong> buttons on any file to assign it to a group. Files in the same group will be merged into <strong className="text-slate-600 dark:text-white/70">one PDF</strong>. Unassigned files print separately.
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-2 px-5 py-2 overflow-x-auto shrink-0">
          {GROUP_SLOTS.map(g => {
            const n = files.filter(f => f.groupId === g.id).length;
            return (
              <div key={g.id} className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{ background: g.bg, color: g.color, border: `1px solid ${g.border}` }}>
                <i className="bx bxs-file-pdf text-xs"></i>
                {g.label}: {n} file{n !== 1 ? 's' : ''}
              </div>
            );
          })}
        </div>

        {/* Containers */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 pt-2">
          {containers.map(c => {
            const containerFiles = files.filter(f => (c.id === null ? !f.groupId : f.groupId === c.id));
            const isExpanded = expandedGroup === c.id || containerFiles.length > 0;
            return (
              <div
                key={String(c.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragFileId) { onAssign(dragFileId, c.id as GroupId | null); setDragFileId(null); }
                }}
                className="rounded-2xl overflow-hidden transition-all"
                style={{
                  background: containerFiles.length > 0 ? c.bg : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${containerFiles.length > 0 ? c.border : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {/* Container header */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3"
                  onClick={() => setExpandedGroup(expandedGroup === c.id ? null : (c.id ?? 'sep'))}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${c.color}20`, border: `1.5px solid ${c.border || c.color}` }}>
                    <i className={`bx ${c.icon} text-sm`} style={{ color: c.color }}></i>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-sm" style={{ color: c.color }}>{c.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {containerFiles.length === 0
                        ? 'Drop files here or tap a file below'
                        : `${containerFiles.length} file${containerFiles.length !== 1 ? 's' : ''}${c.id ? ' → 1 PDF' : ' → printed separately'}`}
                    </p>
                  </div>
                  {containerFiles.length === 0 ? (
                    <div className="w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center"
                      style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                      <i className="bx bx-plus text-xs text-white/25"></i>
                    </div>
                  ) : (
                    <span className="text-xs font-black rounded-full px-2 py-0.5"
                      style={{ background: `${c.color}20`, color: c.color }}>
                      {containerFiles.length}
                    </span>
                  )}
                </button>

                {/* Files inside container */}
                {containerFiles.length > 0 && (
                  <div className="px-4 pb-4">
                    <div className="flex flex-wrap gap-2">
                      {containerFiles.map(f => <FileThumbnail key={f.id} f={f} />)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Unassigned picker — all files, tap to assign */}
          <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 mb-3">Tap a file to assign group</p>
            <div className="space-y-2">
              {files.map(f => {
                const grp = f.groupId ? GROUP_SLOTS.find(g => g.id === f.groupId) : null;
                return (
                  <div key={f.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${grp ? grp.border : 'rgba(255,255,255,0.07)'}` }}>
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ background: '#1a2733' }}>
                      {f.previewUrl
                        ? <img src={f.previewUrl} alt="" className="w-full h-full object-cover" />
                        : <i className={`bx ${getFileTypeBadge(f.file).icon} text-xl text-slate-500 dark:text-white/40`}></i>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 dark:text-white text-xs font-semibold truncate">{f.file.name}</p>
                      <p className="text-slate-400 dark:text-white/30 text-[10px]">{formatSize(f.file.size)}</p>
                    </div>
                    {/* Group assign pills */}
                    <div className="flex gap-1 shrink-0">
                      {GROUP_SLOTS.map(g => (
                        <button
                          key={g.id}
                          onClick={() => onAssign(f.id, f.groupId === g.id ? null : g.id)}
                          className="w-6 h-6 rounded-md text-[10px] font-black transition-all hover:scale-110 active:scale-95"
                          style={{
                            background: f.groupId === g.id ? g.bg : 'rgba(255,255,255,0.07)',
                            color: f.groupId === g.id ? g.color : 'rgba(255,255,255,0.3)',
                            border: `1.5px solid ${f.groupId === g.id ? g.border : 'transparent'}`,
                          }}
                          title={g.label}
                        >{g.id}</button>
                      ))}
                      {f.groupId && (
                        <button
                          onClick={() => onAssign(f.id, null)}
                          className="w-6 h-6 rounded-md text-[10px] transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)', border: '1.5px solid transparent' }}
                          title="Remove from group"
                        ><i className="bx bx-x text-xs"></i></button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Done button */}
        <div className="px-5 pb-6 pt-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={onClose}
            className="clay-accent w-full py-4 rounded-clay text-base font-black text-slate-800 dark:text-white transition-all hover:brightness-110 active:scale-95 shadow-glow-success"
          >
            ✓ Done Organising
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Group Picker (in-card mini version) ─────────────────────────────────────
function GroupPicker({ currentGroupId, onChange }: {
  currentGroupId: string | null;
  onChange: (gid: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = GROUP_SLOTS.find(g => g.id === currentGroupId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 border"
        style={current
          ? { background: current.bg, color: current.color, border: `1px solid ${current.border}` }
          : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
        }
      >
        <i className="bx bx-layer text-sm"></i>
        {current ? `${current.label} → PDF` : 'Group (combine to PDF)'}
        <i className={`bx bx-chevron-${open ? 'up' : 'down'} text-sm ml-auto`}></i>
      </button>

      {open && (
        <div
          className="glass-strong elev-4 absolute bottom-full left-0 right-0 mb-1.5 rounded-xl overflow-hidden z-30 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">Assign to group</p>
          <div className="p-2 space-y-1">
            {GROUP_SLOTS.map(g => (
              <button
                key={g.id}
                onClick={() => { onChange(g.id); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition hover:brightness-110"
                style={{ background: currentGroupId === g.id ? g.bg : 'rgba(255,255,255,0.04)', color: g.color, border: `1px solid ${currentGroupId === g.id ? g.border : 'transparent'}` }}
              >
                <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black" style={{ background: g.bg, border: `1px solid ${g.border}` }}>{g.id}</span>
                {g.label}
                {currentGroupId === g.id && <i className="bx bx-check ml-auto text-sm"></i>}
              </button>
            ))}
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition text-slate-500 dark:text-white/40 hover:text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:bg-white/5"
              style={{ border: '1px solid transparent' }}
            >
              <span className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <i className="bx bx-minus text-xs"></i>
              </span>
              Print separately
              {!currentGroupId && <i className="bx bx-check ml-auto text-sm text-slate-500 dark:text-white/40"></i>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Message Bubble ─────────────────────────────────────────────────────────
function MessageBubble({
  msg, files, updateFileSetting, addToast, setCropFileId, setPassportModalFileId
}: {
  msg: ChatMessage;
  files: FileWithSettings[];
  updateFileSetting: (id: string, key: keyof FileWithSettings, value: unknown) => void;
  addToast: (msg: string, icon?: string) => void;
  setCropFileId: (id: string) => void;
  setPassportModalFileId: (id: string) => void;
}) {
  const isBot = msg.type === 'bot';
  const isUser = msg.type === 'user';
  const fileItem = msg.fileItem ? files.find(f => f.id === msg.fileItem!.id) || msg.fileItem : null;
  const isImage = fileItem?.file.type.startsWith('image/');
  const isGrouped = !!fileItem?.groupId;

  return (
    <div className={`flex items-end gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {isBot && (
        <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center shrink-0 mb-1">
          <i className="bx bx-printer text-slate-800 dark:text-white text-xs"></i>
        </div>
      )}
      {isUser && <div className="w-7 shrink-0"></div>}

      <div className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* File preview card */}
        {fileItem && (
          <div className={`rounded-2xl overflow-hidden w-full ${isBot ? 'glass elev-2' : 'shadow-md'}`} style={{ background: isBot ? undefined : '#128C7E', maxWidth: '290px' }}>
            {fileItem.previewUrl && (
              <div className="relative">
                <img src={fileItem.previewUrl} alt="preview" className="w-full max-h-40 object-cover" />
                {/* Group badge overlay */}
                {fileItem.groupId && (() => {
                  const g = GROUP_SLOTS.find(x => x.id === fileItem.groupId);
                  return g ? (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1"
                      style={{ background: g.bg, color: g.color, border: `1px solid ${g.border}`, backdropFilter: 'blur(4px)' }}>
                      <i className="bx bxs-file-pdf text-[10px]"></i>{g.label}
                    </div>
                  ) : null;
                })()}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
            )}
            <div className={`p-3 ${fileItem.previewUrl ? '' : 'pt-3'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <i className={`bx ${getFileTypeBadge(fileItem.file).icon} text-slate-800 dark:text-white text-lg`}></i>
                </div>
                <div className="overflow-hidden">
                  <p className="text-slate-800 dark:text-white text-xs font-semibold truncate">{fileItem.file.name}</p>
                  <p className="text-slate-500 dark:text-white/40 text-[10px]">{formatSize(fileItem.file.size)} · {getFileTypeBadge(fileItem.file).label}</p>
                </div>
              </div>

              {isBot && (
                <div className="space-y-2 mt-2 border-t border-slate-300 dark:border-white/10 pt-2">

                  {/* ── Group Picker (images only) ──────────────────────── */}
                  {isImage && (
                    <GroupPicker
                      currentGroupId={fileItem.groupId ?? null}
                      onChange={(gid) => {
                        updateFileSetting(fileItem.id, 'groupId', gid);
                        if (gid) {
                          // When grouped, clear passport action
                          updateFileSetting(fileItem.id, 'action', 'direct_print');
                          updateFileSetting(fileItem.id, 'passportConfig', undefined);
                          const slot = GROUP_SLOTS.find(g => g.id === gid);
                          addToast(`Added to ${slot?.label}`, 'bx-layer');
                        } else {
                          addToast('Set to print separately', 'bx-minus-circle');
                        }
                      }}
                    />
                  )}

                  {/* ── Per-file settings (hidden when grouped — group uses its own settings) */}
                  {!isGrouped && (
                    <>
                      {/* Color */}
                      <div className="flex gap-1">
                        {(['bw', 'color'] as const).map(c => (
                          <button key={c} onClick={() => updateFileSetting(fileItem.id, 'color', c)}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${fileItem.color === c ? 'text-slate-800 dark:text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/50 hover:text-slate-800 dark:text-white'}`}
                            style={fileItem.color === c ? { background: '#25D366' } : {}}
                          >{c === 'bw' ? '⬛ B&W' : '🎨 Color'}</button>
                        ))}
                      </div>
                      {/* Copies */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 dark:text-white/50 text-[11px] shrink-0">Copies:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3].map(n => (
                            <button key={n} onClick={() => updateFileSetting(fileItem.id, 'copies', n)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${fileItem.copies === n ? 'text-slate-800 dark:text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/50 hover:text-slate-800 dark:text-white'}`}
                              style={fileItem.copies === n ? { background: '#075E54' } : {}}
                            >×{n}</button>
                          ))}
                          <input type="number" min={1} max={50} value={fileItem.copies > 3 ? fileItem.copies : ''}
                            onChange={e => { const v = parseInt(e.target.value); if (v > 0) updateFileSetting(fileItem.id, 'copies', v); }}
                            placeholder="..."
                            className="w-10 h-8 rounded-lg text-xs text-center text-slate-800 dark:text-white bg-slate-200 dark:bg-white/10 border-0 outline-none focus:ring-1 focus:ring-emerald-500 placeholder-white/30"
                          />
                        </div>
                      </div>
                      {/* Paper Size */}
                      <div className="flex gap-1">
                        {['A4', 'A3', 'Letter'].map(s => (
                          <button key={s} onClick={() => updateFileSetting(fileItem.id, 'paperSize', s)}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${fileItem.paperSize === s ? 'text-slate-800 dark:text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/50 hover:text-slate-800 dark:text-white'}`}
                            style={fileItem.paperSize === s ? { background: '#075E54' } : {}}
                          >{s}</button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Grouped settings hint */}
                  {isGrouped && (() => {
                    const g = GROUP_SLOTS.find(x => x.id === fileItem.groupId);
                    return g ? (
                      <p className="text-[10px] px-2 py-1.5 rounded-lg text-center" style={{ color: g.color, background: g.bg }}>
                        Settings applied from {g.label} combined PDF
                      </p>
                    ) : null;
                  })()}

                  {/* Page range for PDFs */}
                  {fileItem.file.type === 'application/pdf' && (
                    <div>
                      <p className="text-slate-500 dark:text-white/50 text-[11px] mb-1">Pages:</p>
                      <input type="text" value={fileItem.pageRange}
                        onChange={e => updateFileSetting(fileItem.id, 'pageRange', e.target.value)}
                        placeholder="all — or e.g. 1-5, 8"
                        className="w-full px-3 py-1.5 rounded-lg text-xs text-slate-800 dark:text-white bg-slate-200 dark:bg-white/10 outline-none focus:ring-1 focus:ring-emerald-500 placeholder-white/30"
                      />
                    </div>
                  )}

                  {/* Crop (images, not grouped) */}
                  {isImage && !isGrouped && (
                    <button onClick={() => setCropFileId(fileItem.id)}
                      className="w-full py-1.5 rounded-lg text-[11px] font-bold bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 transition border border-purple-500/30 flex items-center justify-center gap-1.5"
                    >
                      <i className="bx bx-crop text-sm"></i> ✂️ Crop / Rotate
                    </button>
                  )}

                  {/* Passport Photo (images, not grouped) */}
                  {isImage && !isGrouped && (
                    <button onClick={() => {
                        if (fileItem.action === 'passport_photo') {
                          updateFileSetting(fileItem.id, 'action', 'direct_print');
                          updateFileSetting(fileItem.id, 'passportConfig', undefined);
                        } else {
                          setPassportModalFileId(fileItem.id);
                        }
                      }}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${fileItem.action === 'passport_photo' ? 'bg-amber-500 text-slate-800 dark:text-white border-amber-400' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20'}`}
                    >
                      <i className="bx bx-id-card text-lg"></i>
                      {fileItem.action === 'passport_photo' ? '🛂 Passport Photo (Selected)' : 'Make Passport Photo'}
                    </button>
                  )}
                  {fileItem.action === 'passport_photo' && fileItem.passportConfig && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 flex flex-col gap-1">
                      <span className="text-amber-400 text-[10px] font-bold">Size: {fileItem.passportConfig.size}</span>
                      <span className="text-amber-400/80 text-[10px]">Copies: {fileItem.passportConfig.copiesPerPage} per page</span>
                      <button onClick={() => setPassportModalFileId(fileItem.id)} className="text-amber-400 hover:underline text-[10px] text-right pt-1">Change Size</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Text message */}
        {msg.content && !msg.isTyping && (
          <div
            className={`px-3 py-2.5 rounded-2xl shadow-elev-1 ${isBot ? 'rounded-bl-sm glass' : 'rounded-br-sm'}`}
            style={{ background: isBot ? undefined : '#128C7E', maxWidth: fileItem ? '290px' : undefined }}
          >
            <p className="text-slate-800 dark:text-white text-sm leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br>')
              }}
            ></p>
          </div>
        )}

        {/* Timestamp + read receipt */}
        <div className={`flex items-center gap-1 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-white/25 text-[10px]">{formatTime(msg.timestamp)}</span>
          {isUser && <i className="bx bx-check-double text-[10px]" style={{ color: '#34B7F1' }}></i>}
        </div>
      </div>
    </div>
  );
}
