"use client";

import { useState } from "react";

export interface PassportSize {
  id: string;
  label: string;
  country: string;
  widthMm: number;
  heightMm: number;
}

export const PASSPORT_SIZES: PassportSize[] = [
  { id: "indian",  label: "Indian",       country: "🇮🇳 India",    widthMm: 35, heightMm: 45 },
  { id: "us",      label: "US",           country: "🇺🇸 USA",      widthMm: 51, heightMm: 51 },
  { id: "uk",      label: "UK",           country: "🇬🇧 UK",       widthMm: 35, heightMm: 45 },
  { id: "eu",      label: "EU / Schengen",country: "🇪🇺 Schengen", widthMm: 35, heightMm: 45 },
  { id: "custom",  label: "Custom",       country: "✏️ Custom",    widthMm: 35, heightMm: 45 },
];

export const BG_COLORS = [
  { label: "White",  value: "#FFFFFF", sample: "bg-white border border-gray-200" },
  { label: "Off-white", value: "#F8F8F8", sample: "bg-stone-100 border border-gray-200" },
  { label: "Light Blue", value: "#C3D9F0", sample: "bg-blue-200" },
  { label: "Red",    value: "#E8312F", sample: "bg-red-500" },
  { label: "Custom", value: "custom",  sample: "bg-gradient-to-br from-purple-200 to-pink-200" },
];

export interface PassportConfig {
  size: PassportSize;
  customWidth: number;
  customHeight: number;
  copies: number;
  bgColor: string;
}

interface PassportConfigProps {
  config: PassportConfig;
  onChange: (c: PassportConfig) => void;
}

export function PassportConfigPanel({ config, onChange }: PassportConfigProps) {
  const { size, customWidth, customHeight, copies, bgColor } = config;
  const [isCustomCopies, setIsCustomCopies] = useState(![4, 8, 12, 16, 32].includes(copies));

  function setSize(s: PassportSize) {
    onChange({ ...config, size: s });
  }

  function setCopies(n: number) {
    onChange({ ...config, copies: Math.max(1, Math.min(50, n)) });
  }

  function setBg(v: string) {
    onChange({ ...config, bgColor: v === "custom" ? "#AACCEE" : v });
  }

  const effectiveW = size.id === "custom" ? customWidth : size.widthMm;
  const effectiveH = size.id === "custom" ? customHeight : size.heightMm;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Size selector ─────────────────────────────── */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Passport Size
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PASSPORT_SIZES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSize(s)}
              className={`flex flex-col items-start rounded-xl border px-4 py-3 text-left text-sm transition-all
                ${size.id === s.id
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
            >
              <span className="font-semibold">{s.country}</span>
              {s.id !== "custom" && (
                <span className="mt-0.5 text-xs text-gray-400">
                  {s.widthMm}×{s.heightMm} mm
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Custom dimensions */}
        {size.id === "custom" && (
          <div className="mt-3 flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">Width (mm)</label>
              <input
                type="number"
                value={customWidth}
                min={20}
                max={100}
                onChange={(e) =>
                  onChange({ ...config, customWidth: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">Height (mm)</label>
              <input
                type="number"
                value={customHeight}
                min={20}
                max={100}
                onChange={(e) =>
                  onChange({ ...config, customHeight: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>
        )}

        <p className="mt-2 text-xs text-gray-400">
          Selected: {effectiveW}×{effectiveH} mm
        </p>
      </div>

      {/* ── Copies ────────────────────────────────────── */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Number of Copies
        </label>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {[4, 8, 12, 16, 32].map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setCopies(preset);
                setIsCustomCopies(false);
              }}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                copies === preset && !isCustomCopies
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {preset}
            </button>
          ))}
          <button
            onClick={() => setIsCustomCopies(true)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
              isCustomCopies || ![4, 8, 12, 16, 32].includes(copies)
                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            Custom
          </button>
        </div>

        {(isCustomCopies || ![4, 8, 12, 16, 32].includes(copies)) && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCopies(copies - 1)}
              disabled={copies <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
              aria-label="Decrease copies"
            >
              <i className="bx bx-minus text-lg"></i>
            </button>
            <input
              type="number"
              value={copies}
              min={1}
              max={50}
              onChange={(e) => setCopies(Number(e.target.value))}
              className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-center text-sm font-semibold focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              id="passport-copies-input"
            />
            <button
              onClick={() => setCopies(copies + 1)}
              disabled={copies >= 50}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
              aria-label="Increase copies"
            >
              <i className="bx bx-plus text-lg"></i>
            </button>
            <span className="text-sm text-gray-400">photos (max 50)</span>
          </div>
        )}
      </div>

      {/* ── Background color ──────────────────────────── */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Background Color
        </label>
        <div className="flex flex-wrap gap-3">
          {BG_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setBg(c.value)}
              title={c.label}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all
                ${c.sample}
                ${bgColor === c.value || (c.value === "custom" && !BG_COLORS.slice(0, -1).some((x) => x.value === bgColor))
                  ? "ring-2 ring-blue-500 ring-offset-2"
                  : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-1"
                }`}
              aria-label={`Background color: ${c.label}`}
            >
              {(c.value === "custom") && (
                <i className="bx bx-palette text-white text-sm drop-shadow"></i>
              )}
            </button>
          ))}

          {/* Custom hex picker */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => onChange({ ...config, bgColor: e.target.value })}
              className="h-10 w-10 cursor-pointer rounded-full border-none p-0"
              title="Custom color"
              id="passport-bg-color-picker"
            />
          </div>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          Current: <code className="rounded bg-gray-100 px-1">{bgColor}</code>
        </p>
      </div>
    </div>
  );
}
