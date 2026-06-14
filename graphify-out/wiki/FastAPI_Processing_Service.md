# FastAPI Processing Service

> 25 nodes · cohesion 0.10

## Key Concepts

- **process_passport_photo()** (13 connections) — `/media/bhavya/backup and etc/Project/Printo_/apps/processing/main.py`
- **PassportPage web panel** (8 connections) — `apps/web/src/app/dashboard/passport/page.tsx`
- **main.py** (7 connections) — `/media/bhavya/backup and etc/Project/Printo_/apps/processing/main.py`
- **FileDropzone** (5 connections) — `apps/desktop/src/renderer/components/passport/passport/FileDropzone.tsx`
- **_crop_to_passport()** (3 connections) — `/media/bhavya/backup and etc/Project/Printo_/apps/processing/main.py`
- **_detect_face()** (3 connections) — `/media/bhavya/backup and etc/Project/Printo_/apps/processing/main.py`
- **_pil_to_cv2()** (3 connections) — `/media/bhavya/backup and etc/Project/Printo_/apps/processing/main.py`
- **health_check()** (2 connections) — `/media/bhavya/backup and etc/Project/Printo_/apps/processing/main.py`
- **_image_to_base64()** (2 connections) — `/media/bhavya/backup and etc/Project/Printo_/apps/processing/main.py`
- **ACCEPTED formats list** (1 connections) — `apps/web/src/components/passport/FileDropzone.tsx`
- **MAX_MB file size** (1 connections) — `apps/web/src/components/passport/FileDropzone.tsx`
- **_crop_to_passport image cropper** (1 connections) — `apps/processing/main.py`
- **_detect_face face detector** (1 connections) — `apps/processing/main.py`
- **_image_to_base64 serializer** (1 connections) — `apps/processing/main.py`
- **_pil_to_cv2 conversion helper** (1 connections) — `apps/processing/main.py`
- **Health check endpoint — used by UptimeRobot to keep Render awake.** (1 connections) — `/media/bhavya/backup and etc/Project/Printo_/apps/processing/main.py`
- **Accept a portrait photo, remove its background, detect the face,     and return** (1 connections) — `/media/bhavya/backup and etc/Project/Printo_/apps/processing/main.py`
- **Convert PIL image (RGBA or RGB) to OpenCV BGR.** (1 connections) — `/media/bhavya/backup and etc/Project/Printo_/apps/processing/main.py`
- **Return the (x, y, w, h) of the largest detected face, or None.** (1 connections) — `/media/bhavya/backup and etc/Project/Printo_/apps/processing/main.py`
- **Crop the image to passport proportions (35×45 mm → 7:9 ratio) centred     on the** (1 connections) — `/media/bhavya/backup and etc/Project/Printo_/apps/processing/main.py`
- **root()** (1 connections) — `/media/bhavya/backup and etc/Project/Printo_/apps/processing/main.py`
- **DEFAULT_CONFIG passport parameters** (1 connections) — `apps/web/src/app/dashboard/passport/page.tsx`
- **PhotoPreview live compositor** (1 connections) — `apps/web/src/app/dashboard/passport/page.tsx`
- **ProcessingScreen scanning status** (1 connections) — `apps/web/src/app/dashboard/passport/page.tsx`
- **STAGES pipeline step array** (1 connections) — `apps/web/src/app/dashboard/passport/page.tsx`

## Relationships

- No strong cross-community connections detected

## Source Files

- `/media/bhavya/backup and etc/Project/Printo_/apps/processing/main.py`
- `apps/desktop/src/renderer/components/passport/passport/FileDropzone.tsx`
- `apps/processing/main.py`
- `apps/web/src/app/dashboard/passport/page.tsx`
- `apps/web/src/components/passport/FileDropzone.tsx`

## Audit Trail

- EXTRACTED: 55 (89%)
- INFERRED: 7 (11%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*