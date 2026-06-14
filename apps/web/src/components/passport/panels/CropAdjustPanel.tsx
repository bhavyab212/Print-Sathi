"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface CropBox { x: number; y: number; w: number; h: number; rotation: number; }

export interface CropCase {
  id: string;
  label: string;
  ratio: number | null; // null for free
  desc: string;
  widthMm?: number;
  heightMm?: number;
}

export const CROP_CASES: CropCase[] = [
  { id: "passport", label: "Indian Passport", ratio: 35 / 45, desc: "35 × 45 mm", widthMm: 35, heightMm: 45 },
  { id: "aadhaar",  label: "Aadhaar / PAN",   ratio: 25 / 35, desc: "25 × 35 mm", widthMm: 25, heightMm: 35 },
  { id: "stamp",    label: "Stamp Size",      ratio: 20 / 25, desc: "20 × 25 mm", widthMm: 20, heightMm: 25 },
  { id: "usvisa",   label: "US Visa / OCI",   ratio: 51 / 51, desc: "51 × 51 mm", widthMm: 51, heightMm: 51 },
  { id: "schengen", label: "EU Schengen",     ratio: 35 / 45, desc: "35 × 45 mm", widthMm: 35, heightMm: 45 },
  { id: "canada",   label: "Canada Passport", ratio: 50 / 70, desc: "50 × 70 mm", widthMm: 50, heightMm: 70 },
  { id: "china",    label: "China Passport",  ratio: 33 / 48, desc: "33 × 48 mm", widthMm: 33, heightMm: 48 },
  { id: "uaevisa",  label: "UAE / Saudi Visa", ratio: 40 / 60, desc: "40 × 60 mm", widthMm: 40, heightMm: 60 },
  { id: "free",     label: "Free Aspect",     ratio: null,    desc: "Custom Aspect" },
];

interface CropAdjustPanelProps {
  processedSrc: string;
  faceBox?: number[] | null;
  onApply: (
    cropped: string,
    box: CropBox,
    cropCase?: CropCase,
    cropMeta?: { srcX: number; srcY: number; srcW: number; srcH: number }
  ) => void;
  onSkip: () => void;
}

const PASSPORT_RATIO = 35 / 45; // width / height

type Handle = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r" | "pan";

export function CropAdjustPanel({ processedSrc, faceBox, onApply, onSkip }: CropAdjustPanelProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [box, setBox] = useState<CropBox>({ x: 0, y: 0, w: 0, h: 0, rotation: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [activeCaseId, setActiveCaseId] = useState<string>("passport");

  const dragRef = useRef<
    | { mode: "resize"; handle: Handle; startX: number; startY: number; startBox: CropBox }
    | { mode: "pan"; startX: number; startY: number; startPanX: number; startPanY: number }
    | null
  >(null);

  // Load image
  useEffect(() => {
    const image = new Image();
    image.onload = () => setImg(image);
    image.src = processedSrc;
  }, [processedSrc]);

  // Initialize crop box centered
  const initBox = useCallback((image: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cW = canvas.width;
    const cH = canvas.height;
    
    // Fit image to canvas at 85% to give breathing room for crop borders
    const scale = Math.min(cW / image.naturalWidth, cH / image.naturalHeight) * 0.85;
    const imgW = image.naturalWidth * scale;
    const imgH = image.naturalHeight * scale;
    const imgX = (cW - imgW) / 2;
    const imgY = (cH - imgH) / 2;
    
    const activeCase = CROP_CASES.find(c => c.id === activeCaseId);
    const ratio = activeCase?.ratio ?? PASSPORT_RATIO;

    let cropW, cropH, cropX, cropY;
    if (faceBox && faceBox.length === 4) {
      const [fx, fy, fw, fh] = faceBox;
      
      // Calculate face center in original image space
      const faceCX = fx + fw / 2;
      const faceCY = fy + fh / 2;
      
      // Make the crop box height about 2.5 times the face height to give plenty of breathing room
      cropH = Math.min(image.naturalHeight, fh * 2.5) * scale;
      cropW = cropH * ratio;
      
      // Center the crop box horizontally around the face center
      cropX = imgX + (faceCX * scale) - (cropW / 2);
      // Position the face slightly higher than the center (face center at 45% of crop height)
      cropY = imgY + (faceCY * scale) - (cropH * 0.45);
      
      // Clamp to image bounds
      if (cropX < imgX) cropX = imgX;
      if (cropY < imgY) cropY = imgY;
      if (cropX + cropW > imgX + imgW) {
        cropX = imgX + imgW - cropW;
      }
      if (cropY + cropH > imgY + imgH) {
        cropY = imgY + imgH - cropH;
      }
    } else {
      // Crop box defaults to 75% of fit image size
      cropH = imgH * 0.75;
      cropW = cropH * ratio;
      cropX = imgX + (imgW - cropW) / 2;
      cropY = imgY + (imgH - cropH) / 2;
    }
    
    setBox({ x: Math.round(cropX), y: Math.round(cropY), w: Math.round(cropW), h: Math.round(cropH), rotation: 0 });
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
  }, [faceBox, activeCaseId]);

  // Set up wheel zoom listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 0.05;
      const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor;
      setZoom(prev => Math.max(0.5, Math.min(4.0, prev + delta)));
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Keyboard navigation for cropping box
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;

      const stepSize = e.shiftKey ? 15 : 3;
      setBox(prev => {
        let { x, y, w, h } = prev;
        const cW = canvasRef.current?.width || 600;
        const cH = canvasRef.current?.height || 500;

        switch (e.key) {
          case "ArrowLeft":
            if (e.ctrlKey) w = Math.max(40, w - stepSize);
            else x = Math.max(0, x - stepSize);
            break;
          case "ArrowRight":
            if (e.ctrlKey) w = Math.min(cW - x, w + stepSize);
            else x = Math.min(cW - w, x + stepSize);
            break;
          case "ArrowUp":
            if (e.ctrlKey) h = Math.max(40, h - stepSize);
            else y = Math.max(0, y - stepSize);
            break;
          case "ArrowDown":
            if (e.ctrlKey) h = Math.min(cH - y, h + stepSize);
            else y = Math.min(cH - h, y + stepSize);
            break;
          default:
            return prev;
        }

        const activeCase = CROP_CASES.find(c => c.id === activeCaseId);
        if (lockAspect && activeCase && activeCase.ratio) {
          h = w / activeCase.ratio;
        }
        return { ...prev, x, y, w, h };
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCaseId, lockAspect]);

  // Draw main workspace canvas (Left Panel)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    
    // Auto scale to container size
    canvas.width  = rect.width  || 600;
    canvas.height = rect.height || 500;

    if (box.w === 0) { initBox(img); return; }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const fitScale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight) * 0.85;
    if (fitScale <= 0) return;

    const totalScale = fitScale * zoom;
    const imgW  = img.naturalWidth * totalScale;
    const imgH  = img.naturalHeight * totalScale;
    
    // Image draw coords with panning offset
    const imgX  = (canvas.width  - imgW) / 2 + panX;
    const imgY  = (canvas.height - imgH) / 2 + panY;

    // Checkerboard pattern for transparent sections
    const pat = document.createElement("canvas");
    pat.width = pat.height = 12;
    const ptx = pat.getContext("2d")!;
    ptx.fillStyle = "#e5e5e5"; ptx.fillRect(0, 0, 12, 12);
    ptx.fillStyle = "#fafafa"; ptx.fillRect(0, 0, 6, 6); ptx.fillRect(6, 6, 6, 6);
    const pattern = ctx.createPattern(pat, "repeat")!;

    const cx = imgX + imgW / 2;
    const cy = imgY + imgH / 2;

    // Checkerboard layer
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.fillStyle = pattern;
    ctx.fillRect(-imgW / 2, -imgH / 2, imgW, imgH);
    ctx.restore();

    // Rotated and translated main image
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH);
    ctx.restore();

    // Dark mask outside crop window
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, canvas.width, box.y);
    ctx.fillRect(0, box.y + box.h, canvas.width, canvas.height - (box.y + box.h));
    ctx.fillRect(0, box.y, box.x, box.h);
    ctx.fillRect(box.x + box.w, box.y, canvas.width - (box.x + box.w), box.h);
    ctx.restore();

    // Visual bounds border
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(box.x, box.y, box.w, box.h);

    // Center Crosshair
    ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(box.x + box.w / 2 - 12, box.y + box.h / 2);
    ctx.lineTo(box.x + box.w / 2 + 12, box.y + box.h / 2);
    ctx.moveTo(box.x + box.w / 2, box.y + box.h / 2 - 12);
    ctx.lineTo(box.x + box.w / 2, box.y + box.h / 2 + 12);
    ctx.stroke();

    // Grid overlays (Rule of Thirds)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 0.8;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); 
      ctx.moveTo(box.x + (box.w / 3) * i, box.y); 
      ctx.lineTo(box.x + (box.w / 3) * i, box.y + box.h); 
      ctx.stroke();
      
      ctx.beginPath(); 
      ctx.moveTo(box.x, box.y + (box.h / 3) * i); 
      ctx.lineTo(box.x + box.w, box.y + (box.h / 3) * i); 
      ctx.stroke();
    }

    // Handles drawing
    const handlePositions: { [key in Handle]?: [number, number] } = {
      tl: [box.x, box.y],
      tr: [box.x + box.w, box.y],
      bl: [box.x, box.y + box.h],
      br: [box.x + box.w, box.y + box.h],
      t: [box.x + box.w / 2, box.y],
      b: [box.x + box.w / 2, box.y + box.h],
      l: [box.x, box.y + box.h / 2],
      r: [box.x + box.w, box.y + box.h / 2]
    };

    Object.entries(handlePositions).forEach(([hKey, val]) => {
      if (!val) return;
      const [hx, hy] = val;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#1d4ed8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (["tl", "tr", "bl", "br"].includes(hKey)) {
        ctx.fillRect(hx - 5, hy - 5, 10, 10);
        ctx.strokeRect(hx - 5, hy - 5, 10, 10);
      } else {
        ctx.arc(hx, hy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });

  }, [img, box, rotation, zoom, panX, panY, initBox]);

  // Draw high-resolution cropped live preview (Right Panel)
  useEffect(() => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas || !img || !canvasRef.current || box.w === 0 || box.h === 0) return;
    const pctx = previewCanvas.getContext("2d");
    if (!pctx) return;

    const fitScale = Math.min(canvasRef.current.width / img.naturalWidth, canvasRef.current.height / img.naturalHeight) * 0.85;
    if (fitScale <= 0) return;

    const s = fitScale * zoom;

    // Use a large canvas size for premium high resolution output representation
    const previewWidth = 600;
    const previewHeight = Math.round(previewWidth / (box.w / box.h));
    previewCanvas.width = previewWidth;
    previewCanvas.height = previewHeight;

    pctx.clearRect(0, 0, previewWidth, previewHeight);

    // Checkerboard
    const pat = document.createElement("canvas");
    pat.width = pat.height = 12;
    const ptx = pat.getContext("2d")!;
    ptx.fillStyle = "#e5e5e5"; ptx.fillRect(0, 0, 12, 12);
    ptx.fillStyle = "#fafafa"; ptx.fillRect(0, 0, 6, 6); ptx.fillRect(6, 6, 6, 6);
    const pattern = pctx.createPattern(pat, "repeat")!;
    pctx.fillStyle = pattern;
    pctx.fillRect(0, 0, previewWidth, previewHeight);

    // Apply exact coordinate mapping matching left side
    const previewScale = previewWidth / box.w;
    const cx = (canvasRef.current.width / 2 + panX - box.x) * previewScale;
    const cy = (canvasRef.current.height / 2 + panY - box.y) * previewScale;
    const imgW = img.naturalWidth * s * previewScale;
    const imgH = img.naturalHeight * s * previewScale;

    pctx.save();
    pctx.translate(cx, cy);
    pctx.rotate((rotation * Math.PI) / 180);
    pctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH);
    pctx.restore();

  }, [img, box, rotation, zoom, panX, panY]);

  // Determine handle proximity for dragging
  function getHandle(x: number, y: number): Handle | null {
    const r = 12;
    if (Math.hypot(x - box.x, y - box.y) < r)              return "tl";
    if (Math.hypot(x - (box.x + box.w), y - box.y) < r)      return "tr";
    if (Math.hypot(x - box.x, y - (box.y + box.h)) < r)      return "bl";
    if (Math.hypot(x - (box.x + box.w), y - (box.y + box.h)) < r) return "br";
    if (Math.hypot(x - (box.x + box.w / 2), y - box.y) < r)    return "t";
    if (Math.hypot(x - (box.x + box.w / 2), y - (box.y + box.h)) < r) return "b";
    if (Math.hypot(x - box.x, y - (box.y + box.h / 2)) < r)    return "l";
    if (Math.hypot(x - (box.x + box.w), y - (box.y + box.h / 2)) < r) return "r";
    return null;
  }

  function canvasCoords(e: React.MouseEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onMouseDown(e: React.MouseEvent) {
    const { x, y } = canvasCoords(e);
    const handle = getHandle(x, y);
    if (handle) {
      dragRef.current = { mode: "resize", handle, startX: x, startY: y, startBox: { ...box } };
    } else {
      dragRef.current = { mode: "pan", startX: x, startY: y, startPanX: panX, startPanY: panY };
    }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return;
    const { x, y } = canvasCoords(e);

    // Pan image
    if (dragRef.current.mode === "pan") {
      const { startX, startY, startPanX, startPanY } = dragRef.current;
      setPanX(startPanX + (x - startX));
      setPanY(startPanY + (y - startY));
      return;
    }

    // Resize crop box
    const { handle, startX, startY, startBox } = dragRef.current;
    const dx = x - startX, dy = y - startY;
    const activeCase = CROP_CASES.find(x => x.id === activeCaseId);
    const targetRatio = lockAspect && activeCase ? activeCase.ratio : null;

    setBox(prev => {
      let { x: bx, y: by, w: bw, h: bh } = startBox;
      const cW = canvasRef.current?.width || 600;
      const cH = canvasRef.current?.height || 500;

      switch (handle) {
        case "tl":
          bx = Math.min(startBox.x + startBox.w - 40, Math.max(0, bx + dx));
          by = Math.min(startBox.y + startBox.h - 40, Math.max(0, by + dy));
          bw = startBox.x + startBox.w - bx;
          bh = startBox.y + startBox.h - by;
          break;
        case "tr":
          bw = Math.min(cW - bx, Math.max(40, bw + dx));
          by = Math.min(startBox.y + startBox.h - 40, Math.max(0, by + dy));
          bh = startBox.y + startBox.h - by;
          break;
        case "bl":
          bx = Math.min(startBox.x + startBox.w - 40, Math.max(0, bx + dx));
          bw = startBox.x + startBox.w - bx;
          bh = Math.min(cH - by, Math.max(40, bh + dy));
          break;
        case "br":
          bw = Math.min(cW - bx, Math.max(40, bw + dx));
          bh = Math.min(cH - by, Math.max(40, bh + dy));
          break;
        case "t":
          by = Math.min(startBox.y + startBox.h - 40, Math.max(0, by + dy));
          bh = startBox.y + startBox.h - by;
          break;
        case "b":
          bh = Math.min(cH - by, Math.max(40, bh + dy));
          break;
        case "l":
          bx = Math.min(startBox.x + startBox.w - 40, Math.max(0, bx + dx));
          bw = startBox.x + startBox.w - bx;
          break;
        case "r":
          bw = Math.min(cW - bx, Math.max(40, bw + dx));
          break;
      }

      if (targetRatio) {
        bh = bw / targetRatio;
        if (by + bh > cH) {
          bh = cH - by;
          bw = bh * targetRatio;
          if (handle === "tl" || handle === "bl" || handle === "l") {
            bx = startBox.x + startBox.w - bw;
          }
        }
      }

      return { ...prev, x: Math.round(bx), y: Math.round(by), w: Math.round(bw), h: Math.round(bh) };
    });
  }

  function onMouseUp() { dragRef.current = null; }

  // Apply crop and output high quality result
  function applyCrop() {
    if (!img || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const fitScale  = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight) * 0.85;
    if (fitScale <= 0) return;

    const s = fitScale * zoom;

    const imgW  = img.naturalWidth * s;
    const imgH  = img.naturalHeight * s;
    const imgX  = (canvas.width  - imgW) / 2 + panX;
    const imgY  = (canvas.height - imgH) / 2 + panY;

    // Source coordinates on the unrotated, unpanned original image space
    const srcX = (box.x - imgX) / s;
    const srcY = (box.y - imgY) / s;
    const srcW = box.w / s;
    const srcH = box.h / s;

    // Target output canvas matching high-res size
    const out = document.createElement("canvas");
    out.width  = Math.round(srcW);
    out.height = Math.round(srcH);
    const octx = out.getContext("2d")!;

    // Compute coordinate mapping to maintain relative positioning after rotation
    const cx_out = (canvas.width / 2 + panX - box.x) / s;
    const cy_out = (canvas.height / 2 + panY - box.y) / s;

    octx.save();
    octx.translate(cx_out, cy_out);
    octx.rotate((rotation * Math.PI) / 180);
    octx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2, img.naturalWidth, img.naturalHeight);
    octx.restore();

    const dataURL = out.toDataURL("image/png");
    const activeCase = CROP_CASES.find(x => x.id === activeCaseId);
    onApply(dataURL, box, activeCase, { srcX, srcY, srcW, srcH });
  }

  function resetCrop() {
    if (img) {
      setRotation(0);
      initBox(img);
    }
  }

  function selectCropCase(cId: string) {
    const c = CROP_CASES.find(x => x.id === cId);
    if (!c) return;
    setActiveCaseId(cId);
    if (c.ratio === null) {
      setLockAspect(false);
    } else {
      setLockAspect(true);
      if (img) {
        setBox(b => {
          const newH = b.w / c.ratio!;
          const centerY = b.y + b.h / 2;
          const newY = Math.max(0, centerY - newH / 2);
          const cH = canvasRef.current?.height || 500;
          const clampedH = Math.min(cH - newY, newH);
          return { ...b, y: Math.round(newY), h: Math.round(clampedH) };
        });
      }
    }
  }

  const activeCase = CROP_CASES.find(c => c.id === activeCaseId);
  const fitScaleVal = (canvasRef.current && img) 
    ? Math.min(canvasRef.current.width / img.naturalWidth, canvasRef.current.height / img.naturalHeight) * 0.85 
    : 1;

  const currentZoomScale = fitScaleVal * zoom;

  return (
    <div className="flex flex-col h-full gap-0 overflow-hidden bg-background">
      
      {/* 1. Presets Toolbar (Ratio Selector above the images) */}
      <div className="shrink-0 border-b border-border bg-card px-6 py-4 flex items-center justify-between flex-wrap gap-4 shadow-sm z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary/10 rounded-xl">
            <i className="bx bx-crop text-primary text-xl" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Interactive Crop Workspace</h2>
            <p className="text-[10px] text-muted-foreground">Adjust dimensions & center photo alignment</p>
          </div>
        </div>
        <div className="flex bg-muted/80 p-1 rounded-2xl gap-1.5 flex-wrap border border-border/40">
          {CROP_CASES.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCropCase(c.id)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                activeCaseId === c.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Workspace Layout (Side-by-Side Split) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-y-auto lg:overflow-hidden">
        
        {/* Left: Original Photo Interactive Canvas */}
        <div className="h-auto lg:h-full bg-muted/5 flex flex-col min-w-0 border-r border-border overflow-y-auto">
          <div className="shrink-0 px-6 py-3 border-b border-border/40 bg-card/40 flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Original Image Workspace
            </span>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium">
              Drag to pan • Scroll to zoom
            </span>
          </div>

          <div ref={containerRef} className="flex-1 min-h-[320px] relative overflow-hidden flex items-center justify-center p-6">
            <canvas
              ref={canvasRef}
              className="max-h-full max-w-full object-contain shadow-xl border border-border/60 bg-transparent select-none rounded-xl"
              style={{ cursor: dragRef.current ? "grabbing" : "grab" }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            />
          </div>

          {/* Left Canvas Controls (Zoom & Rotation) */}
          <div className="shrink-0 border-t border-border/40 bg-card p-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Zoom slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <i className="bx bx-zoom-in text-sm text-primary" /> Image Zoom Scale
                  </span>
                  <span className="font-mono text-primary bg-primary/5 px-2 py-0.5 rounded text-[11px]">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} 
                    className="p-1.5 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground transition"
                  >
                    <i className="bx bx-minus text-sm" />
                  </button>
                  <input
                    type="range"
                    min={0.5}
                    max={4.0}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 accent-primary bg-muted h-1 rounded cursor-pointer"
                  />
                  <button 
                    onClick={() => setZoom(z => Math.min(4.0, z + 0.1))} 
                    className="p-1.5 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground transition"
                  >
                    <i className="bx bx-plus text-sm" />
                  </button>
                </div>
              </div>

              {/* Rotation Alignment */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <i className="bx bx-rotate-left text-sm text-primary" /> Rotation Alignment
                  </span>
                  <span className="font-mono text-primary bg-primary/5 px-2 py-0.5 rounded text-[11px]">
                    {rotation > 0 ? "+" : ""}{rotation.toFixed(1)}°
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setRotation(r => Math.max(-45, r - 1))} 
                    className="p-1.5 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground transition"
                  >
                    <i className="bx bx-rotate-left text-sm" />
                  </button>
                  <input
                    type="range"
                    min={-45}
                    max={45}
                    step={0.5}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="flex-1 accent-primary bg-muted h-1 rounded cursor-pointer"
                  />
                  <button 
                    onClick={() => setRotation(r => Math.min(45, r + 1))} 
                    className="p-1.5 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground transition"
                  >
                    <i className="bx bx-rotate-right text-sm" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Cropped Photo Viewport */}
        <div className="h-auto lg:h-full flex flex-col min-w-0 bg-card overflow-y-auto">
          <div className="shrink-0 px-6 py-3 border-b border-border/40 bg-card flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Cropped Output
            </span>
            {activeCase && (
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                {activeCase.desc}
              </span>
            )}
          </div>

          {/* Large Live Preview canvas */}
          <div className="flex-1 min-h-[320px] relative overflow-hidden flex items-center justify-center p-8 bg-muted/10">
            <div className="relative max-h-full max-w-full flex items-center justify-center p-4">
              <canvas
                ref={previewCanvasRef}
                className="max-h-[380px] max-w-full object-contain rounded-2xl border-4 border-white shadow-2xl bg-white transition-all duration-300"
                style={{ aspectRatio: box.w > 0 ? box.w / box.h : 1 }}
              />
            </div>
          </div>

          {/* Right Controls (Manual Coordinates & Action Buttons) */}
          <div className="shrink-0 border-t border-border/40 bg-card p-6 flex flex-col gap-5">
            {/* Dimensions stats info */}
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Digital Output Size</span>
                <span className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  Calculated based on crop bounds
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-3 py-1 rounded-xl shadow-sm">
                {Math.round(box.w / currentZoomScale)} × {Math.round(box.h / currentZoomScale)} px
              </span>
            </div>

            {/* Manual Coordinates Grid */}
            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Manual Frame Coordinates (px)</span>
              <div className="grid grid-cols-4 gap-2.5 font-mono text-xs">
                <div>
                  <label className="text-[9px] text-muted-foreground mb-1 block">X Offset</label>
                  <input
                    type="number"
                    value={Math.round(box.x)}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value));
                      setBox(prev => ({ ...prev, x: val }));
                    }}
                    className="w-full rounded-xl border border-border/60 bg-muted/20 px-2.5 py-2 text-xs outline-none focus:border-primary focus:bg-card transition"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-muted-foreground mb-1 block">Y Offset</label>
                  <input
                    type="number"
                    value={Math.round(box.y)}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value));
                      setBox(prev => ({ ...prev, y: val }));
                    }}
                    className="w-full rounded-xl border border-border/60 bg-muted/20 px-2.5 py-2 text-xs outline-none focus:border-primary focus:bg-card transition"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-muted-foreground mb-1 block">Width</label>
                  <input
                    type="number"
                    value={Math.round(box.w)}
                    onChange={(e) => {
                      const val = Math.max(40, Number(e.target.value));
                      const newH = lockAspect && activeCase?.ratio ? val / activeCase.ratio : box.h;
                      setBox(prev => ({ ...prev, w: val, h: Math.round(newH) }));
                    }}
                    className="w-full rounded-xl border border-border/60 bg-muted/20 px-2.5 py-2 text-xs outline-none focus:border-primary focus:bg-card transition"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-muted-foreground mb-1 block">Height</label>
                  <input
                    type="number"
                    value={Math.round(box.h)}
                    disabled={lockAspect && activeCaseId !== "free"}
                    onChange={(e) => {
                      const val = Math.max(40, Number(e.target.value));
                      setBox(prev => ({ ...prev, h: val }));
                    }}
                    className="w-full rounded-xl border border-border/60 bg-muted/20 px-2.5 py-2 text-xs outline-none focus:border-primary focus:bg-card transition disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <button
                onClick={resetCrop}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-accent transition duration-200"
              >
                <i className="bx bx-reset text-sm" />
                Reset
              </button>
              <button
                onClick={onSkip}
                className="py-3 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-accent transition duration-200"
              >
                Skip Crop
              </button>
              <button
                onClick={applyCrop}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition duration-200"
              >
                <i className="bx bx-check-circle text-sm" />
                Apply Crop
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
