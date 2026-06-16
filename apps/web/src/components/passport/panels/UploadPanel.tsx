"use client";

import { useState, useCallback } from "react";
import { FileDropzone } from "../FileDropzone";

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
          <i className="bx bx-id-card text-sm" />
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
          <i className="bx bx-error-circle mt-0.5 text-base shrink-0" />
          <div>
            <p className="font-semibold">Processing failed</p>
            <p className="opacity-80">{error}</p>
            <p className="mt-1 text-xs opacity-60">
              Make sure the Python service is running:{" "}
              <code className="rounded bg-destructive/10 px-1">npm run dev:processing</code>
            </p>
          </div>
        </div>
      )}

      {/* Dropzone */}
      <div className="w-full max-w-xl">
        <FileDropzone onFileSelected={handleFile} />
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
        <i className="bx bx-bulb text-sm mt-0.5 text-amber-500 shrink-0" />
        <span>
          <strong className="text-foreground">Pro tip:</strong> For best passport results use a portrait with the face clearly visible, no sunglasses, and a plain or simple background.
        </span>
      </div>
    </div>
  );
}
