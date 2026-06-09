"use client";

import { useEffect, useRef, useCallback } from "react";
import type { PassportSize } from "./PassportConfig";

interface A4SheetPreviewProps {
  processedImageSrc: string;   // base64 data-URI of the cropped passport photo
  size: PassportSize;
  customWidth: number;
  customHeight: number;
  copies: number;
  bgColor: string;
  onPhotoCount?: (count: number) => void;
}

// A4 at 96 dpi: 794 × 1123 px  ≈  210 × 297 mm
const A4_PX_W = 794;
const A4_PX_H = 1123;
const MM_TO_PX = A4_PX_W / 210; // ≈ 3.78 px/mm

const MARGIN_MM  = 6;   // outer margin
const GAP_MM     = 3;   // gap between photos

export function A4SheetPreview({
  processedImageSrc,
  size,
  customWidth,
  customHeight,
  copies,
  bgColor,
  onPhotoCount,
}: A4SheetPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const effectiveW = size.id === "custom" ? customWidth : size.widthMm;
  const effectiveH = size.id === "custom" ? customHeight : size.heightMm;

  const drawSheet = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const photoWpx = effectiveW * MM_TO_PX;
    const photoHpx = effectiveH * MM_TO_PX;
    const marginPx  = MARGIN_MM * MM_TO_PX;
    const gapPx     = GAP_MM * MM_TO_PX;

    // How many cols & rows fit?
    const availW = A4_PX_W - 2 * marginPx;
    const availH = A4_PX_H - 2 * marginPx;
    const cols = Math.max(1, Math.floor((availW + gapPx) / (photoWpx + gapPx)));
    const rows = Math.max(1, Math.floor((availH + gapPx) / (photoHpx + gapPx)));
    const maxOnSheet = cols * rows;
    const toDraw = Math.min(copies, maxOnSheet);

    onPhotoCount?.(toDraw);

    // ── Draw white A4 background ──
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, A4_PX_W, A4_PX_H);

    // ── Load & draw photos ──
    const img = new Image();
    img.onload = () => {
      let drawn = 0;
      for (let r = 0; r < rows && drawn < toDraw; r++) {
        for (let c = 0; c < cols && drawn < toDraw; c++) {
          const x = marginPx + c * (photoWpx + gapPx);
          const y = marginPx + r * (photoHpx + gapPx);

          // Background colour fill behind photo
          ctx.fillStyle = bgColor;
          ctx.fillRect(x, y, photoWpx, photoHpx);

          // Draw photo
          ctx.drawImage(img, x, y, photoWpx, photoHpx);

          // Thin border
          ctx.strokeStyle = "#CCCCCC";
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, photoWpx, photoHpx);

          drawn++;
        }
      }
    };
    img.src = processedImageSrc;
  }, [processedImageSrc, effectiveW, effectiveH, copies, bgColor, onPhotoCount]);

  useEffect(() => {
    drawSheet();
  }, [drawSheet]);

  return (
    <canvas
      ref={canvasRef}
      width={A4_PX_W}
      height={A4_PX_H}
      id="passport-a4-canvas"
      className="w-full rounded-lg border border-gray-200 shadow-sm"
      style={{ maxWidth: A4_PX_W }}
    />
  );
}
