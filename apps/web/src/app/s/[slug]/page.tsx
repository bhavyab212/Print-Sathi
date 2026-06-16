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

type PrintAction = 'direct_print' | 'edit' | 'passport_photo';
type PrintColor = 'bw' | 'color';
type ChatStep = 'intro' | 'greeting' | 'name' | 'files' | 'combine_prompt' | 'notes' | 'confirm' | 'uploading' | 'success';

const BROWSER_DISPLAYABLE = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml', 'text/plain'];
const BLOCKED_EXTENSIONS = ['exe', 'bat', 'sh', 'cmd', 'js', 'ts', 'php', 'py', 'rb', 'go', 'c', 'cpp', 'h', 'jar', 'zip', 'rar', '7z', 'tar', 'gz'];
const MAX_FILE_SIZE_MB = 25;
const MAX_TOTAL_SIZE_MB = 50;

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
}

interface ChatMessage {
  id: string;
  type: 'bot' | 'user' | 'system';
  content: string;
  timestamp: Date;
  fileItem?: FileWithSettings;
  isTyping?: boolean;
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
  const [combineImages, setCombineImages] = useState(false);

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
      }

      const newItem: FileWithSettings = {
        id: Math.random().toString(36).slice(2),
        file, action: 'direct_print', color: 'bw', copies: 1, pageRange: 'all', paperSize: 'A4',
        previewUrl, validationWarning: validation.warning,
      };
      setFiles(prev => [...prev, newItem]);

      // Add file as user message + bot response
      addMessage({ type: 'user', content: `Attached: ${file.name}`, fileItem: newItem });
      
      setIsBotTyping(true);
      await new Promise(r => setTimeout(r, 600));
      setIsBotTyping(false);
      addMessage({ type: 'bot', content: `Got your file! Configure the print settings below:`, fileItem: newItem });
      scrollToBottom();
    }

    const imageCount = newRawFiles.filter(f => f.type.startsWith('image/')).length;
    if (imageCount > 1) {
      setStep('combine_prompt');
      await botSay(`You've uploaded ${imageCount} photos. Do you want to combine them into a single PDF document, or keep them separate?`);
    }

    if (errors.length > 0) setError(errors.join('\n'));
  }, [shopId, addMessage, scrollToBottom]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await addFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateFileSetting = (id: string, key: keyof FileWithSettings, value: unknown) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const handleCombineChoice = async (combine: boolean) => {
    setCombineImages(combine);
    addMessage({ type: 'user', content: combine ? 'Combine into 1 PDF' : 'Keep Separate' });
    setStep('files');
    await botSay(combine ? 'Great, they will be combined.' : 'Got it, they will be printed separately.');
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
    if (!shopId || !name || files.length === 0) return;
    const totalMB = files.reduce((acc, f) => acc + f.file.size, 0) / 1024 / 1024;
    if (totalMB > MAX_TOTAL_SIZE_MB) { setError(`Total size (${totalMB.toFixed(1)} MB) exceeds ${MAX_TOTAL_SIZE_MB} MB limit.`); return; }

    setStep('uploading');
    setError(null);
    addMessage({ type: 'user', content: '✅ Confirmed! Sending to shop...' });

    let jobData: { id: string } | null = null;

    try {
      let finalFiles = [...files];
      if (combineImages) {
        const imageFiles = files.filter(f => f.file.type.startsWith('image/') && f.file.type !== 'image/heic');
        const nonImageFiles = files.filter(f => !f.file.type.startsWith('image/') || f.file.type === 'image/heic');
        if (imageFiles.length > 1) {
          setUploadProgress(`Combining ${imageFiles.length} images into a PDF...`);
          const pdf = new jsPDF();
          for (let i = 0; i < imageFiles.length; i++) {
            if (i > 0) pdf.addPage();
            const imgFile = imageFiles[i].file;
            const imgDataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(imgFile);
            });
            const imgProps = pdf.getImageProperties(imgDataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgDataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          }
          const pdfBlob = pdf.output('blob');
          const pdfFile = new File([pdfBlob], 'Combined_Images.pdf', { type: 'application/pdf' });
          finalFiles = [...nonImageFiles, { id: Math.random().toString(), file: pdfFile, action: imageFiles[0].action, color: imageFiles[0].color, copies: imageFiles[0].copies, pageRange: 'all', paperSize: imageFiles[0].paperSize }];
        }
      }

      setUploadProgress('Creating your print job...');
      const startOfDay = new Date(); startOfDay.setUTCHours(0, 0, 0, 0);
      const { count } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('shop_id', shopId).gte('created_at', startOfDay.toISOString());
      let tokenNum = (count || 0) + 1;

      while (!jobData) {
        const { data, error: jobErr } = await supabase.from('jobs').insert({
          shop_id: shopId, customer_name: name.trim(), word_token: tokenNum.toString(),
          source: 'qr', status: 'pending', notes: notes.trim() || null,
        }).select('id').single();
        if (jobErr) { if (jobErr.code === '23505') tokenNum++; else throw jobErr; }
        else { jobData = data; }
      }

      for (let i = 0; i < finalFiles.length; i++) {
        const item = finalFiles[i];
        const fileSizeMB = (item.file.size / (1024 * 1024)).toFixed(1);
        setUploadProgress(`Uploading file ${i + 1} of ${finalFiles.length} (0%) - ${fileSizeMB}MB`);
        const fileExt = item.file.name.split('.').pop();
        const filePath = `${shopId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        
        const uploadData = await uploadFileWithProgress(item.file, filePath, (percent) => {
          setUploadProgress(`Uploading file ${i + 1} of ${finalFiles.length} (${percent}%) - ${fileSizeMB}MB`);
        });
        const fileType = item.file.type.includes('pdf') ? 'pdf' : item.file.type.startsWith('image/') ? 'image' : 'document';
        const { error: itemErr } = await supabase.from('job_items').insert({
          job_id: jobData.id, file_url: uploadData.path, file_name: item.file.name,
          file_type: fileType, file_size_bytes: item.file.size,
          settings: { action: item.action, color: item.color, copies: item.copies, page_range: item.pageRange !== 'all' ? item.pageRange : null, paper_size: item.paperSize, passport_config: item.passportConfig },
        });
        if (itemErr) throw itemErr;
      }

      setTokenNumber(tokenNum.toString());
      setJobId(jobData.id);
      setStep('success');
      setIsSubmitting(false);

      setIsBotTyping(true);
      await new Promise(r => setTimeout(r, 800));
      setIsBotTyping(false);
      addMessage({ type: 'bot', content: `✅ **You're #${tokenNum} in queue!**\n\nYour files have been sent to **${shopName}**. Show your token number to the shopkeeper.\n\n🎫 **Token: #${tokenNum}**` });
    } catch (err: unknown) {
      if (jobData?.id) {
        try { await supabase.from('jobs').delete().eq('id', jobData.id); } catch {}
      }
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(msg);
      setStep('confirm');
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="bx bx-printer text-3xl text-white"></i>
          </div>
          <p className="text-white/60 text-sm">Connecting to shop...</p>
        </div>
      </div>
    );
  }

  if (error && step === 'greeting') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0d1117' }}>
        <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-8 text-center max-w-sm">
          <i className="bx bx-error-circle text-5xl text-red-400 mb-4"></i>
          <h2 className="text-white font-bold text-xl mb-2">Shop Not Found</h2>
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
    <div className="min-h-screen flex flex-col" style={{ background: '#0b141a' }}>
      {/* Crop Modal */}
      {cropFileId && activeCropFile && activeCropFile.previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="flex items-center justify-between p-4 bg-[#1f2c34]">
            <button onClick={() => setCropFileId(null)} className="text-white/70 hover:text-white">
              <i className="bx bx-arrow-back text-2xl"></i>
            </button>
            <h3 className="text-white font-bold">Crop & Rotate</h3>
            <button onClick={() => setCropFileId(null)} className="text-white/70 hover:text-white text-sm">Cancel</button>
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
          <div className="p-4 bg-[#1f2c34] space-y-3">
            <div className="flex gap-2 justify-center">
              {[-90, -45, 45, 90].map(deg => (
                <button key={deg} onClick={() => setActiveCrop(prev => prev ? { ...prev, rotation: (prev.rotation + deg) % 360 } : prev)}
                  className="px-3 py-2 bg-white/10 text-white text-sm rounded-xl hover:bg-white/20 transition">{deg > 0 ? `+${deg}°` : `${deg}°`}</button>
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
              className="w-full py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition"
            >✂️ Crop &amp; Done</button>
          </div>
        </div>
      )}

      {/* Passport Modal */}
      {passportModalFileId && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-end sm:justify-center items-center sm:p-4">
          <div className="bg-[#1f2c34] w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl p-6 border border-white/10 animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-lg">Passport Photo Setup</h3>
              <button onClick={() => setPassportModalFileId(null)} className="text-white/50 hover:text-white">
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            
            <p className="text-white/70 text-sm mb-4">Select the size of passport photo you need:</p>
            
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
                      <p className="text-white font-semibold text-sm">{size.label}</p>
                      <p className="text-white/50 text-xs mt-0.5">{size.widthMm} x {size.heightMm} mm</p>
                    </div>
                    <div className="bg-white/5 px-2 py-1 rounded text-amber-400 font-bold text-xs">
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
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 shadow-lg" style={{ background: '#1f2c34' }}>
        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 shadow-md">
          <i className="bx bx-printer text-white text-lg"></i>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{shopName || 'Print Shop'}</p>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-white/50 text-xs">Print Bot · Online</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-white/50">
          <i className="bx bx-search text-xl hover:text-white cursor-pointer transition"></i>
          <i className="bx bx-dots-vertical-rounded text-xl hover:text-white cursor-pointer transition"></i>
        </div>
      </div>

      {/* Initial Welcome Overlay */}
      {step === 'intro' && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="w-full bg-[#1f2c34] rounded-3xl p-6 shadow-2xl border border-white/10 animate-in slide-in-from-bottom-8 duration-500 max-w-sm mb-20 sm:mb-0">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
              <i className="bx bx-store text-4xl text-emerald-400"></i>
            </div>
            <h2 className="text-2xl font-black text-white text-center mb-2">Welcome to {shopName || 'Print Shop'}</h2>
            <p className="text-white/60 text-center text-sm mb-6">Enter your name to start your print order</p>
            
            <form onSubmit={(e) => { e.preventDefault(); handleStartChat(); }}>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your Name" autoFocus
                className="w-full bg-[#0d1117] text-white px-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 border border-white/5 mb-4 text-center font-bold text-lg"
              />
              <button type="submit" disabled={name.length < 2}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-emerald-950 font-black rounded-2xl transition active:scale-95 flex items-center justify-center gap-2"
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
              <i className="bx bx-printer text-white text-xs"></i>
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm shadow-md" style={{ background: '#1f2c34', maxWidth: '60px' }}>
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
            <div className="bg-white/10 text-white/70 text-xs px-4 py-2 rounded-full flex items-center gap-2">
              <i className="bx bx-loader-alt animate-spin text-sm"></i>
              {uploadProgress}
            </div>
          </div>
        )}

        {/* Summary card (confirm step) */}
        {step === 'confirm' && (
          <div className="flex items-end gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center shrink-0">
              <i className="bx bx-printer text-white text-xs"></i>
            </div>
            <div className="rounded-2xl rounded-bl-sm shadow-md overflow-hidden" style={{ background: '#1f2c34', maxWidth: '85%' }}>
              <div className="p-3 border-b border-white/10 flex items-center gap-2" style={{ background: '#075E54' }}>
                <i className="bx bx-receipt text-white text-lg"></i>
                <span className="text-white font-bold text-sm">Print Job Summary</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Customer</span>
                  <span className="text-white font-semibold">{name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Files</span>
                  <span className="text-white font-semibold">{files.length} file(s)</span>
                </div>
                {files.map(f => (
                  <div key={f.id} className="bg-white/5 rounded-xl p-2 text-xs">
                    <p className="text-white font-medium truncate">{f.file.name}</p>
                    <p className="text-white/40 mt-0.5">{f.color === 'bw' ? '⬛ B&W' : '🎨 Color'} · {f.paperSize} · {f.copies}× · {f.pageRange === 'all' ? 'All pages' : `Pages: ${f.pageRange}`}</p>
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
                  className="w-full py-3 font-bold text-sm text-white rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-lg"
                  style={{ background: '#25D366' }}
                >
                  <i className="bx bx-paper-plane text-lg"></i>
                  Submit Print Order
                </button>
                <button
                  onClick={() => { setStep('files'); setError(null); }}
                  className="w-full py-2 text-xs text-white/50 hover:text-white/80 transition"
                >← Edit files</button>
              </div>
            </div>
          </div>
        )}

        {/* Success step */}
        {step === 'success' && jobId && (
          <div className="flex justify-center my-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/20 w-full max-w-xs">
              <div className="p-4 text-center" style={{ background: 'linear-gradient(135deg, #075E54, #128C7E)' }}>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">🎉</span>
                </div>
                <h3 className="text-white font-black text-xl">You're in queue!</h3>
                <p className="text-white/70 text-sm mt-1">Show this to the shopkeeper</p>
                <div className="mt-4 bg-white/15 rounded-2xl py-4">
                  <p className="text-white/60 text-xs uppercase tracking-widest">Your Token</p>
                  <p className="text-white font-black text-5xl mt-1">#{tokenNumber}</p>
                </div>
              </div>
              <div className="p-4 space-y-2" style={{ background: '#1f2c34' }}>
                <button
                  onClick={() => router.push(`/s/${params.slug}/status/${jobId}`)}
                  className="w-full py-3 text-sm font-bold rounded-xl transition-all hover:opacity-90 active:scale-95"
                  style={{ background: '#25D366', color: 'white' }}
                >
                  📱 Track My Order →
                </button>
                <button
                  onClick={handleManualRefresh}
                  className="w-full py-3 text-sm font-bold rounded-xl transition-all hover:bg-white/10"
                  style={{ color: '#25D366', border: '1px solid rgba(37,211,102,0.3)' }}
                >
                  <i className="bx bx-refresh text-lg align-middle"></i> Refresh Status
                </button>
                <p className="text-center text-white/30 text-xs">Powered by Print Sathi</p>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      {/* Bottom Input Bar */}
      {step !== 'success' && step !== 'uploading' && step !== 'intro' && (
        <div className="sticky bottom-0 z-10 px-3 py-3 flex items-end gap-2 shadow-2xl" style={{ background: '#1f2c34' }}>
          {/* Attachment */}
          {(step === 'files' || step === 'confirm') && (
            <>
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0"
              >
                <i className="bx bx-paperclip text-2xl rotate-[-45deg]"></i>
              </button>
            </>
          )}

          {/* Text Input */}
          {step === 'combine_prompt' && (
            <div className="flex-1 flex gap-2">
              <button onClick={() => handleCombineChoice(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full py-3 text-sm font-bold transition">Combine to PDF</button>
              <button onClick={() => handleCombineChoice(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-full py-3 text-sm font-bold transition">Keep Separate</button>
            </div>
          )}

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
                  className="flex-1 rounded-full px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                  style={{ background: '#2a3942' }}
                  autoFocus
                />
                <button
                  onClick={() => { setInputValue(''); handleSendNotes(); }}
                  className="px-4 py-2 rounded-full text-xs font-bold text-white/70 hover:text-white transition-all"
                  style={{ background: '#2a3942' }}
                >Skip</button>
              </div>
              <button
                onClick={handleSendNotes}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white transition-all active:scale-90 shrink-0"
                style={{ background: '#25D366' }}
              >
                <i className="bx bx-send text-lg"></i>
              </button>
            </>
          )}

          {step === 'files' && (
            <div className="flex-1 flex gap-2 overflow-x-auto">
              {files.length > 0 && (
                <button
                  onClick={handleDoneWithFiles}
                  className="shrink-0 px-5 py-3 rounded-full text-sm font-bold text-white transition-all active:scale-95 hover:opacity-90"
                  style={{ background: '#25D366' }}
                >
                  Done with files ({files.length}) ✓
                </button>
              )}
              {files.length === 0 && (
                <div className="flex-1 flex items-center px-4 py-3 rounded-full text-sm text-white/30" style={{ background: '#2a3942' }}>
                  Tap 📎 to attach files...
                </div>
              )}
            </div>
          )}

          {step === 'confirm' && (
            <div className="flex-1 flex items-center px-4 py-3 rounded-full text-sm text-white/30" style={{ background: '#2a3942' }}>
              Review your order above...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Message Bubble Component
function MessageBubble({
  msg, files, updateFileSetting, setCropFileId, setPassportModalFileId
}: {
  msg: ChatMessage;
  files: FileWithSettings[];
  updateFileSetting: (id: string, key: keyof FileWithSettings, value: unknown) => void;
  setCropFileId: (id: string) => void;
  setPassportModalFileId: (id: string) => void;
}) {
  const isBot = msg.type === 'bot';
  const isUser = msg.type === 'user';
  const fileItem = msg.fileItem ? files.find(f => f.id === msg.fileItem!.id) || msg.fileItem : null;

  return (
    <div className={`flex items-end gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {isBot && (
        <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center shrink-0 mb-1">
          <i className="bx bx-printer text-white text-xs"></i>
        </div>
      )}
      {isUser && <div className="w-7 shrink-0"></div>}

      <div className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* File preview card */}
        {fileItem && (
          <div className="rounded-2xl overflow-hidden shadow-md w-full" style={{ background: isBot ? '#1f2c34' : '#128C7E', maxWidth: '280px' }}>
            {fileItem.previewUrl && (
              <div className="relative">
                <img src={fileItem.previewUrl} alt="preview" className="w-full max-h-40 object-cover" />
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
            )}
            <div className={`p-3 ${fileItem.previewUrl ? '' : 'pt-3'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <i className={`bx ${getFileTypeBadge(fileItem.file).icon} text-white text-lg`}></i>
                </div>
                <div className="overflow-hidden">
                  <p className="text-white text-xs font-semibold truncate">{fileItem.file.name}</p>
                  <p className="text-white/40 text-[10px]">{formatSize(fileItem.file.size)} · {getFileTypeBadge(fileItem.file).label}</p>
                </div>
              </div>

              {isBot && (
                <div className="space-y-2 mt-2 border-t border-white/10 pt-2">
                  {/* Color setting */}
                  <div className="flex gap-1">
                    {(['bw', 'color'] as const).map(c => (
                      <button key={c} onClick={() => updateFileSetting(fileItem.id, 'color', c)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${fileItem.color === c ? 'text-white' : 'bg-white/10 text-white/50 hover:text-white'}`}
                        style={fileItem.color === c ? { background: '#25D366' } : {}}
                      >{c === 'bw' ? '⬛ B&W' : '🎨 Color'}</button>
                    ))}
                  </div>
                  {/* Copies */}
                  <div className="flex items-center gap-2">
                    <span className="text-white/50 text-[11px] shrink-0">Copies:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map(n => (
                        <button key={n} onClick={() => updateFileSetting(fileItem.id, 'copies', n)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${fileItem.copies === n ? 'text-white' : 'bg-white/10 text-white/50 hover:text-white'}`}
                          style={fileItem.copies === n ? { background: '#075E54' } : {}}
                        >×{n}</button>
                      ))}
                      <input type="number" min={1} max={50} value={fileItem.copies > 3 ? fileItem.copies : ''}
                        onChange={e => { const v = parseInt(e.target.value); if (v > 0) updateFileSetting(fileItem.id, 'copies', v); }}
                        placeholder="..."
                        className="w-10 h-8 rounded-lg text-xs text-center text-white bg-white/10 border-0 outline-none focus:ring-1 focus:ring-emerald-500 placeholder-white/30"
                      />
                    </div>
                  </div>
                  {/* Paper Size */}
                  <div className="flex gap-1 mt-2">
                    {['A4', 'A3', 'Letter'].map(s => (
                      <button key={s} onClick={() => updateFileSetting(fileItem.id, 'paperSize', s)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${fileItem.paperSize === s ? 'text-white' : 'bg-white/10 text-white/50 hover:text-white'}`}
                        style={fileItem.paperSize === s ? { background: '#075E54' } : {}}
                      >{s}</button>
                    ))}
                  </div>
                  {/* Page range for PDFs */}
                  {fileItem.file.type === 'application/pdf' && (
                    <div>
                      <p className="text-white/50 text-[11px] mb-1">Pages:</p>
                      <input type="text" value={fileItem.pageRange}
                        onChange={e => updateFileSetting(fileItem.id, 'pageRange', e.target.value)}
                        placeholder="all — or e.g. 1-5, 8"
                        className="w-full px-3 py-1.5 rounded-lg text-xs text-white bg-white/10 outline-none focus:ring-1 focus:ring-emerald-500 placeholder-white/30"
                      />
                    </div>
                  )}
                  {/* Crop button for images */}
                  {fileItem.file.type.startsWith('image/') && (
                    <button onClick={() => setCropFileId(fileItem.id)}
                      className="w-full py-1.5 rounded-lg text-[11px] font-bold bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 transition border border-purple-500/30 flex items-center justify-center gap-1.5"
                    >
                      <i className="bx bx-crop text-sm"></i> ✂️ Crop / Rotate
                    </button>
                  )}
                  {/* Passport Photo Toggle */}
                  {fileItem.file.type.startsWith('image/') && (
                    <button onClick={() => {
                        if (fileItem.action === 'passport_photo') {
                          updateFileSetting(fileItem.id, 'action', 'direct_print');
                          updateFileSetting(fileItem.id, 'passportConfig', undefined);
                        } else {
                          setPassportModalFileId(fileItem.id);
                        }
                      }}
                      className={`mt-2 w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${fileItem.action === 'passport_photo' ? 'bg-amber-500 text-white border-amber-400' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20'}`}
                    >
                      <i className="bx bx-id-card text-lg"></i>
                      {fileItem.action === 'passport_photo' ? '🛂 Passport Photo (Selected)' : 'Make Passport Photo'}
                    </button>
                  )}
                  {fileItem.action === 'passport_photo' && fileItem.passportConfig && (
                    <div className="mt-1 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 flex flex-col gap-1">
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
            className={`px-3 py-2.5 rounded-2xl shadow-sm ${isBot ? 'rounded-bl-sm' : 'rounded-br-sm'}`}
            style={{ background: isBot ? '#1f2c34' : '#128C7E', maxWidth: fileItem ? '280px' : undefined }}
          >
            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap"
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
