"use client";

import { useState, useEffect } from "react";
import { canvasToBMP, canvasToTIFF, canvasToPDF, padImageBuffer } from "@/lib/imageEncoders";
import { createBrowserClient } from "@supabase/ssr";
import toast from "react-hot-toast";

// Helper to draw stroke outline around a transparent image
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

  // Draw foreground image
  octx.drawImage(img, 0, 0, width, height);

  // Turn non-transparent pixels into solid strokeColor
  octx.globalCompositeOperation = "source-in";
  octx.fillStyle = strokeColor;
  octx.fillRect(0, 0, width, height);

  // Draw offset silhouette in 16 directions
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
import { PassportConfigPanel, BG_COLORS } from "../PassportConfig";
import { A4SheetPreview } from "../A4SheetPreview";
import type { PassportConfig } from "../PassportConfig";

interface LayoutPrintPanelProps {
  processedSrc: string;
  config: PassportConfig;
  onChange: (c: PassportConfig) => void;
  onPrint: () => void;
  printing: boolean;
  onReset: () => void;
  onCropClick?: () => void;
  jobId?: string | null;
  itemId?: string | null;
}

export function LayoutPrintPanel({
  processedSrc,
  config,
  onChange,
  onPrint,
  printing,
  onReset,
  onCropClick,
  jobId,
  itemId,
}: LayoutPrintPanelProps) {
  const [photosOnSheet, setPhotosOnSheet] = useState(0);
  const [downloadTarget, setDownloadTarget] = useState<"single" | "sheet">("sheet");
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg" | "webp" | "pdf" | "bmp" | "tiff">("png");
  const [limitFileSize, setLimitFileSize] = useState<boolean>(false);
  const [targetSizeKb, setTargetSizeKb] = useState<number>(50);
  const [estimatedSizeKb, setEstimatedSizeKb] = useState<number | null>(null);
  const [jpegQuality, setJpegQuality] = useState<number>(90);
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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

  const getSinglePhotoCanvas = (): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      const effectiveW = config.size.id === "custom" ? config.customWidth : config.size.widthMm;
      const effectiveH = config.size.id === "custom" ? config.customHeight : config.size.heightMm;
      const MM_TO_PX = 794 / 210;
      const w = effectiveW * MM_TO_PX;
      const h = effectiveH * MM_TO_PX;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(canvas);
        return;
      }

      ctx.fillStyle = config.bgColor;
      ctx.fillRect(0, 0, w, h);

      const fg = new Image();
      fg.onload = () => {
        const renderfg = (bgImg?: HTMLImageElement) => {
          if (bgImg) {
            ctx.drawImage(bgImg, 0, 0, w, h);
          }
          if (config.outlineWidth && config.outlineWidth > 0 && config.outlineColor) {
            drawOutline(ctx, fg, 0, 0, w, h, config.outlineWidth, config.outlineColor);
          }
          ctx.save();
          const filterStr = `brightness(${config.brightness}%) contrast(${config.contrast}%) saturate(${config.saturation}%)` + 
            (config.skinSmoothing && config.skinSmoothing > 0 ? ` blur(${config.skinSmoothing}px)` : "");
          ctx.filter = filterStr;
          ctx.drawImage(fg, 0, 0, w, h);
          ctx.restore();
          resolve(canvas);
        };

        if (config.bgImageSrc) {
          const bgImg = new Image();
          bgImg.onload = () => renderfg(bgImg);
          bgImg.onerror = () => renderfg();
          bgImg.src = config.bgImageSrc;
        } else {
          renderfg();
        }
      };
      fg.src = processedSrc;
    });
  };

  // Debounced estimated file size calculator
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        let canvas: HTMLCanvasElement;
        if (downloadTarget === "sheet") {
          const c = document.getElementById("passport-a4-canvas") as HTMLCanvasElement;
          if (!c) return;
          canvas = c;
        } else {
          canvas = await getSinglePhotoCanvas();
        }

        const quality = jpegQuality / 100;
        const blob = await getCompressedBlob(canvas, exportFormat, targetSizeKb, quality);
        setEstimatedSizeKb(Math.round(blob.size / 1024));
      } catch (err) {
        console.error("Size estimation error", err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    processedSrc,
    downloadTarget,
    exportFormat,
    jpegQuality,
    limitFileSize,
    targetSizeKb,
    config,
  ]);

  const handleDownload = async () => {
    try {
      let canvas: HTMLCanvasElement;
      if (downloadTarget === "sheet") {
        const c = document.getElementById("passport-a4-canvas") as HTMLCanvasElement;
        if (!c) return;
        canvas = c;
      } else {
        canvas = await getSinglePhotoCanvas();
      }

      const quality = jpegQuality / 100;
      const blob = await getCompressedBlob(canvas, exportFormat, targetSizeKb, quality);
      const url = URL.createObjectURL(blob);

      const extension = {
        png: "png",
        jpeg: "jpg",
        webp: "webp",
        pdf: "pdf",
        bmp: "bmp",
        tiff: "tiff"
      }[exportFormat];

      const link = document.createElement("a");
      link.download = `printo_passport_${downloadTarget}.${extension}`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download", err);
      alert("Failed to download image");
    }
  };

  const handleSaveToJob = async () => {
    if (!jobId || !itemId) return;
    setIsSaving(true);
    const toastId = toast.loading("Saving generated passport sheet...");
    try {
      const c = document.getElementById("passport-a4-canvas") as HTMLCanvasElement;
      if (!c) throw new Error("A4 Canvas not found");

      // Always save as a high-quality PDF for the dashboard
      const pdfBlob = canvasToPDF(c, 0.9);
      const file = new File([pdfBlob], "passport_sheet.pdf", { type: "application/pdf" });

      const filePath = `edited/${jobId}_${itemId}.pdf`;
      const { error: uploadErr } = await supabase.storage.from("customer_uploads").upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: itemData, error: fetchErr } = await supabase.from("job_items").select("settings").eq("id", itemId).single();
      if (fetchErr) throw fetchErr;

      const newSettings = { ...(itemData?.settings || {}), action: 'direct_print' };

      const { error: updateErr } = await supabase.from("job_items").update({
        file_url: filePath,
        file_name: "Passport_Sheet.pdf",
        file_type: "pdf",
        file_size_bytes: file.size,
        settings: newSettings
      }).eq("id", itemId);
      if (updateErr) throw updateErr;

      toast.success("Saved successfully!", { id: toastId });
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast.error("Failed to save: " + err.message, { id: toastId });
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-0 overflow-hidden">
      {/* Main area */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">

        {/* LEFT: A4 Preview */}
        <div className="flex flex-col items-center justify-start bg-muted/10 border-r border-border p-5 gap-3 overflow-y-auto">
          <div className="w-full flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              A4 Sheet Preview
            </h3>
            {photosOnSheet > 0 && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {photosOnSheet} photos / sheet
              </span>
            )}
          </div>

          <div className="w-full">
            <A4SheetPreview
              processedImageSrc={processedSrc}
              size={config.size}
              customWidth={config.customWidth}
              customHeight={config.customHeight}
              copies={config.copies}
              bgColor={config.bgColor}
              bgImageSrc={config.bgImageSrc}
              onPhotoCount={setPhotosOnSheet}
              brightness={config.brightness}
              contrast={config.contrast}
              saturation={config.saturation}
              skinSmoothing={config.skinSmoothing}
              outlineWidth={config.outlineWidth}
              outlineColor={config.outlineColor}
              pageMarginMm={config.pageMarginMm}
              photoGapMm={config.photoGapMm}
            />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            A4 (210 × 297 mm) — photos rendered at actual scale
          </p>
        </div>

        {/* RIGHT: Configuration */}
        <div className="overflow-y-auto p-5 flex flex-col gap-6">

          {/* Large single photo preview card */}
          <div className="rounded-clay glass elev-2 overflow-hidden shrink-0">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <i className="bx bx-user text-sm text-primary" />
                Processed Photo
              </h3>
              {onCropClick && (
                <button
                  type="button"
                  onClick={onCropClick}
                  className="flex items-center gap-1.5 rounded-lg neu hover:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] px-3 py-1.5 transition-all"
                >
                  <i className="bx bx-crop text-xs" /> Crop &amp; Adjust
                </button>
              )}
            </div>
            <div
              className="flex items-center justify-center px-4 pb-4"
              style={{ background: config.bgColor }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={processedSrc}
                alt="Processed passport photo"
                className="max-h-64 object-contain"
                style={{
                  filter: `brightness(${config.brightness ?? 100}%) contrast(${config.contrast ?? 100}%) saturate(${config.saturation ?? 100}%)`,
                }}
              />
            </div>
          </div>

          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10">
              <i className="bx bx-layout text-indigo-500 text-sm" />
            </div>
            Layout & Background
          </h3>

          {/* Quick background color bar */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">
              Background Color
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {BG_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => onChange({ ...config, bgColor: c.value === "custom" ? "#AACCEE" : c.value, bgImageSrc: null })}
                  title={c.label}
                  className={`flex h-8 w-8 rounded-full items-center justify-center transition-all ${c.sample} ${
                    config.bgColor === c.value || (c.value === "custom" && !BG_COLORS.slice(0, -1).some(x => x.value === config.bgColor))
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-card scale-110"
                      : "hover:scale-105"
                  }`}
                >
                  {c.value === "custom" && <i className="bx bx-palette text-white text-xs drop-shadow" />}
                </button>
              ))}
              <input
                type="color"
                value={config.bgColor}
                onChange={e => onChange({ ...config, bgColor: e.target.value, bgImageSrc: null })}
                className="h-8 w-8 rounded-full cursor-pointer border-none p-0"
                title="Custom color"
              />
              <code className="text-xs font-mono text-muted-foreground ml-1">{config.bgColor}</code>
            </div>
          </div>

          {/* Page Layout Spacing Controls */}
          <div className="grid grid-cols-2 gap-6 border-t border-b border-border/40 py-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-semibold">
                <span className="text-muted-foreground">Page Margin</span>
                <span className="text-primary font-mono">{config.pageMarginMm ?? 6} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={config.pageMarginMm ?? 6}
                onChange={(e) => onChange({ ...config, pageMarginMm: Number(e.target.value) })}
                className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-semibold">
                <span className="text-muted-foreground">Photo Spacing / Gap</span>
                <span className="text-primary font-mono">{config.photoGapMm ?? 3} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={config.photoGapMm ?? 3}
                onChange={(e) => onChange({ ...config, photoGapMm: Number(e.target.value) })}
                className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Full config panel (sizes, copies, bg image) */}
          <PassportConfigPanel config={config} onChange={onChange} />

          {/* Premium Download & Export Section */}
          <div className="border-t border-border/60 pt-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10">
                <i className="bx bx-download text-emerald-500 text-sm" />
              </div>
              Download &amp; Export Config
            </h3>

            {/* Target Select: Single or Sheet */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Download Target
              </label>
              <div className="grid grid-cols-2 gap-2 neu-inset p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDownloadTarget("sheet")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    downloadTarget === "sheet"
                      ? "glass-strong text-primary glow-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  A4 Layout Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setDownloadTarget("single")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    downloadTarget === "single"
                      ? "glass-strong text-primary glow-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Single Photo
                </button>
              </div>
            </div>

            {/* Export Format */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Output Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["png", "jpeg", "webp", "pdf", "bmp", "tiff"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setExportFormat(fmt)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold uppercase transition-all ${
                      exportFormat === fmt
                        ? "glass-strong text-primary glow-primary ring-1 ring-primary"
                        : "neu text-foreground hover:text-primary"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Compression slider */}
            {(exportFormat === "jpeg" || exportFormat === "webp" || exportFormat === "pdf") && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                  <span>Image Quality</span>
                  <span>{jpegQuality}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={jpegQuality}
                  onChange={(e) => setJpegQuality(Number(e.target.value))}
                  className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Sizing constraints */}
            <div className="space-y-3">
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
                <div className="space-y-2 animate-in fade-in duration-150">
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
                    * Quality and scaling will automatically adjust to keep the file under {targetSizeKb} KB.
                  </p>
                </div>
              )}
            </div>

            {/* Estimation & Action */}
            <div className="neu-inset rounded-xl p-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Estimated Size</span>
                <span className="text-xs text-muted-foreground uppercase font-semibold">
                  {exportFormat} · {downloadTarget}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-primary">
                {estimatedSizeKb !== null ? `~ ${estimatedSizeKb} KB` : "Estimating..."}
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm glow-success hover:shadow-lg transition-all"
            >
              <i className="bx bx-download text-base" /> Download File
            </button>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="shrink-0 glass-nav px-5 py-3 flex items-center gap-4">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-xl neu px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition"
        >
          <i className="bx bx-refresh text-sm" />
          Start Over
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2 justify-end">
          {jobId && itemId && (
            <button
              onClick={handleSaveToJob}
              disabled={isSaving || printing}
              className="flex items-center gap-2 rounded-clay bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-bold text-white glow-success transition-all hover:shadow-xl hover:shadow-emerald-500/35 disabled:opacity-60"
            >
              {isSaving ? (
                <><i className="bx bx-loader-alt animate-spin text-lg" /> Saving…</>
              ) : (
                <><i className="bx bx-check-circle text-lg" /> Save to Queue &amp; Return</>
              )}
            </button>
          )}
          <button
            onClick={onPrint}
            disabled={printing || isSaving}
            id="passport-print-btn"
            className="flex items-center gap-2.5 rounded-clay bg-gradient-to-r from-blue-500 to-indigo-600 px-7 py-3 text-sm font-bold text-white glow-primary transition-all hover:shadow-xl hover:shadow-blue-500/35 disabled:opacity-60"
          >
            {printing ? (
              <><i className="bx bx-loader-alt animate-spin text-lg" /> Opening print dialog…</>
            ) : (
              <><i className="bx bx-printer text-lg" /> Print A4 Sheet</>
            )}
          </button>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground text-right px-5 pb-2 -mt-1 bg-card">Set scale 100% · Portrait · No margins</p>
    </div>
  );
}
