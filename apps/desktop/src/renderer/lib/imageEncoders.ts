export function canvasToBMP(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D context");
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const width = imgData.width;
  const height = imgData.height;
  const data = imgData.data;

  const extraBytes = (width * 3) % 4;
  const paddingSize = extraBytes === 0 ? 0 : 4 - extraBytes;
  const rowSize = width * 3 + paddingSize;
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // File Header
  view.setUint16(0, 0x424D, false); // "BM"
  view.setUint32(2, fileSize, true); // File Size
  view.setUint32(6, 0, true); // Reserved
  view.setUint32(10, 54, true); // Offset to image data

  // Info Header
  view.setUint32(14, 40, true); // Header Size
  view.setUint32(18, width, true); // Width
  view.setUint32(22, height, true); // Height (positive for bottom-up)
  view.setUint16(26, 1, true); // Planes
  view.setUint16(28, 24, true); // Bits per Pixel (24 bit BGR)
  view.setUint32(30, 0, true); // Compression (None)
  view.setUint32(34, pixelDataSize, true); // Image Size
  view.setUint32(38, 2835, true); // X pixels per meter (72 DPI approx)
  view.setUint32(42, 2835, true); // Y pixels per meter
  view.setUint32(46, 0, true); // Total Colors
  view.setUint32(50, 0, true); // Important Colors

  // Pixel Data (Bottom-Up)
  const u8 = new Uint8Array(buffer, 54);
  let offset = 0;
  for (let y = height - 1; y >= 0; y--) {
    const rowStart = y * width * 4;
    for (let x = 0; x < width; x++) {
      const i = rowStart + x * 4;
      u8[offset++] = data[i + 2]; // B
      u8[offset++] = data[i + 1]; // G
      u8[offset++] = data[i];     // R
    }
    for (let p = 0; p < paddingSize; p++) {
      u8[offset++] = 0; // Padding
    }
  }

  return new Blob([buffer], { type: "image/bmp" });
}

export function canvasToTIFF(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get context");
  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height).data;

  const pixelCount = width * height;
  const pixelDataSize = pixelCount * 3;
  
  // Layout:
  // 0: Header (8 bytes)
  // 8: BitsPerSample values [8, 8, 8] (6 bytes)
  // 14: XResolution values [72, 1] (8 bytes)
  // 22: YResolution values [72, 1] (8 bytes)
  // 30: IFD starting offset (needs 2 bytes count + 12 entries * 12 bytes + 4 bytes next offset = 150 bytes)
  // 180: Pixel Data (RGB)
  
  const ifdOffset = 30;
  const pixelDataOffset = 180;
  const fileSize = pixelDataOffset + pixelDataSize;
  
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  
  // Header: "II" (0x4949) + Magic 42 (0x002A) + IFD Offset (30)
  view.setUint16(0, 0x4949, true);
  view.setUint16(2, 42, true);
  view.setUint32(4, ifdOffset, true);
  
  // BitsPerSample values: 8, 8, 8
  view.setUint16(8, 8, true);
  view.setUint16(10, 8, true);
  view.setUint16(12, 8, true);
  
  // XResolution values: 72, 1
  view.setUint32(14, 72, true);
  view.setUint32(18, 1, true);
  
  // YResolution values: 72, 1
  view.setUint32(22, 72, true);
  view.setUint32(26, 1, true);
  
  // IFD Entries count
  let offset = ifdOffset;
  view.setUint16(offset, 12, true); // 12 entries
  offset += 2;
  
  const writeEntry = (tag: number, type: number, count: number, valueOrOffset: number) => {
    view.setUint16(offset, tag, true);
    view.setUint16(offset + 2, type, true);
    view.setUint32(offset + 4, count, true);
    view.setUint32(offset + 8, valueOrOffset, true);
    offset += 12;
  };
  
  writeEntry(256, 3, 1, width); // ImageWidth
  writeEntry(257, 3, 1, height); // ImageLength
  writeEntry(258, 3, 3, 8); // BitsPerSample
  writeEntry(259, 3, 1, 1); // Compression: 1 (None)
  writeEntry(262, 3, 1, 2); // PhotometricInterpretation: 2 (RGB)
  writeEntry(273, 4, 1, pixelDataOffset); // StripOffsets
  writeEntry(277, 3, 1, 3); // SamplesPerPixel
  writeEntry(278, 4, 1, height); // RowsPerStrip
  writeEntry(279, 4, 1, pixelDataSize); // StripByteCounts
  writeEntry(282, 5, 1, 14); // XResolution
  writeEntry(283, 5, 1, 22); // YResolution
  writeEntry(296, 3, 1, 2); // ResolutionUnit: 2 (Inches)
  
  view.setUint32(offset, 0, true); // Next IFD (0)
  
  // Pixel Data (RGB format)
  const u8 = new Uint8Array(buffer, pixelDataOffset);
  let pOffset = 0;
  for (let i = 0; i < imgData.length; i += 4) {
    u8[pOffset++] = imgData[i];     // R
    u8[pOffset++] = imgData[i + 1]; // G
    u8[pOffset++] = imgData[i + 2]; // B
  }
  
  return new Blob([buffer], { type: "image/tiff" });
}

export function canvasToPDF(canvas: HTMLCanvasElement, quality: number = 0.9): Blob {
  const jpegUrl = canvas.toDataURL("image/jpeg", quality);
  const b64Data = jpegUrl.split(",")[1];
  const jpegBytes = Uint8Array.from(atob(b64Data), c => c.charCodeAt(0));
  
  const w = canvas.width;
  const h = canvas.height;
  // Convert px to points (1 px = 0.75 pt)
  const wPt = (w * 0.75).toFixed(2);
  const hPt = (h * 0.75).toFixed(2);
  
  const parts: (string | Uint8Array)[] = [];
  let offset = 0;
  const objects: number[] = [];
  
  const addObj = (str: string) => {
    objects.push(offset);
    const enc = new TextEncoder().encode(str);
    parts.push(enc);
    offset += enc.length;
  };
  
  const addBinaryObj = (header: string, data: Uint8Array, footer: string) => {
    objects.push(offset);
    const encHeader = new TextEncoder().encode(header);
    const encFooter = new TextEncoder().encode(footer);
    parts.push(encHeader);
    parts.push(data);
    parts.push(encFooter);
    offset += encHeader.length + data.length + encFooter.length;
  };
  
  // PDF Header
  const headerStr = `%PDF-1.4\n`;
  const headerEnc = new TextEncoder().encode(headerStr);
  parts.push(headerEnc);
  offset += headerEnc.length;
  
  // Obj 1: Catalog
  addObj(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
  
  // Obj 2: Pages
  addObj(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`);
  
  // Obj 3: Page
  addObj(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt} ${hPt}] /Contents 4 0 R /Resources << /XObject << /Img1 5 0 R >> >> >>\nendobj\n`);
  
  // Obj 4: Contents
  const contentStream = `q\n${wPt} 0 0 ${hPt} 0 0 cm\n/Img1 Do\nQ\n`;
  addObj(`4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`);
  
  // Obj 5: Image XObject (JPEG)
  const obj5Header = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`;
  const obj5Footer = `\nendstream\nendobj\n`;
  addBinaryObj(obj5Header, jpegBytes, obj5Footer);
  
  // Xref table
  const xrefStart = offset;
  let xrefStr = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of objects) {
    const offStr = String(off).padStart(10, "0");
    xrefStr += `${offStr} 00000 n \n`;
  }
  
  const trailerStr = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  const trailerEnc = new TextEncoder().encode(xrefStr + trailerStr);
  parts.push(trailerEnc);
  
  return new Blob(parts as unknown as BlobPart[], { type: "application/pdf" });
}

export function padImageBuffer(arrayBuffer: ArrayBuffer, targetSizeBytes: number): ArrayBuffer {
  const currentSize = arrayBuffer.byteLength;
  if (currentSize >= targetSizeBytes) {
    return arrayBuffer;
  }
  const padded = new Uint8Array(targetSizeBytes);
  padded.set(new Uint8Array(arrayBuffer), 0);
  return padded.buffer;
}
