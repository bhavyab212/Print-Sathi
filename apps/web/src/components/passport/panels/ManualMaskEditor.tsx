"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ManualMaskEditorProps {
  originalFile: File | null;
  processedSrc: string;
  onApply: (base64png: string) => void;
  onCancel: () => void;
}

type Tool = "brush-erase" | "brush-restore" | "lasso" | "dot-erase" | "dot-restore";
type LassoState = "idle" | "drawing" | "closed";

interface HistoryEntry {
  imageData: ImageData;
}

export function ManualMaskEditor({ originalFile, processedSrc, onApply, onCancel }: ManualMaskEditorProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const overlayRef  = useRef<HTMLCanvasElement>(null); // lasso + cursor overlay
  const origCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef  = useRef<HTMLDivElement>(null);

  const [tool, setTool]         = useState<Tool>("brush-erase");
  const [brushSize, setBrushSize] = useState(24);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lassoState, setLassoState] = useState<LassoState>("idle");
  const [, setLassoPoints] = useState<{ x: number; y: number }[]>([]);
  const [showLassoBar, setShowLassoBar] = useState(false);
  const [lassoCentroid, setLassoCentroid] = useState({ x: 0, y: 0 });

  // Zoom & Pan
  const [zoom, setZoom]   = useState(1.0);
  const [panX, setPanX]   = useState(0);
  const [panY, setPanY]   = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  let fitScale = 1.0;
  let displayW = 0;
  let displayH = 0;
  if (imageSize && dimensions.width > 0 && dimensions.height > 0) {
    fitScale = Math.min(dimensions.width / imageSize.width, dimensions.height / imageSize.height) * 0.92;
    displayW = imageSize.width * fitScale;
    displayH = imageSize.height * fitScale;
  }

  const isPanningRef = useRef(false);
  const panStartRef  = useRef({ x: 0, y: 0, px: 0, py: 0 });

  // Undo / Redo
  const historyRef   = useRef<HistoryEntry[]>([]);
  const historyIdxRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo]   = useState(false);

  // Blend slider (shows original opacity underneath)
  const [blendOpacity, setBlendOpacity] = useState(0);

  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const lassoPointsRef = useRef<{ x: number; y: number }[]>([]);
  const cursorPosRef   = useRef<{ x: number; y: number } | null>(null);

  // ── Track container size ───────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setDimensions({ width: rect.width, height: rect.height });

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ── Image loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!processedSrc) return;

    const imgProcessed = new Image();
    let loadedCount = 0;
    const total = originalFile ? 2 : 1;

    const onLoaded = () => {
      loadedCount++;
      if (loadedCount !== total) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width  = imgProcessed.naturalWidth;
      canvas.height = imgProcessed.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgProcessed, 0, 0);

      // Sync overlay size
      const overlay = overlayRef.current;
      if (overlay) {
        overlay.width  = canvas.width;
        overlay.height = canvas.height;
      }

      // Snapshot initial state into history
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current = [{ imageData }];
      historyIdxRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
      setImageSize({ width: imgProcessed.naturalWidth, height: imgProcessed.naturalHeight });
    };

    imgProcessed.onload = onLoaded;
    imgProcessed.src = processedSrc;

    if (originalFile) {
      const imgOriginal = new Image();
      imgOriginal.onload = () => {
        const origCanvas = document.createElement("canvas");
        origCanvas.width  = imgOriginal.naturalWidth;
        origCanvas.height = imgOriginal.naturalHeight;
        const oCtx = origCanvas.getContext("2d");
        if (oCtx) oCtx.drawImage(imgOriginal, 0, 0);
        origCanvasRef.current = origCanvas;
        onLoaded();
      };
      imgOriginal.src = URL.createObjectURL(originalFile);
    }
  }, [originalFile, processedSrc]);

  // ── History helpers ───────────────────────────────────────────────────────
  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const newHistory = historyRef.current.slice(0, historyIdxRef.current + 1);
    newHistory.push({ imageData });
    // Cap at 30 steps
    if (newHistory.length > 30) newHistory.shift();
    historyRef.current = newHistory;
    historyIdxRef.current = newHistory.length - 1;
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current -= 1;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.putImageData(historyRef.current[historyIdxRef.current].imageData, 0, 0);
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current += 1;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.putImageData(historyRef.current[historyIdxRef.current].imageData, 0, 0);
    setCanUndo(true);
    setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
  }, []);

  const resetAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length === 0) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.putImageData(historyRef.current[0].imageData, 0, 0);
    historyRef.current = [historyRef.current[0]];
    historyIdxRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  // ── Coordinate helpers ───────────────────────────────────────────────────
  // Convert screen coords → canvas logical coords (accounting for zoom & pan)
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const container = containerRef.current;
    if (!imageSize || !container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    // Center of container in screen coords
    const cx = rect.width  / 2;
    const cy = rect.height / 2;
    // Canvas display size (fit inside container)
    const fitScale = Math.min(rect.width / imageSize.width, rect.height / imageSize.height) * 0.92;
    const totalScale = fitScale * zoom;
    // Position of canvas origin in container coords
    const originX = cx - (imageSize.width  * totalScale) / 2 + panX;
    const originY = cy - (imageSize.height * totalScale) / 2 + panY;
    return {
      x: (screenX - rect.left - originX) / totalScale,
      y: (screenY - rect.top  - originY) / totalScale,
    };
  }, [zoom, panX, panY, imageSize]);

  const getEventPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ("touches" in e && e.touches.length > 0) {
      return { screenX: e.touches[0].clientX, screenY: e.touches[0].clientY };
    }
    return { screenX: (e as MouseEvent).clientX, screenY: (e as MouseEvent).clientY };
  };

  // ── Wheel zoom ────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(z => Math.max(0.5, Math.min(6.0, z - e.deltaY * 0.001)));
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      if (e.key === "e") setTool("brush-erase");
      if (e.key === "r") setTool("brush-restore");
      if (e.key === "l") setTool("lasso");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // ── Draw overlay (lasso path + cursor) ──────────────────────────────────
  const drawOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    const canvas  = canvasRef.current;
    if (!overlay || !canvas || !fitScale) return;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Lasso path
    const pts = lassoPointsRef.current;
    if (pts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2 / fitScale;
      ctx.setLineDash([6 / fitScale, 4 / fitScale]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Close line to start if near
      if (pts.length > 3) {
        const dx = pts[pts.length - 1].x - pts[0].x;
        const dy = pts[pts.length - 1].y - pts[0].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const targetDist = 20 / fitScale;
        if (dist < targetDist) {
          ctx.beginPath();
          ctx.arc(pts[0].x, pts[0].y, 8 / fitScale, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(59,130,246,0.4)";
          ctx.fill();
        }
      }
    }

    // Brush cursor
    const pos = cursorPosRef.current;
    if (pos && (tool === "brush-erase" || tool === "brush-restore" || tool === "dot-erase" || tool === "dot-restore")) {
      ctx.beginPath();
      const actualRadius = (brushSize / fitScale) / 2;
      ctx.arc(pos.x, pos.y, actualRadius, 0, Math.PI * 2);
      ctx.strokeStyle = tool.includes("erase") ? "rgba(239,68,68,0.85)" : "rgba(16,185,129,0.85)";
      ctx.lineWidth = 1.5 / fitScale;
      ctx.stroke();
      ctx.fillStyle = tool.includes("erase") ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)";
      ctx.fill();
    }
  }, [tool, brushSize, fitScale]);

  // ── Paint brush stroke ────────────────────────────────────────────────────
  const paintStroke = useCallback((x: number, y: number, continuous: boolean) => {
    const canvas  = canvasRef.current;
    const origCanvas = origCanvasRef.current;
    if (!canvas || !fitScale) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isErase = tool === "brush-erase" || tool === "dot-erase";
    ctx.save();
    ctx.lineCap  = "round";
    ctx.lineJoin = "round";
    
    const actualBrushSize = brushSize / fitScale;
    ctx.lineWidth = actualBrushSize;

    if (isErase) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.beginPath();
      if (continuous && lastPosRef.current) {
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      } else {
        ctx.moveTo(x, y);
      }
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (origCanvas) {
      // Restore: clip to brush path and redraw original pixels
      ctx.globalCompositeOperation = "source-over";
      ctx.beginPath();
      if (continuous && lastPosRef.current) {
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      } else {
        ctx.moveTo(x, y);
      }
      ctx.lineTo(x, y);
      ctx.clip();
      ctx.drawImage(origCanvas, 0, 0, canvas.width, canvas.height);
    }
    ctx.restore();
    lastPosRef.current = { x, y };
  }, [tool, brushSize, fitScale]);

  // ── Lasso fill ────────────────────────────────────────────────────────────
  const applyLasso = useCallback((action: "erase" | "restore") => {
    const pts = lassoPointsRef.current;
    const canvas = canvasRef.current;
    const origCanvas = origCanvasRef.current;
    if (!canvas || pts.length < 3) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();

    if (action === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fill();
    } else if (origCanvas) {
      ctx.globalCompositeOperation = "source-over";
      ctx.clip();
      ctx.drawImage(origCanvas, 0, 0, canvas.width, canvas.height);
    }
    ctx.restore();

    pushHistory();
    setLassoPoints([]);
    lassoPointsRef.current = [];
    setLassoState("idle");
    setShowLassoBar(false);
    // Clear overlay
    const overlay = overlayRef.current;
    if (overlay) {
      const octx = overlay.getContext("2d");
      if (octx) octx.clearRect(0, 0, overlay.width, overlay.height);
    }
  }, [pushHistory]);

  // ── Pointer down ──────────────────────────────────────────────────────────
  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { screenX, screenY } = getEventPos(e);

    // Right click or two-finger → pan
    if (("button" in e && e.button === 2) || ("touches" in e && e.touches.length === 2)) {
      isPanningRef.current = true;
      panStartRef.current = { x: screenX, y: screenY, px: panX, py: panY };
      return;
    }

    const { x, y } = screenToCanvas(screenX, screenY);

    if (tool === "lasso") {
      setLassoState("drawing");
      setShowLassoBar(false);
      lassoPointsRef.current = [{ x, y }];
      setLassoPoints([{ x, y }]);
      drawOverlay();
      return;
    }

    // Brush / dot tools
    setIsDrawing(true);
    lastPosRef.current = null;
    paintStroke(x, y, false);
  };

  // ── Pointer move ──────────────────────────────────────────────────────────
  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { screenX, screenY } = getEventPos(e);
    const { x, y } = screenToCanvas(screenX, screenY);
    cursorPosRef.current = { x, y };

    // Pan
    if (isPanningRef.current) {
      setPanX(panStartRef.current.px + (screenX - panStartRef.current.x));
      setPanY(panStartRef.current.py + (screenY - panStartRef.current.y));
      return;
    }

    // Lasso drawing
    if (tool === "lasso" && lassoState === "drawing") {
      const pts = lassoPointsRef.current;
      const lastPt = pts[pts.length - 1];
      if (!lastPt || Math.abs(x - lastPt.x) > 1 || Math.abs(y - lastPt.y) > 1) {
        lassoPointsRef.current = [...pts, { x, y }];
        setLassoPoints([...lassoPointsRef.current]);
      }
      drawOverlay();
      return;
    }

    drawOverlay(); // update cursor ring

    if (!isDrawing) return;
    paintStroke(x, y, true);
  };

  // ── Pointer up ────────────────────────────────────────────────────────────
  const onPointerUp = () => {
    if (isPanningRef.current) { isPanningRef.current = false; return; }
    
    if (tool === "lasso" && lassoState === "drawing") {
      const pts = lassoPointsRef.current;
      if (pts.length > 3) {
        // Auto-close: complete path by linking back to start point
        lassoPointsRef.current = [...pts, pts[0]];
        setLassoPoints([...lassoPointsRef.current]);
        setLassoState("closed");
        setShowLassoBar(true);
        // Calculate centroid for action bar position
        const cx = lassoPointsRef.current.reduce((s, p) => s + p.x, 0) / lassoPointsRef.current.length;
        const cy = lassoPointsRef.current.reduce((s, p) => s + p.y, 0) / lassoPointsRef.current.length;
        setLassoCentroid({ x: cx, y: cy });
      } else {
        setLassoState("idle");
        setShowLassoBar(false);
        lassoPointsRef.current = [];
        setLassoPoints([]);
      }
      drawOverlay();
      return;
    }

    if (isDrawing) {
      setIsDrawing(false);
      lastPosRef.current = null;
      pushHistory();
    }
  };

  const onContextMenu = (e: React.MouseEvent) => e.preventDefault();

  // ── Apply / Export ────────────────────────────────────────────────────────
  const handleApply = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onApply(dataUrl);
  };



  // ── CSS transform for zoom/pan display ──────────────────────────────────
  const canvasStyle: React.CSSProperties = {
    position: "relative",
    width: displayW ? `${displayW}px` : "auto",
    height: displayH ? `${displayH}px` : "auto",
    transformOrigin: "center center",
    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
    transition: isDrawing ? "none" : "transform 0.05s",
    cursor: tool === "lasso" ? "crosshair"
          : tool.includes("erase") ? "cell"
          : "copy",
  };

  const toolBtns: { id: Tool; icon: string; label: string; color: string }[] = [
    { id: "brush-erase",   icon: "bx-eraser",      label: "Erase Brush",   color: "rose" },
    { id: "brush-restore", icon: "bx-brush-alt",   label: "Restore Brush", color: "emerald" },
    { id: "lasso",         icon: "bx-lasso",       label: "Lasso Select",  color: "blue" },
    { id: "dot-erase",     icon: "bx-x-circle",    label: "Dot Erase",     color: "orange" },
    { id: "dot-restore",   icon: "bx-plus-circle", label: "Dot Restore",   color: "teal" },
  ];

  const colorMap: Record<string, string> = {
    rose:    "bg-rose-500 text-white ring-rose-400",
    emerald: "bg-emerald-500 text-white ring-emerald-400",
    blue:    "bg-blue-500 text-white ring-blue-400",
    orange:  "bg-orange-500 text-white ring-orange-400",
    teal:    "bg-teal-500 text-white ring-teal-400",
  };

  return (
    <div className="flex flex-col h-full bg-background absolute inset-0 z-30 overflow-hidden">
      
      {/* ─── Toolbar ───────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border bg-card px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Icon + Title */}
          <div className="flex items-center gap-2 mr-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <i className="bx bx-brush text-primary text-base" />
            </div>
            <span className="text-sm font-bold text-foreground hidden sm:block">Precision Editor</span>
          </div>
          
          <div className="h-5 w-px bg-border mx-1" />

          {/* Tool Buttons */}
          {toolBtns.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ring-offset-background ${
                tool === t.id
                  ? `${colorMap[t.color]} ring-2 ring-offset-1`
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
              }`}
            >
              <i className={`bx ${t.icon} text-sm`} />
              <span className="hidden md:inline">{t.label}</span>
            </button>
          ))}

          <div className="h-5 w-px bg-border mx-1" />

          {/* Brush Size (only for brush/dot tools) */}
          {tool !== "lasso" && (
            <div className="flex items-center gap-2">
              <i className="bx bx-circle text-muted-foreground text-[10px]" />
              <input
                type="range" min={4} max={120} value={brushSize}
                onChange={e => setBrushSize(Number(e.target.value))}
                className="w-20 accent-primary h-1 rounded-lg bg-muted cursor-pointer"
              />
              <i className="bx bx-circle text-muted-foreground text-sm" />
              <span className="text-[10px] text-muted-foreground font-mono w-6">{brushSize}</span>
            </div>
          )}

          <div className="h-5 w-px bg-border mx-1" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground transition text-xs"
              title="Zoom out"
            >
              <i className="bx bx-minus" />
            </button>
            <input
              type="range"
              min="0.5"
              max="6.0"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-16 sm:w-24 accent-primary h-1 rounded-lg bg-muted cursor-pointer"
              title="Zoom level"
            />
            <button
              onClick={() => setZoom(z => Math.min(6.0, z + 0.25))}
              className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground transition text-xs"
              title="Zoom in"
            >
              <i className="bx bx-plus" />
            </button>
            <span className="text-[10px] font-mono text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => { setZoom(1.0); setPanX(0); setPanY(0); }}
              className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground transition text-[10px] font-semibold"
            >
              Fit
            </button>
          </div>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Undo / Redo / Reset */}
          <div className="flex items-center gap-1">
            <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground disabled:opacity-30 transition">
              <i className="bx bx-undo text-sm" />
            </button>
            <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)" className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground disabled:opacity-30 transition">
              <i className="bx bx-redo text-sm" />
            </button>
            <button onClick={resetAll} title="Reset to original result" className="p-1.5 rounded-lg border border-border hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition">
              <i className="bx bx-reset text-sm" />
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-accent border border-border transition">
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition"
          >
            <i className="bx bx-check text-sm mr-1" />
            Apply Changes
          </button>
        </div>
      </div>

      {/* ─── Blend Slider hint bar ──────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border/40 bg-muted/20 px-6 py-2 flex items-center gap-4">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Original Preview</span>
        <input
          type="range" min={0} max={80} value={blendOpacity}
          onChange={e => setBlendOpacity(Number(e.target.value))}
          className="flex-1 max-w-[200px] accent-primary h-1 rounded-lg bg-muted cursor-pointer"
        />
        <span className="text-[10px] font-mono text-muted-foreground">{blendOpacity}%</span>
        <div className="h-5 w-px bg-border mx-1" />
        <span className="text-[10px] text-muted-foreground">
          {tool === "lasso" ? "Draw a free-form area to erase or restore it · Click near start to close shape"
          : tool === "brush-erase" ? "Paint to erase background pixels · Right-click drag to pan"
          : tool === "brush-restore" ? "Paint to restore removed pixels · Right-click drag to pan"
          : "Click to place a dot · Right-click drag to pan"}
        </span>
      </div>

      {/* ─── Canvas Workspace ─────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 relative overflow-hidden flex items-center justify-center select-none"
        style={{
          backgroundImage: "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",
          backgroundSize: "14px 14px",
          backgroundPosition: "0 0,0 7px,7px -7px,-7px 0",
          backgroundColor: "#f4f4f4",
        }}
        onContextMenu={e => e.preventDefault()}
      >
        {/* Stacked canvases: processed image + overlay */}
        <div className="relative" style={canvasStyle}>
          {/* Main editable canvas */}
          <canvas
            ref={canvasRef}
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseUp={onPointerUp}
            onMouseLeave={onPointerUp}
            onTouchStart={onPointerDown}
            onTouchMove={onPointerMove}
            onTouchEnd={onPointerUp}
            onContextMenu={onContextMenu}
            className="block w-full h-full object-contain shadow-2xl border border-border/60 touch-none"
          />
          {/* Original image blend overlay */}
          {origCanvasRef.current && blendOpacity > 0 && (
            <canvas
              ref={(el) => {
                if (!el || !origCanvasRef.current) return;
                el.width  = origCanvasRef.current.width;
                el.height = origCanvasRef.current.height;
                const ctx = el.getContext("2d");
                if (ctx) {
                  ctx.clearRect(0, 0, el.width, el.height);
                  ctx.drawImage(origCanvasRef.current, 0, 0);
                }
              }}
              className="absolute inset-0 block w-full h-full object-contain pointer-events-none"
              style={{ opacity: blendOpacity / 100 }}
            />
          )}
          {/* Lasso + cursor overlay */}
          <canvas
            ref={overlayRef}
            className="absolute inset-0 block w-full h-full object-contain pointer-events-none"
          />
        </div>

        {/* ── Lasso action bar (floating) ──────────────────────────────── */}
        {showLassoBar && lassoState === "closed" && (() => {
          // Convert canvas centroid to screen position
          const container = containerRef.current;
          if (!imageSize || !container) return null;
          const rect = container.getBoundingClientRect();
          const ts = fitScale * zoom;
          const ox = rect.width  / 2 - (imageSize.width  * ts) / 2 + panX;
          const oy = rect.height / 2 - (imageSize.height * ts) / 2 + panY;
          const sx = lassoCentroid.x * ts + ox;
          const sy = lassoCentroid.y * ts + oy;

          return (
            <div
              className="absolute z-40 bg-card border border-border shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3 pointer-events-auto animate-in zoom-in-75 duration-150"
              style={{ left: sx, top: sy, transform: "translate(-50%, -120%)" }}
            >
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Selection:</span>
              <button
                onClick={() => applyLasso("erase")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold shadow-md hover:bg-rose-600 transition"
              >
                <i className="bx bx-eraser text-sm" /> Erase Area
              </button>
              <button
                onClick={() => applyLasso("restore")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-md hover:bg-emerald-600 transition"
              >
                <i className="bx bx-brush-alt text-sm" /> Restore Area
              </button>
              <button
                onClick={() => {
                  setShowLassoBar(false);
                  setLassoState("idle");
                  lassoPointsRef.current = [];
                  setLassoPoints([]);
                  const overlay = overlayRef.current;
                  if (overlay) {
                    const ctx = overlay.getContext("2d");
                    if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);
                  }
                }}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition"
              >
                <i className="bx bx-x text-sm" />
              </button>
            </div>
          );
        })()}
      </div>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-card border-t border-border px-4 py-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-3">
          <span><kbd className="bg-muted border border-border px-1.5 py-0.5 rounded text-[9px]">E</kbd> Erase brush</span>
          <span><kbd className="bg-muted border border-border px-1.5 py-0.5 rounded text-[9px]">R</kbd> Restore brush</span>
          <span><kbd className="bg-muted border border-border px-1.5 py-0.5 rounded text-[9px]">L</kbd> Lasso</span>
          <span><kbd className="bg-muted border border-border px-1.5 py-0.5 rounded text-[9px]">Ctrl+Z</kbd> Undo</span>
          <span><kbd className="bg-muted border border-border px-1.5 py-0.5 rounded text-[9px]">Scroll</kbd> Zoom</span>
          <span><kbd className="bg-muted border border-border px-1.5 py-0.5 rounded text-[9px]">Right-drag</kbd> Pan</span>
        </span>
        <span className="opacity-60">Precision Mask Editor — Print Sathi</span>
      </div>
    </div>
  );
}
