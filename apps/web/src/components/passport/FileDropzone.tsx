"use client";

import { useRef, useState } from "react";

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"];
const MAX_MB = 10;

export function FileDropzone({ onFileSelected, disabled }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validate(file: File): string | null {
    if (!ACCEPTED.includes(file.type) && !file.name.toLowerCase().endsWith(".heic")) {
      return "Unsupported format. Use JPG, PNG, or HEIC.";
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return `File too large. Maximum ${MAX_MB} MB allowed.`;
    }
    return null;
  }

  function handleFile(file: File) {
    const err = validate(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFileSelected(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all
          ${dragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40"
          }
          ${disabled ? "pointer-events-none opacity-50" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif,image/webp,.heic"
          className="hidden"
          onChange={onInputChange}
          disabled={disabled}
          id="passport-file-input"
        />

        {preview ? (
          <div className="flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Selected portrait"
              className="h-44 w-44 rounded-xl object-cover shadow-md"
            />
            <p className="text-sm text-gray-500">
              Photo selected — click to change
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
              <i className="bx bx-cloud-upload text-4xl text-blue-500"></i>
            </div>
            <div>
              <p className="text-base font-semibold text-gray-700">
                Drag & drop portrait here
              </p>
              <p className="mt-1 text-sm text-gray-400">
                or click to browse — JPG, PNG, HEIC · max 10 MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <i className="bx bx-error-circle text-base"></i>
          {error}
        </div>
      )}
    </div>
  );
}
