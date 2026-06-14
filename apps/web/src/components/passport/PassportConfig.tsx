"use client";

import { useState, useRef, useEffect } from "react";

export interface PassportSize {
  id: string;
  label: string;
  country: string;
  widthMm: number;
  heightMm: number;
}

export const PASSPORT_SIZES: PassportSize[] = [
  { id: "indian",  label: "Indian Passport", country: "🇮🇳 India",     widthMm: 35, heightMm: 45 },
  { id: "aadhaar", label: "Aadhaar / PAN",   country: "🇮🇳 India",     widthMm: 25, heightMm: 35 },
  { id: "stamp",   label: "Stamp Size",      country: "🇮🇳 India",     widthMm: 20, heightMm: 25 },
  { id: "us",      label: "US Visa / OCI",   country: "🇺🇸 USA",       widthMm: 51, heightMm: 51 },
  { id: "uk",      label: "UK Passport",     country: "🇬🇧 UK",        widthMm: 35, heightMm: 45 },
  { id: "eu",      label: "EU / Schengen",   country: "🇪🇺 Schengen",  widthMm: 35, heightMm: 45 },
  { id: "custom",  label: "Custom Size",     country: "✏️ Custom",     widthMm: 35, heightMm: 45 },
];

export const BG_COLORS = [
  { label: "White",      value: "#FFFFFF", sample: "bg-white border border-gray-200" },
  { label: "Off-white",  value: "#F8F8F8", sample: "bg-stone-100 border border-gray-200" },
  { label: "Light Blue", value: "#C3D9F0", sample: "bg-blue-200" },
  { label: "Red",        value: "#E8312F", sample: "bg-red-500" },
  { label: "Custom",     value: "custom",  sample: "bg-gradient-to-br from-purple-200 to-pink-200" },
];

export interface PassportConfig {
  size: PassportSize;
  customWidth: number;
  customHeight: number;
  copies: number;
  bgColor: string;
  bgImageSrc: string | null;  // custom background image as data-URI
  brightness?: number;
  contrast?: number;
  saturation?: number;
  skinSmoothing?: number;
  outlineWidth?: number;
  outlineColor?: string;
  exposure?: number;
  temperature?: number;
  tint?: number;
  sharpness?: number;
  faceBrightness?: number;
  faceSkinSmoothing?: number;
  faceWarmth?: number;
  pageMarginMm?: number;
  photoGapMm?: number;
}

interface PassportConfigProps {
  config: PassportConfig;
  onChange: (c: PassportConfig) => void;
}

export function PassportConfigPanel({ config, onChange }: PassportConfigProps) {
  const [sizesList, setSizesList] = useState<PassportSize[]>(PASSPORT_SIZES);
  const [lockRatio, setLockRatio] = useState(false);
  const [aspectRatio, setAspectRatio] = useState((config.customWidth ?? 35) / (config.customHeight ?? 45));
  const [enhanceTab, setEnhanceTab] = useState<"presets" | "outline">("presets");

  const {
    size,
    customWidth = 35,
    customHeight = 45,
    copies,
    bgColor,
    brightness = 100,
    contrast = 100,
    saturation = 100,
    skinSmoothing = 0,
    outlineWidth = 0,
    outlineColor = "#FFFFFF",
  } = config;

  const [isCustomCopies, setIsCustomCopies] = useState(![4, 8, 12, 16, 32].includes(copies));

  // Sync aspect ratio when lock is off and custom sizes change
  useEffect(() => {
    if (!lockRatio && customWidth && customHeight) {
      setAspectRatio(customWidth / customHeight);
    }
  }, [customWidth, customHeight, lockRatio]);

  function setSize(s: PassportSize) {
    onChange({ ...config, size: s });
  }

  function setCopies(n: number) {
    onChange({ ...config, copies: Math.max(1, Math.min(50, n)) });
  }

  function setBg(v: string) {
    onChange({ ...config, bgColor: v === "custom" ? "#AACCEE" : v });
  }

  const handleWidthChange = (w: number) => {
    const val = Math.max(20, Math.min(100, w));
    if (lockRatio) {
      const h = Math.round(val / aspectRatio);
      if (h >= 20 && h <= 100) {
        onChange({ ...config, customWidth: val, customHeight: h });
      } else {
        const clampedH = Math.max(20, Math.min(100, h));
        const adjustedW = Math.round(clampedH * aspectRatio);
        onChange({ ...config, customWidth: adjustedW, customHeight: clampedH });
      }
    } else {
      onChange({ ...config, customWidth: val });
    }
  };

  const handleHeightChange = (h: number) => {
    const val = Math.max(20, Math.min(100, h));
    if (lockRatio) {
      const w = Math.round(val * aspectRatio);
      if (w >= 20 && w <= 100) {
        onChange({ ...config, customWidth: w, customHeight: val });
      } else {
        const clampedW = Math.max(20, Math.min(100, w));
        const adjustedH = Math.round(clampedW / aspectRatio);
        onChange({ ...config, customWidth: clampedW, customHeight: adjustedH });
      }
    } else {
      onChange({ ...config, customHeight: val });
    }
  };

  const handleCreatePreset = () => {
    const name = prompt("Enter preset name:", `Custom ${customWidth}x${customHeight} mm`);
    if (!name) return;
    const newPreset: PassportSize = {
      id: `custom-preset-${Date.now()}`,
      label: name,
      country: name,
      widthMm: customWidth,
      heightMm: customHeight,
    };
    // Insert preset before custom size (the last element)
    setSizesList(prev => [...prev.slice(0, -1), newPreset, prev[prev.length - 1]]);
    onChange({ ...config, size: newPreset });
  };

  const effectiveW = size.id === "custom" ? customWidth : size.widthMm;
  const effectiveH = size.id === "custom" ? customHeight : size.heightMm;

  const hasChanged =
    brightness !== 100 ||
    contrast !== 100 ||
    saturation !== 100 ||
    skinSmoothing !== 0 ||
    outlineWidth !== 0 ||
    (config.exposure ?? 0) !== 0 ||
    (config.temperature ?? 0) !== 0 ||
    (config.tint ?? 0) !== 0 ||
    (config.sharpness ?? 0) !== 0 ||
    (config.faceBrightness ?? 0) !== 0 ||
    (config.faceSkinSmoothing ?? 0) !== 0 ||
    (config.faceWarmth ?? 0) !== 0;

  function resetEnhancements() {
    onChange({
      ...config,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      skinSmoothing: 0,
      outlineWidth: 0,
      outlineColor: "#FFFFFF",
      exposure: 0,
      temperature: 0,
      tint: 0,
      sharpness: 0,
      faceBrightness: 0,
      faceSkinSmoothing: 0,
      faceWarmth: 0,
    });
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Size selector */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-foreground">
          Passport Size
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {sizesList.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSize(s)}
              className={`flex flex-col items-start rounded-xl border px-4 py-3 text-left text-sm transition-all
                ${size.id === s.id
                  ? "border-primary bg-primary/15 text-primary shadow-sm"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent"
                }`}
            >
              <span className="font-semibold">{s.country}</span>
              {s.id !== "custom" && (
                <span className="mt-0.5 text-xs text-muted-foreground">
                  {s.widthMm}×{s.heightMm} mm
                </span>
              )}
            </button>
          ))}
        </div>

        {size.id === "custom" && (
          <div className="mt-3 space-y-4 rounded-xl border border-border bg-muted/20 p-3.5">
            {/* Aspect Ratio Lock Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Aspect Ratio Lock</span>
              <button
                type="button"
                onClick={() => setLockRatio(!lockRatio)}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
                  lockRatio
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                <i className={`bx ${lockRatio ? "bx-lock-alt" : "bx-lock-open-alt"}`} />
                {lockRatio ? "Locked" : "Unlocked"}
              </button>
            </div>

            {/* Inputs & Sliders */}
            <div className="space-y-3">
              {/* Width */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Width</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={customWidth}
                      min={20}
                      max={100}
                      onChange={(e) => handleWidthChange(Number(e.target.value))}
                      className="w-14 rounded-lg border border-border bg-background px-1.5 py-0.5 text-center text-xs font-semibold focus:border-primary focus:outline-none"
                    />
                    <span className="text-muted-foreground font-semibold">mm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={customWidth}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
                />
              </div>

              {/* Height */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Height</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={customHeight}
                      min={20}
                      max={100}
                      onChange={(e) => handleHeightChange(Number(e.target.value))}
                      className="w-14 rounded-lg border border-border bg-background px-1.5 py-0.5 text-center text-xs font-semibold focus:border-primary focus:outline-none"
                    />
                    <span className="text-muted-foreground font-semibold">mm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={customHeight}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Create Preset Action */}
            <button
              type="button"
              onClick={handleCreatePreset}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-md hover:shadow-lg transition duration-200"
            >
              <i className="bx bx-plus-circle text-sm" />
              Create a Preset
            </button>
          </div>
        )}

        <p className="mt-2 text-xs text-muted-foreground">
          Selected: {effectiveW}×{effectiveH} mm
        </p>
      </div>

      {/* Copies */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-foreground">
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
                  ? "border-primary bg-primary/15 text-primary shadow-sm"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent"
              }`}
            >
              {preset}
            </button>
          ))}
          <button
            onClick={() => setIsCustomCopies(true)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
              isCustomCopies || ![4, 8, 12, 16, 32].includes(copies)
                ? "border-primary bg-primary/15 text-primary shadow-sm"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent"
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
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:bg-accent disabled:opacity-40"
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
              className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-center text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              id="passport-copies-input"
            />
            <button
              onClick={() => setCopies(copies + 1)}
              disabled={copies >= 50}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:bg-accent disabled:opacity-40"
              aria-label="Increase copies"
            >
              <i className="bx bx-plus text-lg"></i>
            </button>
            <span className="text-sm text-muted-foreground">photos (max 50)</span>
          </div>
        )}
      </div>

      {/* Background color + image */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-foreground">
          Background
        </label>

        {/* Preset color swatches */}
        <div className="flex flex-wrap gap-3 mb-3">
          {BG_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                setBg(c.value);
                // clear bg image when selecting a solid color
                if (c.value !== "custom") onChange({ ...config, bgColor: c.value, bgImageSrc: null });
                else setBg(c.value);
              }}
              title={c.label}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all
                ${c.sample}
                ${bgColor === c.value || (c.value === "custom" && !BG_COLORS.slice(0, -1).some((x) => x.value === bgColor))
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                  : "hover:ring-2 hover:ring-muted-foreground hover:ring-offset-1 hover:ring-offset-card"
                }`}
              aria-label={`Background color: ${c.label}`}
            >
              {(c.value === "custom") && (
                <i className="bx bx-palette text-white text-sm drop-shadow"></i>
              )}
            </button>
          ))}

          {/* Custom hex color picker */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => onChange({ ...config, bgColor: e.target.value, bgImageSrc: null })}
              className="h-10 w-10 cursor-pointer rounded-full border-none p-0"
              title="Custom color"
              id="passport-bg-color-picker"
            />
          </div>
        </div>

        {/* Custom background IMAGE upload */}
        <div className="mb-3">
          <BackgroundImageUpload
            current={config.bgImageSrc}
            onSelect={(src) => onChange({ ...config, bgImageSrc: src })}
            onClear={() => onChange({ ...config, bgImageSrc: null })}
          />
        </div>

        <p className="mt-1.5 text-xs text-muted-foreground">
          Color: <code className="rounded bg-muted px-1">{bgColor}</code>
          {config.bgImageSrc && <span className="ml-2 text-emerald-400">· Custom image active</span>}
        </p>
      </div>

      {/* Enhancement section with subtabs */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <i className="bx bx-slider-alt text-primary text-base"></i>
            Enhancement
          </h3>
          {hasChanged && (
            <button
              onClick={resetEnhancements}
              type="button"
              className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground rounded-lg px-2.5 py-1.5 border border-border hover:bg-muted transition"
            >
              <i className="bx bx-reset text-xs" /> Reset
            </button>
          )}
        </div>

        {/* Subtabs Selector */}
        <div className="flex bg-muted p-1 rounded-xl gap-1 mb-4">
          {(["presets", "outline"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setEnhanceTab(t)}
              className={`flex-1 rounded-lg py-1.5 text-[10px] font-bold capitalize transition-all ${
                enhanceTab === t
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab 1: Presets */}
        {enhanceTab === "presets" && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[
              {
                id: "auto",
                label: "Auto Enhance",
                desc: "Balanced auto enhance",
                config: { brightness: 106, contrast: 106, saturation: 104, exposure: 0.08, temperature: 1, tint: 0, sharpness: 1.5, skinSmoothing: 0, faceBrightness: 0, faceSkinSmoothing: 0, faceWarmth: 0 }
              },
              {
                id: "studio",
                label: "Studio Lighting",
                desc: "Bright and clear",
                config: { brightness: 112, contrast: 102, saturation: 98, exposure: 0.15, temperature: -2, tint: 0, sharpness: 1.0, skinSmoothing: 1.0, faceBrightness: 0, faceSkinSmoothing: 0, faceWarmth: 0 }
              },
              {
                id: "vibrant",
                label: "Vibrant",
                desc: "Boosted colors",
                config: { brightness: 103, contrast: 108, saturation: 128, exposure: 0.04, temperature: 4, tint: 1, sharpness: 2.0, skinSmoothing: 0, faceBrightness: 0, faceSkinSmoothing: 0, faceWarmth: 0 }
              },
              {
                id: "lighten",
                label: "Lighten",
                desc: "Lift shadows",
                config: { brightness: 120, contrast: 95, saturation: 100, exposure: 0.25, temperature: 0, tint: 0, sharpness: 1.0, skinSmoothing: 0, faceBrightness: 0, faceSkinSmoothing: 0, faceWarmth: 0 }
              },
              {
                id: "contrast",
                label: "High Contrast",
                desc: "Deep blacks & whites",
                config: { brightness: 96, contrast: 125, saturation: 110, exposure: -0.1, temperature: -5, tint: 1, sharpness: 4.0, skinSmoothing: 0, faceBrightness: 0, faceSkinSmoothing: 0, faceWarmth: 0 }
              }
            ].map((p) => {
              const isActive =
                (config.brightness ?? 100) === p.config.brightness &&
                (config.contrast ?? 100) === p.config.contrast &&
                (config.saturation ?? 100) === p.config.saturation;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange({ ...config, ...p.config })}
                  className={`flex flex-col text-left p-2.5 rounded-xl border text-xs transition-all ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-card hover:border-primary/30 hover:bg-accent"
                  }`}
                >
                  <span className="font-bold text-foreground leading-tight">{p.label}</span>
                  <span className="text-[10px] text-muted-foreground/80 mt-0.5 truncate">{p.desc}</span>
                </button>
              );
            })}
          </div>
        )}



        {/* Tab 4: Outline */}
        {enhanceTab === "outline" && (
          <div className="space-y-4 mt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground font-medium">Outline Width</span>
                <span className="font-semibold text-foreground">{outlineWidth}px</span>
              </div>
              <input
                type="range" min="0" max="12" step="0.5"
                value={outlineWidth}
                onChange={(e) => onChange({ ...config, outlineWidth: Number(e.target.value) })}
                className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
              />
            </div>
            {outlineWidth > 0 && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Outline Color
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {["#FFFFFF", "#000000", "#FFD700", "#FF3333", "#3388FF", "#33FF33"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onChange({ ...config, outlineColor: color })}
                      style={{ backgroundColor: color }}
                      className={`h-6 w-6 rounded-full border transition-all ${
                        outlineColor === color
                          ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-card"
                          : "border-border hover:scale-110"
                      }`}
                      aria-label={`Outline color ${color}`}
                    />
                  ))}
                  <input
                    type="color"
                    value={outlineColor}
                    onChange={(e) => onChange({ ...config, outlineColor: e.target.value })}
                    className="h-6 w-6 cursor-pointer rounded border-none p-0 bg-transparent"
                    title="Custom outline color"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



/* ── Background Image Upload sub-component ───────────────────────────── */
function BackgroundImageUpload({
  current,
  onSelect,
  onClear,
}: {
  current: string | null;
  onSelect: (src: string) => void;
  onClear: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) onSelect(ev.target.result as string);
    };
    reader.readAsDataURL(file);
    // reset input so same file can be re-selected
    e.target.value = "";
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        id="passport-bg-image-input"
      />
      <button
        onClick={() => fileRef.current?.click()}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
          current
            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            : "border-border bg-card text-foreground hover:bg-accent"
        }`}
      >
        <i className="bx bx-image-add text-sm"></i>
        {current ? "Change bg image" : "Use background image"}
      </button>
      {current && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
        >
          <i className="bx bx-x text-sm"></i>
          Remove
        </button>
      )}
      {current && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current} alt="bg" className="h-8 w-12 rounded-lg object-cover border border-border" />
      )}
    </div>
  );
}
