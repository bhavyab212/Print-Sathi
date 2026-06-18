"use client";
import { Boxicon } from "@/components/ui";


import { useState, useRef, useEffect, useCallback } from "react";
import type { PassportConfig } from "../PassportConfig";

interface EnhancePanelProps {
  processedSrc: string;
  config: PassportConfig;
  onChange: (c: PassportConfig) => void;
  onNext: () => void;
  onImageChange?: (src: string) => void;
  faceBox?: number[] | null;
}

const PROCESSING_URL =
  process.env.NEXT_PUBLIC_PROCESSING_URL ?? "http://localhost:8000";

// Helper to draw outline (silhouette stroke)
function drawOutline(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number, height: number,
  strokeWidth: number, strokeColor: string
) {
  if (strokeWidth <= 0) return;
  const off = document.createElement("canvas");
  off.width = width; off.height = height;
  const oc = off.getContext("2d")!;
  oc.drawImage(img, 0, 0, width, height);
  oc.globalCompositeOperation = "source-in";
  oc.fillStyle = strokeColor;
  oc.fillRect(0, 0, width, height);
  ctx.save();
  for (let i = 0; i < 16; i++) {
    const a = (i * 2 * Math.PI) / 16;
    ctx.drawImage(off, Math.cos(a) * strokeWidth, Math.sin(a) * strokeWidth);
  }
  ctx.restore();
}

async function base64ToFile(base64Src: string, filename: string): Promise<File> {
  const res = await fetch(base64Src);
  const blob = await res.blob();
  return new File([blob], filename, { type: "image/png" });
}

const PRESETS = [
  {
    id: "auto",
    label: "Auto Enhance",
    icon: "bx-magic-wand",
    desc: "Optimizes light and contrast automatically",
    config: { brightness: 106, contrast: 106, saturation: 104, exposure: 0.08, temperature: 1, tint: 0, sharpness: 1.5, skinSmoothing: 0, faceBrightness: 0, faceSkinSmoothing: 0, faceWarmth: 0 }
  },
  {
    id: "studio",
    label: "Studio Lighting",
    icon: "bx-bulb",
    desc: "Brightens face and softens shadows",
    config: { brightness: 112, contrast: 102, saturation: 98, exposure: 0.15, temperature: -2, tint: 0, sharpness: 1.0, skinSmoothing: 1.0, faceBrightness: 0, faceSkinSmoothing: 0, faceWarmth: 0 }
  },
  {
    id: "vibrant",
    label: "Vibrant Color",
    icon: "bx-palette",
    desc: "Boosts color saturation and richness",
    config: { brightness: 103, contrast: 108, saturation: 128, exposure: 0.04, temperature: 4, tint: 1, sharpness: 2.0, skinSmoothing: 0, faceBrightness: 0, faceSkinSmoothing: 0, faceWarmth: 0 }
  },
  {
    id: "lighten",
    label: "Lighten",
    icon: "bx-sun",
    desc: "Lift shadows and brighten dark photos",
    config: { brightness: 120, contrast: 95, saturation: 100, exposure: 0.25, temperature: 0, tint: 0, sharpness: 1.0, skinSmoothing: 0, faceBrightness: 0, faceSkinSmoothing: 0, faceWarmth: 0 }
  },
  {
    id: "contrast",
    label: "High Contrast",
    icon: "bx-adjust",
    desc: "Deep blacks and bright highlights",
    config: { brightness: 96, contrast: 125, saturation: 110, exposure: -0.1, temperature: -5, tint: 1, sharpness: 4.0, skinSmoothing: 0, faceBrightness: 0, faceSkinSmoothing: 0, faceWarmth: 0 }
  }
];

function Slider({ label, value, min, max, step = 1, unit, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="group">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-md transition-colors ${
          value !== (min + max) / 2 ? "bg-primary/10 text-primary" : "text-muted-foreground"
        }`}>{value}{unit}</span>
      </div>
      <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

export function EnhancePanel({ processedSrc, config, onChange, onNext, onImageChange, faceBox }: EnhancePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef    = useRef<HTMLImageElement | null>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"presets" | "manual" | "face" | "ai">("presets");
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);

  // AI Tab State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSkinSoft, setAiSkinSoft] = useState(true);
  const [aiStudioLight, setAiStudioLight] = useState(true);
  const [aiSharp, setAiSharp] = useState(true);

  // Local Toast State
  const [localToast, setLocalToast] = useState<string | null>(null);
  const showLocalToast = (msg: string) => {
    setLocalToast(msg);
    setTimeout(() => setLocalToast(null), 3000);
  };

  // Load main image
  useEffect(() => {
    const img = new Image();
    img.onload = () => { imgRef.current = img; redraw(); };
    img.src = processedSrc;
  }, [processedSrc]);

  // Load custom background image
  useEffect(() => {
    if (!config.bgImageSrc) {
      setBgImg(null);
      redraw();
      return;
    }
    const bImg = new Image();
    bImg.onload = () => { setBgImg(bImg); redraw(); };
    bImg.src = config.bgImageSrc;
  }, [config.bgImageSrc]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const {
      bgColor = "#FFFFFF",
      bgImageSrc,
      brightness = 100, contrast = 100, saturation = 100,
      skinSmoothing = 0, outlineWidth = 0, outlineColor = "#FFFFFF",
      faceBrightness = 0, faceSkinSmoothing = 0, faceWarmth = 0
    } = config;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background (solid, transparent checkerboard, or background image)
    if (bgColor === "transparent") {
      const pat = document.createElement("canvas");
      pat.width = pat.height = 12;
      const ptx = pat.getContext("2d")!;
      ptx.fillStyle = "#d4d4d4"; ptx.fillRect(0, 0, 12, 12);
      ptx.fillStyle = "#f0f0f0"; ptx.fillRect(0, 0, 6, 6); ptx.fillRect(6, 6, 6, 6);
      const pattern = ctx.createPattern(pat, "repeat")!;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (bgImageSrc && bgImg) {
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    }

    // Draw outline
    if (outlineWidth > 0) {
      drawOutline(ctx, img, canvas.width, canvas.height, outlineWidth, outlineColor);
    }

    // Draw base subject image with adjustment filters
    ctx.save();
    let cssFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    if (skinSmoothing > 0) {
      cssFilter += ` blur(${skinSmoothing}px)`;
    }
    cssFilter += ` url(#custom-enhance-filter)`;
    ctx.filter = cssFilter;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Localized Face-based Skin Smoothing with soft feathered edges
    if (faceBox && faceSkinSmoothing > 0) {
      const [fx, fy, fw, fh] = faceBox;
      // Map coordinates from original image size to canvas preview size
      const scaleX = canvas.width / img.naturalWidth;
      const scaleY = canvas.height / img.naturalHeight;
      const cx = (fx + fw / 2) * scaleX;
      const cy = (fy + fh / 2) * scaleY;
      const r = Math.max(fw * scaleX, fh * scaleY) * 0.9;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d")!;
      
      tempCtx.save();
      tempCtx.filter = `blur(${faceSkinSmoothing}px)`;
      tempCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
      tempCtx.restore();

      tempCtx.save();
      tempCtx.globalCompositeOperation = "destination-in";
      const maskGrad = tempCtx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
      maskGrad.addColorStop(0, "rgba(0, 0, 0, 1)");
      maskGrad.addColorStop(0.6, "rgba(0, 0, 0, 0.8)");
      maskGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      tempCtx.fillStyle = maskGrad;
      tempCtx.beginPath();
      tempCtx.arc(cx, cy, r, 0, Math.PI * 2);
      tempCtx.fill();
      tempCtx.restore();

      ctx.drawImage(tempCanvas, 0, 0);
    }

    // Localized Face Spotlight (Face Brightness) - supports both bright & dark
    if (faceBox && faceBrightness !== 0) {
      const [fx, fy, fw, fh] = faceBox;
      const scaleX = canvas.width / img.naturalWidth;
      const scaleY = canvas.height / img.naturalHeight;
      const cx = (fx + fw / 2) * scaleX;
      const cy = (fy + fh / 2) * scaleY;
      const r = Math.max(fw * scaleX, fh * scaleY) * 0.8;

      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
      const absVal = Math.abs(faceBrightness);
      const opacity = (absVal / 100) * 0.35;
      const colorStr = faceBrightness > 0 ? "255, 255, 255" : "0, 0, 0";
      grad.addColorStop(0, `rgba(${colorStr}, ${opacity})`);
      grad.addColorStop(0.5, `rgba(${colorStr}, ${opacity * 0.5})`);
      grad.addColorStop(1, `rgba(${colorStr}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Localized Face Warmth (Color temperature overlay)
    if (faceBox && faceWarmth !== 0) {
      const [fx, fy, fw, fh] = faceBox;
      const scaleX = canvas.width / img.naturalWidth;
      const scaleY = canvas.height / img.naturalHeight;
      const cx = (fx + fw / 2) * scaleX;
      const cy = (fy + fh / 2) * scaleY;
      const r = Math.max(fw * scaleX, fh * scaleY) * 0.8;

      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
      const absVal = Math.abs(faceWarmth);
      const opacity = (absVal / 100) * 0.25;
      const colorStr = faceWarmth > 0 ? "255, 125, 0" : "0, 100, 255";
      grad.addColorStop(0, `rgba(${colorStr}, ${opacity})`);
      grad.addColorStop(0.5, `rgba(${colorStr}, ${opacity * 0.4})`);
      grad.addColorStop(1, `rgba(${colorStr}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [config, bgImg, faceBox]);

  useEffect(() => { redraw(); }, [redraw]);

  const set = (partial: Partial<PassportConfig>) => onChange({ ...config, ...partial });

  function resetEnhancements() {
    onChange({
      ...config,
      brightness: 100, contrast: 100, saturation: 100,
      skinSmoothing: 0, outlineWidth: 0, outlineColor: "#FFFFFF",
      exposure: 0, temperature: 0, tint: 0, sharpness: 0,
      faceBrightness: 0, faceSkinSmoothing: 0, faceWarmth: 0
    });
  }

  const applyPreset = (presetConfig: Partial<PassportConfig>) => {
    onChange({
      ...config,
      ...presetConfig
    });
  };

  function applyBakedImage() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !onImageChange) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.naturalWidth;
    tempCanvas.height = img.naturalHeight;
    const tempCtx = tempCanvas.getContext("2d")!;

    tempCtx.save();
    let cssFilter = `brightness(${config.brightness ?? 100}%) contrast(${config.contrast ?? 100}%) saturate(${config.saturation ?? 100}%)`;
    if (config.skinSmoothing && config.skinSmoothing > 0) {
      const scaleBlur = config.skinSmoothing * (img.naturalWidth / canvas.width);
      cssFilter += ` blur(${scaleBlur}px)`;
    }
    cssFilter += ` url(#custom-enhance-filter)`;
    tempCtx.filter = cssFilter;
    tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.restore();

    if (faceBox && config.faceSkinSmoothing && config.faceSkinSmoothing > 0) {
      const [fx, fy, fw, fh] = faceBox;
      const scaleX = tempCanvas.width / img.naturalWidth;
      const scaleY = tempCanvas.height / img.naturalHeight;
      const cx = (fx + fw / 2) * scaleX;
      const cy = (fy + fh / 2) * scaleY;
      const r = Math.max(fw * scaleX, fh * scaleY) * 0.9;
      const scaleBlur = config.faceSkinSmoothing * (img.naturalWidth / canvas.width);

      const blurCanvas = document.createElement("canvas");
      blurCanvas.width = tempCanvas.width;
      blurCanvas.height = tempCanvas.height;
      const blurCtx = blurCanvas.getContext("2d")!;

      blurCtx.save();
      blurCtx.filter = `blur(${scaleBlur}px)`;
      blurCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
      blurCtx.restore();

      blurCtx.save();
      blurCtx.globalCompositeOperation = "destination-in";
      const maskGrad = blurCtx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
      maskGrad.addColorStop(0, "rgba(0, 0, 0, 1)");
      maskGrad.addColorStop(0.6, "rgba(0, 0, 0, 0.8)");
      maskGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      blurCtx.fillStyle = maskGrad;
      blurCtx.beginPath();
      blurCtx.arc(cx, cy, r, 0, Math.PI * 2);
      blurCtx.fill();
      blurCtx.restore();

      tempCtx.drawImage(blurCanvas, 0, 0);
    }

    if (faceBox && config.faceBrightness && config.faceBrightness !== 0) {
      const [fx, fy, fw, fh] = faceBox;
      const scaleX = tempCanvas.width / img.naturalWidth;
      const scaleY = tempCanvas.height / img.naturalHeight;
      const cx = (fx + fw / 2) * scaleX;
      const cy = (fy + fh / 2) * scaleY;
      const r = Math.max(fw * scaleX, fh * scaleY) * 0.8;

      tempCtx.save();
      const grad = tempCtx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
      const absVal = Math.abs(config.faceBrightness);
      const opacity = (absVal / 100) * 0.35;
      const colorStr = config.faceBrightness > 0 ? "255, 255, 255" : "0, 0, 0";
      grad.addColorStop(0, `rgba(${colorStr}, ${opacity})`);
      grad.addColorStop(0.5, `rgba(${colorStr}, ${opacity * 0.5})`);
      grad.addColorStop(1, `rgba(${colorStr}, 0)`);
      tempCtx.fillStyle = grad;
      tempCtx.beginPath();
      tempCtx.arc(cx, cy, r, 0, Math.PI * 2);
      tempCtx.fill();
      tempCtx.restore();
    }

    if (faceBox && config.faceWarmth && config.faceWarmth !== 0) {
      const [fx, fy, fw, fh] = faceBox;
      const scaleX = tempCanvas.width / img.naturalWidth;
      const scaleY = tempCanvas.height / img.naturalHeight;
      const cx = (fx + fw / 2) * scaleX;
      const cy = (fy + fh / 2) * scaleY;
      const r = Math.max(fw * scaleX, fh * scaleY) * 0.8;

      tempCtx.save();
      const grad = tempCtx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
      const absVal = Math.abs(config.faceWarmth);
      const opacity = (absVal / 100) * 0.25;
      const colorStr = config.faceWarmth > 0 ? "255, 125, 0" : "0, 100, 255";
      grad.addColorStop(0, `rgba(${colorStr}, ${opacity})`);
      grad.addColorStop(0.5, `rgba(${colorStr}, ${opacity * 0.4})`);
      grad.addColorStop(1, `rgba(${colorStr}, 0)`);
      tempCtx.fillStyle = grad;
      tempCtx.beginPath();
      tempCtx.arc(cx, cy, r, 0, Math.PI * 2);
      tempCtx.fill();
      tempCtx.restore();
    }

    const bakedDataURL = tempCanvas.toDataURL("image/png");
    onImageChange(bakedDataURL);

    onChange({
      ...config,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      skinSmoothing: 0,
      exposure: 0,
      temperature: 0,
      tint: 0,
      sharpness: 0,
      faceBrightness: 0,
      faceSkinSmoothing: 0,
      faceWarmth: 0,
    });

    showLocalToast("Enhancements baked & stacked successfully!");
  }

  async function runAiEnhance() {
    if (!onImageChange) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const file = await base64ToFile(processedSrc, "portrait.png");
      const formData = new FormData();
      formData.append("file", file);

      const url = `${PROCESSING_URL}/passport/enhance?skin_softening=${aiSkinSoft}&studio_lighting=${aiStudioLight}&sharpness=${aiSharp}`;
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "AI enhancement failed" }));
        throw new Error(err.detail ?? "AI enhancement failed");
      }

      const data = await res.json();
      onImageChange(data.image);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI enhancement service unavailable";
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  }

  function handleBgFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        onChange({ ...config, bgImageSrc: ev.target.result as string });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const hasChanged =
    (config.brightness ?? 100) !== 100 ||
    (config.contrast ?? 100) !== 100 ||
    (config.saturation ?? 100) !== 100 ||
    (config.skinSmoothing ?? 0) !== 0 ||
    (config.outlineWidth ?? 0) !== 0 ||
    (config.exposure ?? 0) !== 0 ||
    (config.temperature ?? 0) !== 0 ||
    (config.tint ?? 0) !== 0 ||
    (config.sharpness ?? 0) !== 0 ||
    (config.faceBrightness ?? 0) !== 0 ||
    (config.faceSkinSmoothing ?? 0) !== 0 ||
    (config.faceWarmth ?? 0) !== 0;

  // SVG Filter math variables
  const temp = config.temperature ?? 0;
  const tint = config.tint ?? 0;
  const exp = config.exposure ?? 0;
  const sharp = config.sharpness ?? 0;

  // Exposure multiplier
  const m = Math.pow(2, exp);
  
  // Temperature & Tint matrix offsets
  const tVal = temp / 100;
  const gVal = tint / 100;
  const rOffset = tVal * 0.15 - gVal * 0.05;
  const gOffset = tVal * 0.07 + gVal * 0.15;
  const bOffset = -tVal * 0.15 - gVal * 0.05;

  const bgColor = config.bgColor ?? "#FFFFFF";

  return (
    <div className="flex flex-col h-full gap-0 overflow-hidden relative bg-background">
      
      {/* Dynamic hidden SVG for advanced filter matrixes */}
      <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
        <defs>
          <filter id="custom-enhance-filter" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`
                ${m} 0 0 0 ${rOffset}
                0 ${m} 0 0 ${gOffset}
                0 0 ${m} 0 ${bOffset}
                0 0 0 1 0
              `}
              result="color-adjusted"
            />
            {sharp > 0 ? (
              <feConvolveMatrix
                order="3"
                kernelMatrix={`
                  0 ${-sharp / 10} 0
                  ${-sharp / 10} ${1 + (4 * sharp) / 10} ${-sharp / 10}
                  0 ${-sharp / 10} 0
                `}
                edgeMode="duplicate"
                preserveAlpha="true"
                in="color-adjusted"
              />
            ) : (
              <feOffset in="color-adjusted" />
            )}
          </filter>
        </defs>
      </svg>

      {/* Tabs Selector Header */}
      <div className="shrink-0 border-b border-border bg-card px-5 py-3 flex items-center justify-between">
        <div className="flex bg-muted p-1 rounded-xl gap-1">
          {(["presets", "manual"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold capitalize transition-all ${
                tab === t
                  ? "bg-primary text-white shadow-md shadow-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {hasChanged && tab !== "ai" && (
          <button
            onClick={resetEnhancements}
            className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground rounded-lg px-2.5 py-1.5 border border-border hover:bg-muted transition"
          >
            <Boxicon className="bx bx-reset text-xs" /> Reset
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 overflow-hidden">

        {/* LEFT: Live preview */}
        <div className="flex flex-col items-center justify-center bg-muted/20 border-r border-border p-6 gap-4 min-h-0">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Live Preview
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-border shadow-lg"
            style={{ maxWidth: 260 }}>
            <canvas
              ref={canvasRef}
              width={260}
              height={Math.round(260 * (45 / 35))}
              className="block w-full bg-white animate-fade-in animate-scale-up"
            />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-black/40 py-1.5 text-[10px] text-white/70 backdrop-blur-sm font-medium">
              35 × 45 mm · Live
            </div>
          </div>
        </div>

        {/* RIGHT: Sliders / Presets / AI controls + persistent BG Color Tool */}
        <div className="flex flex-col gap-0 overflow-y-auto justify-between bg-card">
          
          <div className="p-6 flex-1 space-y-6">
            
            {/* TAB 1: PRESETS */}
            {tab === "presets" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Boxicon className="bx bx-magic-wand text-primary text-lg" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">Enhancement Presets</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {PRESETS.map((p) => {
                    const isActive = 
                      (config.brightness ?? 100) === p.config.brightness &&
                      (config.contrast ?? 100) === p.config.contrast &&
                      (config.saturation ?? 100) === p.config.saturation &&
                      (config.exposure ?? 0) === p.config.exposure &&
                      (config.temperature ?? 0) === p.config.temperature &&
                      (config.tint ?? 0) === p.config.tint &&
                      (config.sharpness ?? 0) === p.config.sharpness &&
                      (config.faceBrightness ?? 0) === p.config.faceBrightness &&
                      (config.faceSkinSmoothing ?? 0) === p.config.faceSkinSmoothing &&
                      (config.faceWarmth ?? 0) === p.config.faceWarmth;

                    return (
                      <button
                        key={p.id}
                        onClick={() => applyPreset(p.config)}
                        className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${
                          isActive
                            ? "border-primary bg-primary/8 shadow-sm ring-1 ring-primary"
                            : "border-border bg-card hover:border-primary/30 hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="font-bold text-xs text-foreground leading-tight">{p.label}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/85 leading-normal">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: MANUAL CONTROLS */}
            {tab === "manual" && (
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <Boxicon className="bx bx-slider text-primary text-lg" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">Manual Adjustments</span>
                </div>
                <div className="space-y-4">
                  <Slider label="Exposure" value={config.exposure ?? 0} min={-2.0} max={2.0} step={0.05} unit=" EV" onChange={v => set({ exposure: v })} />
                  <Slider label="Brightness" value={config.brightness ?? 100} min={50} max={150} step={0.5} unit="%" onChange={v => set({ brightness: v })} />
                  <Slider label="Contrast"   value={config.contrast   ?? 100} min={50} max={150} step={0.5} unit="%" onChange={v => set({ contrast:   v })} />
                  <Slider label="Saturation" value={config.saturation ?? 100} min={0}  max={200} step={0.5} unit="%" onChange={v => set({ saturation: v })} />
                  <Slider label="Temperature" value={config.temperature ?? 0} min={-50} max={50} step={1} unit="" onChange={v => set({ temperature: v })} />
                  <Slider label="Tint" value={config.tint ?? 0} min={-50} max={50} step={1} unit="" onChange={v => set({ tint: v })} />
                  <Slider label="Sharpness" value={config.sharpness ?? 0} min={0} max={10} step={0.5} unit="px" onChange={v => set({ sharpness: v })} />
                </div>

                {/* Custom Outline Section */}
                <div className="border-t border-border pt-4 mt-2">
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Custom Outline Border</span>
                  <div className="space-y-4">
                    <Slider label="Outline Width" value={config.outlineWidth ?? 0} min={0} max={12} step={0.5} unit="px" onChange={v => set({ outlineWidth: v })} />
                    {(config.outlineWidth ?? 0) > 0 && (
                      <div>
                        <label className="text-[11px] font-semibold text-foreground mb-1.5 block">Outline Color</label>
                        <div className="flex flex-wrap items-center gap-2">
                          {["#FFFFFF", "#000000", "#FFD700", "#FF3333", "#3388FF", "#33FF33"].map(color => (
                            <button
                              key={color}
                              onClick={() => set({ outlineColor: color })}
                              style={{ backgroundColor: color }}
                              className={`h-6 w-6 rounded-full border transition-all ${
                                config.outlineColor === color
                                  ? "border-primary scale-110 ring-2 ring-primary/40"
                                  : "border-border hover:scale-105"
                              }`}
                            />
                          ))}
                          <input
                            type="color"
                            value={config.outlineColor ?? "#FFFFFF"}
                            onChange={e => set({ outlineColor: e.target.value })}
                            className="h-6 w-6 rounded-full cursor-pointer border-none p-0 bg-transparent"
                            title="Custom color"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FACE RETOUCH (NEW) */}
            {tab === "face" && (
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <Boxicon className="bx bx-face text-primary text-lg" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">Face-Based Retouching</span>
                </div>

                {faceBox ? (
                  <>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs text-emerald-600">
                      <Boxicon className="bx bx-check-circle text-base shrink-0 text-emerald-500" />
                      <span><strong>Face Detected!</strong> Bounding coordinates mapped successfully.</span>
                    </div>

                    <div className="space-y-4">
                      {/* Face Spotlight Brightness */}
                      <Slider
                        label="Face Brightness Spotlight"
                        value={config.faceBrightness ?? 0}
                        min={-50}
                        max={50}
                        step={1}
                        unit="%"
                        onChange={(v) => set({ faceBrightness: v })}
                      />
                      
                      {/* Localized Face Skin Smoothing */}
                      <Slider
                        label="Localized Skin Smoothing (Face Only)"
                        value={config.faceSkinSmoothing ?? 0}
                        min={0}
                        max={5}
                        step={0.1}
                        unit="px"
                        onChange={(v) => set({ faceSkinSmoothing: v })}
                      />

                      {/* Localized Face Warmth */}
                      <Slider
                        label="Face Warmth / Color Tone"
                        value={config.faceWarmth ?? 0}
                        min={-50}
                        max={50}
                        step={1}
                        unit=""
                        onChange={(v) => set({ faceWarmth: v })}
                      />

                      <div className="p-3 bg-muted/40 border border-border rounded-xl flex items-start gap-2 text-[10px] text-muted-foreground leading-relaxed">
                        <Boxicon className="bx bx-info-circle text-sm text-primary shrink-0 mt-0.5" />
                        <p>
                          Face Skin Smoothing applies soft blur filters <strong>only within the face region</strong>. This leaves clothing textures and hair outlines completely sharp, satisfying biometric passport photo requirements.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center gap-3 py-12">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Boxicon className="bx bx-user-x text-2xl" />
                    </div>
                    <div className="max-w-[200px]">
                      <span className="text-xs font-bold text-foreground">No Face Bounding Box Found</span>
                      <p className="text-[10px] text-muted-foreground/80 mt-1 leading-normal">
                        Make sure the portrait upload is clear and has not been cropped too tightly.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: ENHANCEMENT */}
            {tab === "ai" && (
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <Boxicon className="bx bx-aperture text-primary text-lg" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">Photo Enhancers</span>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-accent/40 cursor-pointer select-none transition">
                    <div className="flex flex-col gap-0.5 pr-2">
                      <span className="text-xs font-bold text-foreground">Skin Retouch</span>
                      <span className="text-[10px] text-muted-foreground">Server-side skin segmentation and smoothing.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={aiSkinSoft}
                      onChange={(e) => setAiSkinSoft(e.target.checked)}
                      className="h-4.5 w-4.5 rounded-md border-border bg-muted text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-accent/40 cursor-pointer select-none transition">
                    <div className="flex flex-col gap-0.5 pr-2">
                      <span className="text-xs font-bold text-foreground">Studio Lighting</span>
                      <span className="text-[10px] text-muted-foreground">Normalizes light shadows on faces.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={aiStudioLight}
                      onChange={(e) => setAiStudioLight(e.target.checked)}
                      className="h-4.5 w-4.5 rounded-md border-border bg-muted text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-accent/40 cursor-pointer select-none transition">
                    <div className="flex flex-col gap-0.5 pr-2">
                      <span className="text-xs font-bold text-foreground">Detail Sharpening</span>
                      <span className="text-[10px] text-muted-foreground">Enhances hair, eyes, and portrait details.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={aiSharp}
                      onChange={(e) => setAiSharp(e.target.checked)}
                      className="h-4.5 w-4.5 rounded-md border-border bg-muted text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
                    />
                  </label>
                </div>

                {aiError && (
                  <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                    <Boxicon className="bx bx-error-circle text-sm shrink-0" />
                    <span>{aiError}</span>
                  </div>
                )}

                <button
                  onClick={runAiEnhance}
                  disabled={aiLoading || (!aiSkinSoft && !aiStudioLight && !aiSharp)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg transition disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <Boxicon className="bx bx-loader-alt animate-spin text-sm" />
                      Running Enhancers...
                    </>
                  ) : (
                    <>
                      <Boxicon className="bx bx-wand text-sm" />
                      Apply Enhancements
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* PERSISTENT Background controls */}
          <div className="shrink-0 border-t border-border bg-card/60 p-6 space-y-4">
            <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Photo Background &amp; Color</span>
            
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onChange({ ...config, bgColor: "transparent", bgImageSrc: null })}
                  title="Transparent Background"
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full border border-border overflow-hidden bg-muted/40 transition-all ${
                    bgColor === "transparent" ? "ring-2 ring-primary ring-offset-2 ring-offset-card scale-110" : "hover:scale-105"
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-rose-500 rotate-45" />
                  </div>
                </button>

                {[
                  { label: "White", value: "#FFFFFF", bgClass: "bg-white border border-gray-200" },
                  { label: "Off-white", value: "#F8F8F8", bgClass: "bg-stone-100 border border-gray-200" },
                  { label: "Light Blue", value: "#C3D9F0", bgClass: "bg-blue-200" },
                  { label: "Red", value: "#E8312F", bgClass: "bg-red-500" },
                ].map((c) => (
                  <button
                    key={c.value}
                    onClick={() => onChange({ ...config, bgColor: c.value, bgImageSrc: null })}
                    title={c.label}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${c.bgClass} ${
                      bgColor === c.value
                        ? "ring-2 ring-primary ring-offset-2 scale-110"
                        : "hover:scale-105"
                    }`}
                  />
                ))}

                <input
                  type="color"
                  value={bgColor === "transparent" ? "#FFFFFF" : bgColor}
                  onChange={(e) => onChange({ ...config, bgColor: e.target.value, bgImageSrc: null })}
                  className="h-9 w-9 cursor-pointer rounded-full border-none p-0 bg-transparent"
                  title="Custom color picker"
                />
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input
                  ref={bgFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBgFileChange}
                />
                <button
                  onClick={() => bgFileRef.current?.click()}
                  className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                    config.bgImageSrc
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      : "border-border bg-card text-foreground hover:bg-accent"
                  }`}
                >
                  <Boxicon className="bx bx-image-add text-sm" />
                  {config.bgImageSrc ? "Change BG Image" : "Upload Custom Background"}
                </button>
                {config.bgImageSrc && (
                  <button
                    onClick={() => onChange({ ...config, bgImageSrc: null })}
                    className="flex items-center gap-1 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Boxicon className="bx bx-x text-sm" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom action bar */}
      <div className="shrink-0 border-t border-border bg-card px-5 py-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground hidden sm:block">
          Adjustments are applied instantly. Set face lighting or smoothness in the &quot;Face Retouch&quot; tab.
        </p>
        <div className="flex items-center gap-3 ml-auto">
          {hasChanged && (
            <button
              onClick={applyBakedImage}
              className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary px-4 py-2 text-xs font-bold transition shadow-sm"
              title="Save current adjustments into the image and reset sliders to keep editing on top"
            >
              <Boxicon className="bx bx-layer text-sm" />
              Bake &amp; Stack Edits
            </button>
          )}
          <button
            onClick={onNext}
            disabled={aiLoading}
            id="enhance-next-btn"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition"
          >
            Continue to Layout
            <Boxicon className="bx bx-chevron-right text-lg" />
          </button>
        </div>
      </div>

      {/* Local Toast Notification */}
      {localToast && (
        <div className="absolute bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white shadow-2xl ring-1 ring-white/10 animate-fade-in flex items-center gap-2">
          <Boxicon className="bx bx-check-circle text-emerald-400 text-sm" />
          {localToast}
        </div>
      )}
    </div>
  );
}
