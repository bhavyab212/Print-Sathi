"use client";
import { Boxicon } from "@/components/ui";

import { useState, useCallback } from "react";
import { FileDropzone } from "../FileDropzone";
import { useServerHealth } from "@/hooks/useServerHealth";

export type AIModel = "u2net" | "u2net_human_seg";

interface UploadPanelProps {
  onFileSelected: (file: File, model: AIModel) => void;
  error?: string | null;
}

const MODEL_OPTIONS: {
  id: AIModel;
  label: string;
  badge: string;
  badgeColor: string;
  icon: string;
  desc: string;
  detail: string;
}[] = [
  {
    id: "u2net",
    label: "Standard",
    badge: "FAST",
    badgeColor: "bg-sky-500/15 text-sky-600",
    icon: "bx-run",
    desc: "u2net · Fast background removal",
    detail: "Best for clean studio shots with simple backgrounds. Processing takes 3–10 seconds.",
  },
  {
    id: "u2net_human_seg",
    label: "Ultra",
    badge: "PRECISE",
    badgeColor: "bg-violet-500/15 text-violet-600",
    icon: "bx-user-voice",
    desc: "u2net_human_seg · High-precision portrait model",
    detail: "Best for complex backgrounds, curly/detailed hair, or poor lighting. Takes 15–30 seconds.",
  },
];

export function UploadPanel({ onFileSelected, error }: UploadPanelProps) {
  const isOnline = useServerHealth();
  const [model, setModel] = useState<AIModel>("u2net");

  const handleFile = useCallback(
    (file: File) => {
      onFileSelected(file, model);
    },
    [model, onFileSelected]
  );

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-4 py-8">
      {/* Header */}
      <div className="text-center max-w-md">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-3">
          <Boxicon className="bx bx-id-card text-sm" />
          Step 1 — Upload Photo
        </div>
        <h2 className="text-h2 font-display font-bold text-foreground">Upload a Portrait Photo</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Clear face, neutral expression, good lighting · JPG, PNG, HEIC up to 10 MB
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="w-full max-w-xl flex items-start gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <Boxicon className="bx bx-error-circle mt-0.5 text-base shrink-0" />
          <div>
            <p className="font-semibold">Processing failed</p>
            <p className="opacity-80">{error}</p>
            <p className="mt-1 text-xs opacity-60">
              Make sure the AI Server is running:{" "}
              <strong className="text-foreground">Start the Print-Sathi Server Manager app</strong>
            </p>
          </div>
        </div>
      )}

      {/* Dropzone / Offline State */}
      <div className="w-full max-w-xl">
        {!isOnline ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Boxicon className="bx bx-wifi-off text-2xl" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">AI Server Offline</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Please connect to the AI Server from the top-right menu to proceed.
              </p>
            </div>
          </div>
        ) : (
          <FileDropzone onFileSelected={handleFile} />
        )}
      </div>

      {/* AI Model picker */}
      <div className="w-full max-w-xl">
        <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
          AI Segmentation Model
        </label>
        <div className="grid grid-cols-2 gap-3">
          {MODEL_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setModel(opt.id)}
              className={`group flex flex-col gap-2.5 rounded-clay p-4 text-left transition-all ${
                model === opt.id
                  ? "glass-strong ring-1 ring-primary glow-primary"
                  : "neu hover:text-foreground"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10`}>
                  <i className={`bx ${opt.icon} text-primary text-base`} />
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${opt.badgeColor}`}>
                  {opt.badge}
                </span>
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">{opt.label} Model</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
              </div>
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed">{opt.detail}</p>

              {/* Selected indicator */}
              <div className={`h-0.5 rounded-full transition-all ${
                model === opt.id ? "bg-primary" : "bg-transparent"
              }`} />
            </button>
          ))}
        </div>
      </div>

      {/* Tip */}
      <div className="w-full max-w-xl flex items-start gap-2 rounded-xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground border border-border">
        <Boxicon className="bx bx-bulb text-sm mt-0.5 text-amber-500 shrink-0" />
        <span>
          <strong className="text-foreground">Pro tip:</strong> For best passport results use a portrait with the face clearly visible, no sunglasses, and a plain or simple background.
        </span>
      </div>
    </div>
  );
}
