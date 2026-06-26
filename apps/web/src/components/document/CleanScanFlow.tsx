"use client";
import { Boxicon } from "@/components/ui";


import { useState, useRef } from "react";
import { DocumentDropzone } from "@/components/document/DocumentDropzone";
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

// Python processing service base URL
const PROCESSING_URL =
  process.env.NEXT_PUBLIC_PROCESSING_URL ?? "http://localhost:8000";

type Step = "upload" | "crop" | "processing" | "compare";

interface Point { x: number; y: number }

export function CleanScanFlow() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [originalImageObjUrl, setOriginalImageObjUrl] = useState<string | null>(null);
  
  // Cropping State
  const [points, setPoints] = useState<Point[]>([
    { x: 10, y: 10 }, { x: 90, y: 10 }, { x: 90, y: 90 }, { x: 10, y: 90 }
  ]);
  
  const [cleanedImage, setCleanedImage] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  const handleFilesSelected = (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith("image/")) {
        setProcessingError("Please upload an image (JPG/PNG) for Clean Scan.");
        return;
    }
    setFile(f);
    setOriginalImageObjUrl(URL.createObjectURL(f));
    setStep("crop");
    setProcessingError(null);
    // Reset points to default 10% inset
    setPoints([{ x: 10, y: 10 }, { x: 90, y: 10 }, { x: 90, y: 90 }, { x: 10, y: 90 }]);
  };

  const handlePointerDown = (index: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      let newX = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      let newY = ((moveEvent.clientY - rect.top) / rect.height) * 100;

      // Clamp to 0-100%
      newX = Math.max(0, Math.min(100, newX));
      newY = Math.max(0, Math.min(100, newY));

      setPoints(prev => {
        const newPoints = [...prev];
        newPoints[index] = { x: newX, y: newY };
        return newPoints;
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleConfirmCrop = async () => {
    if (!file || !imgRef.current) return;
    setStep("processing");

    // Convert % points back to actual image pixel coordinates
    const natWidth = imgRef.current.naturalWidth;
    const natHeight = imgRef.current.naturalHeight;

    const pixelPoints = points.map(p => [
        (p.x / 100) * natWidth,
        (p.y / 100) * natHeight
    ]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("points", JSON.stringify(pixelPoints));
      formData.append("enhance", "true");

      const res = await fetch(`${PROCESSING_URL}/document/clean-scan`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to clean document");
      }

      const data = await res.json();
      setCleanedImage(data.image);
      setStep("compare");
    } catch (err: unknown) {
      setProcessingError(err instanceof Error ? err.message : "Processing failed");
      setStep("crop");
    }
  };

  const handleReset = () => {
    setStep("upload");
    setFile(null);
    setOriginalImageObjUrl(null);
    setCleanedImage(null);
    setProcessingError(null);
  };

  const handlePrint = () => {
    if (!cleanedImage) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
        printWindow.document.write(`<img /* eslint-disable-next-line @next/next/no-img-element */ src="${cleanedImage}" style="width:100%;max-width:210mm;"/>`);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 200);
        showToast("Print dialog opened ✓");
    }
  };

  return (
    <>
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-5xl h-full flex flex-col gap-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-h2 font-display font-bold text-foreground">Clean Scan</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Turn phone photos into clean, straightened PDFs.
            </p>
          </div>
          {step !== "upload" && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-xl neu px-4 py-2 text-sm font-medium text-foreground transition hover:text-primary"
            >
              <Boxicon className="bx bx-refresh text-base" />
              Start over
            </button>
          )}
        </div>

        {/* Step Content */}
        <div className="flex-1 min-h-0 relative">
          {step === "upload" && (
            <div className="absolute inset-0 overflow-y-auto pr-1 pb-6">
              <div className="rounded-clay glass elev-2 p-6">
                {processingError && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
                    <Boxicon className="bx bx-error-circle mt-0.5 text-base" />
                    <div>
                      <p className="font-semibold">Upload failed</p>
                      <p className="text-destructive/80">{processingError}</p>
                    </div>
                  </div>
                )}
                <DocumentDropzone onFileSelected={handleFilesSelected} />
              </div>
            </div>
          )}

          {step === "crop" && originalImageObjUrl && (
             <div className="absolute inset-0 flex flex-col items-center gap-4">
                <p className="text-sm font-medium text-muted-foreground">Drag the 4 corners to perfectly outline the document.</p>
                <div 
                    ref={containerRef}
                    className="relative max-h-[70vh] flex-1 w-full max-w-2xl border border-border rounded-lg bg-black/5 overflow-hidden select-none touch-none"
                >
                    <img /* eslint-disable-next-line @next/next/no-img-element */ 
                        ref={imgRef}
                        src={originalImageObjUrl} 
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        alt="Document to crop"
                    />
                    
                    {/* SVG Polygon connecting the points */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 drop-shadow-md">
                        <polygon 
                            points={`${points[0].x}%,${points[0].y}% ${points[1].x}%,${points[1].y}% ${points[2].x}%,${points[2].y}% ${points[3].x}%,${points[3].y}%`}
                            fill="rgba(59, 130, 246, 0.2)"
                            stroke="#3b82f6"
                            strokeWidth="2"
                        />
                    </svg>

                    {/* Draggable handles */}
                    {points.map((p, i) => (
                        <div 
                            key={i}
                            onPointerDown={handlePointerDown(i)}
                            className="absolute z-20 w-8 h-8 -ml-4 -mt-4 bg-white border-2 border-blue-500 rounded-full cursor-move shadow-md flex items-center justify-center hover:scale-110 transition-transform touch-none"
                            style={{ left: `${p.x}%`, top: `${p.y}%` }}
                        >
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                   <button
                      onClick={handleReset}
                      className="px-6 py-3 rounded-xl neu font-semibold text-muted-foreground hover:text-foreground transition"
                   >
                      Cancel
                   </button>
                   <button
                      onClick={handleConfirmCrop}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold glow-primary hover:shadow-xl hover:shadow-blue-500/35 transition-all"
                   >
                      Confirm &amp; Clean Scan
                   </button>
                </div>
             </div>
          )}

          {step === "processing" && (
            <div className="absolute inset-0 overflow-y-auto pr-1 pb-6">
              <div className="flex flex-col items-center justify-center gap-6 rounded-clay glass elev-2 py-20">
                 <Boxicon className="bx bx-loader-alt animate-spin text-4xl text-blue-500" />
                 <p className="text-base font-semibold text-foreground">Cleaning Scan...</p>
              </div>
            </div>
          )}

          {step === "compare" && originalImageObjUrl && cleanedImage && (
             <div className="absolute inset-0 flex flex-col gap-4">
                <div className="flex-1 min-h-0 rounded-clay glass-faint overflow-hidden relative elev-1">
                    <ReactCompareSlider
                        itemOne={<ReactCompareSliderImage src={originalImageObjUrl} alt="Original" style={{ objectFit: 'contain' }} />}
                        itemTwo={<ReactCompareSliderImage src={cleanedImage} alt="Cleaned" style={{ objectFit: 'contain' }} />}
                        className="w-full h-full"
                    />
                    <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm pointer-events-none">
                        Original
                    </div>
                    <div className="absolute top-4 right-4 bg-blue-600/90 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm pointer-events-none">
                        Clean Scan
                    </div>
                </div>
                
                <div className="flex justify-end shrink-0">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white glow-primary hover:shadow-xl hover:shadow-blue-500/35 transition-all"
                    >
                        <Boxicon className="bx bx-printer text-lg" />
                        Print
                    </button>
                </div>
             </div>
          )}
        </div>
      </div>
    </>
  );
}
