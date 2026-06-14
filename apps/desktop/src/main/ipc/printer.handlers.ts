import { ipcMain } from 'electron';
import * as ptp from 'pdf-to-printer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';

export function setupPrinterHandlers() {
  ipcMain.handle('printer:list', async () => {
    try {
      const printers = await ptp.getPrinters();
      return { success: true, printers };
    } catch (error: any) {
      console.error('Failed to list printers:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('printer:print', async (_, { filePath, printerName, options }) => {
    try {
      await ptp.print(filePath, {
        printer: printerName,
        copies: options.copies || 1,
        // pdf-to-printer doesn't directly support all these options universally,
        // but we map what we can.
        sumatraPdfArgs: buildSumatraArgs(options)
      } as any);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to print file:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('printer:printPDF', async (_, { pdfBase64, printerName, options }) => {
    let tempFilePath = '';
    try {
      // Decode base64 PDF
      const pdfBuffer = Buffer.from(pdfBase64.replace(/^data:application\/pdf;base64,/, ''), 'base64');
      
      // Save to temp file
      const tempFileName = `print_${Date.now()}.pdf`;
      tempFilePath = path.join(app.getPath('temp'), tempFileName);
      await fs.writeFile(tempFilePath, pdfBuffer);

      // Print using pdf-to-printer
      await ptp.print(tempFilePath, {
        printer: printerName,
        copies: options.copies || 1,
        sumatraPdfArgs: buildSumatraArgs(options)
      } as any);
      
      return { success: true };
    } catch (error: any) {
      console.error('Failed to print PDF:', error);
      return { success: false, error: error.message };
    } finally {
      // Clean up temp file
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.error('Failed to clean up temp file:', cleanupError);
        }
      }
    }
  });
}

function buildSumatraArgs(options: any): string[] {
  const args: string[] = [];
  if (options.paperSize) {
    args.push('-paper', options.paperSize);
  }
  // Optional: add more SumatraPDF specific arguments if needed
  return args;
}
