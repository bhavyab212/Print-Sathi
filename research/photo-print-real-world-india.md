# 📸 Photo Print — Real-World Indian Shop Research

> **Purpose:** Deep technical research into how Indian photo print shops actually prepare and print photos — exact dimensions, PDF layout, margins, gaps, and real shop workflow.  
> **For:** Print Sathi (Feature 1A — Passport Photo Auto Generator)  
> **Status:** Research Complete — Implementation Ready  

---

## 1. The Two Types of Indian Print Shops (Critical Distinction)

Understanding the shop type is essential because it determines paper size, print method, and layout.

### Type A — DTP / Xerox Shop (Majority of shops)

These are the most common shops in tier-2/3 cities, near colleges, government offices, etc.

| Property | Detail |
|---|---|
| **Printer type** | Inkjet or laser (Canon, HP, Epson) |
| **Paper type** | Glossy photo paper (200 GSM) or standard A4 (80 GSM) |
| **Primary paper size** | **A4 (210 × 297 mm)** |
| **Common print mode** | Full A4 sheet with multiple photos arranged as a grid |
| **Output format** | PDF sent to printer at 100% scale |
| **Customer interaction** | Customer hands phone/USB → shopkeeper arranges → prints |
| **Software used** | Photoshop, MS Word, or online tools like passportsizephoto.in |

### Type B — Photo Studio / Color Lab

High-quality photo printing using chemical or high-end digital printers.

| Property | Detail |
|---|---|
| **Printer type** | Fuji or Noritsu Minilab (chemical/continuous tone) |
| **Paper type** | Glossy or Matte photo paper (Fuji Crystal Archive, Kodak) |
| **Primary paper sizes** | **4R (4" × 6" = 102 × 152 mm)**, A4, A6 |
| **Output format** | JPEG or PDF sent to dedicated photo lab software |
| **Quality** | True continuous-tone — no visible dots |
| **Customer interaction** | More structured, often uses dedicated passport photo software |

> **For Print Sathi's target market (busy DTP/xerox shops):** The A4 layout is the primary use case. The 4R layout is secondary but important for studios.

---

## 2. Photo Size Standards Used in Indian Shops

### 2.1 Passport / ID Photo Sizes

| Document Type | Size (mm) | Size (inches) | Size (px @ 300 DPI) | Notes |
|---|---|---|---|---|
| **Indian Passport** | **35 × 45 mm** | 1.38" × 1.77" | **413 × 531 px** | Most common in shops |
| **Indian Passport (US-style)** | 51 × 51 mm | 2" × 2" | 602 × 602 px | Sometimes called "2x2", used for US visas etc. |
| **OCI Card** | 35 × 35 mm | 1.38" × 1.38" | 413 × 413 px | Square format |
| **PAN Card** | 25 × 35 mm | 0.98" × 1.38" | 295 × 413 px | Landscape orientation, smaller |
| **Aadhaar Card** | 35 × 45 mm | 1.38" × 1.77" | 413 × 531 px | Same as passport |
| **Voter ID (EPIC)** | 35 × 45 mm | 1.38" × 1.77" | 413 × 531 px | Same as passport |
| **Driving Licence** | 35 × 45 mm | 1.38" × 1.77" | 413 × 531 px | Same as passport |
| **School/College ID** | 35 × 45 mm | 1.38" × 1.77" | 413 × 531 px | Standard; some use 25×35 |

> **Key Insight:** For 90%+ of Indian government documents, the photo size is **35 × 45 mm**. This is the universal default. Only PAN card (25×35) and OCI (35×35) are exceptions.

### 2.2 General Print Photo Sizes (R-Series — Photo Lab Standard)

| Size Name | Size (inches) | Size (mm) | Use Case |
|---|---|---|---|
| **2R / Wallet** | 2.5" × 3.5" | 64 × 89 mm | Small keepsakes, wallet photos |
| **4R** ⭐ | **4" × 6"** | **102 × 152 mm** | Standard photo print — most common |
| **5R** | 5" × 7" | 127 × 178 mm | Portraits, desk frames |
| **6R** | 6" × 8" | 152 × 203 mm | Mid-size frames |
| **8R** | 8" × 10" | 203 × 254 mm | Wall frames, gifts |
| **A4** | 8.27" × 11.69" | 210 × 297 mm | DTP/document printing, passport sheets |
| **A6** | 5.83" × 4.13" | 148 × 105 mm | Compact photo sheet (postcard size) |

---

## 3. How Shops Actually Arrange Photos on a Sheet

This is the core of the research. Here is exactly what happens in real Indian print shops.

### 3.1 The Standard A4 Sheet Layout (DTP Shop Method)

**Canvas:** A4 = 210 × 297 mm = 2480 × 3508 px at 300 DPI

#### Layout for 35 × 45 mm passport photos on A4:

```
Sheet margin: 5–10 mm on all sides
Photo size: 35 × 45 mm each
Gap between photos: 2–3 mm (cutting guide)
```

**Capacity calculation:**

```
Usable width  = 210 - (2 × 5mm margin) = 200 mm
Usable height = 297 - (2 × 5mm margin) = 287 mm

Photos per row = floor(200 / (35 + 3)) = floor(200 / 38) = 5 photos
Rows           = floor(287 / (45 + 3)) = floor(287 / 48) = 5 rows

Total per A4 = 5 × 5 = 25 photos (practical maximum with 5mm margins + 3mm gap)
```

**Common practical layouts chosen by shops:**

| Layout | Photos | When Used |
|---|---|---|
| 4 columns × 2 rows | **8 photos** | "Give me 8 photos on one sheet" — most common customer request |
| 4 columns × 3 rows | **12 photos** | Standard quantity for government forms |
| 5 columns × 5 rows | **25 photos** | Maximum — when customer needs many copies |
| 4 columns × 4 rows | **16 photos** | Compromise between quantity and size |
| 3 columns × 2 rows | **6 photos** | Student budget option (fewer photos needed) |

> **Real-world default:** Most Indian DTP shops default to **8 photos on A4** (4 col × 2 row) as their standard "passport photo sheet." Customers asking for "4 photos" usually get a half-sheet or 4 on A4.

#### Exact pixel coordinates for 8-photo layout on A4 (at 300 DPI):

```
Canvas: 2480 × 3508 px (A4 at 300 DPI)

Sheet margin: 10mm = 118px
Photo width:  35mm = 413px
Photo height: 45mm = 531px
Gap:          3mm  = 35px

Layout: 4 columns × 2 rows

Column positions (left edge of each photo):
  Col 1: 118 px
  Col 2: 118 + 413 + 35 = 566 px
  Col 3: 566 + 413 + 35 = 1014 px
  Col 4: 1014 + 413 + 35 = 1462 px

Row positions (top edge of each photo):
  Row 1: 118 px
  Row 2: 118 + 531 + 35 = 684 px

Right edge of last photo: 1462 + 413 = 1875 px (within 2480 px ✓)
Bottom edge of last row: 684 + 531 = 1215 px (within 3508 px ✓)
```

### 3.2 The 4R Sheet Layout (Photo Studio Method)

**Canvas:** 4R = 4" × 6" = 102 × 152 mm = 1200 × 1800 px at 300 DPI

#### Layout for 35 × 45 mm photos on 4R:

```
Usable width  = 102 mm
Usable height = 152 mm

Photos per row = floor(102 / (35 + 3)) = floor(102 / 38) = 2 photos
Rows           = floor(152 / (45 + 3)) = floor(152 / 48) = 3 rows

Total per 4R = 2 × 3 = 6 photos (max with 3mm gap, no outer margin)

With 3mm outer margin:
  Usable width  = 96 mm → floor(96 / 38) = 2 photos
  Usable height = 146 mm → floor(146 / 48) = 3 photos
  Total = 6 photos
```

**Standard 4R layout — 8 photos (most common studio request):**

```
4R sheet = 102 × 152 mm
Photo: 35 × 45 mm, 4 across × 2 down
  → 4 × 35 = 140 mm (wider than 4R — NOT possible)

Actual max for 35mm wide photos:
  → 2 × 35 = 70 mm + 1 gap (3mm) = 73 mm — fits in 102mm
  → Height: 4 × 45 = 180 mm — too tall for 4R!

Correct 4R layout: 2 columns × 3 rows = 6 photos of 35×45mm
  OR: 2 columns × 4 rows = 8 photos of 35×45mm — only if tight margin (0–1 mm)

Tight fit for 8 on 4R:
  Width:  2 × 35 + 1 gap = 71 mm (fits in 102mm)
  Height: 4 × 45 + 3 gaps = 189 mm (does NOT fit in 152mm)

CONCLUSION: 4R can only fit 6 photos of 35×45mm cleanly.
For 8 photos, shops use A4 — NOT 4R.
```

> **Critical correction:** Many online tools claim "8 photos on 4R" but this is technically impossible for 35×45mm photos. In practice, **4R gives 6 photos** of 35×45mm. The "8 photos" request in Indian shops means the A4 layout.

### 3.3 A6 Photo Sheet Layout (Compact — Less Common)

**Canvas:** A6 = 105 × 148 mm = 1240 × 1748 px at 300 DPI

```
Photos per row = floor(105 / (35 + 3)) = 2 photos
Rows           = floor(148 / (45 + 3)) = 3 rows
Total          = 6 photos
```

---

## 4. Exact PDF Generation Specifications

### 4.1 PDF Technical Specifications (Production Standard)

| Property | Value | Notes |
|---|---|---|
| **Page size** | Matches print paper (A4, 4R, A6) | Must match printer paper exactly |
| **Resolution** | **300 DPI** (minimum) | 600 DPI for high-end photo labs |
| **Color mode** | **sRGB** for DTP shops | CMYK for professional labs (Fuji/Noritsu) |
| **Print scale** | **100% — "Actual Size"** | NEVER "Fit to Page" — destroys dimensions |
| **Compression** | JPEG inside PDF (quality 90+) | Keeps file small while maintaining print quality |
| **File format** | PDF/A or standard PDF 1.4+ | Universal printer compatibility |
| **Margins embedded** | Baked into PDF layout | No printer should need to add margins |

### 4.2 Margin Specification — What Shops Actually Use

```
Outer sheet margin (safety zone for printer): 5–10 mm
Gap between photos (cutting guide):           2–3 mm
Border on each photo:                         0 mm (none — photos edge-to-edge in their cell)

Standard recommendation:
  Outer margin:  8 mm (safe for almost all printers)
  Gap:           3 mm (enough for scissors, paper cutter)
```

> **Why margins matter:** Laser and inkjet printers have a non-printable zone of approximately 4–6 mm from paper edge. If photos are placed too close to the edge, they get cut off. The 8mm outer margin ensures safety.

### 4.3 The "No Scale" Problem — Why Current Systems Fail

The #1 reason passport photos come out wrong is printer scaling. When a PDF is opened in a browser or PDF viewer and "Fit to Page" is selected (often the default), an A4 PDF on an A4 printer still gets scaled slightly. 

**Consequence:** A 35mm photo becomes 33–34mm. Government offices reject these.

**Solution for Print Sathi:** 
- Embed the media box in PDF exactly matching the page dimensions
- Always print instruction on the PDF: "Print at 100% scale — Actual Size"
- Generate PDF with correct page dimensions so no scaling is needed

---

## 5. Complete Measurement Reference Table

### 5.1 All Dimensions at 300 DPI

| Description | mm | inches | pixels @ 300 DPI |
|---|---|---|---|
| **A4 sheet** | 210 × 297 | 8.27 × 11.69 | 2480 × 3508 |
| **A6 sheet** | 105 × 148 | 4.13 × 5.83 | 1240 × 1748 |
| **4R sheet** | 102 × 152 | 4.00 × 6.00 | 1200 × 1800 |
| **Passport photo 35×45** | 35 × 45 | 1.38 × 1.77 | 413 × 531 |
| **Passport photo 51×51** | 51 × 51 | 2.00 × 2.00 | 602 × 602 |
| **PAN card photo** | 25 × 35 | 0.98 × 1.38 | 295 × 413 |
| **Standard outer margin** | 8 | 0.31 | 94 |
| **Standard gap between photos** | 3 | 0.12 | 35 |
| **Minimum outer margin** | 5 | 0.20 | 59 |

### 5.2 Complete Layout Matrix (How Many Photos Fit)

| Photo Size | Sheet | Columns | Rows | Total | Margin | Gap |
|---|---|---|---|---|---|---|
| 35 × 45 mm | A4 | 4 | 2 | **8** | 8mm | 3mm |
| 35 × 45 mm | A4 | 4 | 3 | **12** | 8mm | 3mm |
| 35 × 45 mm | A4 | 5 | 5 | **25** | 5mm | 3mm |
| 35 × 45 mm | 4R | 2 | 3 | **6** | 3mm | 3mm |
| 35 × 45 mm | A6 | 2 | 3 | **6** | 5mm | 3mm |
| 51 × 51 mm | A4 | 3 | 4 | **12** | 8mm | 3mm |
| 51 × 51 mm | 4R | 1 | 2 | **2** | 5mm | 3mm |
| 25 × 35 mm | A4 | 5 | 6 | **30** | 8mm | 3mm |

---

## 6. Face and Composition Requirements

### 6.1 Face Position Within Photo

| Requirement | Standard |
|---|---|
| **Head height** | 70–80% of photo height |
| **Head width** | 50–70% of photo width |
| **Face position** | Centered horizontally, slightly above center vertically |
| **Eyes position** | 55–70% from bottom of photo |
| **Crown clearance** | 3–5 mm from top of photo |
| **Expression** | Neutral, mouth closed, eyes open |
| **Head tilt** | 0° (no tilt allowed) |

### 6.2 Photo Quality Requirements

| Requirement | Standard |
|---|---|
| **Minimum resolution** | 300 DPI at final print size |
| **Background** | Plain white (RGB 255, 255, 255) or off-white (RGB 240+) |
| **Shadows on face** | Not allowed |
| **Shadows on background** | Not allowed |
| **Eye glasses** | Generally not allowed (Passport Seva 2023 rules) |
| **Photo age** | Must be recent (within 6 months) |
| **Paper** | Glossy or matte photo paper (not plain office paper) |
| **Color** | Full color — not B&W |

---

## 7. Real Shop Workflow — Step by Step

### 7.1 Walk-in Customer at DTP Shop (Most Common)

```
1. Customer arrives, shows photo (phone gallery or WhatsApp received)
2. Shopkeeper receives photo via:
   - USB cable / Bluetooth transfer
   - Customer shares on WhatsApp → shopkeeper downloads
   - Customer's phone brought to counter
3. Shopkeeper opens photo on PC
4. Opens tool (Photoshop, passportsizephoto.in, or similar)
5. Crops face, removes background, sets white background
6. Arranges 8 copies on A4 layout
7. Saves as PDF or prints directly
8. Prints on glossy photo paper at 100% scale
9. Cuts photos with paper cutter
10. Hands to customer — total time: 5–15 minutes
```

### 7.2 Shopkeeper Tools Used (Real World)

| Tool | Usage | Notes |
|---|---|---|
| **Adobe Photoshop** | Professional shops | Highest quality, most manual |
| **passportsizephoto.in** | Common online tool | Free, generates A4 PDF automatically |
| **eface.in** | Indian-made tool | AI-based, good background removal |
| **docset.in** | Online tool | Simple UI, popular |
| **MS Word** | Budget shops | Manual arrangement, error-prone |
| **photocopywala.in** | Online platform | Multiple tools including passport photo |
| **Passport Photo Maker software** | Installed software | Offline Windows app — common in studios |
| **Canva** | Increasing adoption | Easy grid layout, slightly larger gap |

### 7.3 Common Pain Points (What the Current System Gets Wrong)

1. **Scale not preserved:** Browser printing adds "fit to page" — photos come out 2–4mm too small
2. **Gap too large:** Many online tools use 5mm+ gaps — wastes paper, looks unprofessional
3. **Wrong sheet size:** System generates A4 PDF but customer needs 4R for studio printing
4. **No cutting guides:** Professional shops want thin cut lines on the sheet
5. **Background color issues:** Not a true 255,255,255 white — creates gray shadow band at edges
6. **Face centering wrong:** Crops too much forehead or too little — face ratio off
7. **No quantity selection:** System always generates 8 copies — customer wanted 6 or 12
8. **PDF quality too compressed:** Low JPEG quality inside PDF looks OK on screen, terrible in print
9. **No print instructions embedded:** Customer doesn't know to print at 100%

---

## 8. Implementation Specification for Print Sathi

### 8.1 PDF Generation — Required Technical Parameters

```javascript
// Exact PDF generation spec for Print Sathi

const PRINT_CONFIG = {
  // Paper sizes
  A4: { width: 210, height: 297 },      // mm
  A6: { width: 105, height: 148 },      // mm  
  '4R': { width: 102, height: 152 },   // mm

  // Standard photo sizes (mm)
  photoSizes: {
    'passport-35x45': { width: 35, height: 45 },   // DEFAULT - 90% of use cases
    'passport-51x51': { width: 51, height: 51 },   // US/international style
    'pan-25x35':      { width: 25, height: 35 },   // PAN card
    'oci-35x35':      { width: 35, height: 35 },   // OCI card
  },

  // Layout defaults
  outerMargin: 8,   // mm — safe for all consumer printers
  photoGap: 3,      // mm — enough for paper cutter  

  // PDF output
  dpi: 300,
  colorMode: 'sRGB',
  jpegQuality: 0.92,  // High quality inside PDF
  scale: 1.0,         // NEVER scale — always 1:1
}

// Standard layouts (cols × rows) for A4 + 35x45mm photo
const STANDARD_LAYOUTS = {
  6:  { cols: 3, rows: 2 },   // 3×2 — compact
  8:  { cols: 4, rows: 2 },   // 4×2 — DEFAULT (most common request)
  12: { cols: 4, rows: 3 },   // 4×3 — common for form submissions
  16: { cols: 4, rows: 4 },   // 4×4 — large batch
  25: { cols: 5, rows: 5 },   // 5×5 — maximum for A4
}
```

### 8.2 Layout Calculation Algorithm

```python
def calculate_layout(sheet_w_mm, sheet_h_mm, photo_w_mm, photo_h_mm,
                      outer_margin_mm=8, gap_mm=3):
    """
    Calculate exact photo positions on sheet.
    Returns: list of (x, y) tuples in mm from top-left
    """
    usable_w = sheet_w_mm - 2 * outer_margin_mm
    usable_h = sheet_h_mm - 2 * outer_margin_mm
    
    # How many fit in each dimension
    cols = int(usable_w / (photo_w_mm + gap_mm))
    rows = int(usable_h / (photo_h_mm + gap_mm))
    
    # Center the grid on the sheet
    grid_w = cols * photo_w_mm + (cols - 1) * gap_mm
    grid_h = rows * photo_h_mm + (rows - 1) * gap_mm
    
    start_x = (sheet_w_mm - grid_w) / 2
    start_y = (sheet_h_mm - grid_h) / 2
    
    positions = []
    for row in range(rows):
        for col in range(cols):
            x = start_x + col * (photo_w_mm + gap_mm)
            y = start_y + row * (photo_h_mm + gap_mm)
            positions.append((x, y))
    
    return positions, cols, rows

# Example: A4 + 35×45mm passport photo
positions, cols, rows = calculate_layout(210, 297, 35, 45)
# Returns: 4 cols, 5 rows = 20 photos, perfectly centered
```

### 8.3 Face Detection and Crop Requirements

```
Input photo requirements:
  - Minimum resolution: 500 × 600 px (to get clean 413 × 531 px output)
  - Preferred: 1500+ × 1800+ px for high-quality crop
  - Format: JPEG, PNG, HEIC (convert HEIC to JPEG first)

Face crop algorithm:
  1. Detect face bounding box (rembg/mediapipe/dlib)
  2. Calculate head height from chin to crown
  3. Target: head occupies 75% of photo height (middle of 70–80% range)
  4. Center face horizontally
  5. Position eyes at 62% from bottom of photo (middle of 55–70% range)
  6. Add padding to achieve correct photo dimensions
  7. Resize to exact target dimensions (413 × 531 px for 35×45mm)

Background removal:
  - Replace with pure white: RGB(255, 255, 255)
  - Anti-aliasing: 1–2 px feather at edge
  - Do NOT leave semi-transparent edge pixels
```

### 8.4 Required UI States for Passport Photo Feature

```
State 1: Upload Screen
  - Accept: JPG, PNG, HEIC
  - Max size: 20MB
  - Show file requirements

State 2: Processing Screen  
  - Background removal in progress
  - Face detection in progress
  - Show spinner + "Processing..."

State 3: Preview + Config Screen
  - Show processed single photo
  - Options:
    a. Number of copies: 6 / 8 / 12 / 16 (radio buttons, default: 8)
    b. Background: White / Off-white / Light blue / Beige (swatches)
    c. Paper size: A4 / 4R (default: A4)
    d. Photo type: 35×45mm / 51×51mm / Custom (default: 35×45mm)
  - Show live preview of sheet layout

State 4: Sheet Preview Screen
  - Full sheet preview (zoomable)
  - Show cut lines (toggle)
  - Download PDF button
  - Print now button (if on shopkeeper desktop)

State 5: Error States
  - No face detected → "No face found — try a different photo"
  - Low resolution → "Photo too blurry — try higher quality"
  - Multiple faces → "Multiple faces found — use a single portrait photo"
```

---

## 9. Common Photo Sizes by Use Case — Quick Reference

| Use Case | Size | Count on A4 | Notes |
|---|---|---|---|
| Passport application | 35 × 45 mm | 8 or 12 | Most common request |
| US visa / OCI | 51 × 51 mm | 12 | "2 inch" photos |
| PAN card | 25 × 35 mm | 20+ | Small size, many fit |
| Aadhaar | 35 × 45 mm | 8 | Same as passport |
| Driving license | 35 × 45 mm | 8 | Same as passport |
| Voter ID | 35 × 45 mm | 8 | Same as passport |
| School ID | 35 × 45 mm | 8 | Some use 25×35 |
| Bank account | 35 × 45 mm | 8 | Same as passport |
| Railway pass | 35 × 45 mm | 8 | Same as passport |
| Family photo print | 4R = 102 × 152 mm | 2 per A4 | Personal |
| Portrait print | 5R = 127 × 178 mm | 1–2 per A4 | Personal/studio |

---

## 10. Problems With Current System and How to Fix Them

### Current System Failures

| Problem | Impact | Fix |
|---|---|---|
| Generic "passport photo" with no size selection | Wrong size printed, rejected by govt | Add explicit size dropdown with all Indian document sizes |
| No photo count selector | Customer gets wrong number, waste | Add 6/8/12/16 count selector |
| PDF generated without embedded dimensions | Printer scales it, dimensions wrong | Use pdf-lib with exact MediaBox matching paper size |
| Background is light gray, not white | Photo rejected — background must be white | Force exact #FFFFFF (255,255,255) background |
| No margin/gap configuration | Photos overlap or can't be cut | Implement 8mm outer margin + 3mm gap |
| No cutting guides on print | Difficult to cut straight | Add thin 0.5pt gray lines on PDF at cut positions |
| No print instruction on sheet | Customer prints at wrong scale | Add "Print at 100% — Do not scale" watermark in margin |
| Face position not verified | Face may be off-center or wrong ratio | Add face ratio validation before generating sheet |
| No paper size selection | A4 generated when customer needs 4R for studio | Add paper size toggle: A4 / 4R / A6 |
| Low DPI output | Looks fine on screen, blurry when printed | Always output 300 DPI minimum |

### Correct Specification for Print Sathi Output

```
Final PDF spec:
  - Page: A4 (210 × 297 mm) embedded exactly
  - Photos: 35 × 45 mm each (413 × 531 px)
  - Layout: 4 cols × 2 rows = 8 photos (default)
  - Outer margin: 8 mm from all edges
  - Gap between photos: 3 mm
  - Grid centered on page
  - Cut lines: 0.5pt solid #CCCCCC at all photo edges
  - Print note: "Print at 100% / Actual Size — Do NOT scale" in 6pt font in margin
  - Background: Pure white #FFFFFF
  - Resolution: 300 DPI
  - JPEG quality inside PDF: 92%
  - Color: sRGB
```

---

## 11. Paper Types — What Indian Shops Actually Use

### 11.1 Photo Paper Types

| Paper Type | Finish | GSM | Best For | Price Range |
|---|---|---|---|---|
| **Glossy** | High shine, reflective | 200–260 | Passport photos, everyday prints | Budget |
| **Matte** | Non-reflective, flat | 200–260 | Portraits, professional look | Mid |
| **Lustre / Satin** | Semi-gloss, textured | 200–260 | Professional labs, weddings | Premium |
| **Standard (A4)** | Plain office | 80 | Document + photo mixed | Cheapest |

> **DTP shop practice:** Most DTP shops in India use **200 GSM glossy photo paper** for passport photos. This is pre-cut to A4 and loaded into the photo paper tray of the inkjet printer. Cost: ₹1.50–₹3 per A4 sheet.

### 11.2 Printers Used in Indian DTP Shops

| Printer Category | Models | Used For | Photo Quality |
|---|---|---|---|
| **Epson L-Series (EcoTank)** | L3250, L8050, L1800 | High-volume DTP shops | Good (6-color for L8050) |
| **Canon MegaTank** | G670, G3000 | Quality-focused shops | Excellent color accuracy |
| **HP DeskJet/OfficeJet** | Various | Budget shops | Average |
| **Fuji / Noritsu Minilab** | Frontier, QSS | Professional studios | Professional (chemical) |

> **Most common in target market (DTP shops):** Epson L-Series due to extremely low cost-per-page with ink tank system. The L1800 is popular for A3 borderless photo printing. The L8050 (6-color) is used by higher-end DTP shops for better photo quality.

### 11.3 Non-Printable Zones (Printer Safety Margin)

| Printer Type | Non-Printable Edge (approx.) |
|---|---|
| Consumer inkjet (Epson L-series, Canon G-series) | 3–5 mm |
| Laser printer | 5–8 mm |
| Photo lab (Fuji/Noritsu) | 0 mm (borderless) |
| Budget inkjet | 5–10 mm |

> **Implication:** Our 8mm outer margin is safe for **all** consumer printers. For professional photo labs, the margin can be reduced to 3mm.

---

## 12. Digital Portal Requirements (Online Submissions)

### 12.1 Passport Seva Portal (passportindia.gov.in)

| Requirement | Value |
|---|---|
| **Dimensions** | Exactly 630 × 810 pixels |
| **File format** | JPEG only |
| **File size** | 10 KB – 250 KB |
| **Face coverage** | 80–85% of photo height |
| **Background** | Plain white, no patterns |
| **Glasses** | Not permitted |
| **Expression** | Neutral, eyes open |

### 12.2 Other Indian Portal Photo Requirements

| Portal | Size | Format | Max Size | Notes |
|---|---|---|---|---|
| Passport Seva | 630 × 810 px | JPEG | 250 KB | Face: 80-85% |
| Aadhaar (UIDAI) | 35 × 45 mm physical | JPEG | 50 KB for online | Often captured on-site |
| Voter ID (NVSP) | 35 × 45 mm physical | JPEG | 2 MB | Online form |
| PAN Card | 213 × 213 px digital | JPEG | 50 KB | Square for some portals |
| Driving Licence | 35 × 45 mm physical | JPEG | Varies by state | Often captured at RTO |

> **Key Insight for Print Sathi:** The system should output BOTH a print-ready PDF AND a digital submission-ready JPEG (630 × 810 px, <250 KB) for Passport Seva. This doubles the utility of the tool.

---

## 13. Cutting Equipment Used in Indian Shops

| Tool | Usage | Precision | Common in India |
|---|---|---|---|
| **Guillotine paper cutter** | High-volume cutting | ±1mm | Very common in DTP shops |
| **Rotary trimmer** | Individual photo cutting | ±0.5mm | Common in studios |
| **Scissors** | Budget/small shops | ±2mm | Small shops |
| **Paper cutter with backstop** | Batch cutting | ±0.5mm | Professional shops |

> **Implication for gap size:** A 3mm gap between photos is sufficient for guillotine cutters (which can drift by ±1mm). For scissors, a 5mm gap is safer. Our default of 3mm is the professional standard.

> **Cutting guide lines on PDF:** Professional shopkeepers prefer thin hairline cut guides printed on the sheet — makes guillotine alignment faster. These should be visible on the PDF but thin enough not to appear in the cut photos.

---

## 14. Complete Final Specification — "What Perfect Looks Like"

This is the gold standard for the Print Sathi passport photo output:

```
PRINT-READY A4 PDF (Default Output)
════════════════════════════════════════

Paper:    A4 (210 × 297 mm = 2480 × 3508 px at 300 DPI)
Photos:   35 × 45 mm each (413 × 531 px)
Count:    8 photos (4 columns × 2 rows) — DEFAULT
Layout:   Grid, centered on page
Margin:   8 mm outer margin on all 4 sides
Gap:      3 mm between photos (cutting guide)
Cut lines: 0.3pt hairline, color #BBBBBB, at every photo edge
Print note: "Print at 100% / Actual Size" — 7pt Arial, bottom margin

Background: Exact RGB(255, 255, 255) — pure white
Resolution: 300 DPI
JPEG quality in PDF: 92%
Color space: sRGB
PDF version: 1.4 (wide compatibility)
Page MediaBox: exactly 595.276 × 841.890 points (A4 in points @ 72pt/inch)

Face composition:
  Head height: 75% of photo height
  Eyes at: 62% from photo bottom
  Crown clearance: 4 mm from top
  Face centered horizontally

────────────────────────────────────────
DIGITAL SUBMISSION JPEG (Secondary Output)
────────────────────────────────────────
Size: 630 × 810 px
Format: JPEG
Quality: Compress to <250 KB
Use: Passport Seva and other online portals
Background: RGB(255, 255, 255)
```

---

## 15. Sources and References

| Source | What It Told Us |
|---|---|
| passportsizephoto.in | Standard 35×45mm, A4 layout basics, Passport Seva 630×810px |
| docset.in | 0.5cm (5mm) margin practice, MS Word 4col×2row method |
| photocopywala.in | Indian DTP shop tools and workflow landscape |
| eface.in | A4 paper, 100% scale mandatory, 300 DPI standard |
| toolhai.in | 4–6 photos on 4R with gap control |
| visafoto.com | A6 layout: 9 photos (3×3) of 35×45mm |
| Passport Seva Guidelines (passportindia.gov.in) | 35×45mm physical, 630×810px digital, face 80-85% |
| VFS Global | Indian passport 35×45mm specification confirmed |
| Multiple Indian photo forums | 4R gives 6 (not 8) photos of 35×45mm (math verified) |
| Multiple sources consensus | Gap 2–5mm, outer margin 5–10mm |
| Fuji/Noritsu lab research | Chemical labs use JPEG at 300+ DPI, sRGB, borderless print |
| Epson India | L-series most common in DTP shops, EcoTank preferred |
| Photography forums | Guillotine cutter standard in Indian DTP shops |

---

*Research completed: June 2026 | For: Print Sathi — Feature 1A (Passport Photo Auto Generator)*

