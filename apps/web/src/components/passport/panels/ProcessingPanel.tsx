"use client";

import { useState, useRef, useEffect } from "react";

const STAGES = [
  { label: "Uploading image",            icon: "bx-cloud-upload",  pct: 8  },
  { label: "Reading file format",        icon: "bx-file",          pct: 18 },
  { label: "Initialising AI model",      icon: "bx-brain",         pct: 28 },
  { label: "Removing background",        icon: "bx-eraser",        pct: 52 },
  { label: "Detecting face & landmarks", icon: "bx-face",          pct: 72 },
  { label: "Cropping to passport frame", icon: "bx-crop",          pct: 84 },
  { label: "Optimising image quality",   icon: "bx-image-alt",     pct: 94 },
  { label: "Finalising",                 icon: "bx-check-shield",  pct: 99 },
];

const BG_REMOVE_STAGES = [
  { label: "Uploading image",            icon: "bx-cloud-upload",  pct: 10 },
  { label: "Reading file format",        icon: "bx-file",          pct: 25 },
  { label: "Initialising AI model",      icon: "bx-brain",         pct: 45 },
  { label: "Removing background",        icon: "bx-eraser",        pct: 75 },
  { label: "Optimising image quality",   icon: "bx-image-alt",     pct: 92 },
  { label: "Finalising",                 icon: "bx-check-shield",  pct: 99 },
];

interface ProcessingPanelProps {
  selectedFile: File | null;
  stageIdx: number;
  animPct: number;
  model: string;
  type?: "passport" | "bg-remove";
}

export function ProcessingPanel({ selectedFile, stageIdx, animPct, model, type = "passport" }: ProcessingPanelProps) {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const activeStages = type === "bg-remove" ? BG_REMOVE_STAGES : STAGES;
  const currentStage = activeStages[Math.min(stageIdx, activeStages.length - 1)];

  // Create and load preview URL once
  useEffect(() => {
    if (!selectedFile) return;
    const url = URL.createObjectURL(selectedFile);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  useEffect(() => {
    if (!filePreview) return;
    const img = new Image();
    img.onload = () => setLoadedImage(img);
    img.src = filePreview;
  }, [filePreview]);

  // Render pixelation animation
  useEffect(() => {
    if (!loadedImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const aspect = loadedImage.naturalHeight / loadedImage.naturalWidth;
    const w = 320;
    const h = Math.round(w * aspect);
    canvas.width = w;
    canvas.height = h;

    ctx.imageSmoothingEnabled = false;

    const p = animPct / 100;
    const scale = 0.03 + 0.97 * Math.pow(p, 3.5);
    const tempW = Math.max(2, Math.round(w * scale));
    const tempH = Math.max(2, Math.round(h * scale));

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(loadedImage, 0, 0, tempW, tempH);
    ctx.drawImage(canvas, 0, 0, tempW, tempH, 0, 0, w, h);

    if (animPct < 100) {
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const noiseFactor = (1 - p) * 0.42;
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < 0.75) {
          const noise = (Math.random() - 0.5) * 255 * noiseFactor;
          data[i]     = Math.min(255, Math.max(0, data[i]     + noise));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
  }, [loadedImage, animPct]);

  const blurPx = Math.max(0, (1 - animPct / 100) * 18);
  const brightness = 0.65 + (animPct / 100) * 0.35;
  const saturation = animPct;
  const cssFilter = `blur(${blurPx}px) brightness(${brightness}) saturate(${saturation}%)`;

  return (
    <div className="flex h-full items-center justify-center px-4 py-6">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

        {/* LEFT: Scan Chamber */}
        <div className="flex flex-col items-center justify-center gap-4 md:col-span-5">
          {filePreview ? (
            <div className="group relative">
              {/* Corner brackets */}
              <div className="absolute -left-2 -top-2 h-5 w-5 border-l-2 border-t-2 border-primary rounded-tl-sm animate-pulse" />
              <div className="absolute -right-2 -top-2 h-5 w-5 border-r-2 border-t-2 border-primary rounded-tr-sm animate-pulse" />
              <div className="absolute -left-2 -bottom-2 h-5 w-5 border-l-2 border-b-2 border-primary rounded-bl-sm animate-pulse" />
              <div className="absolute -right-2 -bottom-2 h-5 w-5 border-r-2 border-b-2 border-primary rounded-br-sm animate-pulse" />

              {/* Outer glow */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 opacity-25 blur-lg transition duration-700 group-hover:opacity-40" />

              {/* Photo window */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-2xl"
                style={{ width: 280, height: 360 }}>
                <canvas
                  ref={canvasRef}
                  className="h-full w-full object-cover"
                  style={{ filter: cssFilter }}
                />

                {/* Sweep overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 animate-sweep" />
                </div>

                {/* Scanline */}
                <div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                  style={{ top: `${animPct}%`, transition: "top 0.12s ease-out" }}
                />

                {/* Grid matrix */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:18px_18px] opacity-50" />

                {/* Generating badge */}
                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold tracking-wider text-primary border border-primary/25 backdrop-blur-sm uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                  {model === "u2net_human_seg" ? "Ultra" : "Standard"} AI
                </div>

                {/* Resolution label */}
                <div className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-0.5 text-[9px] font-mono text-white/60 backdrop-blur-sm">
                  {type === "bg-remove" ? "HD Quality · Transparency" : "35 × 45 mm · ISO/IEC"}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30"
              style={{ width: 280, height: 360 }}>
              <i className="bx bx-image-alt text-4xl text-muted-foreground/40 animate-pulse" />
            </div>
          )}

          {selectedFile && (
            <p className="max-w-[220px] truncate text-center text-xs text-muted-foreground/70">
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
            </p>
          )}
        </div>

        {/* RIGHT: Stage details */}
        <div className="flex flex-col gap-6 md:col-span-7 md:pl-2">
          {/* AI header orb */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <div className="absolute inset-2 animate-ping rounded-full bg-primary/15" style={{ animationDelay: "300ms" }} />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/40">
                <i className={`bx ${currentStage.icon} text-xl text-white transition-all duration-500`} />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Print Sathi AI Engine
              </span>
              <h3 className="mt-0.5 text-lg font-bold leading-snug text-foreground">
                {currentStage.label}
              </h3>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <i className="bx bx-loader-alt animate-spin text-sm" />
                Analyzing structure...
              </span>
              <span className="text-sm font-bold tabular-nums text-primary">{animPct}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted p-[2px] border border-border/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-100 ease-out"
                style={{ width: `${animPct}%` }}
              />
            </div>
          </div>

          {/* Stage grid */}
          <div className="grid grid-cols-1 gap-2.5 rounded-xl border border-border/40 bg-muted/25 p-4 sm:grid-cols-2">
            {STAGES.map((s, i) => {
              const isDone   = i < stageIdx;
              const isActive = i === stageIdx;
              return (
                <div key={i} className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
                  isDone   ? "font-medium text-emerald-500" :
                  isActive ? "font-bold text-primary translate-x-1" : "text-muted-foreground/40"
                }`}>
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {isDone   ? <i className="bx bx-check-circle text-base text-emerald-500" /> :
                     isActive ? <i className={`bx ${s.icon} animate-pulse text-base text-primary`} /> :
                                <i className="bx bx-circle text-sm opacity-40" />}
                  </div>
                  <span className="truncate">{s.label}</span>
                </div>
              );
            })}
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-between border-t border-border/40 pt-3">
            <div className="flex items-center gap-1.5">
              {STAGES.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${
                  i < stageIdx ? "w-3 bg-emerald-500" : i === stageIdx ? "w-5 bg-primary" : "w-1.5 bg-muted"
                }`} />
              ))}
            </div>
            <span className="font-mono text-[10px] text-muted-foreground/50">
              Stage {Math.min(stageIdx + 1, STAGES.length)} of {STAGES.length}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sweep { 0% { transform: translateX(-150%); } 100% { transform: translateX(250%); } }
        .animate-sweep { animation: sweep 2.5s cubic-bezier(0.4,0,0.2,1) infinite; }
      `}</style>
    </div>
  );
}
