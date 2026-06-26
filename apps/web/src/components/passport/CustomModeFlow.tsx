"use client";
import { Boxicon } from "@/components/ui";


import { useState, useCallback, useRef, useEffect } from "react";
import { PASSPORT_SIZES, type PassportConfig } from "@/components/passport/PassportConfig";
import { StepNav, type PassportStep } from "@/components/passport/panels/StepNav";
import { UploadPanel, type AIModel } from "@/components/passport/panels/UploadPanel";
import { ProcessingPanel } from "@/components/passport/panels/ProcessingPanel";
import { BgReviewPanel } from "@/components/passport/panels/BgReviewPanel";
import { CropAdjustPanel, type CropBox } from "@/components/passport/panels/CropAdjustPanel";
import { EnhancePanel } from "@/components/passport/panels/EnhancePanel";
import { LayoutPrintPanel } from "@/components/passport/panels/LayoutPrintPanel";

const PROCESSING_URL =
  (process.env.NEXT_PUBLIC_PROCESSING_URL ?? "http://localhost:8000").replace(/\/+$/, "");

const DEFAULT_CONFIG: PassportConfig = {
  size: PASSPORT_SIZES[0],
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
  exposure: 0,
  temperature: 0,
  tint: 0,
  sharpness: 0,
  faceBrightness: 0,
  faceSkinSmoothing: 0,
  faceWarmth: 0,
  pageMarginMm: 6,
  photoGapMm: 3,
};


// Map step to the "completedUpTo" index for StepNav
const STEP_ORDER: PassportStep[] = ["upload", "processing", "bg-review", "crop", "enhance", "print"];

interface CustomModeFlowProps {
  onWorkStatusChange: (hasWork: boolean) => void;
  initialImageUrl?: string | null;
  jobId?: string | null;
  itemId?: string | null;
}

export function CustomModeFlow({ onWorkStatusChange, initialImageUrl, jobId, itemId }: CustomModeFlowProps) {
  const [step, setStep]                     = useState<PassportStep>("upload");

  useEffect(() => {
    onWorkStatusChange(step !== "upload");
  }, [step, onWorkStatusChange]);
  const [selectedFile, setSelectedFile]     = useState<File | null>(null);
  const [model, setModel]                   = useState<AIModel>("u2net");
  const [processedSrc, setProcessedSrc]     = useState<string | null>(null);
  const [displaySrc, setDisplaySrc]         = useState<string | null>(null); // after crop
  const [faceDetected, setFaceDetected]     = useState(true);
  const [faceBox, setFaceBox]               = useState<number[] | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [config, setConfig]                 = useState<PassportConfig>(DEFAULT_CONFIG);
  const [printing, setPrinting]             = useState(false);
  const [toast, setToast]                   = useState<string | null>(null);

  // Processing animation
  const [stageIdx, setStageIdx] = useState(0);
  const [pct, setPct]           = useState(0);
  const [animPct, setAnimPct]   = useState(0);
  const stageRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated percentage counter
  useEffect(() => {
    if (step !== "processing") return;
    animRef.current = setInterval(() => {
      setAnimPct(prev => prev < pct ? Math.min(prev + 1, pct) : prev);
    }, 18);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [pct, step]);

  function startAnimation() {
    setStageIdx(0); setPct(8); setAnimPct(0);
    let idx = 0;
    stageRef.current = setInterval(() => {
      idx++;
      const stages = [8, 18, 28, 52, 72, 84, 94, 99];
      if (idx < stages.length) { setStageIdx(idx); setPct(stages[idx]); }
      else clearInterval(stageRef.current!);
    }, 900);
  }

  function stopAnimation() {
    if (stageRef.current) clearInterval(stageRef.current);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // ── Core processing call ─────────────────────────────────────────────
  const processFile = useCallback(async (
    file: File, 
    mdl: AIModel,
    feedback?: { alpha_matting?: boolean; fg?: number; bg?: number; remove_shadow?: boolean }
  ) => {
    setSelectedFile(file);
    setModel(mdl);
    setProcessingError(null);
    setStep("processing");
    startAnimation();

    try {
      const form = new FormData();
      form.append("file", file);

      // Pass crop=false to the backend so we get the full uncropped image for background removal review.
      let url = `${PROCESSING_URL}/passport/process?model=${mdl}&crop=false`;
      if (feedback?.alpha_matting) {
        url += `&alpha_matting=true&alpha_matting_fg=${feedback.fg ?? 240}&alpha_matting_bg=${feedback.bg ?? 10}`;
      }
      if (feedback?.remove_shadow) {
        url += `&remove_shadow=true`;
      }

      const res = await fetch(url, {
        method: "POST", body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Processing failed" }));
        throw new Error(err.detail ?? "Processing failed");
      }

      const data = await res.json();
      stopAnimation();
      setPct(100); setAnimPct(100);
      await new Promise(r => setTimeout(r, 500));

      setProcessedSrc(data.image);
      setDisplaySrc(data.image);
      setFaceDetected(data.face_detected ?? true);
      // The backend returns the faceBox relative to the uncropped image now
      setFaceBox(data.face_box ?? null);

      // Log usage
      fetch("/api/usage/passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size: config.size.id, model: mdl }),
      }).catch(() => {});

      setStep("bg-review");
    } catch (err: unknown) {
      stopAnimation();
      const msg = err instanceof Error ? err.message : "Processing service unavailable";
      setProcessingError(msg);
      setStep("upload");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.size]);

  // ── Handler bindings ─────────────────────────────────────────────────

  // Step 1 → 2 (& 2)
  const handleFileSelected = useCallback((file: File, mdl: AIModel = "u2net") => {
    processFile(file, mdl);
  }, [processFile]);

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

  // Retry: re-send with same file & model, possibly with feedback
  const handleRetry = useCallback((feedback?: { alpha_matting?: boolean; fg?: number; bg?: number; remove_shadow?: boolean }) => {
    if (selectedFile) processFile(selectedFile, model, feedback);
  }, [selectedFile, model, processFile]);

  // Upgrade to ultra and re-send
  const handleUpgradeToUltra = useCallback(() => {
    if (selectedFile) processFile(selectedFile, "u2net_human_seg");
  }, [selectedFile, processFile]);

  // BG review accept → go to crop
  const handleBgAccept = useCallback(() => setStep("crop"), []);

  // Manual Edit Apply -> update processedSrc & displaySrc
  const handleManualApply = useCallback((editedImageBase64: string) => {
    setProcessedSrc(editedImageBase64);
    setDisplaySrc(editedImageBase64);
  }, []);

  // Crop applied → update displaySrc
  const handleCropApply = useCallback((
    cropped: string,
    _box: CropBox,
    cropCase?: { widthMm?: number; heightMm?: number },
    cropMeta?: { srcX: number; srcY: number; srcW: number; srcH: number }
  ) => {
    setDisplaySrc(cropped);
    if (cropCase && cropCase.widthMm && cropCase.heightMm) {
      const match = PASSPORT_SIZES.find(s => s.widthMm === cropCase.widthMm && s.heightMm === cropCase.heightMm);
      if (match) {
        setConfig(c => ({ ...c, size: match }));
      }
    }
    // Update faceBox coordinates relative to the crop!
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
    setStep("enhance");
  }, [faceBox]);

  const handleCropSkip = useCallback(() => {
    setDisplaySrc(processedSrc);
    setStep("enhance");
  }, [processedSrc]);

  // Enhance → go to print
  const handleEnhanceNext = useCallback(() => setStep("print"), []);

  // Print
  async function handlePrint() {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
      showToast("Print dialog opened ✓");
    }, 300);
  }

  // Hard reset
  function handleReset() {
    stopAnimation();
    setStep("upload");
    setSelectedFile(null);
    setProcessedSrc(null);
    setDisplaySrc(null);
    setFaceBox(null);
    setProcessingError(null);
    setConfig(DEFAULT_CONFIG);
    setFaceDetected(true);
    setStageIdx(0); setPct(0); setAnimPct(0);
  }

  // Step nav click
  function handleStepClick(s: PassportStep) {
    const cur = STEP_ORDER.indexOf(step);
    const target = STEP_ORDER.indexOf(s);
    // Only allow going back or to completed steps
    if (target <= cur) setStep(s);
  }

  const completedUpTo = Math.max(0, STEP_ORDER.indexOf(step) - 1);
  const activeSrc     = displaySrc ?? processedSrc;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #passport-a4-canvas, #passport-a4-canvas * { visibility: visible !important; }
          #passport-a4-canvas {
            position: fixed !important; left: 0; top: 0;
            width: 210mm !important; height: 297mm !important;
            margin: 0 !important; padding: 0 !important;
            border: none !important; box-shadow: none !important;
          }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-xl ring-1 ring-white/10 animate-fade-in">
          {toast}
        </div>
      )}

      {/* Full-height panel container */}
      <div className="flex flex-col h-full overflow-hidden">

        {/* Top nav strip */}
        <div className="shrink-0 border-b border-border bg-card/80 backdrop-blur-sm px-4 py-2.5 flex items-center gap-4">
          {/* Back button (except first step) */}
          {step !== "upload" && step !== "processing" && (
            <button
              onClick={() => {
                const cur = STEP_ORDER.indexOf(step);
                if (cur > 0) setStep(STEP_ORDER[cur - 1]);
              }}
              className="shrink-0 flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition"
            >
              <Boxicon className="bx bx-chevron-left text-base" /> Back
            </button>
          )}

          <StepNav
            current={step}
            completedUpTo={completedUpTo}
            onStepClick={handleStepClick}
          />

          {/* Reset (except on upload step) */}
          {step !== "upload" && (
            <button
              onClick={handleReset}
              className="shrink-0 flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
              title="Start over"
            >
              <Boxicon className="bx bx-x text-base" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>

        {/* Panel content */}
        <div className="flex-1 min-h-0 overflow-hidden relative">

          {/* Upload (Step 1) */}
          {step === "upload" && (
            <div className="h-full overflow-y-auto">
              <UploadPanel
                onFileSelected={handleFileSelected}
                error={processingError}
              />
            </div>
          )}

          {/* Processing (Step 2) */}
          {step === "processing" && (
            <div className="h-full overflow-hidden">
              <ProcessingPanel
                selectedFile={selectedFile}
                stageIdx={stageIdx}
                animPct={animPct}
                model={model}
              />
            </div>
          )}

          {/* Background Review (Step 3) */}
          {step === "bg-review" && processedSrc && (
            <div className="h-full overflow-hidden flex flex-col">
              <BgReviewPanel
                originalFile={selectedFile}
                processedSrc={processedSrc}
                faceDetected={faceDetected}
                model={model}
                onAccept={handleBgAccept}
                onRetry={handleRetry}
                onUpgradeToUltra={handleUpgradeToUltra}
                onManualApply={handleManualApply}
              />
            </div>
          )}

          {/* Crop Adjust (Step 4) */}
          {step === "crop" && processedSrc && (
            <div className="h-full overflow-hidden flex flex-col">
              <CropAdjustPanel
                processedSrc={processedSrc}
                faceBox={faceBox}
                onApply={handleCropApply}
                onSkip={handleCropSkip}
              />
            </div>
          )}

          {/* Enhance (Step 5) */}
          {step === "enhance" && activeSrc && (
            <div className="h-full overflow-hidden flex flex-col">
              <EnhancePanel
                processedSrc={activeSrc}
                config={config}
                onChange={setConfig}
                onNext={handleEnhanceNext}
                onImageChange={setDisplaySrc}
                faceBox={faceBox}
              />
            </div>
          )}

          {/* Layout & Print (Step 6) */}
          {step === "print" && activeSrc && (
            <div className="h-full overflow-hidden flex flex-col">
              <LayoutPrintPanel
                processedSrc={activeSrc}
                config={config}
                onChange={setConfig}
                onPrint={handlePrint}
                printing={printing}
                onReset={handleReset}
                onCropClick={() => setStep("crop")}
                jobId={jobId}
                itemId={itemId}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
