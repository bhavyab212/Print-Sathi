"use client";
import { Boxicon } from "@/components/ui";


import { useState, useCallback, useEffect } from "react";
import { FileDropzone } from "@/components/passport/FileDropzone";
import {
  PASSPORT_SIZES,
  type PassportConfig,
} from "@/components/passport/PassportConfig";
import { LayoutPrintPanel } from "@/components/passport/panels/LayoutPrintPanel";
import { CropAdjustPanel, type CropBox } from "@/components/passport/panels/CropAdjustPanel";

// Python processing service base URL
const PROCESSING_URL =
  process.env.NEXT_PUBLIC_PROCESSING_URL ?? "http://localhost:8000";

type Step = "upload" | "processing" | "configure" | "done";

const DEFAULT_CONFIG: PassportConfig = {
  size: PASSPORT_SIZES[0], // Indian by default
  customWidth: 35,
  customHeight: 45,
  copies: 4,
  bgColor: "#FFFFFF",
  bgImageSrc: null,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  skinSmoothing: 0,
  outlineWidth: 0,
  outlineColor: "#FFFFFF",
  pageMarginMm: 6,
  photoGapMm: 3,
};

interface QuickModeFlowProps {
  onWorkStatusChange: (hasWork: boolean) => void;
  initialImageUrl?: string | null;
  jobId?: string | null;
  itemId?: string | null;
}

export function QuickModeFlow({ onWorkStatusChange, initialImageUrl, jobId, itemId }: QuickModeFlowProps) {
  const [step, setStep] = useState<Step>("upload");

  useEffect(() => {
    onWorkStatusChange(step !== "upload");
  }, [step, onWorkStatusChange]);

  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalProcessedImage, setOriginalProcessedImage] = useState<string | null>(null);
  const [faceBox, setFaceBox] = useState<number[] | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [config, setConfig] = useState<PassportConfig>(DEFAULT_CONFIG);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ── Show a transient toast ──────────────────────────────────────────────
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  // ── Step 1 → 2: File selected, send to Python ─────────────────────────
  const handleFileSelected = useCallback(async (file: File) => {
    setProcessingError(null);
    setStep("processing");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // crop=false so we get the full BG-removed image; user can crop manually in the editor
      const res = await fetch(`${PROCESSING_URL}/passport/process?crop=false`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Processing failed" }));
        throw new Error(err.detail ?? "Processing failed");
      }

      const data = await res.json();
      setOriginalProcessedImage(data.image);
      setProcessedImage(data.image);
      setFaceBox(data.face_box ?? null);
      setStep("configure");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Processing service unavailable";
      setProcessingError(msg);
      setStep("upload");
    }
  }, []);

  // ── Auto-load initial image if provided ─────────────────────────────────
  useEffect(() => {
    if (initialImageUrl && step === "upload") {
      fetch(initialImageUrl)
        .then(r => r.blob())
        .then(blob => {
          const file = new File([blob], "passport-photo.jpg", { type: blob.type || "image/jpeg" });
          handleFileSelected(file);
        })
        .catch(() => {
          setProcessingError("Could not load initial image from URL");
        });
    }
  }, [initialImageUrl, step, handleFileSelected]);

  // ── Crop callbacks ───────────────────────────────────────────────────
  const handleCropApply = useCallback((
    cropped: string,
    _box: CropBox,
    cropCase?: { widthMm?: number; heightMm?: number },
    cropMeta?: { srcX: number; srcY: number; srcW: number; srcH: number }
  ) => {
    setProcessedImage(cropped);
    if (cropCase && cropCase.widthMm && cropCase.heightMm) {
      const match = PASSPORT_SIZES.find(s => s.widthMm === cropCase.widthMm && s.heightMm === cropCase.heightMm);
      if (match) {
        setConfig(c => ({ ...c, size: match }));
      }
    }
    // Update faceBox coordinates relative to the crop
    if (faceBox && cropMeta) {
      const { srcX, srcY } = cropMeta;
      const [fx, fy, fw, fh] = faceBox;
      setFaceBox([
        Math.max(0, Math.round(fx - srcX)),
        Math.max(0, Math.round(fy - srcY)),
        Math.round(fw),
        Math.round(fh)
      ]);
    }
    setIsCropping(false);
  }, [faceBox]);

  const handleCropSkip = useCallback(() => {
    setProcessedImage(originalProcessedImage);
    setIsCropping(false);
  }, [originalProcessedImage]);

  // ── Step 3 → print ────────────────────────────────────────────────────
  async function handlePrint() {
    setPrinting(true);

    // Log usage (fire-and-forget)
    fetch("/api/usage/passport", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        size: config.size,
        copies: config.copies,
        bgColor: config.bgColor,
      }),
    }).catch(() => {/* non-fatal */});

    // Give the canvas a moment to fully render, then print
    setTimeout(() => {
      window.print();
      setPrinting(false);
      setStep("done");
      showToast("Print dialog opened ✓");
    }, 300);
  }

  // ── Reset ─────────────────────────────────────────────────────────────
  function handleReset() {
    setStep("upload");
    setProcessedImage(null);
    setOriginalProcessedImage(null);
    setFaceBox(null);
    setIsCropping(false);
    setProcessingError(null);
    setConfig(DEFAULT_CONFIG);
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Print-only styles (hides everything except the canvas) ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #passport-a4-canvas,
          #passport-a4-canvas * { visibility: visible !important; }
          #passport-a4-canvas {
            position: fixed !important;
            left: 0; top: 0;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-5xl h-full flex flex-col gap-6 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Passport Photo</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a portrait, auto-remove background, arrange on A4, print.
            </p>
          </div>
          {step !== "upload" && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              <Boxicon className="bx bx-refresh text-base" />
              Start over
            </button>
          )}
        </div>

        {/* ── Step indicator ── */}
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/60 shrink-0">
          {(["upload", "processing", "configure"] as Step[]).map((s, idx) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all
                  ${step === s || (step === "done" && s === "configure")
                    ? "bg-blue-500 text-white"
                    : step === "processing" && idx === 0
                      ? "bg-green-500 text-white"
                      : step === "configure" && idx < 2
                        ? "bg-green-500 text-white"
                        : step === "done"
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                  }`}
              >
                {(step === "configure" && idx < 2) ||
                (step === "processing" && idx === 0) ||
                step === "done"
                  ? "✓"
                  : idx + 1}
              </div>
              <span className={step === s ? "text-foreground font-bold" : "text-muted-foreground/60"}>
                {s === "upload" ? "Upload" : s === "processing" ? "Process" : "Configure & Print"}
              </span>
              {idx < 2 && <div className="h-px w-6 bg-border"></div>}
            </div>
          ))}
        </div>

        {/* ── Step Content ── */}
        <div className="flex-1 min-h-0 relative">
          {/* ═══════════════════════════════════════════════════════
              STEP: UPLOAD
          ═══════════════════════════════════════════════════════ */}
          {step === "upload" && (
            <div className="absolute inset-0 overflow-y-auto pr-1 pb-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-foreground">
                  Upload Portrait Photo
                </h2>

                {processingError && (
                  <div className="mb-4 flex items-start gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
                    <Boxicon className="bx bx-error-circle mt-0.5 text-base" />
                    <div>
                      <p className="font-semibold">Processing failed</p>
                      <p className="text-destructive/80">{processingError}</p>
                      <p className="mt-1 text-xs text-destructive/60">
                        Make sure the Python service is running:{" "}
                        <code className="rounded bg-destructive/20 px-1 font-mono text-[11px]">
                          uvicorn main:app --reload --port 8000
                        </code>
                      </p>
                    </div>
                  </div>
                )}

                <FileDropzone onFileSelected={handleFileSelected} />

                <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/10 px-4 py-3 text-xs text-primary border border-primary/20">
                  <Boxicon className="bx bx-info-circle mt-0.5 text-sm" />
                  <p>
                    For best results: clear face, neutral expression, good lighting,
                    plain background. The AI will auto-remove the background.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP: PROCESSING
          ═══════════════════════════════════════════════════════ */}
          {step === "processing" && (
            <div className="absolute inset-0 overflow-y-auto pr-1 pb-6">
              <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-border bg-card py-20 shadow-sm">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <Boxicon className="bx bx-image-alt text-4xl text-primary" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-foreground">
                    Removing background & detecting face…
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This takes 5–15 seconds on first run (model loading).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]"></div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP: CONFIGURE & PRINT
          ═══════════════════════════════════════════════════════ */}
          {(step === "configure" || step === "done") && processedImage && (
            <div className="absolute inset-0 flex flex-col overflow-hidden">
              <LayoutPrintPanel
                processedSrc={processedImage}
                config={config}
                onChange={setConfig}
                onPrint={handlePrint}
                printing={printing}
                onReset={handleReset}
                onCropClick={() => setIsCropping(true)}
                jobId={jobId}
                itemId={itemId}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Crop Overlay Modal ── */}
      {isCropping && originalProcessedImage && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col overflow-hidden animate-in fade-in duration-200">
          <div className="shrink-0 border-b border-border bg-card/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="text-sm font-bold text-foreground">Crop &amp; Adjust Photo</h2>
            </div>
            <button
              onClick={() => setIsCropping(false)}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
            >
              <Boxicon className="bx bx-x text-base" /> Cancel
            </button>
          </div>
          <div className="flex-1 min-h-0 bg-muted/5">
            <CropAdjustPanel
              processedSrc={originalProcessedImage}
              faceBox={faceBox}
              onApply={handleCropApply}
              onSkip={handleCropSkip}
            />
          </div>
        </div>
      )}
    </>
  );
}
