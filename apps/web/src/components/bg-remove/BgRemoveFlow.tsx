"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { UploadPanel, type AIModel } from "@/components/passport/panels/UploadPanel";
import { ProcessingPanel } from "@/components/passport/panels/ProcessingPanel";
import { BgReviewPanel } from "@/components/passport/panels/BgReviewPanel";
import { CropAdjustPanel } from "@/components/passport/panels/CropAdjustPanel";

const PROCESSING_URL =
  process.env.NEXT_PUBLIC_PROCESSING_URL ?? "http://localhost:8000";

type BgStep = "upload" | "processing" | "review" | "crop" | "done";

const BG_STEP_ORDER: BgStep[] = ["upload", "processing", "review", "crop", "done"];

const BG_STEPS: { id: BgStep; label: string; icon: string }[] = [
  { id: "upload",     label: "Upload",       icon: "bx-cloud-upload"  },
  { id: "processing", label: "Processing",   icon: "bx-brain"         },
  { id: "review",     label: "Background",   icon: "bx-eraser"        },
  { id: "crop",       label: "Crop Adjust",  icon: "bx-crop"          },
  { id: "done",       label: "Download",     icon: "bx-download"      },
];

interface BgRemoveFlowProps {
  initialImageUrl?: string | null;
}

export function BgRemoveFlow({ initialImageUrl }: BgRemoveFlowProps) {
  const [step, setStep] = useState<BgStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [model, setModel] = useState<AIModel>("u2net");
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [customizedSrc, setCustomizedSrc] = useState<string | null>(null);
  const [croppedSrc, setCroppedSrc] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [faceBox, setFaceBox] = useState<number[] | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [completedUpTo, setCompletedUpTo] = useState<number>(0);

  // Processing animation
  const [stageIdx, setStageIdx] = useState(0);
  const [pct, setPct] = useState(0);
  const [animPct, setAnimPct] = useState(0);
  const stageRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated percentage counter
  useEffect(() => {
    if (step !== "processing") return;
    animRef.current = setInterval(() => {
      setAnimPct(prev => (prev < pct ? Math.min(prev + 1, pct) : prev));
    }, 18);
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [pct, step]);

  // Keep track of completed steps
  useEffect(() => {
    const idx = BG_STEP_ORDER.indexOf(step);
    setCompletedUpTo(prev => Math.max(prev, idx));
  }, [step]);

  function startAnimation() {
    setStageIdx(0);
    setPct(10);
    setAnimPct(0);
    let idx = 0;
    stageRef.current = setInterval(() => {
      idx++;
      const stages = [10, 25, 45, 75, 92, 99];
      if (idx < stages.length) {
        setStageIdx(idx);
        setPct(stages[idx]);
      } else {
        clearInterval(stageRef.current!);
      }
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
  const processFile = useCallback(
    async (
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

        // Call background removal with crop=false
        let url = `${PROCESSING_URL}/passport/process?model=${mdl}&crop=false`;
        if (feedback?.alpha_matting) {
          url += `&alpha_matting=true&alpha_matting_fg=${feedback.fg ?? 240}&alpha_matting_bg=${feedback.bg ?? 10}`;
        }
        if (feedback?.remove_shadow) {
          url += `&remove_shadow=true`;
        }

        const res = await fetch(url, {
          method: "POST",
          body: form,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Processing failed" }));
          throw new Error(err.detail ?? "Processing failed");
        }

        const data = await res.json();
        stopAnimation();
        setPct(100);
        setAnimPct(100);
        await new Promise(r => setTimeout(r, 500));

        setProcessedSrc(data.image);
        setCustomizedSrc(data.image);
        setCroppedSrc(null);
        setFaceBox(data.face_box);
        setFaceDetected(data.face_detected);
        setStep("review");
      } catch (err: unknown) {
        stopAnimation();
        const msg = err instanceof Error ? err.message : "Processing service unavailable";
        setProcessingError(msg);
        setStep("upload");
      }
    },
    []
  );

  // Handlers
  const handleFileSelected = useCallback(
    (file: File, mdl: AIModel = "u2net") => {
      processFile(file, mdl);
    },
    [processFile]
  );

  // ── Auto-load initial image if provided ─────────────────────────────────
  useEffect(() => {
    if (initialImageUrl && step === "upload") {
      fetch(initialImageUrl)
        .then((r) => r.blob())
        .then((blob) => {
          const file = new File([blob], "bg-remove-image.jpg", { type: blob.type || "image/jpeg" });
          handleFileSelected(file);
        })
        .catch((err) => {
          setProcessingError("Could not load initial image from URL");
        });
    }
  }, [initialImageUrl, step, handleFileSelected]);

  const handleRetry = useCallback(
    (feedback?: { alpha_matting?: boolean; fg?: number; bg?: number; remove_shadow?: boolean }) => {
      if (selectedFile) processFile(selectedFile, model, feedback);
    },
    [selectedFile, model, processFile]
  );

  const handleUpgradeToUltra = useCallback(() => {
    if (selectedFile) processFile(selectedFile, "u2net_human_seg");
  }, [selectedFile, processFile]);

  const handleManualApply = useCallback((editedImageBase64: string) => {
    setProcessedSrc(editedImageBase64);
    setCustomizedSrc(editedImageBase64);
  }, []);

  const handleAccept = useCallback((editedSrc?: string) => {
    if (editedSrc) {
      setCustomizedSrc(editedSrc);
    }
    setStep("crop");
  }, []);

  const handleCropApply = useCallback((cropped: string) => {
    setCroppedSrc(cropped);
    setStep("done");
  }, []);

  const handleCropSkip = useCallback(() => {
    setCroppedSrc(null);
    setStep("done");
  }, []);

  function handleReset() {
    stopAnimation();
    setStep("upload");
    setSelectedFile(null);
    setProcessedSrc(null);
    setCustomizedSrc(null);
    setCroppedSrc(null);
    setProcessingError(null);
    setFaceBox(null);
    setFaceDetected(false);
    setStageIdx(0);
    setPct(0);
    setAnimPct(0);
    setCompletedUpTo(0);
  }

  const finalImage = croppedSrc ?? customizedSrc ?? processedSrc;

  async function copyImageToClipboard() {
    if (!finalImage) return;
    try {
      const res = await fetch(finalImage);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      showToast("Copied transparent image to clipboard! ✓");
    } catch {
      showToast("Failed to copy image to clipboard");
    }
  }

  function handleDownload(withBg: boolean) {
    if (!finalImage) return;

    let ext = "png";
    if (finalImage.startsWith("data:image/jpeg")) {
      ext = "jpg";
    } else if (finalImage.startsWith("data:image/webp")) {
      ext = "webp";
    }

    const link = document.createElement("a");
    link.download = withBg ? "bg_removed_solid.jpg" : `bg_removed_custom.${ext}`;

    if (!withBg) {
      link.href = finalImage;
      link.click();
      return;
    }

    const canvas = document.createElement("canvas");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    };
    img.src = finalImage;
  }

  const currentIdx = BG_STEP_ORDER.indexOf(step);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-xl ring-1 ring-white/10 animate-fade-in">
          {toast}
        </div>
      )}

      {/* Top Header/Action Bar */}
      <div className="shrink-0 glass-nav px-4 py-3 flex items-center justify-between gap-4 z-10">
        
        {/* Left: Back button & Title */}
        <div className="flex items-center gap-2 shrink-0">
          {step !== "upload" && step !== "processing" && (
            <button
              onClick={() => {
                const cur = BG_STEP_ORDER.indexOf(step);
                if (cur > 0) setStep(BG_STEP_ORDER[cur - 1]);
              }}
              className="flex items-center gap-1 rounded-xl neu px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            >
              <i className="bx bx-chevron-left text-base" /> Back
            </button>
          )}
          
          <div className="hidden md:flex flex-col ml-2">
            <h1 className="text-sm font-bold text-foreground">Background Remover</h1>
          </div>
        </div>

        {/* Middle: Stepper */}
        <div className="flex-1 max-w-xl mx-auto">
          <div className="flex items-center gap-0 w-full overflow-x-auto scrollbar-none glass-faint rounded-xl px-2 py-1.5">
            {BG_STEPS.map((s, idx) => {
              const isDone    = idx <= completedUpTo && idx !== currentIdx;
              const isActive  = s.id === step;
              const isLocked  = idx > completedUpTo;

              return (
                <div key={s.id} className="flex items-center flex-1 min-w-0">
                  {/* Step pill */}
                  <button
                    onClick={() => !isLocked && setStep(s.id)}
                    disabled={isLocked}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all select-none whitespace-nowrap
                      ${isActive
                        ? "bg-primary text-white glow-primary"
                        : isDone
                          ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 cursor-pointer"
                          : isLocked
                            ? "text-muted-foreground/30 cursor-not-allowed"
                            : "text-muted-foreground hover:text-foreground cursor-pointer"
                      }`}
                  >
                    <div className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold
                      ${isActive ? "bg-white/25" : isDone ? "bg-emerald-500 text-white" : "bg-muted"}`}
                    >
                      {isDone ? <i className="bx bx-check text-[10px]" /> : <span>{idx + 1}</span>}
                    </div>
                    <i className={`bx ${s.icon} text-sm`} />
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>

                  {/* Connector line */}
                  {idx < BG_STEPS.length - 1 && (
                    <div className={`h-px flex-1 mx-2 rounded-full transition-colors ${
                      idx < completedUpTo ? "bg-emerald-500/40" : "bg-border"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Start Over Reset */}
        <div className="shrink-0 flex items-center">
          {step !== "upload" && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-xl neu px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive transition"
              title="Start over"
            >
              <i className="bx bx-refresh text-base"></i>
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 min-h-0 relative bg-background">
        {step === "upload" && (
          <div className="h-full overflow-y-auto">
            <UploadPanel onFileSelected={handleFileSelected} error={processingError} />
          </div>
        )}

        {step === "processing" && (
          <div className="h-full overflow-hidden">
            <ProcessingPanel
              selectedFile={selectedFile}
              stageIdx={stageIdx}
              animPct={animPct}
              model={model}
              type="bg-remove"
            />
          </div>
        )}

        {step === "review" && processedSrc && (
          <div className="h-full overflow-hidden flex flex-col">
            <BgReviewPanel
              originalFile={selectedFile}
              processedSrc={processedSrc}
              faceDetected={faceDetected}
              model={model}
              onAccept={handleAccept}
              onRetry={handleRetry}
              onUpgradeToUltra={handleUpgradeToUltra}
              onManualApply={handleManualApply}
              standalone={true}
            />
          </div>
        )}

        {step === "crop" && (customizedSrc ?? processedSrc) && (
          <div className="h-full overflow-hidden flex flex-col">
            <CropAdjustPanel
              processedSrc={customizedSrc ?? processedSrc!}
              faceBox={faceBox}
              onApply={handleCropApply}
              onSkip={handleCropSkip}
            />
          </div>
        )}

        {step === "done" && finalImage && (
          <div className="h-full flex items-center justify-center p-6 overflow-y-auto">
            <div className="w-full max-w-xl glass-strong glass-rim rounded-clay p-8 elev-5 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 glow-success mb-4">
                <i className="bx bx-check-shield text-3xl" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Background Removed successfully!</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                Your high-resolution cutout is ready for use.
              </p>

              {/* Preview Box */}
              <div
                className="relative overflow-hidden rounded-xl border border-border p-4 bg-muted/20 w-full max-w-sm aspect-[4/3] flex items-center justify-center mb-8"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",
                  backgroundSize: "12px 12px",
                  backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                  backgroundColor: "#f8f8f8",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={finalImage}
                  alt="Done Cutout"
                  className="max-h-full max-w-full object-contain drop-shadow-md"
                />
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                <button
                  onClick={() => handleDownload(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 text-sm font-bold text-white glow-primary hover:shadow-xl hover:shadow-blue-500/35 transition"
                >
                  <i className="bx bx-download text-lg" />
                  Download Cutout
                </button>
                <button
                  onClick={() => handleDownload(true)}
                  className="flex items-center justify-center gap-2 rounded-xl neu py-3 text-sm font-bold text-foreground hover:text-primary transition"
                >
                  <i className="bx bx-download text-lg text-muted-foreground" />
                  Force White BG (JPG)
                </button>
                <button
                  onClick={copyImageToClipboard}
                  className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 py-3 text-sm font-bold text-emerald-500 transition"
                >
                  <i className="bx bx-copy text-lg" />
                  Copy to Clipboard
                </button>
              </div>

              <div className="mt-8 border-t border-border w-full pt-6 flex justify-between items-center text-xs text-muted-foreground">
                <span>Format: {finalImage.startsWith("data:image/jpeg") ? "JPEG (Compressed)" : finalImage.startsWith("data:image/webp") ? "WEBP" : "PNG (Lossless)"}</span>
                <button onClick={handleReset} className="text-primary font-bold hover:underline">
                  Process another photo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
