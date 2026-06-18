"use client";
import { Boxicon } from "@/components/ui";


import { useRef, useState } from "react";

interface DocumentDropzoneProps {
  onFileSelected: (files: File[]) => void;
  disabled?: boolean;
}

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/heic", "image/webp"];
const MAX_MB = 50;

export function DocumentDropzone({ onFileSelected, disabled }: DocumentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(file: File): string | null {
    if (!ACCEPTED.includes(file.type) && !file.name.toLowerCase().endsWith(".heic")) {
      // Reject word/ppt explicitly
      if (file.name.endsWith('.doc') || file.name.endsWith('.docx') || file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) {
          return "Word and PowerPoint files are not supported to preserve formatting. Please 'Save as PDF' and upload the PDF.";
      }
      return "Unsupported format. Use PDF, JPG, PNG, or HEIC.";
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return `File too large. Maximum ${MAX_MB} MB allowed.`;
    }
    return null;
  }

  function handleFiles(files: FileList | File[]) {
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const err = validate(file);
        if (err) {
            setError(err);
            return;
        }
        validFiles.push(file);
    }
    setError(null);
    if (validFiles.length > 0) {
        onFileSelected(validFiles);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) {
        handleFiles(e.dataTransfer.files);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
        handleFiles(e.target.files);
    }
  }

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-clay border-2 border-dashed glass-faint p-10 transition-all
          ${dragging
            ? "border-primary bg-primary/10 glow-primary"
            : "border-border hover:border-primary/50 hover:bg-primary/5"
          }
          ${disabled ? "pointer-events-none opacity-50" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/heic,image/heif,image/webp,.heic"
          multiple
          className="hidden"
          onChange={onInputChange}
          disabled={disabled}
          id="document-file-input"
        />

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20 animate-float">
            <Boxicon className="bx bx-file text-4xl text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              Drag &amp; drop PDF or Images
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              or click to browse — PDF, JPG, PNG · max 50 MB
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
          <Boxicon className="bx bx-error-circle mt-0.5 text-base" />
          <div>
            <p className="font-semibold">Upload failed</p>
            <p className="text-destructive/80">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
