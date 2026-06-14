"use client";

import { useEffect, useRef, useCallback } from "react";
import type { PassportSize } from "./PassportConfig";

interface A4SheetPreviewProps {
  processedImageSrc: string;   // transparent RGBA base64 PNG
  size: PassportSize;
  customWidth: number;
  customHeight: number;
  copies: number;
  bgColor: string;
  bgImageSrc: string | null;   // optional background image data-URI
  onPhotoCount?: (count: number) => void;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  skinSmoothing?: number;
  outlineWidth?: number;
  outlineColor?: string;
  pageMarginMm?: number;
  photoGapMm?: number;
}

// A4 at 96 dpi: 794 × 1123 px  ≈  210 × 297 mm
const A4_PX_W = 794;
const A4_PX_H = 1123;
const MM_TO_PX = A4_PX_W / 210; // ≈ 3.78 px/mm

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

  // Draw foreground image
  octx.drawImage(img, 0, 0, width, height);

  // Turn non-transparent pixels into solid strokeColor
  octx.globalCompositeOperation = "source-in";
  octx.fillStyle = strokeColor;
  octx.fillRect(0, 0, width, height);

  // Draw offset silhouette in 16 directions
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
  customWidth,
  customHeight,
  copies,
  bgColor,
  bgImageSrc,
  onPhotoCount,
  brightness = 100,
  contrast = 100,
  saturation = 100,
  skinSmoothing = 0,
  outlineWidth = 0,
  outlineColor = "#FFFFFF",
  pageMarginMm = 6,
  photoGapMm = 3,
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
    const marginPx  = pageMarginMm * MM_TO_PX;
    const gapPx     = photoGapMm * MM_TO_PX;

    const availW = A4_PX_W - 2 * marginPx;
    const availH = A4_PX_H - 2 * marginPx;
    const cols = Math.max(1, Math.floor((availW + gapPx) / (photoWpx + gapPx)));
    const rows = Math.max(1, Math.floor((availH + gapPx) / (photoHpx + gapPx)));
    const maxOnSheet = cols * rows;
    const toDraw = Math.min(copies, maxOnSheet);

    onPhotoCount?.(toDraw);

    // White A4 paper background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, A4_PX_W, A4_PX_H);

    // Load the foreground (transparent PNG) and optional background image
    const fg = new Image();
    fg.onload = () => {
      const renderPhotos = (bgImg?: HTMLImageElement) => {
        let drawn = 0;
        for (let r = 0; r < rows && drawn < toDraw; r++) {
          for (let c = 0; c < cols && drawn < toDraw; c++) {
            const x = marginPx + c * (photoWpx + gapPx);
            const y = marginPx + r * (photoHpx + gapPx);

            // 1) Solid background color
            ctx.fillStyle = bgColor;
            ctx.fillRect(x, y, photoWpx, photoHpx);

            // 2) Background image (if any) — drawn first so fg layers on top
            if (bgImg) {
              ctx.drawImage(bgImg, x, y, photoWpx, photoHpx);
            }

            // 2.5) Draw custom outline border (under the foreground)
            if (outlineWidth > 0) {
              drawOutline(ctx, fg, x, y, photoWpx, photoHpx, outlineWidth, outlineColor);
            }

            // 3) Foreground person (transparent PNG composites naturally, filters applied here)
            ctx.save();
            const filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` + 
              (skinSmoothing > 0 ? ` blur(${skinSmoothing}px)` : "");
            ctx.filter = filterStr;
            ctx.drawImage(fg, x, y, photoWpx, photoHpx);
            ctx.restore();

            // 4) Thin crop guide border
            ctx.strokeStyle = "rgba(0,0,0,0.15)";
            ctx.lineWidth = 0.8;
            ctx.strokeRect(x, y, photoWpx, photoHpx);

            drawn++;
          }
        }
      };

      if (bgImageSrc) {
        const bgImg = new Image();
        bgImg.onload = () => renderPhotos(bgImg);
        bgImg.onerror = () => renderPhotos();   // fallback to color only
        bgImg.src = bgImageSrc;
      } else {
        renderPhotos();
      }
    };
    fg.src = processedImageSrc;
  }, [
    processedImageSrc,
    effectiveW,
    effectiveH,
    copies,
    bgColor,
    bgImageSrc,
    onPhotoCount,
    brightness,
    contrast,
    saturation,
    skinSmoothing,
    outlineWidth,
    outlineColor,
    pageMarginMm,
    photoGapMm,
  ]);

  useEffect(() => {
    drawSheet();
  }, [drawSheet]);

  return (
    <canvas
      ref={canvasRef}
      width={A4_PX_W}
      height={A4_PX_H}
      id="passport-a4-canvas"
      className="w-full rounded-lg border border-border shadow-sm"
      style={{ maxWidth: A4_PX_W }}
    />
  );
}
