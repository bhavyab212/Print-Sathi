"use client";

import { useEffect, useRef, useCallback } from "react";
import type { PassportSize, SheetSize } from "./PassportConfig";

interface A4SheetPreviewProps {
  processedImageSrc: string; // base64 data-URI of the cropped passport photo
  size: PassportSize;
  sheetSize?: SheetSize;
  customWidth: number;
  customHeight: number;
  copies: number;
  bgColor: string;
  showCutLines?: boolean;
  gapMm?: number;
  colsAuto?: boolean;
  customCols?: number;
  onPhotoCount?: (count: number) => void;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  skinSmoothing?: number;
  outlineWidth?: number;
  outlineColor?: string;
}

// ── Sheet configs from research ───────────────────────────────────────────────
// Screen canvas sizes at 96 DPI equivalent for preview
// A4: 210×297 mm  →  794×1123 px
// 4R: 102×152 mm  →  386×575 px
// A6: 105×148 mm  →  397×559 px
const SHEET_CONFIGS: Record<
  SheetSize,
  { widthMm: number; heightMm: number; pxW: number; pxH: number }
> = {
  A4: { widthMm: 210, heightMm: 297, pxW: 794,  pxH: 1123 },
  "4R": { widthMm: 102, heightMm: 152, pxW: 386,  pxH: 575  },
  A6:  { widthMm: 105, heightMm: 148, pxW: 397,  pxH: 559  },
};

// ── Research-based exact layout constants ─────────────────────────────────────
// Source: research/photo-print-real-world-india.md
// "8mm outer margin + 3mm gap between photos"
// - 8mm outer margin: safe for ALL consumer printers (non-printable zone ≈ 4-6mm)
// - 3mm gap: sufficient for guillotine cutter (±1mm drift)
const OUTER_MARGIN_MM = 8;

// Helper to draw stroke outline around a transparent image
const drawOutline = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  strokeWidth: number,
  strokeColor: string
) => {
  if (strokeWidth <= 0) return;

  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const octx = offscreen.getContext("2d");
  if (!octx) return;

  octx.drawImage(img, 0, 0, width, height);
  octx.globalCompositeOperation = "source-in";
  octx.fillStyle = strokeColor;
  octx.fillRect(0, 0, width, height);

  ctx.save();
  const steps = 16;
  for (let i = 0; i < steps; i++) {
    const angle = (i * 2 * Math.PI) / steps;
    const ox = Math.cos(angle) * strokeWidth;
    const oy = Math.sin(angle) * strokeWidth;
    ctx.drawImage(offscreen, x + ox, y + oy);
  }
  ctx.restore();
};

export function A4SheetPreview({
  processedImageSrc,
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
  onPhotoCount,
  brightness = 100,
  contrast = 100,
  saturation = 100,
  skinSmoothing = 0,
  outlineWidth = 0,
  outlineColor = "#FFFFFF",
}: A4SheetPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const effectiveW = size.id === "custom" ? customWidth : size.widthMm;
  const effectiveH = size.id === "custom" ? customHeight : size.heightMm;

  const sheet = SHEET_CONFIGS[sheetSize] ?? SHEET_CONFIGS.A4;

  // px/mm ratio for this sheet at its display resolution
  const MM_TO_PX = sheet.pxW / sheet.widthMm;

  const drawSheet = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Update canvas dimensions to match selected sheet
    canvas.width  = sheet.pxW;
    canvas.height = sheet.pxH;

    const photoWpx = effectiveW * MM_TO_PX;
    const photoHpx = effectiveH * MM_TO_PX;
    const marginPx = OUTER_MARGIN_MM * MM_TO_PX;
    const gapPx    = gapMm * MM_TO_PX;

    // ── Layout calculation (research algorithm) ──
    const availW = sheet.pxW - 2 * marginPx;
    const availH = sheet.pxH - 2 * marginPx;
    
    let cols = 1;
    if (!colsAuto && customCols) {
      cols = customCols;
    } else {
      cols = Math.max(1, Math.floor((availW + gapPx) / (photoWpx + gapPx)));
    }
    
    const rows = Math.max(1, Math.floor((availH + gapPx) / (photoHpx + gapPx)));
    const maxOnSheet = cols * rows;
    const toDraw = Math.min(copies, maxOnSheet);

    onPhotoCount?.(toDraw);

    // ── Draw white sheet background ──
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, sheet.pxW, sheet.pxH);

    // ── Center the grid on the sheet (research spec) ──
    // Grid is centered, not flush to top-left margin.
    // This produces equal whitespace on all sides — more professional.
    const gridW  = cols * photoWpx + (cols - 1) * gapPx;
    const gridH  = rows * photoHpx + (rows - 1) * gapPx;
    const startX = (sheet.pxW - gridW) / 2;
    const startY = (sheet.pxH - gridH) / 2;

    // ── Load & draw photos ──
    const img = new Image();
    img.onload = () => {
      let drawn = 0;
      for (let r = 0; r < rows && drawn < toDraw; r++) {
        for (let c = 0; c < cols && drawn < toDraw; c++) {
          const x = startX + c * (photoWpx + gapPx);
          const y = startY + r * (photoHpx + gapPx);

          // 1) Background colour fill behind photo
          ctx.fillStyle = bgColor;
          ctx.fillRect(x, y, photoWpx, photoHpx);

          // 2) Outline border (under the foreground)
          if (outlineWidth > 0) {
            drawOutline(ctx, img, x, y, photoWpx, photoHpx, outlineWidth, outlineColor);
          }

          // 3) Foreground person with CSS filters
          ctx.save();
          const filterStr =
            `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` +
            (skinSmoothing > 0 ? ` blur(${skinSmoothing}px)` : "");
          ctx.filter = filterStr;
          ctx.drawImage(img, x, y, photoWpx, photoHpx);
          ctx.restore();

          // 4) Cut lines — hairline at every photo edge
          // Research spec: "0.3pt hairline #BBBBBB — professional shop standard"
          // Shopkeepers use this to align guillotine cutter
          if (showCutLines) {
            ctx.strokeStyle = "rgba(170,170,170,0.75)";
            ctx.lineWidth = 0.5;
            ctx.setLineDash([]);
            ctx.strokeRect(x, y, photoWpx, photoHpx);
          }

          drawn++;
        }
      }

      // ── Print instruction text in bottom margin (research spec) ──
      // "Print at 100% / Actual Size — Do NOT scale" in bottom margin
      // This is the #1 fix for why photos come out wrong size in shops
      const instrFontPx = Math.max(7, marginPx * 0.45);
      ctx.font = `${instrFontPx}px Arial, sans-serif`;
      ctx.fillStyle = "rgba(150,150,150,0.85)";
      ctx.textAlign = "center";
      ctx.fillText(
        `Print at 100% / Actual Size — Do NOT scale  ·  ${sheet.widthMm}×${sheet.heightMm}mm  ·  ${effectiveW}×${effectiveH}mm @ 300 DPI`,
        sheet.pxW / 2,
        sheet.pxH - instrFontPx * 0.7
      );
    };
    img.src = processedImageSrc;
  }, [
    processedImageSrc,
    effectiveW,
    effectiveH,
    copies,
    bgColor,
    showCutLines,
    sheetSize,
    onPhotoCount,
    brightness,
    contrast,
    saturation,
    skinSmoothing,
    outlineWidth,
    outlineColor,
    sheet,
    MM_TO_PX,
  ]);

  useEffect(() => {
    drawSheet();
  }, [drawSheet]);

  return (
    <canvas
      ref={canvasRef}
      width={sheet.pxW}
      height={sheet.pxH}
      id="passport-a4-canvas"
      className="w-full rounded-lg border border-gray-200 shadow-sm"
      style={{ maxWidth: sheet.pxW }}
    />
  );
}
