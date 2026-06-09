"use client";

import { useState, useCallback } from "react";
import { FileDropzone } from "@/components/passport/FileDropzone";
import {
  PassportConfigPanel,
  PASSPORT_SIZES,
  type PassportConfig,
} from "@/components/passport/PassportConfig";
import { A4SheetPreview } from "@/components/passport/A4SheetPreview";

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
};

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

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${PROCESSING_URL}/passport/process`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Processing failed" }));
        throw new Error(err.detail ?? "Processing failed");
      }

      const data = await res.json();
      setProcessedImage(data.image);
      setFaceDetected(data.face_detected ?? true);
      setStep("configure");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Processing service unavailable";
      setProcessingError(msg);
      setStep("upload");
    }
  }, []);

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
    setSelectedFile(null);
    setProcessedImage(null);
    setProcessingError(null);
    setConfig(DEFAULT_CONFIG);
    setFaceDetected(true);
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

      {/* ── Toast ─────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-5xl space-y-6">

        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Passport Photo</h1>
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
                          : "bg-gray-100 text-gray-400"
                  }`}
              >
                {(step === "configure" && idx < 2) ||
                (step === "processing" && idx === 0) ||
                step === "done"
                  ? "✓"
                  : idx + 1}
              </div>
              <span className={step === s ? "text-gray-700" : ""}>
                {s === "upload" ? "Upload" : s === "processing" ? "Process" : "Configure & Print"}
              </span>
              {idx < 2 && <div className="h-px w-6 bg-gray-200"></div>}
            </div>
          ))}
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
                <i className="bx bx-error-circle mt-0.5 text-base"></i>
                <div>
                  <p className="font-semibold">Processing failed</p>
                  <p className="text-red-500">{processingError}</p>
                  <p className="mt-1 text-xs text-red-400">
                    Make sure the Python service is running:{" "}
                    <code className="rounded bg-red-100 px-1">
                      uvicorn main:app --reload --port 8000
                    </code>
                  </p>
                </div>
              </div>
            )}

            <FileDropzone onFileSelected={handleFileSelected} />

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
          <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-gray-100 bg-white py-20 shadow-sm">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-blue-100"></div>
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                <i className="bx bx-image-alt text-4xl text-blue-500"></i>
              </div>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-800">
                Removing background & detecting face…
              </p>
              <p className="mt-1 text-sm text-gray-400">
                This takes 5–15 seconds on first run (model loading).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:0ms]"></div>
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:150ms]"></div>
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:300ms]"></div>
            </div>
          </div>
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
                <div className="flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={processedImage}
                    alt="Processed passport photo"
                    className="max-h-64 rounded-xl border border-gray-100 object-contain shadow-sm"
                    style={{ background: config.bgColor }}
                    id="passport-processed-preview"
                  />
                </div>
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
                  customWidth={config.customWidth}
                  customHeight={config.customHeight}
                  copies={config.copies}
                  bgColor={config.bgColor}
                  onPhotoCount={setPhotosOnSheet}
                />

                <p className="mt-2 text-center text-xs text-gray-400">
                  A4 (210×297 mm) — photos at actual scale
                </p>
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

              <p className="text-center text-xs text-gray-400">
                Print at 100% scale, no page scaling, portrait orientation.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
