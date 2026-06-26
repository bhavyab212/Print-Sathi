"use client";
import { Boxicon } from "@/components/ui";


import { useState, useRef, useEffect, useCallback } from "react";
import { ManualMaskEditor } from "./ManualMaskEditor";
import { canvasToBMP, canvasToTIFF, canvasToPDF, padImageBuffer } from "@/lib/imageEncoders";

// Helper to draw outline stroke around the alpha mask of a transparent subject
const drawOutline = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  strokeWidth: number,
  strokeColor: string
) => {
  if (strokeWidth <= 0) return;

  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const octx = offscreen.getContext("2d");
  if (!octx) return;

  octx.drawImage(img, 0, 0, width, height);
  octx.globalCompositeOperation = "source-in";
  octx.fillStyle = strokeColor;
  octx.fillRect(0, 0, width, height);

  ctx.save();
  const steps = 16;
  for (let i = 0; i < steps; i++) {
    const angle = (i * 2 * Math.PI) / steps;
    const ox = Math.cos(angle) * strokeWidth;
    const oy = Math.sin(angle) * strokeWidth;
    ctx.drawImage(offscreen, x + ox, y + oy);
  }
  ctx.restore();
};

interface BgReviewPanelProps {
  originalFile: File | null;
  processedSrc: string;     // base64 transparent PNG
  faceDetected: boolean;
  model: string;
  onAccept: (editedSrc?: string) => void;
  onRetry: (feedback?: { alpha_matting?: boolean; fg?: number; bg?: number; remove_shadow?: boolean }) => void;
  onUpgradeToUltra: () => void;
  onManualApply?: (editedSrc: string) => void;
  standalone?: boolean;     // Render full editor if standalone
}

type Action = "idle" | "retrying" | "upgrading" | "analyzing";
type Tab = "bg" | "effects" | "adjust" | "export";

interface RetryAnalysis {
  strategy: string;
  params: Record<string, boolean | number>;
  explanation: string;
  confidence: number;
}

const PRESET_BGS = [
  { name: "Studio Fluid", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80" },
  { name: "Modern Office", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&auto=format&fit=crop&q=80" },
  { name: "Corporate Blue", url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=500&auto=format&fit=crop&q=80" },
  { name: "Soft Bokeh", url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=500&auto=format&fit=crop&q=80" },
  { name: "White Brick", url: "https://images.unsplash.com/photo-1533628635777-112b2239b1c7?w=500&auto=format&fit=crop&q=80" },
  { name: "Light Wood", url: "https://images.unsplash.com/photo-1507314120004-41349945b7e6?w=500&auto=format&fit=crop&q=80" },
  { name: "Nature Blur", url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=500&auto=format&fit=crop&q=80" },
];

export function BgReviewPanel({
  originalFile,
  processedSrc,
  faceDetected,
  model,
  onAccept,
  onRetry,
  onUpgradeToUltra,
  onManualApply,
  standalone = false,
}: BgReviewPanelProps) {
  const [comparePos, setComparePos] = useState(50); // 0–100 %
  const [isDragging, setIsDragging] = useState(false);
  const [action, setAction] = useState<Action>("idle");
  const [showRetryPopover, setShowRetryPopover] = useState(false);
  const [showManualEditor, setShowManualEditor] = useState(false);
  const [retryAnalysis, setRetryAnalysis] = useState<RetryAnalysis | null>(null);
  
  // Customization States (Adobe Express Features)
  const [bgType, setBgType] = useState<"color" | "image">("color");
  const [bgColor, setBgColor] = useState<string>("transparent");
  const [bgImageSrc, setBgImageSrc] = useState<string | null>(null);

  // Borders & Shadows
  const [outlineWidth, setOutlineWidth] = useState(0);
  const [outlineColor, setOutlineColor] = useState("#FFFFFF");
  const [shadowBlur, setShadowBlur] = useState(0);
  const [shadowColor, setShadowColor] = useState("rgba(0,0,0,0.55)");
  const [shadowOffsetX, setShadowOffsetX] = useState(6);
  const [shadowOffsetY, setShadowOffsetY] = useState(6);

  // Adjustments & Transforms
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [exposure, setExposure] = useState(0);
  const [warmth, setWarmth] = useState(0);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);

  // Export Settings
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg" | "webp" | "pdf" | "bmp" | "tiff">("png");
  const [sizePreset, setSizePreset] = useState<"original" | "passport" | "stamp" | "photo4x6" | "a4" | "custom">("original");
  const [customWidth, setCustomWidth] = useState<number>(0);
  const [customHeight, setCustomHeight] = useState<number>(0);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [subjectScale, setSubjectScale] = useState<number>(100);
  const [subjectOffsetX, setSubjectOffsetX] = useState<number>(0);
  const [subjectOffsetY, setSubjectOffsetY] = useState<number>(0);
  const [jpegQuality, setJpegQuality] = useState<number>(90);
  const [limitFileSize, setLimitFileSize] = useState<boolean>(false);
  const [targetSizeKb, setTargetSizeKb] = useState<number>(50);
  const [estimatedSizeKb, setEstimatedSizeKb] = useState<number | null>(null);
  const [originalAspectRatio, setOriginalAspectRatio] = useState<number>(1);

  const [activeTab, setActiveTab] = useState<Tab>("bg");

  const containerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalUrl = originalFile ? URL.createObjectURL(originalFile) : null;

  // Initialize aspect ratio and dimensions when image is processed
  useEffect(() => {
    if (!processedSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight;
      setOriginalAspectRatio(aspect);
      setCustomWidth(img.naturalWidth);
      setCustomHeight(img.naturalHeight);
    };
    img.src = processedSrc;
  }, [processedSrc]);

  // Helper to generate the exact size image Blob (supporting quality reduction, down-scaling and padding up)
  const getCompressedBlob = async (
    canvas: HTMLCanvasElement,
    format: "png" | "jpeg" | "webp" | "pdf" | "bmp" | "tiff",
    targetKb: number,
    quality: number
  ): Promise<Blob> => {
    let blob: Blob;

    if (format === "png") {
      blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), "image/png"));
    } else if (format === "jpeg") {
      blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), "image/jpeg", quality));
    } else if (format === "webp") {
      blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), "image/webp", quality));
    } else if (format === "bmp") {
      blob = canvasToBMP(canvas);
    } else if (format === "tiff") {
      blob = canvasToTIFF(canvas);
    } else if (format === "pdf") {
      blob = canvasToPDF(canvas, quality);
    } else {
      blob = new Blob();
    }

    let currentSizeKb = blob.size / 1024;

    if (limitFileSize && currentSizeKb > targetKb) {
      if (format === "jpeg" || format === "webp" || format === "pdf") {
        let low = 0.1;
        let high = 0.95;
        for (let i = 0; i < 6; i++) {
          const midQuality = (low + high) / 2;
          let tempBlob: Blob;
          if (format === "pdf") {
            tempBlob = canvasToPDF(canvas, midQuality);
          } else {
            const mime = format === "jpeg" ? "image/jpeg" : "image/webp";
            tempBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), mime, midQuality));
          }
          const sizeKb = tempBlob.size / 1024;
          if (sizeKb <= targetKb) {
            blob = tempBlob;
            currentSizeKb = sizeKb;
            low = midQuality;
          } else {
            high = midQuality;
          }
        }
      }

      if (currentSizeKb > targetKb) {
        let scale = 0.9;
        const originalWidth = canvas.width;
        const originalHeight = canvas.height;
        while (scale > 0.15 && currentSizeKb > targetKb) {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = Math.round(originalWidth * scale);
          tempCanvas.height = Math.round(originalHeight * scale);
          const tctx = tempCanvas.getContext("2d");
          if (tctx) {
            tctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
            let tempBlob: Blob;
            if (format === "png") {
              tempBlob = await new Promise<Blob>((resolve) => tempCanvas.toBlob((b) => resolve(b || new Blob()), "image/png"));
            } else if (format === "bmp") {
              tempBlob = canvasToBMP(tempCanvas);
            } else if (format === "tiff") {
              tempBlob = canvasToTIFF(tempCanvas);
            } else if (format === "pdf") {
              tempBlob = canvasToPDF(tempCanvas, 0.4);
            } else {
              const mime = format === "jpeg" ? "image/jpeg" : "image/webp";
              tempBlob = await new Promise<Blob>((resolve) => tempCanvas.toBlob((b) => resolve(b || new Blob()), mime, 0.4));
            }
            currentSizeKb = tempBlob.size / 1024;
            if (currentSizeKb <= targetKb || scale <= 0.2) {
              blob = tempBlob;
            }
          }
          scale -= 0.1;
        }
      }
    }

    if (limitFileSize && blob.size < targetKb * 1024) {
      const buffer = await blob.arrayBuffer();
      const paddedBuffer = padImageBuffer(buffer, Math.round(targetKb * 1024));
      const mime = {
        png: "image/png",
        jpeg: "image/jpeg",
        webp: "image/webp",
        pdf: "application/pdf",
        bmp: "image/bmp",
        tiff: "image/tiff"
      }[format];
      blob = new Blob([paddedBuffer], { type: mime });
    }

    return blob;
  };

  // Debounced estimated file size calculator
  useEffect(() => {
    if (!processedSrc) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const timer = setTimeout(async () => {
      try {
        const quality = jpegQuality / 100;
        const blob = await getCompressedBlob(canvas, exportFormat, targetSizeKb, quality);
        setEstimatedSizeKb(Math.round(blob.size / 1024));
      } catch (err) {
        console.error("Size estimation error", err);
      }
    }, 400);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    processedSrc,
    exportFormat,
    jpegQuality,
    limitFileSize,
    targetSizeKb,
    bgType,
    bgColor,
    bgImageSrc,
    outlineWidth,
    outlineColor,
    shadowBlur,
    shadowColor,
    shadowOffsetX,
    shadowOffsetY,
    brightness,
    contrast,
    saturation,
    exposure,
    warmth,
    rotation,
    flipHorizontal,
    flipVertical,
    sizePreset,
    customWidth,
    customHeight,
    subjectScale,
    subjectOffsetX,
    subjectOffsetY
  ]);

  const copyImageToClipboard = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    try {
      let format: "png" | "jpeg" = "png";
      if (exportFormat === "jpeg") {
        format = "jpeg";
      }
      
      const quality = jpegQuality / 100;
      const mime = format === "jpeg" ? "image/jpeg" : "image/png";
      let blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), mime, format === "jpeg" ? quality : undefined));
      
      if (limitFileSize) {
        const buffer = await blob.arrayBuffer();
        const paddedBuffer = padImageBuffer(buffer, Math.round(targetSizeKb * 1024));
        blob = new Blob([paddedBuffer], { type: mime });
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      alert("Copied customized image to clipboard! ✓");
    } catch {
      alert("Failed to copy image to clipboard");
    }
  };

  const handleDownload = async (forceWhiteBgJpg: boolean = false) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    
    const prevBgType = bgType;
    const prevBgColor = bgColor;
    const prevFormat = exportFormat;
    
    let format = exportFormat;
    let extension = {
      png: "png",
      jpeg: "jpg",
      webp: "webp",
      pdf: "pdf",
      bmp: "bmp",
      tiff: "tiff"
    }[exportFormat];
    
    if (forceWhiteBgJpg) {
      setBgType("color");
      setBgColor("#FFFFFF");
      setExportFormat("jpeg");
      format = "jpeg";
      extension = "jpg";
      // Allow canvas to redraw
      await new Promise((r) => setTimeout(r, 60));
    }
    
    const blob = await getCompressedBlob(canvas, format, targetSizeKb, jpegQuality / 100);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.download = `printo_bg_removed.${extension}`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
    
    if (forceWhiteBgJpg) {
      setBgType(prevBgType);
      setBgColor(prevBgColor);
      setExportFormat(prevFormat);
    }
  };

  // Real-time Canvas Rendering
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fgImg = new Image();
    fgImg.crossOrigin = "anonymous";
    fgImg.onload = () => {
      // Determine what the target size should be
      let targetW = fgImg.naturalWidth;
      let targetH = fgImg.naturalHeight;
      
      if (sizePreset === "passport") {
        targetW = 413;
        targetH = 531;
      } else if (sizePreset === "stamp") {
        targetW = 236;
        targetH = 295;
      } else if (sizePreset === "photo4x6") {
        targetW = 1200;
        targetH = 1800;
      } else if (sizePreset === "a4") {
        targetW = 2480;
        targetH = 3508;
      } else if (sizePreset === "custom" && customWidth > 0 && customHeight > 0) {
        targetW = customWidth;
        targetH = customHeight;
      }

      canvas.width = targetW;
      canvas.height = targetH;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const renderForeground = () => {
        // Outline width and shadow settings scale with target size relative to original
        const scaleFactor = targetW / fgImg.naturalWidth;
        const scaledOutlineWidth = outlineWidth * scaleFactor;
        const scaledShadowBlur = shadowBlur * scaleFactor;
        const scaledShadowOffsetX = shadowOffsetX * scaleFactor;
        const scaledShadowOffsetY = shadowOffsetY * scaleFactor;

        // 1. Draw Outline
        if (scaledOutlineWidth > 0 && outlineColor) {
          drawOutline(ctx, fgImg, 0, 0, canvas.width, canvas.height, scaledOutlineWidth, outlineColor);
        }

        // 2. Draw Shadow and Foreground Cutout
        ctx.save();
        if (scaledShadowBlur > 0 && shadowColor) {
          ctx.shadowBlur = scaledShadowBlur;
          ctx.shadowColor = shadowColor;
          ctx.shadowOffsetX = scaledShadowOffsetX;
          ctx.shadowOffsetY = scaledShadowOffsetY;
        }

        // Filters (Adjustments)
        const filterStr =
          `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` +
          (exposure !== 0 ? ` brightness(${Math.pow(2, exposure) * 100}%)` : "") +
          (warmth !== 0 ? ` sepia(${Math.abs(warmth) * 0.5}%)` : "");
        ctx.filter = filterStr;

        // Transformations
        ctx.translate(canvas.width / 2, canvas.height / 2);
        if (flipHorizontal) ctx.scale(-1, 1);
        if (flipVertical) ctx.scale(1, -1);
        ctx.rotate((rotation * Math.PI) / 180);

        // Keep original aspect ratio of the subject cutout
        const imgRatio = fgImg.naturalWidth / fgImg.naturalHeight;
        const canvasRatio = canvas.width / canvas.height;
        
        let baseW = canvas.width;
        let baseH = canvas.height;
        
        if (imgRatio > canvasRatio) {
          baseH = canvas.width / imgRatio;
        } else {
          baseW = canvas.height * imgRatio;
        }

        const drawW = baseW * (subjectScale / 100);
        const drawH = baseH * (subjectScale / 100);
        const drawX = -drawW / 2 + subjectOffsetX;
        const drawY = -drawH / 2 + subjectOffsetY;

        ctx.drawImage(fgImg, drawX, drawY, drawW, drawH);
        ctx.restore();
      };

      // Background rendering
      if (bgType === "color" && bgColor && bgColor !== "transparent") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        renderForeground();
      } else if (bgType === "image" && bgImageSrc) {
        const bgImg = new Image();
        bgImg.crossOrigin = "anonymous";
        bgImg.onload = () => {
          // Cover center crop
          const canvasRatio = canvas.width / canvas.height;
          const imgRatio = bgImg.naturalWidth / bgImg.naturalHeight;
          let drawW = canvas.width;
          let drawH = canvas.height;
          let drawX = 0;
          let drawY = 0;
          if (imgRatio > canvasRatio) {
            drawW = canvas.height * imgRatio;
            drawX = (canvas.width - drawW) / 2;
          } else {
            drawH = canvas.width / imgRatio;
            drawY = (canvas.height - drawH) / 2;
          }
          ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
          renderForeground();
        };
        bgImg.src = bgImageSrc;
      } else {
        // Transparent backdrop
        renderForeground();
      }
    };
    fgImg.src = processedSrc;
  }, [
    processedSrc,
    bgType,
    bgColor,
    bgImageSrc,
    outlineWidth,
    outlineColor,
    shadowBlur,
    shadowColor,
    shadowOffsetX,
    shadowOffsetY,
    brightness,
    contrast,
    saturation,
    exposure,
    warmth,
    rotation,
    flipHorizontal,
    flipVertical,
    sizePreset,
    customWidth,
    customHeight,
    subjectScale,
    subjectOffsetX,
    subjectOffsetY,
  ]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct  = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
      setComparePos(pct);
    },
    [isDragging]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct  = Math.min(100, Math.max(0, ((e.touches[0].clientX - rect.left) / rect.width) * 100));
      setComparePos(pct);
    },
    []
  );

  async function analyzeAndRetry() {
    setShowRetryPopover(true);
    setRetryAnalysis(null);
    setAction("analyzing");
    try {
      const formData = new FormData();
      formData.append("processed_image", processedSrc);
      const res = await fetch(`${process.env.NEXT_PUBLIC_PROCESSING_URL ?? "http://localhost:8000"}/passport/retry-analyze`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json() as RetryAnalysis;
        setRetryAnalysis(data);
      } else {
        setRetryAnalysis({ strategy: "just_retry", params: {}, explanation: "Could not analyze result. Retrying with default settings.", confidence: 50 });
      }
    } catch {
      setRetryAnalysis({ strategy: "just_retry", params: {}, explanation: "Analysis service unavailable. Retrying with default settings.", confidence: 50 });
    }
    setAction("idle");
  }

  function executeRetry(analysis?: RetryAnalysis) {
    const a = analysis ?? retryAnalysis;
    setShowRetryPopover(false);
    setRetryAnalysis(null);
    setAction("retrying");
    if (!a || a.strategy === "just_retry") {
      onRetry();
    } else if (a.strategy === "u2net_upgrade") {
      onUpgradeToUltra();
    } else if (a.strategy === "remove_shadow") {
      onRetry({ remove_shadow: true });
    } else if (a.strategy === "alpha_matting_fine") {
      onRetry({ alpha_matting: true, fg: (a.params.alpha_matting_fg as number) ?? 200, bg: (a.params.alpha_matting_bg as number) ?? 5 });
    } else if (a.strategy === "alpha_matting_aggressive") {
      onRetry({ alpha_matting: true, fg: (a.params.alpha_matting_fg as number) ?? 245, bg: (a.params.alpha_matting_bg as number) ?? 25 });
    } else {
      onRetry();
    }
  }

  function triggerUpgrade() {
    setAction("upgrading");
    onUpgradeToUltra();
  }

  const handleAcceptClick = async () => {
    const canvas = previewCanvasRef.current;
    if (canvas) {
      const blob = await getCompressedBlob(canvas, exportFormat, targetSizeKb, jpegQuality / 100);
      const finalSrc = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      onAccept(finalSrc);
    } else {
      onAccept(processedSrc);
    }
  };

  function handleDownloadClick() {
    handleDownload(bgColor !== "transparent");
  }

  function handleBgImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      if (ev.target?.result) {
        setBgImageSrc(ev.target.result as string);
        setBgType("image");
      }
    };
    r.readAsDataURL(file);
  }

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setExposure(0);
    setWarmth(0);
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
  };

  if (showManualEditor) {
    return (
      <ManualMaskEditor
        originalFile={originalFile}
        processedSrc={processedSrc}
        onCancel={() => setShowManualEditor(false)}
        onApply={(editedSrc) => {
          setShowManualEditor(false);
          if (onManualApply) onManualApply(editedSrc);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full gap-0 relative overflow-hidden">
      {/* Face warning (for passport mode) */}
      {!faceDetected && !standalone && (
        <div className="shrink-0 mx-6 mt-4 flex items-start gap-3 rounded-xl bg-amber-500/10 px-4 py-2.5 text-sm text-amber-400 border border-amber-500/20">
          <Boxicon className="bx bx-error mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-xs">No face detected</p>
            <p className="text-xs opacity-80">The crop may not be passport-standard. Review or retry.</p>
          </div>
        </div>
      )}

      {/* Main workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Comparison slider view */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-0">
          <div className="w-full max-w-2xl flex flex-col gap-3 h-full">
            {/* Slide guide label */}
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
              <span className="flex items-center gap-1.5"><Boxicon className="bx bx-image-alt" /> Original</span>
              <span className="text-foreground font-bold text-[11px] bg-muted px-2.5 py-0.5 rounded-full uppercase tracking-wider">Drag Slider to Compare</span>
              <span className="flex items-center gap-1.5">Cutout Studio <Boxicon className="bx bx-eraser" /></span>
            </div>

            {/* Slider Container */}
            <div
              ref={containerRef}
              className="relative flex-1 min-h-[280px] overflow-hidden rounded-2xl border border-border shadow-2xl cursor-col-resize select-none bg-muted/10"
              onMouseMove={handleMouseMove}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchMove={handleTouchMove}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
            >
              {/* Checked Pattern base layer */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",
                  backgroundSize: "12px 12px",
                  backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                  backgroundColor: "#eaeaea",
                }}
              >
                {/* Result Canvas (Adjustments & Custom borders/backdrops) */}
                <canvas ref={previewCanvasRef} className="h-full w-full object-contain pointer-events-none" />
              </div>

              {/* Original layer (clipped left to right) */}
              {originalUrl && (
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none border-r border-white/20"
                  style={{ width: `${comparePos}%` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="absolute inset-0 h-full w-full object-contain max-w-none"
                    style={{ width: `${10000 / (comparePos || 1)}%` }}
                    draggable={false}
                  />
                </div>
              )}

              {/* Divider handles */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.6)] pointer-events-none"
                style={{ left: `${comparePos}%`, transform: "translateX(-50%)" }}
              >
                <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-xl border border-border">
                  <Boxicon className="bx bx-left-arrow-alt text-muted-foreground text-xs" />
                  <Boxicon className="bx bx-right-arrow-alt text-muted-foreground text-xs -ml-0.5" />
                </div>
              </div>
            </div>

            {/* Model detail tag */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <p>Model: <code className="font-mono text-primary font-bold">{model}</code></p>
              {standalone && (
                <button
                  onClick={handleDownloadClick}
                  className="flex items-center gap-1.5 text-primary font-bold hover:underline transition"
                >
                  <Boxicon className="bx bx-download" /> Download Cutout
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Customization side-panel (Adobe Express style, visible only in standalone/editor mode) */}
        {standalone && (
          <div className="w-full lg:w-[360px] shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-card flex flex-col h-[380px] lg:h-full overflow-hidden">
            {/* Panel Tabs */}
            <div className="flex border-b border-border bg-muted/30 p-1 shrink-0">
              {(["bg", "effects", "adjust", "export"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                    activeTab === t
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "bg" ? "Background" : t === "effects" ? "Borders" : t === "adjust" ? "Adjustments" : "Export"}
                </button>
              ))}
            </div>

            {/* Panel Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* TAB 1: BACKGROUND SELECTION */}
              {activeTab === "bg" && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                      Solid Background
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {/* Transparent swatch */}
                      <button
                        onClick={() => {
                          setBgType("color");
                          setBgColor("transparent");
                        }}
                        className={`h-8 w-8 rounded-full border border-border relative overflow-hidden ${
                          bgType === "color" && bgColor === "transparent" ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""
                        }`}
                        title="Transparent"
                      >
                        <div className="absolute inset-0 bg-white" />
                        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-rose-500 rotate-45 origin-center" />
                      </button>

                      {["#FFFFFF", "#F3F4F6", "#C3D9F0", "#E8312F", "#1F2937", "#000000"].map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setBgType("color");
                            setBgColor(c);
                          }}
                          style={{ backgroundColor: c }}
                          className={`h-8 w-8 rounded-full border border-border/80 transition-transform hover:scale-105 ${
                            bgType === "color" && bgColor === c ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""
                          }`}
                        />
                      ))}

                      {/* Color Picker */}
                      <input
                        type="color"
                        value={bgColor === "transparent" ? "#ffffff" : bgColor}
                        onChange={(e) => {
                          setBgType("color");
                          setBgColor(e.target.value);
                        }}
                        className="h-8 w-8 rounded-full border border-border cursor-pointer p-0"
                        title="Custom Color"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                      Preset Backgrounds
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_BGS.map((bg, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setBgImageSrc(bg.url);
                            setBgType("image");
                          }}
                          className={`relative rounded-xl overflow-hidden aspect-[4/3] border border-border hover:border-primary transition-all ${
                            bgType === "image" && bgImageSrc === bg.url ? "ring-2 ring-primary ring-offset-1" : ""
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={bg.url} alt={bg.name} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 flex items-end p-1">
                            <span className="text-[8px] text-white truncate font-medium">{bg.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Custom Backdrop File
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBgImageUpload}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 py-3 text-xs font-semibold text-foreground hover:bg-accent transition"
                    >
                      <Boxicon className="bx bx-image-add text-lg text-primary" />
                      Upload background file
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: BORDERS & SHADOWS */}
              {activeTab === "effects" && (
                <div className="space-y-6">
                  {/* Outline border */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Outline Border
                      </label>
                      {outlineWidth > 0 && (
                        <button onClick={() => setOutlineWidth(0)} className="text-[10px] text-primary hover:underline">
                          Disable
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Width</span>
                        <span>{outlineWidth} px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={24}
                        value={outlineWidth}
                        onChange={(e) => setOutlineWidth(Number(e.target.value))}
                        className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
                      />
                    </div>

                    {outlineWidth > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["#FFFFFF", "#000000", "#FFD700", "#FF3333", "#3388FF", "#33FF33"].map((color) => (
                          <button
                            key={color}
                            onClick={() => setOutlineColor(color)}
                            style={{ backgroundColor: color }}
                            className={`h-6 w-6 rounded-full border border-border/80 transition-transform ${
                              outlineColor === color ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""
                            }`}
                          />
                        ))}
                        <input
                          type="color"
                          value={outlineColor}
                          onChange={(e) => setOutlineColor(e.target.value)}
                          className="h-6 w-6 rounded-full border border-border cursor-pointer p-0"
                          title="Custom border color"
                        />
                      </div>
                    )}
                  </div>

                  {/* Drop Shadow */}
                  <div className="space-y-4 border-t border-border/40 pt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Drop Shadow (Sticker Effect)
                      </label>
                      {shadowBlur > 0 && (
                        <button onClick={() => setShadowBlur(0)} className="text-[10px] text-primary hover:underline">
                          Disable
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Blur Radius</span>
                          <span>{shadowBlur} px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={30}
                          value={shadowBlur}
                          onChange={(e) => setShadowBlur(Number(e.target.value))}
                          className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
                        />
                      </div>

                      {shadowBlur > 0 && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground">Offset X ({shadowOffsetX}px)</span>
                              <input
                                type="range"
                                min={-25}
                                max={25}
                                value={shadowOffsetX}
                                onChange={(e) => setShadowOffsetX(Number(e.target.value))}
                                className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground">Offset Y ({shadowOffsetY}px)</span>
                              <input
                                type="range"
                                min={-25}
                                max={25}
                                value={shadowOffsetY}
                                onChange={(e) => setShadowOffsetY(Number(e.target.value))}
                                className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {["rgba(0,0,0,0.55)", "rgba(0,0,0,0.85)", "rgba(59,130,246,0.5)", "rgba(239,68,68,0.5)", "rgba(16,185,129,0.5)"].map((color) => (
                              <button
                                key={color}
                                onClick={() => setShadowColor(color)}
                                style={{
                                  backgroundColor: color.includes("rgba(0,0,0") ? "#333" : color.replace("0.5", "1")
                                }}
                                className={`h-6 w-6 rounded-full border border-border/80 transition-transform ${
                                  shadowColor === color ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ADJUSTMENTS & TRANSFORMS */}
              {activeTab === "adjust" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Enhance Adjust</span>
                    <button onClick={resetAdjustments} className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5">
                      <Boxicon className="bx bx-reset" /> Reset all
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Exposure */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground font-medium">Exposure</span>
                        <span className="font-semibold text-foreground">{exposure > 0 ? "+" : ""}{exposure.toFixed(2)}</span>
                      </div>
                      <input
                        type="range" min="-2" max="2" step="0.05" value={exposure}
                        onChange={(e) => setExposure(Number(e.target.value))}
                        className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Brightness */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground font-medium">Brightness</span>
                        <span className="font-semibold text-foreground">{brightness}%</span>
                      </div>
                      <input
                        type="range" min="50" max="150" value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Contrast */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground font-medium">Contrast</span>
                        <span className="font-semibold text-foreground">{contrast}%</span>
                      </div>
                      <input
                        type="range" min="50" max="150" value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Saturation */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground font-medium">Saturation</span>
                        <span className="font-semibold text-foreground">{saturation}%</span>
                      </div>
                      <input
                        type="range" min="0" max="200" value={saturation}
                        onChange={(e) => setSaturation(Number(e.target.value))}
                        className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Warmth */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground font-medium">Warmth (Temperature)</span>
                        <span className="font-semibold text-foreground">{warmth > 0 ? "Warm" : warmth < 0 ? "Cool" : "Neutral"} ({warmth})</span>
                      </div>
                      <input
                        type="range" min="-50" max="50" value={warmth}
                        onChange={(e) => setWarmth(Number(e.target.value))}
                        className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="border-t border-border/40 pt-4 space-y-3">
                    <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Transforms</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setRotation((prev) => (prev + 90) % 360)}
                        className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2 text-[10px] font-bold text-foreground hover:bg-accent transition"
                      >
                        <Boxicon className="bx bx-rotate-right text-base text-primary" />
                        <span>Rotate 90°</span>
                      </button>
                      <button
                        onClick={() => setFlipHorizontal((prev) => !prev)}
                        className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[10px] font-bold transition ${
                          flipHorizontal ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:bg-accent"
                        }`}
                      >
                        <Boxicon className="bx bx-reflect-vertical text-base" />
                        <span>Flip Horiz</span>
                      </button>
                      <button
                        onClick={() => setFlipVertical((prev) => !prev)}
                        className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[10px] font-bold transition ${
                          flipVertical ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:bg-accent"
                        }`}
                      >
                        <Boxicon className="bx bx-reflect-horizontal text-base" />
                        <span>Flip Vert</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "export" && (
                <div className="space-y-5">
                  {/* Output Format */}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Output Format</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["png", "jpeg", "webp", "pdf", "bmp", "tiff"] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setExportFormat(fmt)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition-all ${
                            exportFormat === fmt
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-foreground hover:bg-accent"
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size Presets */}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Size Preset</label>
                    <select
                      value={sizePreset}
                      onChange={(e) => {
                        const preset = e.target.value as typeof sizePreset;
                        setSizePreset(preset);
                        if (preset !== "custom" && preset !== "original") {
                          const dims = {
                            passport: { w: 413, h: 531 },
                            stamp: { w: 236, h: 295 },
                            photo4x6: { w: 1200, h: 1800 },
                            a4: { w: 2480, h: 3508 }
                          }[preset as "passport" | "stamp" | "photo4x6" | "a4"];
                          if (dims) {
                            setCustomWidth(dims.w);
                            setCustomHeight(dims.h);
                          }
                        }
                      }}
                      className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="original">Original Size</option>
                      <option value="passport">Passport Photo (35x45mm)</option>
                      <option value="stamp">Stamp Photo (20x25mm)</option>
                      <option value="photo4x6">4&quot; x 6&quot; Portrait (10x15cm)</option>
                      <option value="a4">A4 Page (21x29.7cm)</option>
                      <option value="custom">Custom Dimensions</option>
                    </select>
                  </div>

                  {/* Custom Width/Height Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[10px] text-muted-foreground mb-1">Width (px)</span>
                      <input
                        type="number"
                        disabled={sizePreset !== "custom"}
                        value={customWidth || ""}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value));
                          setCustomWidth(val);
                          if (lockAspectRatio && originalAspectRatio) {
                            setCustomHeight(Math.round(val / originalAspectRatio));
                          }
                        }}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-mono outline-none focus:border-primary disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground mb-1">Height (px)</span>
                      <input
                        type="number"
                        disabled={sizePreset !== "custom"}
                        value={customHeight || ""}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value));
                          setCustomHeight(val);
                          if (lockAspectRatio && originalAspectRatio) {
                            setCustomWidth(Math.round(val * originalAspectRatio));
                          }
                        }}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-mono outline-none focus:border-primary disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {sizePreset === "custom" && (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={lockAspectRatio}
                        onChange={(e) => setLockAspectRatio(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span>Lock Aspect Ratio</span>
                    </label>
                  )}

                  {/* Subject Placement Controls */}
                  <div className="border-t border-border/40 pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Subject Scale & Position</span>
                      <button
                        onClick={() => {
                          setSubjectScale(100);
                          setSubjectOffsetX(0);
                          setSubjectOffsetY(0);
                        }}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Reset Layout
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Subject Scale</span>
                        <span>{subjectScale}%</span>
                      </div>
                      <input
                        type="range" min="30" max="200" value={subjectScale}
                        onChange={(e) => setSubjectScale(Number(e.target.value))}
                        className="w-full accent-primary bg-muted h-1 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Horizontal Offset</span>
                        <span>{subjectOffsetX > 0 ? "+" : ""}{subjectOffsetX}px</span>
                      </div>
                      <input
                        type="range" min="-300" max="300" value={subjectOffsetX}
                        onChange={(e) => setSubjectOffsetX(Number(e.target.value))}
                        className="w-full accent-primary bg-muted h-1 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Vertical Offset</span>
                        <span>{subjectOffsetY > 0 ? "+" : ""}{subjectOffsetY}px</span>
                      </div>
                      <input
                        type="range" min="-300" max="300" value={subjectOffsetY}
                        onChange={(e) => setSubjectOffsetY(Number(e.target.value))}
                        className="w-full accent-primary bg-muted h-1 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Quality Settings */}
                  {(exportFormat === "jpeg" || exportFormat === "webp" || exportFormat === "pdf") && (
                    <div className="border-t border-border/40 pt-4 space-y-4">
                      <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Compression & Quality</span>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Image Quality</span>
                          <span>{jpegQuality}%</span>
                        </div>
                        <input
                          type="range" min="10" max="100" value={jpegQuality}
                          onChange={(e) => setJpegQuality(Number(e.target.value))}
                          className="w-full accent-primary bg-muted h-1 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Size Limit Constraints */}
                  <div className="border-t border-border/40 pt-4 space-y-3">
                    <label className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer">
                      <span>Limit File Size</span>
                      <input
                        type="checkbox"
                        checked={limitFileSize}
                        onChange={(e) => setLimitFileSize(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                    </label>

                    {limitFileSize && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="5"
                            max="5000"
                            value={targetSizeKb}
                            onChange={(e) => setTargetSizeKb(Math.max(5, Number(e.target.value)))}
                            className="w-24 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-mono outline-none focus:border-primary"
                          />
                          <span className="text-xs text-muted-foreground">KB Maximum</span>
                        </div>
                        <p className="text-[10px] text-amber-500 leading-tight">
                          * PNGs will be converted to JPEGs. Quality and scaling will automatically adjust to keep the file under {targetSizeKb} KB.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Size Estimation & Downloads */}
                  <div className="border-t border-border/45 pt-4 space-y-3">
                    <div className="flex items-center justify-between bg-muted/40 border border-border rounded-xl p-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Estimated Size</span>
                        <span className="text-xs text-muted-foreground">
                          {exportFormat.toUpperCase()} ({sizePreset === "original" ? `${customWidth}x${customHeight}` : sizePreset})
                        </span>
                      </div>
                      <div className="text-sm font-mono font-bold text-primary">
                        {estimatedSizeKb !== null ? `~ ${estimatedSizeKb} KB` : "Estimating..."}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleDownload(bgColor !== "transparent")}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
                      >
                        <Boxicon className="bx bx-download" /> Download
                      </button>
                      <button
                        onClick={copyImageToClipboard}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-border bg-card text-foreground font-semibold text-xs hover:bg-accent transition-all"
                      >
                        <Boxicon className="bx bx-copy" /> Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action strip */}
      <div className="shrink-0 border-t border-border bg-card px-4 py-4 relative">
        <div className="mx-auto max-w-2xl">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {/* Accept */}
            <button
              onClick={handleAcceptClick}
              disabled={action !== "idle"}
              className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-xl hover:shadow-emerald-500/35 disabled:opacity-50"
            >
              <Boxicon className="bx bx-check-circle text-lg" />
              Accept &amp; Continue
            </button>

            {/* Smart Retry */}
            <div className="relative">
              <button
                onClick={() => showRetryPopover ? setShowRetryPopover(false) : analyzeAndRetry()}
                disabled={action === "retrying" || action === "upgrading"}
                className={`w-full flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-3 text-xs font-semibold transition disabled:opacity-50 ${
                  showRetryPopover ? "bg-accent border-primary/50 text-foreground" : "bg-card border-border text-foreground hover:bg-accent"
                }`}
              >
                {action === "retrying" || action === "analyzing" ? (
                  <Boxicon className="bx bx-loader-alt animate-spin text-base text-primary" />
                ) : (
                  <Boxicon className="bx bx-refresh text-lg" />
                )}
                <span>{action === "analyzing" ? "Analyzing…" : "Smart Retry"}</span>
              </button>

              {/* Smart Analysis Popover */}
              {showRetryPopover && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-80 bg-card border border-border shadow-2xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-bottom-2">

                  {/* Analyzing spinner */}
                  {action === "analyzing" && (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <Boxicon className="bx bx-loader-alt animate-spin text-3xl text-primary" />
                      <p className="text-xs font-semibold text-muted-foreground text-center">Analyzing result quality…</p>
                      <p className="text-[10px] text-muted-foreground text-center opacity-70">Scanning edges, transparency, and mask quality</p>
                    </div>
                  )}

                  {/* Result analysis */}
                  {!retryAnalysis && action !== "analyzing" && (
                    <p className="text-xs text-muted-foreground">Analysis failed. Click below to retry.</p>
                  )}

                  {retryAnalysis && action !== "analyzing" && (
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-lg shrink-0 mt-0.5">
                          <Boxicon className="bx bx-brain text-primary text-sm" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Smart Fix Recommendation</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{retryAnalysis.explanation}</p>
                        </div>
                      </div>

                      {/* Confidence bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-muted-foreground">
                          <span>Confidence</span>
                          <span className="font-bold text-primary">{retryAnalysis.confidence}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${retryAnalysis.confidence}%` }}
                          />
                        </div>
                      </div>

                      {/* Primary CTA */}
                      <button
                        onClick={() => executeRetry()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition"
                      >
                        <Boxicon className="bx bx-zap text-sm" />
                        Apply Smart Fix
                      </button>

                      {/* Divider */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">or override</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>

                      {/* Manual overrides */}
                      <div className="space-y-1">
                        <button
                          onClick={() => executeRetry({ strategy: "alpha_matting_fine", params: { alpha_matting: true, alpha_matting_fg: 200, alpha_matting_bg: 5 }, explanation: "", confidence: 0 })}
                          className="w-full text-left px-2.5 py-2 text-[10px] rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center gap-2"
                        >
                          <Boxicon className="bx bx-spa text-xs text-indigo-500" /> Preserve fine hair / clothing
                        </button>
                        <button
                          onClick={() => executeRetry({ strategy: "alpha_matting_aggressive", params: { alpha_matting: true, alpha_matting_fg: 245, alpha_matting_bg: 25 }, explanation: "", confidence: 0 })}
                          className="w-full text-left px-2.5 py-2 text-[10px] rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center gap-2"
                        >
                          <Boxicon className="bx bx-exclude text-xs text-rose-500" /> Aggressive background removal
                        </button>
                        <button
                          onClick={() => executeRetry({ strategy: "remove_shadow", params: { remove_shadow: true }, explanation: "", confidence: 0 })}
                          className="w-full text-left px-2.5 py-2 text-[10px] rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center gap-2"
                        >
                          <Boxicon className="bx bx-sun text-xs text-amber-500" /> Fix heavy shadows / low contrast
                        </button>
                        <button
                          onClick={() => executeRetry({ strategy: "u2net_upgrade", params: {}, explanation: "", confidence: 0 })}
                          className="w-full text-left px-2.5 py-2 text-[10px] rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center gap-2"
                        >
                          <Boxicon className="bx bx-up-arrow-circle text-xs text-violet-500" /> Upgrade to Ultra AI model
                        </button>
                        <button
                          onClick={() => { setShowManualEditor(true); setShowRetryPopover(false); }}
                          className="w-full text-left px-2.5 py-2 text-[10px] rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center gap-2"
                        >
                          <Boxicon className="bx bx-brush text-xs text-emerald-500" /> Manual paint / lasso edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Upgrade to Ultra */}
            <button
              onClick={triggerUpgrade}
              disabled={action !== "idle" || model === "u2net_human_seg"}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-violet-500/40 bg-violet-500/5 px-3 py-3 text-xs font-semibold text-violet-600 transition hover:bg-violet-500/10 disabled:opacity-40"
            >
              {action === "upgrading" ? (
                <Boxicon className="bx bx-loader-alt animate-spin text-base" />
              ) : (
                <Boxicon className="bx bx-up-arrow-circle text-lg" />
              )}
              <span>{model === "u2net_human_seg" ? "Already Ultra" : "Upgrade Ultra"}</span>
            </button>

            {/* Manual Select */}
            <button
              onClick={() => setShowManualEditor(true)}
              disabled={action !== "idle"}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-muted/30 px-3 py-3 text-xs text-foreground hover:bg-accent transition"
            >
              <Boxicon className="bx bx-brush text-lg text-primary" />
              <span>Manual Edit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
