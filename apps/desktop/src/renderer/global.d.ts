import { PrintOptions } from '../preload/index';

declare global {
  interface Window {
    electron: {
      getPrinters: () => Promise<{ success: boolean; printers?: any[]; error?: string }>;
      printFile: (filePath: string, printerName: string, options: PrintOptions) => Promise<{ success: boolean; error?: string }>;
      printPDF: (pdfBase64: string, printerName: string, options: PrintOptions) => Promise<{ success: boolean; error?: string }>;
      
      showOpenDialog: (options: any) => Promise<any>;
      showSaveDialog: (options: any) => Promise<any>;
      downloadFile: (url: string, defaultPath: string) => Promise<any>;
      
      getVersion: () => Promise<string>;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      openExternal: (url: string) => Promise<void>;
      
      onUpdateAvailable: (callback: () => void) => void;
      onJobNotification: (callback: (job: any) => void) => void;
    };
  }
}

export {};
