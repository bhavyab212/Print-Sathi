import { useState, useRef, useEffect, useCallback } from "react";
import { FileDropzone } from "../components/passport/passport/FileDropzone";
import {
  PassportConfigPanel,
  PASSPORT_SIZES,
  type PassportConfig,
} from "../components/passport/passport/PassportConfig";
import { A4SheetPreview } from "../components/passport/passport/A4SheetPreview";
import { canvasToBMP, canvasToTIFF, canvasToPDF, padImageBuffer } from "../lib/imageEncoders";

// Python processing service base URL
const PROCESSING_URL =
  (import.meta as any).env?.VITE_PROCESSING_URL ?? "http://localhost:8000";

type Step = "upload" | "processing" | "configure" | "done";

const DEFAULT_CONFIG: PassportConfig = {
  size: PASSPORT_SIZES[0],  // Indian passport 35×45mm — 90% of use cases
  sheetSize: "A4",          // Standard DTP/xerox shop paper — from research
  customWidth: 35,
  customHeight: 45,
  copies: 8,                // 8 = most common Indian shop request (4 col × 2 row)
  bgColor: "#FFFFFF",       // Pure white — mandatory for govt doc photos
  showCutLines: true,       // Professional shops expect hairline cut guides
  gapMm: 3,                 // Gap between photos for cutting
  colsAuto: true,           // Auto-calculate photos per row
  customCols: 4,            // Default custom cols if not auto
  brightness: 100,
  contrast: 100,
  saturation: 100,
  skinSmoothing: 0,
  outlineWidth: 0,
  outlineColor: "#FFFFFF",
};

// Processing stages shown during AI processing
const STAGES = [
  { label: "Uploading image",             icon: "bx-cloud-upload",     pct: 8  },
  { label: "Reading file format",         icon: "bx-file",             pct: 18 },
  { label: "Initialising AI model",       icon: "bx-brain",            pct: 28 },
  { label: "Removing background",         icon: "bx-eraser",           pct: 52 },
  { label: "Detecting face & landmarks",  icon: "bx-face",             pct: 72 },
  { label: "Cropping to passport frame",  icon: "bx-crop",             pct: 84 },
  { label: "Optimising image quality",    icon: "bx-image-alt",        pct: 94 },
  { label: "Finalising",                  icon: "bx-check-shield",     pct: 99 },
];

export default function PassportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(true);
  const [config, setConfig] = useState<PassportConfig>(DEFAULT_CONFIG);
  const [photosOnSheet, setPhotosOnSheet] = useState(0);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [downloadTarget, setDownloadTarget] = useState<"single" | "sheet">("sheet");
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg" | "webp" | "pdf" | "bmp" | "tiff">("png");
  const [limitFileSize, setLimitFileSize] = useState<boolean>(false);
  const [targetSizeKb, setTargetSizeKb] = useState<number>(50);
  const [estimatedSizeKb, setEstimatedSizeKb] = useState<number | null>(null);
  const [jpegQuality, setJpegQuality] = useState<number>(90);

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
      fg.src = processedImage || "";
    });
  };

  // Debounced estimated file size calculator
  useEffect(() => {
    if (step !== "configure" && step !== "done") return;
    if (!processedImage) return;

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
    processedImage,
    downloadTarget,
    exportFormat,
    jpegQuality,
    limitFileSize,
    targetSizeKb,
    config,
    step
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
      showToast("Failed to download image");
    }
  };

  // Model selection state (u2net / u2net_human_seg)
  const [selectedModel, setSelectedModel] = useState<string>("u2net");


  // Processing animation state
  const [stageIdx, setStageIdx] = useState(0);
  const [pct, setPct] = useState(0);
  const [animPct, setAnimPct] = useState(0);
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pctAnimRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated percentage counter
  useEffect(() => {
    if (step !== "processing") return;
    pctAnimRef.current = setInterval(() => {
      setAnimPct((prev) => {
        if (prev < pct) return Math.min(prev + 1, pct);
        return prev;
      });
    }, 18);
    return () => {
      if (pctAnimRef.current) clearInterval(pctAnimRef.current);
    };
  }, [pct, step]);

  function startProcessingAnimation() {
    setStageIdx(0);
    setPct(STAGES[0].pct);
    setAnimPct(0);

    let idx = 0;
    stageTimerRef.current = setInterval(() => {
      idx++;
      if (idx < STAGES.length) {
        setStageIdx(idx);
        setPct(STAGES[idx].pct);
      } else {
        clearInterval(stageTimerRef.current!);
      }
    }, 900);
  }

  function stopProcessingAnimation() {
    if (stageTimerRef.current) clearInterval(stageTimerRef.current);
  }

  // ── Show a transient toast ──────────────────────────────────────────────
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  // ── Step 1 → 2: File selected, send to Python ─────────────────────────
  const handleFileSelected = useCallback(async (file: File) => {
    setSelectedFile(file);
    setProcessingError(null);
    setStep("processing");
    startProcessingAnimation();

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${PROCESSING_URL}/passport/process?model=${selectedModel}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Processing failed" }));
        throw new Error(err.detail ?? "Processing failed");
      }

      const data = await res.json();
      stopProcessingAnimation();
      setPct(100);
      setAnimPct(100);

      // Short pause to show 100%
      await new Promise((r) => setTimeout(r, 600));

      setProcessedImage(data.image);
      setFaceDetected(data.face_detected ?? true);
      setStep("configure");
    } catch (err: any) {
      stopProcessingAnimation();
      setProcessingError(err.message || "Failed to contact processing server");
      setStep("upload");
    }
  }, [selectedModel]);

  // ── Print page trigger ───────────────────────────────────────────
  function handlePrint() {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
      showToast("Print dialog opened ✓");
    }, 300);
  }

  function handleReset() {
    stopProcessingAnimation();
    setStep("upload");
    setSelectedFile(null);
    setProcessedImage(null);
    setProcessingError(null);
    setConfig(DEFAULT_CONFIG);
    setFaceDetected(true);
    setStageIdx(0);
    setPct(0);
    setAnimPct(0);
  }

  const currentStage = STAGES[Math.min(stageIdx, STAGES.length - 1)];

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #passport-a4-canvas,
          #passport-a4-canvas * { visibility: visible !important; }
          #passport-a4-canvas {
            position: fixed !important;
            left: 0; top: 0;
            width: var(--print-sheet-w, 210mm) !important;
            height: var(--print-sheet-h, 297mm) !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          @page {
            size: var(--print-sheet-w, 210mm) var(--print-sheet-h, 297mm);
            margin: 0;
          }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-xl ring-1 ring-white/10">
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-5xl space-y-6">

        {/* ── Header ─────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Passport Photo</h1>
              
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Upload a portrait, auto-remove background, arrange on A4, print.
            </p>
          </div>
          {step !== "upload" && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <i className="bx bx-refresh text-base"></i>
              Start over
            </button>
          )}
        </div>

        {/* ── Step indicator ──────────────────────────── */}
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
          {(["upload", "processing", "configure"] as Step[]).map((s, idx) => {
            const done = (step === "configure" && idx < 2) || (step === "processing" && idx === 0) || step === "done";
            const active = step === s || (step === "done" && s === "configure");
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all
                    ${active ? "bg-blue-500 text-white shadow-md shadow-blue-500/35" : done ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}
                >
                  {done ? "✓" : idx + 1}
                </div>
                <span className={active ? "text-gray-700" : ""}>
                  {s === "upload" ? "Upload" : s === "processing" ? "Process" : "Configure & Print"}
                </span>
                {idx < 2 && <div className="h-px w-6 bg-gray-200"></div>}
              </div>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════
            STEP: UPLOAD
        ═══════════════════════════════════════════════════════ */}
        {step === "upload" && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-800">
              Upload Portrait Photo
            </h2>

            {processingError && (
              <div className="mb-4 flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                <i className="bx bx-error-circle mt-0.5 text-base shrink-0"></i>
                <div>
                  <p className="font-semibold">Processing failed</p>
                  <p className="opacity-80">{processingError}</p>
                  <p className="mt-1 text-xs opacity-65">
                    Make sure the local processing server is online.
                  </p>
                </div>
              </div>
            )}

            <FileDropzone onFileSelected={handleFileSelected} />

            {/* Model Selection Toggle */}
            <div className="mt-5 border-t border-gray-100 pt-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">
                AI Segmentation Model
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setSelectedModel("u2net")}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                    selectedModel === "u2net"
                      ? "border-blue-500 bg-blue-50/50 text-gray-800 ring-1 ring-blue-500"
                      : "border-gray-200 bg-white text-gray-500 hover:border-blue-300"
                  }`}
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <i className="bx bx-run text-base"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Standard Model</p>
                    <p className="text-xs text-gray-400">Fast background removal using standard u2net.</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedModel("u2net_human_seg")}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                    selectedModel === "u2net_human_seg"
                      ? "border-blue-500 bg-blue-50/50 text-gray-800 ring-1 ring-blue-500"
                      : "border-gray-200 bg-white text-gray-500 hover:border-blue-300"
                  }`}
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <i className="bx bx-user-voice text-base"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Ultra Model (Human Seg)</p>
                    <p className="text-xs text-gray-400">Heavy, high-precision portrait model for complex backdrops or hair details.</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-600">
              <i className="bx bx-info-circle mt-0.5 text-sm"></i>
              <p>
                For best results: clear face, neutral expression, good lighting,
                plain background. The AI will auto-remove the background.
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            STEP: PROCESSING
        ═══════════════════════════════════════════════════════ */}
        {step === "processing" && (
          <ProcessingScreen
            stageIdx={stageIdx}
            animPct={animPct}
            currentStage={currentStage}
            selectedFile={selectedFile}
          />
        )}

        {/* ═══════════════════════════════════════════════════════
            STEP: CONFIGURE & PRINT
        ═══════════════════════════════════════════════════════ */}
        {(step === "configure" || step === "done") && processedImage && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* Left: Preview + Config ──────────────────── */}
            <div className="flex flex-col gap-6">

              {/* Face warning */}
              {!faceDetected && (
                <div className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <i className="bx bx-error mt-0.5"></i>
                  <div>
                    <p className="font-semibold">No face detected</p>
                    <p className="text-amber-600">
                      The crop may not be optimal. You can still proceed —
                      the image will be placed as-is.
                    </p>
                  </div>
                </div>
              )}

              {/* Processed photo preview */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-gray-800">
                  Processed Photo
                </h2>
                <PhotoPreview processedImage={processedImage} config={config} />
                {selectedFile && (
                  <p className="mt-3 text-center text-xs text-gray-400">
                    {selectedFile.name} &middot;{" "}
                    {(selectedFile.size / 1024).toFixed(0)} KB
                  </p>
                )}
              </div>

              {/* Config panel */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-gray-800">
                  Configure
                </h2>
                <PassportConfigPanel config={config} onChange={setConfig} />
              </div>
            </div>

            {/* Right: A4 Sheet Preview ──────────────────── */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-800">
                    A4 Sheet Preview
                  </h2>
                  {photosOnSheet > 0 && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                      {photosOnSheet} photos on 1 sheet
                    </span>
                  )}
                </div>

                <A4SheetPreview
                  processedImageSrc={processedImage}
                  size={config.size}
                  sheetSize={config.sheetSize}
                  customWidth={config.customWidth}
                  customHeight={config.customHeight}
                  copies={config.copies}
                  bgColor={config.bgColor}
                  showCutLines={config.showCutLines}
                  gapMm={config.gapMm}
                  colsAuto={config.colsAuto}
                  customCols={config.customCols}
                  onPhotoCount={setPhotosOnSheet}
                  brightness={config.brightness}
                  contrast={config.contrast}
                  saturation={config.saturation}
                  skinSmoothing={config.skinSmoothing}
                  outlineWidth={config.outlineWidth}
                  outlineColor={config.outlineColor}
                />

                <p className="mt-2 text-center text-xs text-gray-400">
                  {config.sheetSize === "4R"
                    ? "4R (102×152 mm / 4×6 inch)"
                    : config.sheetSize === "A6"
                    ? "A6 (105×148 mm)"
                    : "A4 (210×297 mm)"}
                  {" "}&mdash; 8mm margin · 3mm gap · print at 100%
                </p>
              </div>

              {/* Download and Export Config Card */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <i className="bx bx-download text-blue-500"></i>
                  Export &amp; Download Options
                </h2>
                
                {/* Target Select */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                    Download Target
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setDownloadTarget("sheet")}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                        downloadTarget === "sheet"
                          ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      A4 Layout Sheet
                    </button>
                    <button
                      type="button"
                      onClick={() => setDownloadTarget("single")}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                        downloadTarget === "single"
                          ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Single Photo
                    </button>
                  </div>
                </div>

                {/* Export Format */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                    Output Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["png", "jpeg", "webp", "pdf", "bmp", "tiff"] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setExportFormat(fmt)}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-bold uppercase transition ${
                          exportFormat === fmt
                            ? "border-blue-500 bg-blue-50 text-blue-600"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Settings */}
                {(exportFormat === "jpeg" || exportFormat === "webp" || exportFormat === "pdf") && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500 font-semibold">
                      <span>Image Quality</span>
                      <span>{jpegQuality}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={jpegQuality}
                      onChange={(e) => setJpegQuality(Number(e.target.value))}
                      className="w-full accent-blue-500 bg-gray-100 h-1 rounded cursor-pointer"
                    />
                  </div>
                )}

                {/* Size constraints */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <label className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase cursor-pointer">
                    <span>Limit File Size</span>
                    <input
                      type="checkbox"
                      checked={limitFileSize}
                      onChange={(e) => setLimitFileSize(e.target.checked)}
                      className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 h-4 w-4"
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
                          className="w-24 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-mono outline-none focus:border-blue-500"
                        />
                        <span className="text-xs text-gray-500">KB Maximum</span>
                      </div>
                      <p className="text-[10px] text-amber-600 leading-tight">
                        * Quality and resolution will scale automatically to keep size under {targetSizeKb} KB.
                      </p>
                    </div>
                  )}
                </div>

                {/* Size Estimation & Action Button */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Estimated Size</span>
                    <span className="text-xs text-gray-500 font-semibold uppercase">
                      {exportFormat} · {downloadTarget}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-blue-600">
                    {estimatedSizeKb !== null ? `~ ${estimatedSizeKb} KB` : "Estimating..."}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm shadow-md transition"
                >
                  <i className="bx bx-download text-base" /> Download File
                </button>
              </div>

              {/* Print button */}
              <button
                onClick={handlePrint}
                disabled={printing}
                id="passport-print-btn"
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-60"
              >
                {printing ? (
                  <>
                    <i className="bx bx-loader-alt animate-spin text-xl"></i>
                    Opening print dialog…
                  </>
                ) : (
                  <>
                    <i className="bx bx-printer text-xl"></i>
                    Print A4 Sheet
                  </>
                )}
              </button>

              <p className="text-center text-xs text-amber-600 font-medium">
                ⚠ Always print at <strong>100% / Actual Size</strong>. Never use &ldquo;Fit to Page&rdquo; — it shrinks photos and they get rejected.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Processing Screen Component ──────────────────────────────────────── */
function ProcessingScreen({
  stageIdx,
  animPct,
  currentStage,
  selectedFile,
}: {
  stageIdx: number;
  animPct: number;
  currentStage: typeof STAGES[0];
  selectedFile: File | null;
}) {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Setup file preview URL
  useEffect(() => {
    if (!selectedFile) return;
    const url = URL.createObjectURL(selectedFile);
    setFilePreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  // Load preview image once
  useEffect(() => {
    if (!filePreview) return;
    const img = new Image();
    img.onload = () => {
      setLoadedImage(img);
    };
    img.src = filePreview;
  }, [filePreview]);

  // Handle the pixelation and noise canvas drawing on animPct or loadedImage change
  useEffect(() => {
    if (!loadedImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const aspect = 45 / 35; // passport ratio
    const w = 320;
    const h = Math.round(w * aspect);
    canvas.width = w;
    canvas.height = h;

    // Draw pixelated image based on animPct
    ctx.imageSmoothingEnabled = false;
    // @ts-ignore
    ctx.mozImageSmoothingEnabled = false;
    // @ts-ignore
    ctx.webkitImageSmoothingEnabled = false;

    // Scale factor: starts extremely low and reaches 1.0 at 100%
    const p = animPct / 100;
    const scale = 0.03 + 0.97 * Math.pow(p, 3.5);

    const tempW = Math.max(2, Math.round(w * scale));
    const tempH = Math.max(2, Math.round(h * scale));

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Draw small
    ctx.drawImage(loadedImage, 0, 0, tempW, tempH);

    // Stretch back to pixelate
    ctx.drawImage(canvas, 0, 0, tempW, tempH, 0, 0, w, h);

    // Add noise/grain overlay that fades out
    if (animPct < 100) {
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      const noiseFactor = (1 - p) * 0.45;
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < 0.8) {
          // Monochrome grain noise
          const noise = (Math.random() - 0.5) * 255 * noiseFactor;
          data[i] = Math.min(255, Math.max(0, data[i] + noise));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
  }, [loadedImage, animPct]);

  // Compute CSS filter styling for the canvas
  const blurPx = Math.max(0, (1 - animPct / 100) * 16);
  const brightness = 0.7 + (animPct / 100) * 0.3;
  const saturation = animPct; // 0% desaturated to 100% full color
  const cssFilter = `blur(${blurPx}px) brightness(${brightness}) saturate(${saturation}%)`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="relative grid grid-cols-1 gap-8 px-6 py-10 md:grid-cols-12 md:p-12 items-center">
        {/* Left: Large AI Scan Chamber (5 columns) */}
        <div className="flex flex-col items-center justify-center gap-4 md:col-span-5">
          {filePreview ? (
            <div className="group relative">
              {/* Corner tech brackets */}
              <div className="absolute -left-2 -top-2 h-4 w-4 border-l-2 border-t-2 border-blue-500 rounded-tl-sm animate-pulse" />
              <div className="absolute -right-2 -top-2 h-4 w-4 border-r-2 border-t-2 border-blue-500 rounded-tr-sm animate-pulse" />
              <div className="absolute -left-2 -bottom-2 h-4 w-4 border-l-2 border-b-2 border-blue-500 rounded-bl-sm animate-pulse" />
              <div className="absolute -right-2 -bottom-2 h-4 w-4 border-r-2 border-b-2 border-blue-500 rounded-br-sm animate-pulse" />

              {/* Shimmering outer shadow glow */}
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 opacity-20 blur-md transition duration-1000 group-hover:opacity-40" />

              <div className="relative h-80 w-64 md:h-[350px] md:w-[272px] overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-2xl">
                {/* The rendering canvas */}
                <canvas
                  ref={canvasRef}
                  className="h-full w-full object-cover"
                  style={{ filter: cssFilter }}
                />

                {/* Sweep animation overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-sweep" />
                </div>

                {/* Neon horizontal scanline */}
                <div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                  style={{
                    top: `${animPct}%`,
                    transition: "top 0.1s ease-out",
                  }}
                />

                {/* Grid line matrix overlay */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />

                {/* Scanning active badge */}
                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold tracking-wider text-blue-400 border border-blue-500/20 backdrop-blur-md uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                  Generating
                </div>

                {/* Photo details label */}
                <div className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-0.5 text-[9px] font-mono text-white/60 backdrop-blur-sm">
                  35 x 45 mm · ISO/IEC
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-80 w-64 md:h-[350px] md:w-[272px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50">
              <i className="bx bx-image-alt text-4xl text-gray-300 animate-pulse" />
            </div>
          )}

          {/* File details subtext */}
          {selectedFile && (
            <p className="max-w-[200px] truncate text-center text-xs text-gray-400">
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
            </p>
          )}
        </div>

        {/* Right: Engine Details, Steps and Progress (7 columns) */}
        <div className="flex flex-col gap-6 md:col-span-7 md:pl-4">
          <div className="flex items-center gap-4">
            {/* AI Status Orb */}
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-blue-100" />
              <div
                className="absolute inset-2 animate-ping rounded-full bg-blue-50"
                style={{ animationDelay: "300ms" }}
              />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/40">
                <i
                  className={`bx ${currentStage.icon} text-xl text-white transition-all duration-500`}
                ></i>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                Print Sathi AI Engine
              </span>
              <h3 className="mt-0.5 text-lg font-bold leading-snug text-gray-800">
                {currentStage.label}
              </h3>
            </div>
          </div>

          {/* Progress bar and counter */}
          <div className="w-full">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-gray-400">
                <i className="bx bx-loader-alt animate-spin text-sm" />
                Analyzing structure...
              </span>
              <span className="text-sm font-bold tabular-nums text-blue-500">
                {animPct}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 p-[2px] border border-gray-200/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-100 ease-out"
                style={{ width: `${animPct}%` }}
              />
            </div>
          </div>

          {/* Stage list grid */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-2">
            {STAGES.map((s, i) => {
              const isDone = i < stageIdx;
              const isActive = i === stageIdx;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
                    isDone
                      ? "font-medium text-green-600"
                      : isActive
                        ? "font-bold text-blue-600 translate-x-1"
                        : "text-gray-400"
                  }`}
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {isDone ? (
                      <i className="bx bx-check-circle animate-scale-up text-base text-green-500" />
                    ) : isActive ? (
                      <i className={`bx ${s.icon} animate-pulse text-base text-blue-500`} />
                    ) : (
                      <i className="bx bx-circle text-sm opacity-50" />
                    )}
                  </div>
                  <span className="truncate">{s.label}</span>
                </div>
              );
            })}
          </div>

          {/* Step dots under-bar */}
          <div className="mt-1 flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="flex items-center gap-1.5">
              {STAGES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i < stageIdx
                      ? "w-3 bg-green-500"
                      : i === stageIdx
                        ? "w-5 bg-blue-500"
                        : "w-1.5 bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-[10px] text-gray-400">
              Stage {Math.min(stageIdx + 1, STAGES.length)} of {STAGES.length}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom accent glow bar */}
      <div className="relative h-1 w-full overflow-hidden bg-gray-50">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-shimmer" />
      </div>

      <style>{`
        @keyframes sweep {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(250%); }
        }
        .animate-sweep {
          animation: sweep 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }

        @keyframes scale-up {
          0% { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up { animation: scale-up 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>
    </div>
  );
}

// Helper to draw stroke outline around a transparent image (copied in page scope)
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

/* ── Live Photo Preview (applies bg color/image via canvas) ───────────── */
function PhotoPreview({ processedImage, config }: { processedImage: string; config: PassportConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SIZE = 240;
    canvas.width = SIZE;
    canvas.height = Math.round(SIZE * (45 / 35)); // passport ratio

    const {
      bgColor,
      brightness = 100,
      contrast = 100,
      saturation = 100,
      skinSmoothing = 0,
      outlineWidth = 0,
      outlineColor = "#FFFFFF",
    } = config;

    const fg = new Image();
    fg.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 1) Fill background color
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2.5) Draw outline underneath the foreground
      if (outlineWidth > 0) {
        drawOutline(ctx, fg, 0, 0, canvas.width, canvas.height, outlineWidth, outlineColor);
      }

      // 3) Draw foreground person with enhancements
      ctx.save();
      const filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` + 
        (skinSmoothing > 0 ? ` blur(${skinSmoothing}px)` : "");
      ctx.filter = filterStr;
      ctx.drawImage(fg, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    };
    fg.src = processedImage;
  }, [processedImage, config]);

  return (
    <div className="flex items-center justify-center">
      <div className="relative overflow-hidden rounded-xl border border-gray-200 shadow-md">
        <canvas ref={canvasRef} className="block" />
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-black/40 py-1.5 text-xs text-white backdrop-blur-sm">
          Live background preview
        </div>
      </div>
    </div>
  );
}
