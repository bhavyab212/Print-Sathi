from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
import io
import base64
import logging

from PIL import Image
import cv2
import numpy as np

# Register HEIC/HEIF support via pillow-heif
try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass  # HEIC support optional; skip if not installed

try:
    from rembg import remove as rembg_remove, new_session
    _rembg_session = new_session("u2net")
except Exception:
    _rembg_session = None

logger = logging.getLogger("print-sathi")

app = FastAPI(
    title="Print Sathi Processing Service",
    description="Image processing API for passport photos, document conversion, and more.",
    version="0.1.0",
)

# CORS — allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
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
    Crop the image to passport proportions (35×45 mm → 7:9 ratio) centred
    on the detected face, with standard headroom above the face.

    Standard passport framing (Indian/ISO):
    - Face height ≈ 60-70% of total image height
    - Head (crown to chin) ≈ 70-80% of frame height
    - Chin sits about 30% from the bottom of the frame
    """
    img_w, img_h = pil_img.size
    fx, fy, fw, fh = face_box

    TARGET_RATIO = 35 / 45  # width / height (portrait)

    # Estimate head region: face bbox + 20% top headroom (crown) + 15% bottom (neck)
    head_top = int(fy - fh * 0.45)        # crown
    head_bottom = int(fy + fh * 1.25)     # chin + a bit of neck

    head_h = head_bottom - head_top
    # Scale so head occupies 70% of frame height
    frame_h = int(head_h / 0.70)
    frame_w = int(frame_h * TARGET_RATIO)

    # Centre horizontally on the face
    cx = fx + fw // 2
    x1 = cx - frame_w // 2
    y1 = head_top - int(frame_h * 0.05)   # tiny top margin

    # Clamp to image bounds
    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(img_w, x1 + frame_w)
    y2 = min(img_h, y1 + frame_h)

    return pil_img.crop((x1, y1, x2, y2))


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
    """Health check endpoint — used by UptimeRobot to keep Render awake."""
    return {
        "status": "ok",
        "service": "print-sathi-processing",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "rembg_ready": _rembg_session is not None,
    }


@app.get("/")
async def root():
    return {
        "service": "Print Sathi Processing API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.post("/passport/process")
async def process_passport_photo(file: UploadFile = File(...)):
    """
    Accept a portrait photo, remove its background, detect the face,
    and return a passport-cropped image as a base64 data-URI.

    Response:
        {
            "image": "data:image/png;base64,...",
            "width": <px>,
            "height": <px>,
            "face_detected": true
        }
    """
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
        pil_img = pil_img.convert("RGBA")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read image: {e}")

    # ── Remove background ─────────────────────────────────────────────────
    if _rembg_session is not None:
        try:
            pil_img = rembg_remove(pil_img, session=_rembg_session)
        except Exception as e:
            logger.warning("rembg failed: %s — continuing with original", e)
    else:
        logger.warning("rembg session not available — skipping background removal")

    # ── Detect face ───────────────────────────────────────────────────────
    bgr = _pil_to_cv2(pil_img)
    face_box = _detect_face(bgr)

    face_detected = face_box is not None

    if face_detected:
        cropped = _crop_to_passport(pil_img, face_box)
    else:
        # Fall back: return the BG-removed image without cropping.
        # Frontend will show a warning.
        cropped = pil_img

    # ── Compose onto white background ─────────────────────────────────────
    # Convert RGBA → white-backed PNG so transparent areas are clean white.
    white_bg = Image.new("RGB", cropped.size, (255, 255, 255))
    if cropped.mode == "RGBA":
        white_bg.paste(cropped, mask=cropped.split()[3])
    else:
        white_bg.paste(cropped.convert("RGB"))

    # ── Return ────────────────────────────────────────────────────────────
    b64 = _image_to_base64(white_bg, fmt="PNG")
    return JSONResponse({
        "image": b64,
        "width": white_bg.width,
        "height": white_bg.height,
        "face_detected": face_detected,
    })
