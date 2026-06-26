import { PDFDocument, PageSizes } from 'pdf-lib';

export async function imagesToPdf(imagesBase64: string[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const base64 of imagesBase64) {
    let image;
    if (base64.startsWith('data:image/jpeg') || base64.startsWith('data:image/jpg')) {
      image = await pdfDoc.embedJpg(base64);
    } else if (base64.startsWith('data:image/png')) {
      image = await pdfDoc.embedPng(base64);
    } else {
      // Default to JPEG if no explicit header
      image = await pdfDoc.embedJpg(base64);
    }

    const { width, height } = image.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  return await pdfDoc.save();
}

export async function createNUpPdf(fileBytes: Uint8Array, n: 2 | 4): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(fileBytes);
  const outDoc = await PDFDocument.create();
  
  const pages = srcDoc.getPages();
  const A4 = PageSizes.A4; // [595.28, 841.89]

  if (n === 2) {
    // 2-up (Landscape output A4, two portrait A5-ish pages side by side)
    const outPageWidth = A4[1]; // 841.89
    const outPageHeight = A4[0]; // 595.28
    
    for (let i = 0; i < pages.length; i += 2) {
      const outPage = outDoc.addPage([outPageWidth, outPageHeight]);
      
      const p1 = pages[i];
      const p2 = i + 1 < pages.length ? pages[i + 1] : null;

      const embed1 = await outDoc.embedPage(p1);
      const embed2 = p2 ? await outDoc.embedPage(p2) : null;

      const scale1 = Math.min((outPageWidth / 2) / p1.getWidth(), outPageHeight / p1.getHeight()) * 0.95;
      
      outPage.drawPage(embed1, {
        x: outPageWidth * 0.05 / 2,
        y: (outPageHeight - p1.getHeight() * scale1) / 2,
        xScale: scale1,
        yScale: scale1,
      });

      if (embed2 && p2) {
        const scale2 = Math.min((outPageWidth / 2) / p2.getWidth(), outPageHeight / p2.getHeight()) * 0.95;
        outPage.drawPage(embed2, {
          x: outPageWidth / 2 + outPageWidth * 0.05 / 2,
          y: (outPageHeight - p2.getHeight() * scale2) / 2,
          xScale: scale2,
          yScale: scale2,
        });
      }
    }
  } else if (n === 4) {
    // 4-up (Portrait A4 output, 4 pages)
    const outPageWidth = A4[0];
    const outPageHeight = A4[1];
    
    for (let i = 0; i < pages.length; i += 4) {
      const outPage = outDoc.addPage([outPageWidth, outPageHeight]);
      
      for (let j = 0; j < 4; j++) {
        if (i + j >= pages.length) break;
        const p = pages[i + j];
        const embed = await outDoc.embedPage(p);
        const scale = Math.min((outPageWidth / 2) / p.getWidth(), (outPageHeight / 2) / p.getHeight()) * 0.95;
        
        const isLeft = j % 2 === 0;
        const isTop = j < 2;
        
        const xOffset = isLeft ? outPageWidth * 0.025 : outPageWidth / 2 + outPageWidth * 0.025;
        const yOffset = isTop ? outPageHeight / 2 + (outPageHeight / 2 - p.getHeight() * scale) / 2 : (outPageHeight / 2 - p.getHeight() * scale) / 2;

        outPage.drawPage(embed, {
          x: xOffset,
          y: yOffset,
          xScale: scale,
          yScale: scale,
        });
      }
    }
  }

  return await outDoc.save();
}

export async function createBookletPdf(fileBytes: Uint8Array): Promise<Uint8Array> {
    // Simple saddle-stitch implementation for A4 landscape
    const srcDoc = await PDFDocument.load(fileBytes);
    const outDoc = await PDFDocument.create();
    
    const pageCount = srcDoc.getPageCount();
    // Round up to nearest multiple of 4
    const totalBookletPages = Math.ceil(pageCount / 4) * 4;
    
    // Create an array of page indices. Use null for blank padding pages
    const pageOrder = Array.from({ length: totalBookletPages }, (_, i) => i < pageCount ? i : null);
    
    // Rearrange for saddle stitch
    const arrangedOrder = [];
    for (let i = 0; i < totalBookletPages / 2; i += 2) {
        // Outside sheet
        arrangedOrder.push(pageOrder[totalBookletPages - 1 - i]); // Left
        arrangedOrder.push(pageOrder[i]);                       // Right
        // Inside sheet
        arrangedOrder.push(pageOrder[i + 1]);                   // Left
        arrangedOrder.push(pageOrder[totalBookletPages - 2 - i]); // Right
    }

    const A4 = PageSizes.A4;
    const outPageWidth = A4[1]; // Landscape A4
    const outPageHeight = A4[0];

    const pages = srcDoc.getPages();

    for (let i = 0; i < arrangedOrder.length; i += 2) {
        const outPage = outDoc.addPage([outPageWidth, outPageHeight]);
        
        const leftIdx = arrangedOrder[i];
        const rightIdx = arrangedOrder[i+1];

        if (leftIdx !== null) {
            const p = pages[leftIdx];
            const embed = await outDoc.embedPage(p);
            const scale = Math.min((outPageWidth / 2) / p.getWidth(), outPageHeight / p.getHeight()) * 0.95;
            outPage.drawPage(embed, {
                x: (outPageWidth/2 - p.getWidth()*scale)/2,
                y: (outPageHeight - p.getHeight()*scale)/2,
                xScale: scale,
                yScale: scale
            });
        }
        
        if (rightIdx !== null) {
            const p = pages[rightIdx];
            const embed = await outDoc.embedPage(p);
            const scale = Math.min((outPageWidth / 2) / p.getWidth(), outPageHeight / p.getHeight()) * 0.95;
            outPage.drawPage(embed, {
                x: outPageWidth/2 + (outPageWidth/2 - p.getWidth()*scale)/2,
                y: (outPageHeight - p.getHeight()*scale)/2,
                xScale: scale,
                yScale: scale
            });
        }
    }

    return await outDoc.save();
}

export async function scalePdf(fileBytes: Uint8Array, fitToPage: boolean): Promise<Uint8Array> {
    if (!fitToPage) return fileBytes; // "Actual Size" - do nothing

    const srcDoc = await PDFDocument.load(fileBytes);
    const outDoc = await PDFDocument.create();
    
    const A4 = PageSizes.A4;
    const pages = srcDoc.getPages();

    for (const p of pages) {
        // Decide orientation based on original page
        const isLandscape = p.getWidth() > p.getHeight();
        const outPageWidth = isLandscape ? A4[1] : A4[0];
        const outPageHeight = isLandscape ? A4[0] : A4[1];

        const outPage = outDoc.addPage([outPageWidth, outPageHeight]);
        const embed = await outDoc.embedPage(p);
        
        // Fit to page leaving 5% margin
        const scale = Math.min(outPageWidth / p.getWidth(), outPageHeight / p.getHeight()) * 0.95;
        
        outPage.drawPage(embed, {
            x: (outPageWidth - p.getWidth() * scale) / 2,
            y: (outPageHeight - p.getHeight() * scale) / 2,
            xScale: scale,
            yScale: scale
        });
    }

    return await outDoc.save();
}
