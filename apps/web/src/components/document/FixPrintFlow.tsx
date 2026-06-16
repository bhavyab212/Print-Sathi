"use client";

import { useState, useCallback, useEffect } from "react";
import { DocumentDropzone } from "@/components/document/DocumentDropzone";
import { createNUpPdf, createBookletPdf, scalePdf, imagesToPdf } from "@/lib/pdf-utils";

type Step = "upload" | "processing" | "configure";

type Preset = "none" | "notes" | "assignment" | "resume" | "booklet";

export function FixPrintFlow() {
  const [step, setStep] = useState<Step>("upload");
  const [originalPdf, setOriginalPdf] = useState<Uint8Array | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  
  const [preset, setPreset] = useState<Preset>("none");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  const handleFilesSelected = async (files: File[]) => {
    setStep("processing");
    try {
      let pdfBytes: Uint8Array;

      // If images were uploaded, convert to PDF first
      if (files.every(f => f.type.startsWith('image/'))) {
        const base64Images = await Promise.all(files.map(f => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(f);
            });
        }));
        pdfBytes = await imagesToPdf(base64Images);
      } else if (files.length === 1 && files[0].type === 'application/pdf') {
        const arrayBuffer = await files[0].arrayBuffer();
        pdfBytes = new Uint8Array(arrayBuffer);
      } else {
        throw new Error("Please upload either a single PDF, or multiple images.");
      }

      setOriginalPdf(pdfBytes);
      updatePreview(pdfBytes);
      setPreset("none");
      setStep("configure");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to load document");
      setStep("upload");
    }
  };

  const updatePreview = (bytes: Uint8Array) => {
    const blob = new Blob([bytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setPreviewPdfUrl(url);
  };

  const applyPreset = async (newPreset: Preset) => {
    if (!originalPdf) return;
    setPreset(newPreset);
    setIsProcessing(true);

    try {
        let modifiedPdf = originalPdf;

        switch (newPreset) {
            case "notes":
                modifiedPdf = await createNUpPdf(originalPdf, 2);
                break;
            case "assignment":
                modifiedPdf = await scalePdf(originalPdf, true);
                break;
            case "resume":
                modifiedPdf = await scalePdf(originalPdf, false); // Actual size
                break;
            case "booklet":
                modifiedPdf = await createBookletPdf(originalPdf);
                break;
            case "none":
            default:
                break;
        }

        updatePreview(modifiedPdf);
    } catch (error) {
        console.error("Failed to apply preset", error);
        alert("Failed to apply preset to this document.");
    } finally {
        setIsProcessing(false);
    }
  };

  function handleReset() {
    setStep("upload");
    setOriginalPdf(null);
    setPreviewPdfUrl(null);
    setPreset("none");
  }

  function handlePrint() {
    if (!previewPdfUrl) return;
    const printWindow = window.open(previewPdfUrl, "_blank");
    if (printWindow) {
        printWindow.onload = () => {
            printWindow.print();
        };
        showToast("Print dialog opened ✓");
    }
  }

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
            <h1 className="text-h2 font-display font-bold text-foreground">Fix &amp; Print Document</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Format, scale, and layout PDFs and Images automatically.
            </p>
          </div>
          {step !== "upload" && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-xl neu px-4 py-2 text-sm font-medium text-foreground transition hover:text-primary"
            >
              <i className="bx bx-refresh text-base"></i>
              Start over
            </button>
          )}
        </div>

        {/* Step Content */}
        <div className="flex-1 min-h-0 relative">
          {step === "upload" && (
            <div className="absolute inset-0 overflow-y-auto pr-1 pb-6">
              <div className="rounded-clay glass elev-2 p-6">
                <DocumentDropzone onFileSelected={handleFilesSelected} />
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="absolute inset-0 overflow-y-auto pr-1 pb-6">
              <div className="flex flex-col items-center justify-center gap-6 rounded-clay glass elev-2 py-20">
                 <i className="bx bx-loader-alt animate-spin text-4xl text-primary"></i>
                 <p className="text-base font-semibold text-foreground">Processing Document...</p>
              </div>
            </div>
          )}

          {step === "configure" && previewPdfUrl && (
            <div className="absolute inset-0 flex gap-6">
              {/* Left Panel: Settings */}
              <div className="w-80 shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 pb-6">
                 <div className="rounded-clay glass elev-2 p-4">
                    <h3 className="font-semibold text-sm mb-3">Quick Presets</h3>
                    <div className="flex flex-col gap-2">
                        <PresetButton 
                            active={preset === "notes"} 
                            onClick={() => applyPreset("notes")}
                            title="Notes / Compact"
                            desc="2 pages per sheet, fit to page"
                            icon="bx-book-open"
                            loading={isProcessing && preset === "notes"}
                        />
                        <PresetButton 
                            active={preset === "assignment"} 
                            onClick={() => applyPreset("assignment")}
                            title="Assignment"
                            desc="Fit to page, standard margins"
                            icon="bx-file-blank"
                            loading={isProcessing && preset === "assignment"}
                        />
                        <PresetButton 
                            active={preset === "resume"} 
                            onClick={() => applyPreset("resume")}
                            title="Resume"
                            desc="Actual size, no scaling"
                            icon="bx-user-pin"
                            loading={isProcessing && preset === "resume"}
                        />
                        <PresetButton 
                            active={preset === "booklet"} 
                            onClick={() => applyPreset("booklet")}
                            title="Booklet"
                            desc="Saddle-stitch binding layout"
                            icon="bx-book"
                            loading={isProcessing && preset === "booklet"}
                        />
                        <PresetButton 
                            active={preset === "none"} 
                            onClick={() => applyPreset("none")}
                            title="Original"
                            desc="No formatting applied"
                            icon="bx-file"
                            loading={isProcessing && preset === "none"}
                        />
                    </div>
                 </div>

                 <button
                    onClick={handlePrint}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white glow-primary hover:shadow-xl hover:shadow-blue-500/35 transition-all disabled:opacity-50"
                 >
                    <i className="bx bx-printer text-lg"></i>
                    Print Document
                 </button>
              </div>

              {/* Right Panel: Preview */}
              <div className="flex-1 rounded-clay glass-faint overflow-hidden elev-1 relative">
                {isProcessing && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                        <i className="bx bx-loader-alt animate-spin text-4xl text-primary"></i>
                    </div>
                )}
                <iframe 
                    src={`${previewPdfUrl}#toolbar=0&navpanes=0`} 
                    className="w-full h-full border-none"
                    title="PDF Preview"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function PresetButton({ active, onClick, title, desc, icon, loading }: any) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`flex items-start gap-3 p-3 text-left rounded-xl transition-all ${
                active
                    ? "glass-strong ring-1 ring-primary glow-primary"
                    : "neu hover:text-foreground"
            }`}
        >
            <div className={`mt-0.5 flex shrink-0 items-center justify-center rounded-lg p-2 ${
                active ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
            }`}>
                {loading ? (
                    <i className="bx bx-loader-alt animate-spin text-base"></i>
                ) : (
                    <i className={`bx ${icon} text-base`}></i>
                )}
            </div>
            <div>
                <p className={`text-sm font-semibold ${active ? "text-blue-700 dark:text-blue-400" : "text-foreground"}`}>
                    {title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">{desc}</p>
            </div>
        </button>
    );
}
