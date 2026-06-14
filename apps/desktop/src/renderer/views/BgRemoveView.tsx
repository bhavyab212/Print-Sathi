import { useState, useRef, useEffect, useCallback } from "react";
import { canvasToBMP, canvasToTIFF, canvasToPDF, padImageBuffer } from "../lib/imageEncoders";

const PROCESSING_URL =
  (import.meta as any).env?.VITE_PROCESSING_URL ?? "http://localhost:8000";

type Step = "upload" | "processing" | "review" | "done";
type AIModel = "u2net" | "u2net_human_seg";
type Tab = "bg" | "effects" | "adjust" | "export";
type Tool = "erase" | "restore";

// Outline drawing helper
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

const STAGES = [
  { label: "Uploading image",            icon: "bx-cloud-upload",  pct: 10 },
  { label: "Reading file format",        icon: "bx-file",          pct: 25 },
  { label: "Initialising AI model",      icon: "bx-brain",         pct: 45 },
  { label: "Removing background",        icon: "bx-eraser",        pct: 75 },
  { label: "Optimising image quality",   icon: "bx-image-alt",     pct: 92 },
  { label: "Finalising",                 icon: "bx-check-shield",  pct: 99 },
];

const PRESET_BGS = [
  { name: "Studio Fluid", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80" },
  { name: "Modern Office", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&auto=format&fit=crop&q=80" },
  { name: "Corporate Blue", url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=500&auto=format&fit=crop&q=80" },
  { name: "Soft Bokeh", url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=500&auto=format&fit=crop&q=80" },
  { name: "White Brick", url: "https://images.unsplash.com/photo-1533628635777-112b2239b1c7?w=500&auto=format&fit=crop&q=80" },
  { name: "Light Wood", url: "https://images.unsplash.com/photo-1507314120004-41349945b7e6?w=500&auto=format&fit=crop&q=80" },
  { name: "Nature Blur", url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=500&auto=format&fit=crop&q=80" },
];

export default function BgRemoveView() {
  const [step, setStep] = useState<Step>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [model, setModel] = useState<AIModel>("u2net");
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  // Customization States
  const [bgType, setBgType] = useState<"color" | "image">("color");
  const [bgColor, setBgColor] = useState<string>("transparent");
  const [bgImageSrc, setBgImageSrc] = useState<string | null>(null);

  // Borders & Shadows
  const [outlineWidth, setOutlineWidth] = useState(0);
  const [outlineColor, setOutlineColor] = useState("#FFFFFF");
  const [shadowBlur, setShadowBlur] = useState(0);
  const [shadowColor] = useState("rgba(0,0,0,0.55)");
  const [shadowOffsetX, setShadowOffsetX] = useState(6);
  const [shadowOffsetY, setShadowOffsetY] = useState(6);

  // Adjustments & Transforms
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [exposure, setExposure] = useState(0);
  const [warmth, setWarmth] = useState(0);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);

  // Export Settings
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg" | "webp" | "pdf" | "bmp" | "tiff">("png");
  const [sizePreset, setSizePreset] = useState<"original" | "passport" | "stamp" | "photo4x6" | "a4" | "custom">("original");
  const [customWidth, setCustomWidth] = useState<number>(0);
  const [customHeight, setCustomHeight] = useState<number>(0);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [subjectScale, setSubjectScale] = useState<number>(100);
  const [subjectOffsetX, setSubjectOffsetX] = useState<number>(0);
  const [subjectOffsetY, setSubjectOffsetY] = useState<number>(0);
  const [jpegQuality, setJpegQuality] = useState<number>(90);
  const [limitFileSize, setLimitFileSize] = useState<boolean>(false);
  const [targetSizeKb, setTargetSizeKb] = useState<number>(50);
  const [estimatedSizeKb, setEstimatedSizeKb] = useState<number | null>(null);
  const [originalAspectRatio, setOriginalAspectRatio] = useState<number>(1);

  // Processing Animation
  const [stageIdx, setStageIdx] = useState(0);
  const [pct, setPct] = useState(0);
  const [animPct, setAnimPct] = useState(0);
  const stageRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compare Slider Position
  const [comparePos, setComparePos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [action, setAction] = useState<"idle" | "retrying" | "upgrading">("idle");
  const [showRetryPopover, setShowRetryPopover] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("bg");

  // Brush Manual Editor States
  const [showManualEditor, setShowManualEditor] = useState(false);
  const [manualTool, setManualTool] = useState<Tool>("erase");
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [editorProcessedSrc, setEditorProcessedSrc] = useState<string | null>(null);

  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const editorCanvasRef = useRef<HTMLCanvasElement>(null);
  const editorOrigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const originalUrl = selectedFile ? URL.createObjectURL(selectedFile) : null;

  // Animated percentage counter
  useEffect(() => {
    if (step !== "processing") return;
    animRef.current = setInterval(() => {
      setAnimPct((prev) => (prev < pct ? Math.min(prev + 1, pct) : prev));
    }, 18);
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [pct, step]);

  // Initialize aspect ratio and dimensions when image is processed
  useEffect(() => {
    if (!processedSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight;
      setOriginalAspectRatio(aspect);
      setCustomWidth(img.naturalWidth);
      setCustomHeight(img.naturalHeight);
    };
    img.src = processedSrc;
  }, [processedSrc]);

  const getCompressedBlob = async (
    canvas: HTMLCanvasElement,
    format: "png" | "jpeg" | "webp" | "pdf" | "bmp" | "tiff",
    targetKb: number,
    quality: number
  ): Promise<Blob> => {
    let blob: Blob;

    if (format === "png") {
      blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), "image/png"));
    } else if (format === "jpeg") {
      blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), "image/jpeg", quality));
    } else if (format === "webp") {
      blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), "image/webp", quality));
    } else if (format === "bmp") {
      blob = canvasToBMP(canvas);
    } else if (format === "tiff") {
      blob = canvasToTIFF(canvas);
    } else if (format === "pdf") {
      blob = canvasToPDF(canvas, quality);
    } else {
      blob = new Blob();
    }

    let currentSizeKb = blob.size / 1024;

    if (limitFileSize && currentSizeKb > targetKb) {
      if (format === "jpeg" || format === "webp" || format === "pdf") {
        let low = 0.1;
        let high = 0.95;
        for (let i = 0; i < 6; i++) {
          const midQuality = (low + high) / 2;
          let tempBlob: Blob;
          if (format === "pdf") {
            tempBlob = canvasToPDF(canvas, midQuality);
          } else {
            const mime = format === "jpeg" ? "image/jpeg" : "image/webp";
            tempBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), mime, midQuality));
          }
          const sizeKb = tempBlob.size / 1024;
          if (sizeKb <= targetKb) {
            blob = tempBlob;
            currentSizeKb = sizeKb;
            low = midQuality;
          } else {
            high = midQuality;
          }
        }
      }

      if (currentSizeKb > targetKb) {
        let scale = 0.9;
        const originalWidth = canvas.width;
        const originalHeight = canvas.height;
        while (scale > 0.15 && currentSizeKb > targetKb) {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = Math.round(originalWidth * scale);
          tempCanvas.height = Math.round(originalHeight * scale);
          const tctx = tempCanvas.getContext("2d");
          if (tctx) {
            tctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
            let tempBlob: Blob;
            if (format === "png") {
              tempBlob = await new Promise<Blob>((resolve) => tempCanvas.toBlob((b) => resolve(b || new Blob()), "image/png"));
            } else if (format === "bmp") {
              tempBlob = canvasToBMP(tempCanvas);
            } else if (format === "tiff") {
              tempBlob = canvasToTIFF(tempCanvas);
            } else if (format === "pdf") {
              tempBlob = canvasToPDF(tempCanvas, 0.4);
            } else {
              const mime = format === "jpeg" ? "image/jpeg" : "image/webp";
              tempBlob = await new Promise<Blob>((resolve) => tempCanvas.toBlob((b) => resolve(b || new Blob()), mime, 0.4));
            }
            currentSizeKb = tempBlob.size / 1024;
            if (currentSizeKb <= targetKb || scale <= 0.2) {
              blob = tempBlob;
            }
          }
          scale -= 0.1;
        }
      }
    }

    if (limitFileSize && blob.size < targetKb * 1024) {
      const buffer = await blob.arrayBuffer();
      const paddedBuffer = padImageBuffer(buffer, Math.round(targetKb * 1024));
      const mime = {
        png: "image/png",
        jpeg: "image/jpeg",
        webp: "image/webp",
        pdf: "application/pdf",
        bmp: "image/bmp",
        tiff: "image/tiff"
      }[format];
      blob = new Blob([paddedBuffer], { type: mime });
    }

    return blob;
  };

  // Debounced estimated file size calculator
  useEffect(() => {
    if (step !== "review" && step !== "done") return;
    if (!processedSrc) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const timer = setTimeout(async () => {
      try {
        const quality = jpegQuality / 100;
        const blob = await getCompressedBlob(canvas, exportFormat, targetSizeKb, quality);
        setEstimatedSizeKb(Math.round(blob.size / 1024));
      } catch (err) {
        console.error("Size estimation error", err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    processedSrc,
    exportFormat,
    jpegQuality,
    limitFileSize,
    targetSizeKb,
    bgType,
    bgColor,
    bgImageSrc,
    outlineWidth,
    outlineColor,
    shadowBlur,
    shadowColor,
    shadowOffsetX,
    shadowOffsetY,
    brightness,
    contrast,
    saturation,
    exposure,
    warmth,
    rotation,
    flipHorizontal,
    flipVertical,
    sizePreset,
    customWidth,
    customHeight,
    subjectScale,
    subjectOffsetX,
    subjectOffsetY,
    step
  ]);

  function startAnimation() {
    setStageIdx(0);
    setPct(10);
    setAnimPct(0);
    let idx = 0;
    stageRef.current = setInterval(() => {
      idx++;
      const stages = [10, 25, 45, 75, 92, 99];
      if (idx < stages.length) {
        setStageIdx(idx);
        setPct(stages[idx]);
      } else {
        clearInterval(stageRef.current!);
      }
    }, 900);
  }

  function stopAnimation() {
    if (stageRef.current) clearInterval(stageRef.current);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // ── Core processing call ─────────────────────────────────────────────
  const processFile = useCallback(
    async (
      file: File,
      mdl: AIModel,
      feedback?: { alpha_matting?: boolean; fg?: number; bg?: number; remove_shadow?: boolean }
    ) => {
      setSelectedFile(file);
      setModel(mdl);
      setProcessingError(null);
      setStep("processing");
      startAnimation();

      try {
        const form = new FormData();
        form.append("file", file);

        let url = `${PROCESSING_URL}/passport/process?model=${mdl}&crop=false`;
        if (feedback?.alpha_matting) {
          url += `&alpha_matting=true&alpha_matting_fg=${feedback.fg ?? 240}&alpha_matting_bg=${feedback.bg ?? 10}`;
        }
        if (feedback?.remove_shadow) {
          url += `&remove_shadow=true`;
        }

        const res = await fetch(url, {
          method: "POST",
          body: form,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Processing failed" }));
          throw new Error(err.detail ?? "Processing failed");
        }

        const data = await res.json();
        stopAnimation();
        setPct(100);
        setAnimPct(100);
        await new Promise((r) => setTimeout(r, 500));

        setProcessedSrc(data.image);
        setEditorProcessedSrc(data.image);
        setStep("review");
      } catch (err: any) {
        stopAnimation();
        setProcessingError(err.message || "Failed to contact processing server");
        setStep("upload");
      }
    },
    []
  );

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file, model);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file, model);
  };

  // Compare Slider Dragging
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingSlider || !sliderContainerRef.current) return;
      const rect = sliderContainerRef.current.getBoundingClientRect();
      const pct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
      setComparePos(pct);
    },
    [isDraggingSlider]
  );

  // Redraw Canvas on Adjustments change
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !processedSrc) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fgImg = new Image();
    fgImg.crossOrigin = "anonymous";
    fgImg.onload = () => {
      // Determine what the target size should be
      let targetW = fgImg.naturalWidth;
      let targetH = fgImg.naturalHeight;
      
      if (sizePreset === "passport") {
        targetW = 413;
        targetH = 531;
      } else if (sizePreset === "stamp") {
        targetW = 236;
        targetH = 295;
      } else if (sizePreset === "photo4x6") {
        targetW = 1200;
        targetH = 1800;
      } else if (sizePreset === "a4") {
        targetW = 2480;
        targetH = 3508;
      } else if (sizePreset === "custom" && customWidth > 0 && customHeight > 0) {
        targetW = customWidth;
        targetH = customHeight;
      }

      canvas.width = targetW;
      canvas.height = targetH;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const renderForeground = () => {
        // Outline width and shadow settings need to scale with target size relative to original
        const scaleFactor = targetW / fgImg.naturalWidth;
        const scaledOutlineWidth = outlineWidth * scaleFactor;
        const scaledShadowBlur = shadowBlur * scaleFactor;
        const scaledShadowOffsetX = shadowOffsetX * scaleFactor;
        const scaledShadowOffsetY = shadowOffsetY * scaleFactor;

        if (scaledOutlineWidth > 0 && outlineColor) {
          drawOutline(ctx, fgImg, 0, 0, canvas.width, canvas.height, scaledOutlineWidth, outlineColor);
        }

        ctx.save();
        if (scaledShadowBlur > 0 && shadowColor) {
          ctx.shadowBlur = scaledShadowBlur;
          ctx.shadowColor = shadowColor;
          ctx.shadowOffsetX = scaledShadowOffsetX;
          ctx.shadowOffsetY = scaledShadowOffsetY;
        }

        const filterStr =
          `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` +
          (exposure !== 0 ? ` brightness(${Math.pow(2, exposure) * 100}%)` : "") +
          (warmth !== 0 ? ` sepia(${Math.abs(warmth) * 0.5}%)` : "");
        ctx.filter = filterStr;

        // Draw centered with custom subject scale and offset
        ctx.translate(canvas.width / 2, canvas.height / 2);
        if (flipHorizontal) ctx.scale(-1, 1);
        if (flipVertical) ctx.scale(1, -1);
        ctx.rotate((rotation * Math.PI) / 180);

        // Keep original aspect ratio of the subject cutout
        const imgRatio = fgImg.naturalWidth / fgImg.naturalHeight;
        const canvasRatio = canvas.width / canvas.height;
        
        let baseW = canvas.width;
        let baseH = canvas.height;
        
        if (imgRatio > canvasRatio) {
          baseH = canvas.width / imgRatio;
        } else {
          baseW = canvas.height * imgRatio;
        }

        const drawW = baseW * (subjectScale / 100);
        const drawH = baseH * (subjectScale / 100);
        const drawX = -drawW / 2 + subjectOffsetX;
        const drawY = -drawH / 2 + subjectOffsetY;

        ctx.drawImage(fgImg, drawX, drawY, drawW, drawH);
        ctx.restore();
      };

      if (bgType === "color" && bgColor && bgColor !== "transparent") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        renderForeground();
      } else if (bgType === "image" && bgImageSrc) {
        const bgImg = new Image();
        bgImg.crossOrigin = "anonymous";
        bgImg.onload = () => {
          const canvasRatio = canvas.width / canvas.height;
          const imgRatio = bgImg.naturalWidth / bgImg.naturalHeight;
          let drawW = canvas.width;
          let drawH = canvas.height;
          let drawX = 0;
          let drawY = 0;
          if (imgRatio > canvasRatio) {
            drawW = canvas.height * imgRatio;
            drawX = (canvas.width - drawW) / 2;
          } else {
            drawH = canvas.width / imgRatio;
            drawY = (canvas.height - drawH) / 2;
          }
          ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
          renderForeground();
        };
        bgImg.src = bgImageSrc;
      } else {
        renderForeground();
      }
    };
    fgImg.src = processedSrc;
  }, [
    processedSrc,
    bgType,
    bgColor,
    bgImageSrc,
    outlineWidth,
    outlineColor,
    shadowBlur,
    shadowColor,
    shadowOffsetX,
    shadowOffsetY,
    brightness,
    contrast,
    saturation,
    exposure,
    warmth,
    rotation,
    flipHorizontal,
    flipVertical,
    sizePreset,
    customWidth,
    customHeight,
    subjectScale,
    subjectOffsetX,
    subjectOffsetY,
  ]);

  // Manual Editor Drawing Logics
  useEffect(() => {
    if (!showManualEditor || !selectedFile || !editorProcessedSrc) return;

    const imgProcessed = new Image();
    const imgOriginal = new Image();
    let loadedCount = 0;

    const onLoaded = () => {
      loadedCount++;
      if (loadedCount !== 2) return;

      const canvas = editorCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = imgProcessed.naturalWidth;
      canvas.height = imgProcessed.naturalHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgProcessed, 0, 0);

      const origCanvas = document.createElement("canvas");
      origCanvas.width = imgOriginal.naturalWidth;
      origCanvas.height = imgOriginal.naturalHeight;
      const oCtx = origCanvas.getContext("2d");
      if (oCtx) oCtx.drawImage(imgOriginal, 0, 0);
      editorOrigCanvasRef.current = origCanvas;
    };

    imgProcessed.onload = onLoaded;
    imgProcessed.src = editorProcessedSrc;

    imgOriginal.onload = onLoaded;
    imgOriginal.src = URL.createObjectURL(selectedFile);
  }, [showManualEditor, selectedFile, editorProcessedSrc]);

  const getEditorCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const drawStroke = useCallback(
    (x: number, y: number, isContinuous: boolean) => {
      const canvas = editorCanvasRef.current;
      const origCanvas = editorOrigCanvasRef.current;
      if (!canvas || !origCanvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = brushSize;

      if (manualTool === "erase") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.beginPath();
        if (isContinuous && lastPosRef.current) {
          ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        } else {
          ctx.moveTo(x, y);
        }
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        if (isContinuous && lastPosRef.current) {
          ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        } else {
          ctx.moveTo(x, y);
        }
        ctx.lineTo(x, y);
        ctx.clip();
        ctx.drawImage(origCanvas, 0, 0);
      }
      ctx.restore();
      lastPosRef.current = { x, y };
    },
    [brushSize, manualTool]
  );

  const handleEditorPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getEditorCanvasPos(e);
    if (!pos) return;
    setIsDrawing(true);
    drawStroke(pos.x, pos.y, false);
  };

  const handleEditorPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getEditorCanvasPos(e);
    if (!pos) return;
    drawStroke(pos.x, pos.y, true);
  };

  const handleEditorPointerUp = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  const saveManualEdits = () => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;
    const base64 = canvas.toDataURL("image/png");
    setProcessedSrc(base64);
    setEditorProcessedSrc(base64);
    setShowManualEditor(false);
  };

  function triggerRetryClick(feedback?: { alpha_matting?: boolean; fg?: number; bg?: number; remove_shadow?: boolean }) {
    setShowRetryPopover(false);
    setAction("retrying");
    if (selectedFile) processFile(selectedFile, model, feedback);
  }

  function triggerUpgradeClick() {
    setAction("upgrading");
    if (selectedFile) processFile(selectedFile, "u2net_human_seg");
  }

  const handleAcceptClick = async () => {
    const canvas = previewCanvasRef.current;
    if (canvas) {
      const blob = await getCompressedBlob(canvas, exportFormat, targetSizeKb, jpegQuality / 100);
      const finalSrc = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      setProcessedSrc(finalSrc);
    }
    setStep("done");
  };

  const handleDownload = async (forceWhiteBgJpg: boolean = false) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    
    const prevBgType = bgType;
    const prevBgColor = bgColor;
    const prevFormat = exportFormat;
    
    let format = exportFormat;
    let extension = {
      png: "png",
      jpeg: "jpg",
      webp: "webp",
      pdf: "pdf",
      bmp: "bmp",
      tiff: "tiff"
    }[exportFormat];
    
    if (forceWhiteBgJpg) {
      setBgType("color");
      setBgColor("#FFFFFF");
      setExportFormat("jpeg");
      format = "jpeg";
      extension = "jpg";
      // Allow canvas to redraw
      await new Promise((r) => setTimeout(r, 60));
    }
    
    const blob = await getCompressedBlob(canvas, format, targetSizeKb, jpegQuality / 100);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.download = `printo_bg_removed.${extension}`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
    
    if (forceWhiteBgJpg) {
      setBgType(prevBgType);
      setBgColor(prevBgColor);
      setExportFormat(prevFormat);
    }
  };

  const copyImageToClipboard = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    try {
      let format: "png" | "jpeg" = "png";
      if (exportFormat === "jpeg") {
        format = "jpeg";
      }
      
      const quality = jpegQuality / 100;
      const mime = format === "jpeg" ? "image/jpeg" : "image/png";
      let blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), mime, format === "jpeg" ? quality : undefined));
      
      if (limitFileSize) {
        const buffer = await blob.arrayBuffer();
        const paddedBuffer = padImageBuffer(buffer, Math.round(targetSizeKb * 1024));
        blob = new Blob([paddedBuffer], { type: mime });
      }

      const res = await fetch(URL.createObjectURL(blob));
      const finalBlob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [finalBlob.type]: finalBlob,
        }),
      ]);
      showToast("Copied customized image to clipboard! ✓");
    } catch (err) {
      showToast("Failed to copy image to clipboard");
    }
  };

  function handleBgImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      if (ev.target?.result) {
        setBgImageSrc(ev.target.result as string);
        setBgType("image");
      }
    };
    r.readAsDataURL(file);
  }

  function handleReset() {
    stopAnimation();
    setStep("upload");
    setSelectedFile(null);
    setProcessedSrc(null);
    setEditorProcessedSrc(null);
    setProcessingError(null);
    setStageIdx(0);
    setPct(0);
    setAnimPct(0);
    setBgColor("transparent");
    setBgImageSrc(null);
    setBgType("color");
    setOutlineWidth(0);
    setShadowBlur(0);
    resetAdjustments();
    
    // Reset export settings
    setExportFormat("png");
    setSizePreset("original");
    setSubjectScale(100);
    setSubjectOffsetX(0);
    setSubjectOffsetY(0);
    setLimitFileSize(false);
    setEstimatedSizeKb(null);
  }

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setExposure(0);
    setWarmth(0);
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
  };

  return (
    <div className="flex flex-col h-full -m-6 relative overflow-hidden bg-background">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-xl ring-1 ring-white/10">
          {toast}
        </div>
      )}

      {/* Manual brush editor layout */}
      {showManualEditor && (
        <div className="absolute inset-0 bg-background z-30 flex flex-col h-full">
          <div className="shrink-0 border-b border-border bg-card px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <i className="bx bx-brush text-primary text-lg" /> Refine Cutout (Erase &amp; Restore)
              </span>
              <div className="h-4 w-px bg-border" />
              <div className="flex bg-muted/65 border border-border p-1 rounded-xl">
                <button
                  onClick={() => setManualTool("erase")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    manualTool === "erase" ? "bg-rose-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <i className="bx bx-eraser" /> Erase
                </button>
                <button
                  onClick={() => setManualTool("restore")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    manualTool === "restore" ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <i className="bx bx-brush" /> Restore
                </button>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Brush Size:</span>
                <input
                  type="range"
                  min={5}
                  max={80}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-24 accent-primary h-1 rounded bg-muted cursor-pointer"
                />
                <span className="font-mono">{brushSize}px</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowManualEditor(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground border border-border hover:bg-accent transition"
              >
                Cancel
              </button>
              <button
                onClick={saveManualEdits}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary shadow-md hover:shadow-lg transition"
              >
                Save Edits
              </button>
            </div>
          </div>

          <div
            className="flex-1 overflow-hidden relative flex items-center justify-center p-6 bg-muted/15"
            style={{
              backgroundImage:
                "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",
              backgroundSize: "12px 12px",
              backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
              backgroundColor: "#ececec",
            }}
          >
            <canvas
              ref={editorCanvasRef}
              onMouseDown={handleEditorPointerDown}
              onMouseMove={handleEditorPointerMove}
              onMouseUp={handleEditorPointerUp}
              onMouseLeave={handleEditorPointerUp}
              onTouchStart={handleEditorPointerDown}
              onTouchMove={handleEditorPointerMove}
              onTouchEnd={handleEditorPointerUp}
              className="max-h-full max-w-full object-contain shadow-2xl border border-border bg-transparent cursor-crosshair touch-none"
            />
          </div>
          <div className="shrink-0 bg-card p-2 text-center text-[10px] text-muted-foreground border-t border-border">
            Click and drag to edit. Switch to <strong>Restore</strong> to draw back background textures, or <strong>Erase</strong> to remove pixels.
          </div>
        </div>
      )}

      {/* STEP 1: UPLOAD */}
      {step === "upload" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-2">
              <i className="bx bx-eraser" /> Background Remover
            </div>
            <h2 className="text-xl font-bold text-foreground">Upload and Erase Backdrop</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Supports JPEG, PNG, WEBP, HEIC files up to 10 MB.
            </p>
          </div>

          {processingError && (
            <div className="w-full max-w-xl flex items-start gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-xs text-destructive border border-destructive/20">
              <i className="bx bx-error-circle text-base shrink-0" />
              <div>
                <p className="font-semibold">AI processing failed</p>
                <p className="opacity-80">{processingError}</p>
              </div>
            </div>
          )}

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="w-full max-w-xl border-2 border-dashed border-border hover:border-primary/50 bg-card rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition cursor-pointer relative"
          >
            <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <i className="bx bx-cloud-upload text-3xl" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Drag and drop your portrait here</p>
              <p className="text-xs text-muted-foreground mt-0.5">or click to browse your local files</p>
            </div>
          </div>

          {/* AI Settings */}
          <div className="w-full max-w-xl border border-border bg-card rounded-2xl p-4">
            <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">AI Model Tuning</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setModel("u2net")}
                className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition ${
                  model === "u2net" ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent"
                }`}
              >
                <span className="text-xs font-bold text-foreground">Standard AI (Fast)</span>
                <span className="text-[10px] text-muted-foreground leading-tight">Best for normal lighting, portrait contours. (5-10s)</span>
              </button>
              <button
                onClick={() => setModel("u2net_human_seg")}
                className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition ${
                  model === "u2net_human_seg" ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent"
                }`}
              >
                <span className="text-xs font-bold text-foreground">Ultra Segmentation</span>
                <span className="text-[10px] text-muted-foreground leading-tight">Aggressive matting for complex details/hair structures. (15-30s)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PROCESSING */}
      {step === "processing" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-20">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-xl flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg shadow-primary/20">
                  <i className="bx bx-eraser text-lg animate-pulse" />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Print Sathi AI Engine</span>
                <h3 className="text-base font-bold text-foreground">{STAGES[stageIdx]?.label || "Processing"}</h3>
              </div>
            </div>

            <div className="w-full">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <i className="bx bx-loader-alt animate-spin text-sm" />
                  Isolating background...
                </span>
                <span className="text-sm font-bold text-primary">{animPct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted p-[2px] border border-border/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-indigo-500 to-violet-600 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-100 ease-out"
                  style={{ width: `${animPct}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
              {STAGES.map((s, i) => {
                const isDone = i < stageIdx;
                const isActive = i === stageIdx;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
                      isDone
                        ? "font-medium text-emerald-500"
                        : isActive
                        ? "font-bold text-primary translate-x-1"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                      {isDone ? (
                        <i className="bx bx-check-circle text-base text-emerald-500" />
                      ) : isActive ? (
                        <i className={`bx ${s.icon} animate-pulse text-base text-primary`} />
                      ) : (
                        <i className="bx bx-circle text-sm opacity-50" />
                      )}
                    </div>
                    <span className="truncate">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: WORKSPACE / REVIEW */}
      {step === "review" && processedSrc && (
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Slider compare on left (7 cols) */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-0">
            <div className="w-full max-w-2xl flex flex-col gap-3 h-full">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
                <span><i className="bx bx-image-alt" /> Original</span>
                <span className="text-foreground font-bold text-[10px] bg-muted px-2 py-0.5 rounded uppercase tracking-wider">Drag to Compare</span>
                <span>Cutout Studio <i className="bx bx-eraser" /></span>
              </div>

              <div
                ref={sliderContainerRef}
                className="relative flex-1 min-h-[280px] overflow-hidden rounded-2xl border border-border shadow-2xl cursor-col-resize select-none bg-muted/10"
                onMouseMove={handleMouseMove}
                onMouseDown={() => setIsDraggingSlider(true)}
                onMouseUp={() => setIsDraggingSlider(false)}
                onMouseLeave={() => setIsDraggingSlider(false)}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",
                    backgroundSize: "12px 12px",
                    backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                    backgroundColor: "#eaeaea",
                  }}
                >
                  <canvas ref={previewCanvasRef} className="h-full w-full object-contain pointer-events-none" />
                </div>

                {originalUrl && (
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none border-r border-white/20"
                    style={{ width: `${comparePos}%` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={originalUrl}
                      alt="Original"
                      className="absolute inset-0 h-full w-full object-contain max-w-none"
                      style={{ width: `${10000 / (comparePos || 1)}%` }}
                      draggable={false}
                    />
                  </div>
                )}

                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.6)] pointer-events-none"
                  style={{ left: `${comparePos}%`, transform: "translateX(-50%)" }}
                >
                  <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-xl border border-border">
                    <i className="bx bx-chevron-left text-muted-foreground text-sm" />
                    <i className="bx bx-chevron-right text-muted-foreground text-sm -ml-0.5" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <p>Model: <code className="font-mono text-primary font-bold">{model}</code></p>
                <button
                  onClick={() => handleDownload(bgColor !== "transparent")}
                  className="flex items-center gap-1 text-primary font-bold hover:underline"
                >
                  <i className="bx bx-download" /> Quick Download
                </button>
              </div>
            </div>
          </div>

          {/* Right edit Panel (5 cols) */}
          <div className="w-full lg:w-[350px] shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-card flex flex-col h-[380px] lg:h-full overflow-hidden">
            <div className="flex border-b border-border bg-muted/30 p-1 shrink-0">
              {(["bg", "effects", "adjust", "export"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                    activeTab === t ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "bg" ? "Background" : t === "effects" ? "Borders" : t === "adjust" ? "Adjustments" : "Export"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {activeTab === "bg" && (
                <div className="space-y-5">
                  <div>
                    <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Solid Background Color</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setBgType("color");
                          setBgColor("transparent");
                        }}
                        className={`h-8 w-8 rounded-full border border-border relative overflow-hidden ${
                          bgType === "color" && bgColor === "transparent" ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""
                        }`}
                      >
                        <div className="absolute inset-0 bg-white" />
                        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-rose-500 rotate-45 origin-center" />
                      </button>
                      {["#FFFFFF", "#F3F4F6", "#C3D9F0", "#E8312F", "#1F2937", "#000000"].map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setBgType("color");
                            setBgColor(c);
                          }}
                          style={{ backgroundColor: c }}
                          className={`h-8 w-8 rounded-full border border-border transition hover:scale-105 ${
                            bgType === "color" && bgColor === c ? "ring-2 ring-primary ring-offset-2" : ""
                          }`}
                        />
                      ))}
                      <input
                        type="color"
                        value={bgColor === "transparent" ? "#ffffff" : bgColor}
                        onChange={(e) => {
                          setBgType("color");
                          setBgColor(e.target.value);
                        }}
                        className="h-8 w-8 rounded-full border cursor-pointer p-0"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Preset Backdrops</span>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_BGS.map((bg, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setBgImageSrc(bg.url);
                            setBgType("image");
                          }}
                          className={`relative rounded-xl overflow-hidden aspect-[4/3] border hover:border-primary transition ${
                            bgType === "image" && bgImageSrc === bg.url ? "ring-2 ring-primary ring-offset-1" : "border-border"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={bg.url} alt={bg.name} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 flex items-end p-1">
                            <span className="text-[8px] text-white truncate font-medium">{bg.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Upload Backdrop</span>
                    <input ref={bgFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgImageUpload} />
                    <button
                      onClick={() => bgFileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 py-3 text-xs font-semibold text-foreground hover:bg-accent transition"
                    >
                      <i className="bx bx-image-add text-lg text-primary" />
                      Browse background image
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "effects" && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Outline Width</span>
                      {outlineWidth > 0 && (
                        <button onClick={() => setOutlineWidth(0)} className="text-[10px] text-primary hover:underline">
                          Disable
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Stroke Size</span>
                        <span>{outlineWidth} px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={24}
                        value={outlineWidth}
                        onChange={(e) => setOutlineWidth(Number(e.target.value))}
                        className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
                      />
                    </div>
                    {outlineWidth > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["#FFFFFF", "#000000", "#FFD700", "#FF3333", "#3388FF", "#33FF33"].map((color) => (
                          <button
                            key={color}
                            onClick={() => setOutlineColor(color)}
                            style={{ backgroundColor: color }}
                            className={`h-6 w-6 rounded-full border border-border transition ${
                              outlineColor === color ? "ring-2 ring-primary ring-offset-2" : ""
                            }`}
                          />
                        ))}
                        <input
                          type="color"
                          value={outlineColor}
                          onChange={(e) => setOutlineColor(e.target.value)}
                          className="h-6 w-6 rounded-full border cursor-pointer p-0"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 border-t border-border/40 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Drop Shadow</span>
                      {shadowBlur > 0 && (
                        <button onClick={() => setShadowBlur(0)} className="text-[10px] text-primary hover:underline">
                          Disable
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Blur Radius</span>
                          <span>{shadowBlur} px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={30}
                          value={shadowBlur}
                          onChange={(e) => setShadowBlur(Number(e.target.value))}
                          className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
                        />
                      </div>
                      {shadowBlur > 0 && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground">Offset X ({shadowOffsetX}px)</span>
                              <input
                                type="range"
                                min={-25}
                                max={25}
                                value={shadowOffsetX}
                                onChange={(e) => setShadowOffsetX(Number(e.target.value))}
                                className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground">Offset Y ({shadowOffsetY}px)</span>
                              <input
                                type="range"
                                min={-25}
                                max={25}
                                value={shadowOffsetY}
                                onChange={(e) => setShadowOffsetY(Number(e.target.value))}
                                className="w-full accent-primary bg-muted h-1 rounded-lg cursor-pointer"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "adjust" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Lighting Adjustments</span>
                    <button onClick={resetAdjustments} className="text-[10px] text-primary hover:underline">
                      Reset
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Exposure</span>
                        <span>{exposure > 0 ? "+" : ""}{exposure.toFixed(2)}</span>
                      </div>
                      <input
                        type="range" min="-2" max="2" step="0.05" value={exposure}
                        onChange={(e) => setExposure(Number(e.target.value))}
                        className="w-full accent-primary bg-muted h-1 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Brightness</span>
                        <span>{brightness}%</span>
                      </div>
                      <input
                        type="range" min="50" max="150" value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full accent-primary bg-muted h-1 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Contrast</span>
                        <span>{contrast}%</span>
                      </div>
                      <input
                        type="range" min="50" max="150" value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-full accent-primary bg-muted h-1 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Saturation</span>
                        <span>{saturation}%</span>
                      </div>
                      <input
                        type="range" min="0" max="200" value={saturation}
                        onChange={(e) => setSaturation(Number(e.target.value))}
                        className="w-full accent-primary bg-muted h-1 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Warmth</span>
                        <span>{warmth}</span>
                      </div>
                      <input
                        type="range" min="-50" max="50" value={warmth}
                        onChange={(e) => setWarmth(Number(e.target.value))}
                        className="w-full accent-primary bg-muted h-1 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="border-t border-border/45 pt-4 space-y-3">
                    <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rotate &amp; Flip</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setRotation((r) => (r + 90) % 360)}
                        className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2 text-[9px] font-bold text-foreground hover:bg-accent"
                      >
                        <i className="bx bx-rotate-right text-base text-primary" />
                        <span>Rotate 90°</span>
                      </button>
                      <button
                        onClick={() => setFlipHorizontal((f) => !f)}
                        className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[9px] font-bold ${
                          flipHorizontal ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:bg-accent"
                        }`}
                      >
                        <i className="bx bx-reflect-vertical text-base" />
                        <span>Flip Horiz</span>
                      </button>
                      <button
                        onClick={() => setFlipVertical((f) => !f)}
                        className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[9px] font-bold ${
                          flipVertical ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:bg-accent"
                        }`}
                      >
                        <i className="bx bx-reflect-horizontal text-base" />
                        <span>Flip Vert</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "export" && (
                <div className="space-y-5">
                  {/* Output Format */}
                  <div>
                    <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Output Format</span>
                    <div className="grid grid-cols-3 gap-2">
                      {(["png", "jpeg", "webp", "pdf", "bmp", "tiff"] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setExportFormat(fmt)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition ${
                            exportFormat === fmt
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-foreground hover:bg-accent"
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size Presets */}
                  <div>
                    <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Size Preset</span>
                    <select
                      value={sizePreset}
                      onChange={(e) => {
                        const preset = e.target.value as typeof sizePreset;
                        setSizePreset(preset);
                        if (preset !== "custom" && preset !== "original") {
                          const dims = {
                            passport: { w: 413, h: 531 },
                            stamp: { w: 236, h: 295 },
                            photo4x6: { w: 1200, h: 1800 },
                            a4: { w: 2480, h: 3508 }
                          }[preset as "passport" | "stamp" | "photo4x6" | "a4"];
                          if (dims) {
                            setCustomWidth(dims.w);
                            setCustomHeight(dims.h);
                          }
                        }
                      }}
                      className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="original">Original Size</option>
                      <option value="passport">Passport Photo (35x45mm)</option>
                      <option value="stamp">Stamp Photo (20x25mm)</option>
                      <option value="photo4x6">4&quot; x 6&quot; Portrait (10x15cm)</option>
                      <option value="a4">A4 Page (21x29.7cm)</option>
                      <option value="custom">Custom Dimensions</option>
                    </select>
                  </div>

                  {/* Custom Width/Height Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[10px] text-muted-foreground mb-1">Width (px)</span>
                      <input
                        type="number"
                        disabled={sizePreset !== "custom"}
                        value={customWidth || ""}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value));
                          setCustomWidth(val);
                          if (lockAspectRatio && originalAspectRatio) {
                            setCustomHeight(Math.round(val / originalAspectRatio));
                          }
                        }}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-mono outline-none focus:border-primary disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground mb-1">Height (px)</span>
                      <input
                        type="number"
                        disabled={sizePreset !== "custom"}
                        value={customHeight || ""}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value));
                          setCustomHeight(val);
                          if (lockAspectRatio && originalAspectRatio) {
                            setCustomWidth(Math.round(val * originalAspectRatio));
                          }
                        }}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-mono outline-none focus:border-primary disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {sizePreset === "custom" && (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={lockAspectRatio}
                        onChange={(e) => setLockAspectRatio(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span>Lock Aspect Ratio</span>
                    </label>
                  )}

                  {/* Subject Placement Controls */}
                  <div className="border-t border-border/40 pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Subject Scale & Position</span>
                      <button
                        onClick={() => {
                          setSubjectScale(100);
                          setSubjectOffsetX(0);
                          setSubjectOffsetY(0);
                        }}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Reset Layout
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Subject Scale</span>
                        <span>{subjectScale}%</span>
                      </div>
                      <input
                        type="range" min="30" max="200" value={subjectScale}
                        onChange={(e) => setSubjectScale(Number(e.target.value))}
                        className="w-full accent-primary bg-muted h-1 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Horizontal Offset</span>
                        <span>{subjectOffsetX > 0 ? "+" : ""}{subjectOffsetX}px</span>
                      </div>
                      <input
                        type="range" min="-300" max="300" value={subjectOffsetX}
                        onChange={(e) => setSubjectOffsetX(Number(e.target.value))}
                        className="w-full accent-primary bg-muted h-1 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Vertical Offset</span>
                        <span>{subjectOffsetY > 0 ? "+" : ""}{subjectOffsetY}px</span>
                      </div>
                      <input
                        type="range" min="-300" max="300" value={subjectOffsetY}
                        onChange={(e) => setSubjectOffsetY(Number(e.target.value))}
                        className="w-full accent-primary bg-muted h-1 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Quality Settings */}
                  {(exportFormat === "jpeg" || exportFormat === "webp" || exportFormat === "pdf") && (
                    <div className="border-t border-border/40 pt-4 space-y-4">
                      <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Compression & Quality</span>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Image Quality</span>
                          <span>{jpegQuality}%</span>
                        </div>
                        <input
                          type="range" min="10" max="100" value={jpegQuality}
                          onChange={(e) => setJpegQuality(Number(e.target.value))}
                          className="w-full accent-primary bg-muted h-1 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Size Limit Constraints */}
                  <div className="border-t border-border/40 pt-4 space-y-3">
                    <label className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer">
                      <span>Limit File Size</span>
                      <input
                        type="checkbox"
                        checked={limitFileSize}
                        onChange={(e) => setLimitFileSize(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                    </label>

                    {limitFileSize && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="5"
                            max="5000"
                            value={targetSizeKb}
                            onChange={(e) => setTargetSizeKb(Math.max(5, Number(e.target.value)))}
                            className="w-24 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-mono outline-none focus:border-primary"
                          />
                          <span className="text-xs text-muted-foreground">KB Maximum</span>
                        </div>
                        <p className="text-[10px] text-amber-500 leading-tight">
                          * PNGs will be converted to JPEGs. Quality and scaling will automatically adjust to keep the file under {targetSizeKb} KB.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Size Estimation & Downloads */}
                  <div className="border-t border-border/45 pt-4 space-y-3">
                    <div className="flex items-center justify-between bg-muted/40 border border-border rounded-xl p-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Estimated Size</span>
                        <span className="text-xs text-muted-foreground">
                          {exportFormat.toUpperCase()} ({sizePreset === "original" ? `${customWidth}x${customHeight}` : sizePreset})
                        </span>
                      </div>
                      <div className="text-sm font-mono font-bold text-primary">
                        {estimatedSizeKb !== null ? `~ ${estimatedSizeKb} KB` : "Estimating..."}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleDownload(bgColor !== "transparent")}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:shadow-lg transition"
                      >
                        <i className="bx bx-download" /> Download
                      </button>
                      <button
                        onClick={copyImageToClipboard}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-border bg-card text-foreground font-semibold text-xs hover:bg-accent transition"
                      >
                        <i className="bx bx-copy" /> Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Bars */}
      {step === "review" && (
        <div className="shrink-0 border-t border-border bg-card px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Make any manual adjustments, background changes, or transforms. Click Accept once complete.
          </div>
          <div className="flex gap-2">
            {/* Retry */}
            <div className="relative">
              <button
                onClick={() => setShowRetryPopover(!showRetryPopover)}
                disabled={action !== "idle"}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-accent flex items-center gap-1.5"
              >
                {action === "retrying" ? <i className="bx bx-loader-alt animate-spin text-primary" /> : <i className="bx bx-refresh text-sm" />}
                <span>Retry Options</span>
              </button>
              {showRetryPopover && (
                <div className="absolute bottom-full mb-2 right-0 w-64 bg-card border border-border shadow-2xl rounded-xl p-3 z-50 animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Retry with feedback</p>
                  <div className="space-y-1.5">
                    <button onClick={() => triggerRetryClick()} className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-2">
                      <i className="bx bx-refresh text-sm text-primary" />
                      <span>Just try again</span>
                    </button>
                    <button onClick={() => triggerRetryClick({ remove_shadow: true })} className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-2">
                      <i className="bx bx-sun text-sm text-amber-500" />
                      <span>Remove background shadows</span>
                    </button>
                    <button onClick={() => { setShowManualEditor(true); setShowRetryPopover(false); }} className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-2">
                      <i className="bx bx-brush text-sm text-emerald-500" />
                      <span>Select specific location to erase</span>
                    </button>
                    <button onClick={() => triggerRetryClick({ alpha_matting: true, fg: 200, bg: 5 })} className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-2">
                      <i className="bx bx-spa text-sm text-indigo-500" />
                      <span>Preserve fine hair/clothes</span>
                    </button>
                    <button onClick={() => triggerRetryClick({ alpha_matting: true, fg: 245, bg: 25 })} className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-2">
                      <i className="bx bx-exclude text-sm text-rose-500" />
                      <span>Aggressive background removal</span>
                    </button>
                    <button onClick={() => triggerRetryClick({ alpha_matting: true, fg: 240, bg: 10 })} className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-2">
                      <i className="bx bx-select-multiple text-sm text-cyan-500" />
                      <span>Super accurate edge alignment</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={triggerUpgradeClick}
              disabled={action !== "idle" || model === "u2net_human_seg"}
              className="px-4 py-2.5 rounded-xl border border-violet-500/30 bg-violet-500/5 text-xs font-semibold text-violet-600 hover:bg-violet-500/10 disabled:opacity-40"
            >
              Upgrade Ultra
            </button>

            <button
              onClick={() => setShowManualEditor(true)}
              className="px-4 py-2.5 rounded-xl border border-border bg-muted/20 text-xs font-semibold text-foreground hover:bg-accent flex items-center gap-1.5"
            >
              <i className="bx bx-brush text-primary text-sm" />
              <span>Manual Brush</span>
            </button>

            <button
              onClick={handleAcceptClick}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition flex items-center gap-1.5"
            >
              <i className="bx bx-check-circle text-sm" />
              <span>Accept &amp; Finish</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: DONE */}
      {step === "done" && processedSrc && (
        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-xl bg-card border border-border rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
              <i className="bx bx-check-shield text-3xl animate-bounce" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Design Export Ready!</h2>
            <p className="text-xs text-muted-foreground mt-1 mb-6">Your customized background cutout is ready for counter use.</p>

            <div
              className="relative overflow-hidden rounded-2xl border border-border p-4 bg-muted/20 w-full max-w-sm aspect-[4/3] flex items-center justify-center mb-8"
              style={{
                backgroundImage:
                  "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",
                backgroundSize: "12px 12px",
                backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                backgroundColor: "#eaeaea",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={processedSrc} alt="Final Product" className="max-h-full max-w-full object-contain drop-shadow-lg" />
            </div>

            {/* Quick Export Tweak Panel */}
            <div className="w-full max-w-md bg-muted/40 border border-border rounded-2xl p-4 mb-6 text-left animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-foreground flex items-center gap-1">
                  <i className="bx bx-cog text-primary" /> Quick Export Config
                </span>
                <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">Ready</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <span className="block text-[9px] text-muted-foreground uppercase font-bold mb-1">Format</span>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                  >
                    <option value="png">PNG (Lossless)</option>
                    <option value="jpeg">JPEG (Solid BG)</option>
                    <option value="webp">WEBP (Compressed)</option>
                    <option value="pdf">PDF (Document)</option>
                    <option value="bmp">BMP (Windows Bitmap)</option>
                    <option value="tiff">TIFF (Print Master)</option>
                  </select>
                </div>
                <div>
                  <span className="block text-[9px] text-muted-foreground uppercase font-bold mb-1">Size Preset</span>
                  <select
                    value={sizePreset}
                    onChange={(e) => {
                      const preset = e.target.value as any;
                      setSizePreset(preset);
                      const dims = {
                        passport: { w: 413, h: 531 },
                        stamp: { w: 236, h: 295 },
                        photo4x6: { w: 1200, h: 1800 },
                        a4: { w: 2480, h: 3508 }
                      }[preset as "passport" | "stamp" | "photo4x6" | "a4"];
                      if (dims) {
                        setCustomWidth(dims.w);
                        setCustomHeight(dims.h);
                      }
                    }}
                    className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                  >
                    <option value="original">Original Size</option>
                    <option value="passport">Passport Photo</option>
                    <option value="stamp">Stamp Photo</option>
                    <option value="photo4x6">4&quot; x 6&quot; Photo</option>
                    <option value="a4">A4 Page</option>
                  </select>
                </div>
              </div>

              {(exportFormat === "jpeg" || exportFormat === "webp" || exportFormat === "pdf") && (
                <div className="mb-3 animate-in fade-in duration-150">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>JPEG/WEBP Quality</span>
                    <span>{jpegQuality}%</span>
                  </div>
                  <input
                    type="range" min="10" max="100" value={jpegQuality}
                    onChange={(e) => setJpegQuality(Number(e.target.value))}
                    className="w-full accent-primary bg-muted h-1 rounded cursor-pointer"
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-xs border-t border-border/50 pt-2.5 mt-2.5">
                <span className="text-muted-foreground font-medium">Estimated File Size:</span>
                <span className="font-mono font-bold text-primary">
                  {estimatedSizeKb !== null ? `~ ${estimatedSizeKb} KB` : "Estimating..."}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
              <button
                onClick={() => handleDownload(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition"
              >
                <i className="bx bx-download text-lg" />
                Download Cutout
              </button>
              <button
                onClick={() => handleDownload(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-bold text-foreground hover:bg-accent transition"
              >
                <i className="bx bx-download text-lg text-muted-foreground" />
                Force White BG (JPG)
              </button>
              <button
                onClick={copyImageToClipboard}
                className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 py-3 text-sm font-bold text-emerald-500 transition"
              >
                <i className="bx bx-copy text-lg" />
                Copy to Clipboard
              </button>
            </div>

            <div className="mt-8 border-t border-border w-full pt-5 flex justify-between items-center text-xs text-muted-foreground">
              <span>Ready for Counter DTP</span>
              <button onClick={handleReset} className="text-primary font-bold hover:underline">
                Process another file
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
