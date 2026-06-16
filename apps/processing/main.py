from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
import io
import base64
import logging

from PIL import Image, ImageOps
import cv2
import numpy as np

# Register HEIC/HEIF support via pillow-heif
try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass  # HEIC support optional; skip if not installed

rembg_remove = None
try:
    from rembg import remove as rembg_remove
except ImportError:
    pass

_sessions = {}
_total_tasks_processed = 0

logger = logging.getLogger("print-sathi")

def get_rembg_session(model_name: str):
    if model_name not in _sessions:
        try:
            from rembg import new_session
            logger.info(f"Loading rembg model session: {model_name}")
            _sessions[model_name] = new_session(model_name)
        except Exception as e:
            logger.warning(f"Failed to load rembg session {model_name}: {e}")
            _sessions[model_name] = None
    return _sessions[model_name]

app = FastAPI(
    title="Print Sathi Processing Service",
    description="Image processing API for passport photos, document conversion, and more.",
    version="0.1.0",
)

# CORS — allow requests from local and production environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.vercel.app",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _pil_to_cv2(pil_img: Image.Image) -> np.ndarray:
    """Convert PIL image (RGBA or RGB) to OpenCV BGR."""
    if pil_img.mode == "RGBA":
        arr = np.array(pil_img)
        return cv2.cvtColor(arr, cv2.COLOR_RGBA2BGR)
    arr = np.array(pil_img.convert("RGB"))
    return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)


def _detect_face(bgr: np.ndarray):
    """Return the (x, y, w, h) of the largest detected face, or None."""
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(cascade_path)

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    # Try with default scale, then with relaxed params
    for scale, neighbors in [(1.1, 5), (1.05, 3), (1.3, 2)]:
        faces = face_cascade.detectMultiScale(
            gray, scaleFactor=scale, minNeighbors=neighbors, minSize=(60, 60)
        )
        if len(faces) > 0:
            # Pick the largest face by area
            faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
            return faces[0]
    return None


def _crop_to_passport(pil_img: Image.Image, face_box) -> Image.Image:
    """
    Crop image to passport proportions (35×45 mm → 7:9 ratio) centred on the
    detected face with correct biometric framing.

    Research-based Indian passport framing (ISO/ICAO standard):
    - Head height: 75% of photo frame height  (research: 70-80% range, midpoint)
    - Crown clearance: 5% of frame from top   (research: 3-5mm gap ≈ 5% at 45mm)
    - Face centered horizontally
    - Eyes naturally fall at ~62% from bottom when above ratios are applied
    """
    img_w, img_h = pil_img.size
    fx, fy, fw, fh = face_box

    TARGET_RATIO = 35 / 45  # width / height (portrait)

    # Estimate actual head bounds from the Haar face bounding box.
    # Haar cascade: face box goes from upper forehead to chin.
    # Crown is ~20% above the face box top.
    # Chin is ~15% below the face box bottom.
    crown_y = fy - fh * 0.20   # top of head (crown)
    chin_y  = fy + fh * 1.15   # bottom of chin
    head_h  = chin_y - crown_y  # total head height in pixels

    # Target: head occupies 75% of frame height (research midpoint of 70-80%)
    frame_h = int(head_h / 0.75)
    frame_w = int(frame_h * TARGET_RATIO)

    # Crown clearance: 5% from top of frame (≈ 4mm in a 45mm photo)
    # So frame top starts 5% of frame_h above the crown
    crown_clearance = frame_h * 0.05
    y1 = int(crown_y - crown_clearance)

    # Center horizontally on the face
    cx = fx + fw // 2
    x1 = cx - frame_w // 2

    # Clamp to image bounds
    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(img_w, x1 + frame_w)
    y2 = min(img_h, y1 + frame_h)

    # If clamping reduced dimensions, try to recover by shifting
    if (x2 - x1) < frame_w and x1 == 0:
        x2 = min(img_w, frame_w)
    if (y2 - y1) < frame_h and y1 == 0:
        y2 = min(img_h, frame_h)

    return pil_img.crop((x1, y1, x2, y2)), x1, y1


def _image_to_base64(pil_img: Image.Image, fmt: str = "PNG") -> str:
    buf = io.BytesIO()
    pil_img.save(buf, format=fmt)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    mime = "image/png" if fmt == "PNG" else "image/jpeg"
    return f"data:{mime};base64,{b64}"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    """Health check endpoint returning status, task counts, and active sessions."""
    active_sessions = [k for k, v in _sessions.items() if v is not None]
    return {
        "status": "ok",
        "service": "print-sathi-processing",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_tasks_processed": _total_tasks_processed,
        "active_model_sessions": active_sessions,
    }


@app.get("/")
async def root():
    return {
        "service": "Print Sathi Processing API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.post("/passport/process")
async def process_passport_photo(
    file: UploadFile = File(...),
    model: str = Query("u2net", description="Model for background removal (u2net, u2net_human_seg)"),
    alpha_matting: bool = Query(False, description="Enable alpha matting for finer edge detail"),
    alpha_matting_fg: int = Query(240, description="Alpha matting foreground threshold"),
    alpha_matting_bg: int = Query(10, description="Alpha matting background threshold"),
    crop: bool = Query(True, description="Enable passport biometric cropping"),
    remove_shadow: bool = Query(False, description="Enable LAB-CLAHE lighting/shadow correction")
):
    """
    Accept a portrait photo, remove its background, detect the face,
    and return a passport-cropped image as a base64 data-URI.
    """
    global _total_tasks_processed
    # ── Validate ──────────────────────────────────────────────────────────
    ALLOWED = {"image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"}
    ct = (file.content_type or "").lower()
    if ct not in ALLOWED and not ct.startswith("image/"):
        raise HTTPException(status_code=400, detail="Unsupported file type. Upload JPG, PNG, or HEIC.")

    MAX_MB = 10
    raw = await file.read()
    if len(raw) > MAX_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum {MAX_MB} MB.")

    # ── Load image ────────────────────────────────────────────────────────
    try:
        pil_img = Image.open(io.BytesIO(raw))
        pil_img = ImageOps.exif_transpose(pil_img)
        pil_img = pil_img.convert("RGBA")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read image: {e}")

    # ── Remove background ─────────────────────────────────────────────────
    session = get_rembg_session(model)
    rembg_kwargs = {
        "alpha_matting": alpha_matting,
        "alpha_matting_foreground_threshold": alpha_matting_fg,
        "alpha_matting_background_threshold": alpha_matting_bg,
        "alpha_matting_erode_size": 10
    }
    
    # Large images + alpha matting causes severe OOM crashes due to the O(N^3) complexity of solving 
    # the matting Laplacian (e.g., in pymatting). We downsample for matting and upscale the mask.
    MAX_MATTING_DIM = 360
    orig_w, orig_h = pil_img.size
    is_large = max(orig_w, orig_h) > MAX_MATTING_DIM
    
    if rembg_remove is None:
        logger.warning("rembg is not installed — skipping background removal")
    elif alpha_matting and is_large:
        try:
            logger.info("Downsampling image from %dx%d for safe alpha matting", orig_w, orig_h)
            ratio = MAX_MATTING_DIM / max(orig_w, orig_h)
            new_w = int(orig_w * ratio)
            new_h = int(orig_h * ratio)
            resized_img = pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

            if session is not None:
                processed_resized = rembg_remove(resized_img, session=session, **rembg_kwargs)
            else:
                processed_resized = rembg_remove(resized_img, **rembg_kwargs)

            # Extract and upscale the computed alpha mask
            resized_alpha = processed_resized.split()[3]
            upscaled_alpha = resized_alpha.resize((orig_w, orig_h), Image.Resampling.BILINEAR)

            # Apply back to the original full-resolution image
            pil_img = pil_img.copy()
            pil_img.putalpha(upscaled_alpha)
        except Exception as e:
            logger.warning("Downsampled alpha matting failed: %s — falling back to standard removal", e)
            rembg_kwargs["alpha_matting"] = False
            if session is not None:
                pil_img = rembg_remove(pil_img, session=session, **rembg_kwargs)
            else:
                pil_img = rembg_remove(pil_img, **rembg_kwargs)
    else:
        if session is not None:
            try:
                pil_img = rembg_remove(pil_img, session=session, **rembg_kwargs)
            except Exception as e:
                logger.warning("rembg failed with session %s: %s — trying default rembg", model, e)
                try:
                    pil_img = rembg_remove(pil_img, **rembg_kwargs)
                except Exception as e2:
                    logger.warning("rembg fallback failed: %s — continuing with original", e2)
        else:
            try:
                pil_img = rembg_remove(pil_img, **rembg_kwargs)
            except Exception as e:
                logger.warning("rembg default failed: %s — continuing with original", e)

    # ── Remove shadow if requested ───────────────────────────────────────
    if remove_shadow:
        try:
            arr = np.array(pil_img)
            # Separate RGB and alpha
            rgb = arr[:, :, :3]
            alpha = arr[:, :, 3]
            bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)

            # Apply LAB-CLAHE for shadow removal
            lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8, 8))
            cl = clahe.apply(l)
            lab = cv2.merge((cl, a, b))
            bgr = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

            # Reconstruct RGBA
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
            arr[:, :, :3] = rgb
            arr[:, :, 3] = alpha
            pil_img = Image.fromarray(arr)
        except Exception as e:
            logger.warning("Shadow removal failed: %s", e)

    # Increment task count
    _total_tasks_processed += 1

    # ── Biometric cropping & Face box calculation ─────────────────────────
    face_detected = False
    face_box_relative = None
    
    bgr = _pil_to_cv2(pil_img)
    face_box = _detect_face(bgr)
    face_detected = face_box is not None
    
    if crop:
        if face_detected:
            cropped, x1, y1 = _crop_to_passport(pil_img, face_box)
            fx, fy, fw, fh = face_box
            # Calculate coordinates relative to cropped image
            rel_x = max(0, int(fx - x1))
            rel_y = max(0, int(fy - y1))
            rel_w = int(fw)
            rel_h = int(fh)
            face_box_relative = [rel_x, rel_y, rel_w, rel_h]
        else:
            cropped = pil_img
    else:
        cropped = pil_img
        if face_detected:
            fx, fy, fw, fh = face_box
            face_box_relative = [int(fx), int(fy), int(fw), int(fh)]

    # Return transparent PNG directly so frontend can apply custom backgrounds
    b64 = _image_to_base64(cropped, fmt="PNG")
    return JSONResponse({
        "image": b64,
        "width": cropped.width,
        "height": cropped.height,
        "face_detected": face_detected,
        "face_box": face_box_relative,
    })


@app.post("/passport/retry-analyze")
async def analyze_for_retry(
    processed_image: str = Form(..., description="base64 data-URI of the processed PNG"),
):
    """
    Analyze the alpha mask of a background-removed image and recommend the
    best retry strategy.  Returns a JSON object with:
      - strategy   : one of 'alpha_matting_fine' | 'alpha_matting_aggressive'
                     | 'u2net_upgrade' | 'remove_shadow' | 'just_retry'
      - params     : dict of recommended API query params for /passport/process
      - explanation: human-readable reason for this recommendation
      - confidence : 0-100 score for how certain we are
    """
    try:
        # Strip data-URI prefix if present
        if "," in processed_image:
            processed_image = processed_image.split(",", 1)[1]
        raw_bytes = base64.b64decode(processed_image)
        pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGBA")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not decode image: {e}")

    arr = np.array(pil_img)
    alpha = arr[:, :, 3].astype(np.float32)
    h, w = alpha.shape
    total_pixels = h * w

    # ── Metric 1: background removal completeness ────────────────────────────
    # Pixels that are fully transparent (should be background)
    fully_transparent_pct = float(np.sum(alpha < 10) / total_pixels * 100)
    # Semi-transparent pixels (fringe / halo)
    semi_transparent_pct = float(np.sum((alpha >= 10) & (alpha < 230)) / total_pixels * 100)
    # Foreground pixels (solid subject)
    foreground_pct = float(np.sum(alpha >= 230) / total_pixels * 100)

    # ── Metric 2: edge quality ───────────────────────────────────────────────
    # Build a binary mask and detect edges; high variation = jagged edges
    binary_mask = (alpha > 128).astype(np.uint8) * 255
    edges = cv2.Canny(binary_mask, 50, 150)
    # Laplacian of the alpha along the edge strip gives roughness score
    edge_ys, edge_xs = np.where(edges > 0)
    alpha_roughness = 0.0
    if len(edge_ys) > 100:
        # Sample alpha values along edges
        edge_alpha_vals = alpha[edge_ys, edge_xs]
        # High std-dev means jagged, hard edge; low = smooth gradient
        alpha_roughness = float(np.std(edge_alpha_vals))

    # ── Metric 3: interior holes (foreground regions removed by mistake) ────
    # Flood-fill from corners to find connected background; anything not
    # reached that is transparent inside the subject boundary = hole
    fg_mask = (alpha > 128).astype(np.uint8)
    # Find the bounding box of foreground
    fg_rows = np.where(fg_mask.any(axis=1))[0]
    interior_hole_pct = 0.0
    if len(fg_rows) > 0:
        row_top, row_bot = int(fg_rows[0]), int(fg_rows[-1])
        fg_cols = np.where(fg_mask.any(axis=0))[0]
        col_left, col_right = int(fg_cols[0]), int(fg_cols[-1])
        # Interior transparent pixels within the bounding box
        interior_region = alpha[row_top:row_bot, col_left:col_right]
        interior_transparent = float(np.sum(interior_region < 50))
        interior_total = float(interior_region.size)
        if interior_total > 0:
            interior_hole_pct = interior_transparent / interior_total * 100

    # ── Decision Logic ───────────────────────────────────────────────────────
    strategy = "just_retry"
    params: dict = {}
    explanation = "The result looks mostly fine. Retrying with the same settings may give a slightly cleaner cut."
    confidence = 55

    if interior_hole_pct > 5.0:
        # Holes inside the subject = model over-removed foreground
        strategy = "alpha_matting_fine"
        params = {"alpha_matting": True, "alpha_matting_fg": 200, "alpha_matting_bg": 5}
        explanation = (
            f"We detected interior holes (≈{interior_hole_pct:.1f}% of subject area). "
            "This usually means parts of your clothing or hair were accidentally removed. "
            "Fine alpha-matting will preserve more foreground detail."
        )
        confidence = 85

    elif semi_transparent_pct > 8.0 and alpha_roughness < 40:
        # Lots of semi-transparent fringe = halo / soft edges that look unclean
        strategy = "alpha_matting_aggressive"
        params = {"alpha_matting": True, "alpha_matting_fg": 245, "alpha_matting_bg": 25}
        explanation = (
            f"We detected a translucent halo around the subject ({semi_transparent_pct:.1f}% semi-transparent pixels). "
            "Aggressive alpha-matting will sharpen the subject boundary and eliminate the ghosting effect."
        )
        confidence = 80

    elif alpha_roughness > 65:
        # Very high roughness = jagged/pixelated edges
        strategy = "alpha_matting_fine"
        params = {"alpha_matting": True, "alpha_matting_fg": 220, "alpha_matting_bg": 10}
        explanation = (
            f"We detected jagged edges (roughness score: {alpha_roughness:.0f}). "
            "Fine alpha-matting will smooth the boundary and preserve hair/clothing texture naturally."
        )
        confidence = 78

    elif fully_transparent_pct < 20 and foreground_pct > 70:
        # Background barely removed — model failed to detect edges properly
        strategy = "u2net_upgrade"
        params = {}
        explanation = (
            "The background was not fully removed "
            f"(only {fully_transparent_pct:.1f}% transparency). "
            "Upgrading to the Ultra model (u2net_human_seg) will give a much more accurate result."
        )
        confidence = 88

    elif semi_transparent_pct < 2.0 and alpha_roughness < 30 and foreground_pct < 40:
        # Over-removed — almost entire image was stripped
        strategy = "remove_shadow"
        params = {"remove_shadow": True}
        explanation = (
            "Most of the image was removed, likely because of heavy shadows or low contrast. "
            "Shadow normalization will rebalance the lighting before background removal."
        )
        confidence = 72

    return JSONResponse({
        "strategy": strategy,
        "params": params,
        "explanation": explanation,
        "confidence": confidence,
        "metrics": {
            "fully_transparent_pct": round(fully_transparent_pct, 1),
            "semi_transparent_pct": round(semi_transparent_pct, 1),
            "foreground_pct": round(foreground_pct, 1),
            "alpha_roughness": round(alpha_roughness, 1),
            "interior_hole_pct": round(interior_hole_pct, 1),
        }
    })


@app.post("/passport/enhance")
async def enhance_passport_photo(
    file: UploadFile = File(...),
    skin_softening: bool = Query(True, description="Enable skin softening"),
    studio_lighting: bool = Query(True, description="Enable face lighting correction"),
    sharpness: bool = Query(True, description="Enable smart sharpening")
):
    """
    Accept an image, apply advanced portrait enhancements (skin softening,
    studio lighting, and sharpening), preserving transparency, and return base64.
    """
    global _total_tasks_processed

    # Validate file type
    ALLOWED = {"image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"}
    ct = (file.content_type or "").lower()
    if ct not in ALLOWED and not ct.startswith("image/"):
        raise HTTPException(status_code=400, detail="Unsupported file type. Upload JPG, PNG, or HEIC.")

    raw = await file.read()
    try:
        pil_img = Image.open(io.BytesIO(raw))
        pil_img = ImageOps.exif_transpose(pil_img)
        pil_img = pil_img.convert("RGBA")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read image: {e}")

    # Convert to NumPy array
    arr = np.array(pil_img)
    rgb = arr[:, :, :3]
    alpha = arr[:, :, 3]

    # Convert RGB to OpenCV BGR
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)

    # 1. Skin Softening & Blemish Removal (via skin color mask + Bilateral Filter)
    if skin_softening:
        # Detect face first to narrow down skin softening
        face_box = _detect_face(bgr)

        # Convert to YCrCb color space for skin detection
        ycrcb = cv2.cvtColor(bgr, cv2.COLOR_BGR2YCrCb)
        lower_skin = np.array([0, 135, 85], dtype=np.uint8)
        upper_skin = np.array([255, 180, 135], dtype=np.uint8)
        skin_mask = cv2.inRange(ycrcb, lower_skin, upper_skin)

        # Smooth the mask to avoid spotty boundaries
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel)
        skin_mask = cv2.GaussianBlur(skin_mask, (5, 5), 0)

        # Restrict skin mask to the face box area (with margin) if face is found
        if face_box is not None:
            fx, fy, fw, fh = face_box
            head_mask = np.zeros_like(skin_mask)
            h, w = skin_mask.shape
            y1 = max(0, int(fy - fh * 0.2))
            y2 = min(h, int(fy + fh * 1.5))
            x1 = max(0, int(fx - fw * 0.2))
            x2 = min(w, int(fx + fw * 1.2))
            head_mask[y1:y2, x1:x2] = 255
            skin_mask = cv2.bitwise_and(skin_mask, head_mask)

        # Apply Bilateral Filter (preserves edges like eyes, mouth, hair)
        smoothed = cv2.bilateralFilter(bgr, d=7, sigmaColor=30, sigmaSpace=30)

        # Blend original & smoothed using the skin mask
        mask_normalized = skin_mask.astype(float) / 255.0
        mask_normalized = np.expand_dims(mask_normalized, axis=2)
        bgr = (smoothed * mask_normalized + bgr * (1.0 - mask_normalized)).astype(np.uint8)

    # 2. Studio Lighting (via CLAHE in LAB color space)
    if studio_lighting:
        lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        
        # Balance illumination on L channel
        clahe = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8, 8))
        cl = clahe.apply(l_channel)
        
        lab = cv2.merge((cl, a_channel, b_channel))
        bgr = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    # 3. Smart Sharpening (via Unsharp Masking)
    if sharpness:
        gaussian = cv2.GaussianBlur(bgr, (0, 0), 1.5)
        # Add high-frequency details back
        bgr = cv2.addWeighted(bgr, 1.4, gaussian, -0.4, 0)

    # Reconstruct RGBA Image
    enhanced_rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    h, w, _ = enhanced_rgb.shape
    enhanced_rgba = np.zeros((h, w, 4), dtype=np.uint8)
    enhanced_rgba[:, :, :3] = enhanced_rgb
    enhanced_rgba[:, :, 3] = alpha

    out_img = Image.fromarray(enhanced_rgba)
    b64 = _image_to_base64(out_img, fmt="PNG")

    _total_tasks_processed += 1

    return JSONResponse({
        "image": b64,
        "width": out_img.width,
        "height": out_img.height,
    })
@app.post("/passport/digital-export")
async def digital_export_passport_photo(
    file: UploadFile = File(...),
    target_width: int = Query(630, description="Target pixel width (Passport Seva: 630)"),
    target_height: int = Query(810, description="Target pixel height (Passport Seva: 810)"),
    max_kb: int = Query(240, description="Maximum file size in KB")
):
    """
    Export a passport photo as a portal-ready JPEG.

    Default output: Passport Seva portal format (630×810 px, <250 KB).
    Research source: passportindia.gov.in requires exactly 630×810 px JPEG < 250 KB.
    Face coverage must be 80-85% of photo height.
    """
    global _total_tasks_processed

    ALLOWED = {"image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"}
    ct = (file.content_type or "").lower()
    if ct not in ALLOWED and not ct.startswith("image/"):
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    raw = await file.read()
    if len(raw) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum 20 MB.")

    try:
        pil_img = Image.open(io.BytesIO(raw))
        pil_img = ImageOps.exif_transpose(pil_img)
        pil_img = pil_img.convert("RGBA")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read image: {e}")

    # Resize to exact target dimensions using high-quality Lanczos
    resized = pil_img.resize((target_width, target_height), Image.LANCZOS)

    # Composite onto pure white background (RGBA → RGB)
    # Pure white #FFFFFF = RGB(255,255,255) — mandatory for Indian govt docs
    white_bg = Image.new("RGB", (target_width, target_height), (255, 255, 255))
    if resized.mode == "RGBA":
        white_bg.paste(resized, mask=resized.split()[3])
    else:
        white_bg.paste(resized.convert("RGB"))

    # Compress to JPEG targeting max_kb (binary search on quality)
    quality = 90
    buf = io.BytesIO()
    while quality >= 50:
        buf.seek(0)
        buf.truncate()
        white_bg.save(buf, format="JPEG", quality=quality, optimize=True)
        if buf.tell() <= max_kb * 1024:
            break
        quality -= 5

    file_size_kb = round(buf.tell() / 1024, 1)
    buf.seek(0)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    _total_tasks_processed += 1

    return JSONResponse({
        "image": f"data:image/jpeg;base64,{b64}",
        "width": target_width,
        "height": target_height,
        "size_kb": file_size_kb,
        "quality": quality,
        "within_limit": file_size_kb <= max_kb,
        "portal": "Passport Seva (passportindia.gov.in)" if target_width == 630 else "Custom",
    })

def _order_points(pts):
    xSorted = pts[np.argsort(pts[:, 0]), :]
    leftMost = xSorted[:2, :]
    rightMost = xSorted[2:, :]
    leftMost = leftMost[np.argsort(leftMost[:, 1]), :]
    (tl, bl) = leftMost
    rightMost = rightMost[np.argsort(rightMost[:, 1]), :]
    (tr, br) = rightMost
    return np.array([tl, tr, br, bl], dtype="float32")

def _four_point_transform(image, pts):
    rect = _order_points(pts)
    (tl, tr, br, bl) = rect
    widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    maxWidth = max(int(widthA), int(widthB))
    heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    maxHeight = max(int(heightA), int(heightB))
    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]], dtype="float32")
    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
    return warped

@app.post("/document/clean-scan")
async def clean_scan_document(
    file: UploadFile = File(...),
    apply_crop: bool = Query(False, description="Apply heuristic edge detection and crop"),
    points: str = Form(None, description="JSON string of 4 points [[x,y],[x,y],[x,y],[x,y]]"),
    enhance: bool = Query(True, description="Apply shadow removal and contrast enhancement")
):
    global _total_tasks_processed
    ALLOWED = {"image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"}
    ct = (file.content_type or "").lower()
    if ct not in ALLOWED and not ct.startswith("image/"):
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    raw = await file.read()
    if len(raw) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum 20 MB.")

    try:
        pil_img = Image.open(io.BytesIO(raw))
        pil_img = ImageOps.exif_transpose(pil_img)
        pil_img = pil_img.convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read image: {e}")

    bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    screenCnt = None
    if points is not None:
        import json
        try:
            pts_array = json.loads(points)
            if len(pts_array) == 4:
                screenCnt = np.array(pts_array, dtype="float32")
                bgr = _four_point_transform(bgr, screenCnt)
        except Exception as e:
            logger.warning(f"Failed to parse or apply custom points: {e}")
    elif apply_crop:
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (5, 5), 0)
        edged = cv2.Canny(gray, 75, 200)

        cnts, _ = cv2.findContours(edged.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        cnts = sorted(cnts, key=cv2.contourArea, reverse=True)[:5]

        for c in cnts:
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.02 * peri, True)
            if len(approx) == 4:
                screenCnt = approx
                break

        if screenCnt is not None:
            bgr = _four_point_transform(bgr, screenCnt.reshape(4, 2))

    if enhance:
        lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        
        cl = cv2.normalize(cl, None, 0, 255, cv2.NORM_MINMAX)
        lab = cv2.merge((cl, a, b))
        bgr = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        bgr = cv2.filter2D(bgr, -1, kernel)

    enhanced_rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    out_img = Image.fromarray(enhanced_rgb)
    b64 = _image_to_base64(out_img, fmt="JPEG")

    _total_tasks_processed += 1

    return JSONResponse({
        "image": b64,
        "width": out_img.width,
        "height": out_img.height,
        "crop_applied": (apply_crop and screenCnt is not None) or (points is not None)
    })
