"use client";

import { useState } from "react";

export interface PassportSize {
  id: string;
  label: string;
  country: string;
  widthMm: number;
  heightMm: number;
  description?: string;
}

// ── Paper sheet sizes (from research) ────────────────────────────────────────
export type SheetSize = "A4" | "4R" | "A6";

export const SHEET_SIZES: {
  id: SheetSize;
  label: string;
  widthMm: number;
  heightMm: number;
  desc: string;
}[] = [
  { id: "A4", label: "A4",  widthMm: 210, heightMm: 297, desc: "Standard DTP/xerox shop paper (210×297 mm)" },
  { id: "4R", label: "4R",  widthMm: 102, heightMm: 152, desc: "Photo studio 4×6 inch (102×152 mm)" },
  { id: "A6", label: "A6",  widthMm: 105, heightMm: 148, desc: "Compact postcard size (105×148 mm)" },
];

// ── All Indian ID photo sizes (from research) ─────────────────────────────────
// Research finding: 35×45 mm is the universal default for 90%+ Indian govt docs
export const PASSPORT_SIZES: PassportSize[] = [
  {
    id: "passport",
    label: "Passport / Aadhaar / DL / Voter ID",
    country: "🇮🇳 India (Standard)",
    widthMm: 35,
    heightMm: 45,
    description: "35×45 mm — Universal for 90% Indian govt docs",
  },
  {
    id: "pan",
    label: "PAN Card",
    country: "🇮🇳 PAN",
    widthMm: 25,
    heightMm: 35,
    description: "25×35 mm — Smaller portrait size",
  },
  {
    id: "oci",
    label: "OCI Card",
    country: "🇮🇳 OCI",
    widthMm: 35,
    heightMm: 35,
    description: "35×35 mm — Square format",
  },
  {
    id: "us",
    label: "US Visa / OCI Application",
    country: "🇺🇸 USA",
    widthMm: 51,
    heightMm: 51,
    description: "51×51 mm — 2×2 inch square",
  },
  {
    id: "uk",
    label: "UK Passport",
    country: "🇬🇧 UK",
    widthMm: 35,
    heightMm: 45,
    description: "35×45 mm",
  },
  {
    id: "custom",
    label: "Custom Size",
    country: "✏️ Custom",
    widthMm: 35,
    heightMm: 45,
    description: "Enter your own dimensions",
  },
];

export const BG_COLORS = [
  { label: "White",      value: "#FFFFFF", sample: "bg-white border border-gray-200" },
  { label: "Off-white",  value: "#F5F5F0", sample: "bg-stone-100 border border-gray-200" },
  { label: "Light Blue", value: "#C3D9F0", sample: "bg-blue-200" },
  { label: "Beige",      value: "#F5F0E8", sample: "bg-amber-50 border border-amber-200" },
  { label: "Custom",     value: "custom",  sample: "bg-gradient-to-br from-purple-200 to-pink-200" },
];

export interface PassportConfig {
  size: PassportSize;
  sheetSize: SheetSize;
  customWidth: number;
  customHeight: number;
  copies: number;
  bgColor: string;
  showCutLines: boolean;
  gapMm?: number;
  colsAuto?: boolean;
  customCols?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  skinSmoothing?: number;
  outlineWidth?: number;
  outlineColor?: string;
}

interface PassportConfigProps {
  config: PassportConfig;
  onChange: (c: PassportConfig) => void;
}

// Real-world layout presets from research (Indian DTP shops)
// Default 8 = 4col×2row — the most common Indian shop request
const COPY_PRESETS = [6, 8, 12, 16, 25];

export function PassportConfigPanel({ config, onChange }: PassportConfigProps) {
  const {
    size,
    sheetSize = "A4",
    customWidth,
    customHeight,
    copies,
    bgColor,
    showCutLines = true,
    gapMm = 3,
    colsAuto = true,
    customCols = 4,
    brightness = 100,
    contrast = 100,
    saturation = 100,
    skinSmoothing = 0,
  } = config;
  const [isCustomCopies, setIsCustomCopies] = useState(!COPY_PRESETS.includes(copies));

  function setSize(s: PassportSize) {
    onChange({ ...config, size: s });
  }

  function setSheet(s: SheetSize) {
    onChange({ ...config, sheetSize: s });
  }

  function setCopies(n: number) {
    onChange({ ...config, copies: Math.max(1, Math.min(50, n)) });
  }

  function setBg(v: string) {
    onChange({ ...config, bgColor: v === "custom" ? "#AACCEE" : v });
  }

  const effectiveW = size.id === "custom" ? customWidth : size.widthMm;
  const effectiveH = size.id === "custom" ? customHeight : size.heightMm;
  const sheet = SHEET_SIZES.find((s) => s.id === sheetSize) ?? SHEET_SIZES[0];

  // Live layout calculation
  const OUTER_MARGIN_MM = 8;
  const availW = sheet.widthMm - 2 * OUTER_MARGIN_MM;
  const availH = sheet.heightMm - 2 * OUTER_MARGIN_MM;
  
  let cols = 1;
  if (!colsAuto) {
    cols = customCols;
  } else {
    cols = Math.max(1, Math.floor((availW + gapMm) / (effectiveW + gapMm)));
  }
  
  const rows = Math.max(1, Math.floor((availH + gapMm) / (effectiveH + gapMm)));
  const maxFit = cols * rows;

  return (
    <div className="flex flex-col gap-5 text-gray-700">

      {/* ── Paper Sheet Size ──────────────────────────────────────────── */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Print Paper Size
        </label>
        <div className="grid grid-cols-3 gap-2">
          {SHEET_SIZES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSheet(s.id)}
              className={`flex flex-col items-start rounded-xl border px-3 py-2.5 text-left transition-all
                ${sheetSize === s.id
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-400"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
            >
              <span className="font-bold text-base">{s.label}</span>
              <span className="mt-0.5 text-[10px] text-gray-400">{s.widthMm}×{s.heightMm} mm</span>
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-gray-400">{sheet.desc}</p>
      </div>

      {/* ── Photo Size selector ───────────────────────────────────────── */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Photo Size
        </label>
        <div className="flex flex-col gap-1.5">
          {PASSPORT_SIZES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSize(s)}
              className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition-all
                ${size.id === s.id
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
            >
              <div className="min-w-0">
                <span className="font-semibold">{s.country}</span>
                {s.description && (
                  <span className="ml-2 text-[11px] text-gray-400 hidden sm:inline">{s.description}</span>
                )}
              </div>
              {s.id !== "custom" && (
                <span className={`ml-2 shrink-0 text-xs font-mono rounded px-1.5 py-0.5 ${
                  size.id === s.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                }`}>
                  {s.widthMm}×{s.heightMm}mm
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

        <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
          <span className="font-medium">{effectiveW}×{effectiveH} mm</span>
          {" · "}
          <span>{cols} col × {rows} row</span>
          {" = "}
          <span className="font-semibold text-gray-700">{maxFit} photos max</span>
          {" on 1 "}{sheetSize} sheet
          {" · "}
          <span>8mm margin · 3mm gap</span>
        </div>
      </div>

      {/* ── Copies ───────────────────────────────────────────────────── */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Number of Copies
          <span className="ml-2 text-xs font-normal text-gray-400">
            (max {maxFit} on 1 {sheetSize})
          </span>
        </label>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {COPY_PRESETS.map((preset) => (
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
              {preset === 8 && (
                <span className="ml-1 text-[10px] text-green-600 font-bold">★</span>
              )}
            </button>
          ))}
          <button
            onClick={() => setIsCustomCopies(true)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
              isCustomCopies || !COPY_PRESETS.includes(copies)
                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            Custom
          </button>
        </div>
        <p className="mb-2 text-[11px] text-gray-400">
          ★ 8 photos (4×2) is the standard Indian DTP shop default
        </p>

        {(isCustomCopies || !COPY_PRESETS.includes(copies)) && (
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
            <span className="text-sm text-gray-400">photos</span>
          </div>
        )}
      </div>

      {/* ── Background color ──────────────────────────────────────────── */}
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
                ${bgColor === c.value ||
                  (c.value === "custom" &&
                    !BG_COLORS.slice(0, -1).some((x) => x.value === bgColor))
                  ? "ring-2 ring-blue-500 ring-offset-2"
                  : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-1"
                }`}
              aria-label={`Background color: ${c.label}`}
            >
              {c.value === "custom" && (
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
          {bgColor !== "#FFFFFF" && bgColor !== "#F5F5F0" && (
            <span className="ml-2 text-amber-600">
              ⚠ Non-white bg may be rejected by govt offices
            </span>
          )}
        </p>
      </div>

      {/* ── Grid Layout & Gap Overrides ───────────────────────────────── */}
      <div className="border-t border-gray-100 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-800 flex items-center gap-1.5">
          <i className="bx bx-grid-alt text-blue-500 text-base"></i>
          Grid Layout & Gap
        </h3>

        <div className="space-y-4">
          {/* Photos per row */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-gray-500">
              Photos per Row
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onChange({ ...config, colsAuto: true })}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                  colsAuto
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                Auto-fit
              </button>
              {[4, 5, 6, 8].map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ ...config, colsAuto: false, customCols: c })}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                    !colsAuto && customCols === c
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {c} per line
                </button>
              ))}
            </div>
            {!colsAuto && (
              <p className="mt-1.5 text-[11px] text-amber-600">
                ⚠ Forcing photos per row may cause them to overlap or overflow.
              </p>
            )}
          </div>

          {/* Gap (mm) */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 font-medium">Gap Between Photos</span>
              <span className="font-semibold text-gray-700">{gapMm} mm</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={gapMm}
              onChange={(e) =>
                onChange({ ...config, gapMm: Number(e.target.value) })
              }
              className="w-full accent-blue-500 bg-gray-100 h-1 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ── Cut Lines Toggle ──────────────────────────────────────────── */}
      <div className="border-t border-gray-100 pt-4">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">Show Cut Lines</p>
            <p className="text-xs text-gray-400">
              Hairline guides for guillotine cutter (professional shop standard)
            </p>
          </div>
          <div
            onClick={() => onChange({ ...config, showCutLines: !showCutLines })}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              showCutLines ? "bg-blue-500" : "bg-gray-200"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                showCutLines ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </div>
        </label>
      </div>

      {/* ── AI Portrait Enhancements ──────────────────────────────────── */}
      <div className="border-t border-gray-100 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-800 flex items-center gap-1.5">
          <i className="bx bx-slider-alt text-blue-500 text-base"></i>
          Portrait Enhancements
        </h3>

        <div className="space-y-4">
          {/* Brightness */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 font-medium">Brightness</span>
              <span className="font-semibold text-gray-700">{brightness}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={brightness}
              onChange={(e) =>
                onChange({ ...config, brightness: Number(e.target.value) })
              }
              className="w-full accent-blue-500 bg-gray-100 h-1 rounded-lg cursor-pointer"
            />
          </div>

          {/* Contrast */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 font-medium">Contrast</span>
              <span className="font-semibold text-gray-700">{contrast}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={contrast}
              onChange={(e) =>
                onChange({ ...config, contrast: Number(e.target.value) })
              }
              className="w-full accent-blue-500 bg-gray-100 h-1 rounded-lg cursor-pointer"
            />
          </div>

          {/* Saturation */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 font-medium">Saturation</span>
              <span className="font-semibold text-gray-700">{saturation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={saturation}
              onChange={(e) =>
                onChange({ ...config, saturation: Number(e.target.value) })
              }
              className="w-full accent-blue-500 bg-gray-100 h-1 rounded-lg cursor-pointer"
            />
          </div>

          {/* Skin Smoothing */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 font-medium">Skin Smoothing</span>
              <span className="font-semibold text-gray-700">{skinSmoothing}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              value={skinSmoothing}
              onChange={(e) =>
                onChange({ ...config, skinSmoothing: Number(e.target.value) })
              }
              className="w-full accent-blue-500 bg-gray-100 h-1 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
