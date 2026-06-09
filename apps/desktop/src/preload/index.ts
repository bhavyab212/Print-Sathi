import { contextBridge, ipcRenderer } from 'electron';

export interface PrintOptions {
  copies: number;
  duplex?: boolean;
  paperSize?: 'A4' | 'A3' | 'Letter';
  colorMode?: 'color' | 'grayscale';
  orientation?: 'portrait' | 'landscape';
}

const api = {
  // Printer operations
  getPrinters: () => ipcRenderer.invoke('printer:list'),
  printFile: (filePath: string, printerName: string, options: PrintOptions) =>
    ipcRenderer.invoke('printer:print', { filePath, printerName, options }),
  printPDF: (pdfBase64: string, printerName: string, options: PrintOptions) =>
    ipcRenderer.invoke('printer:printPDF', { pdfBase64, printerName, options }),

  // File operations
  showOpenDialog: (options: any) =>
    ipcRenderer.invoke('dialog:open', options),
  showSaveDialog: (options: any) =>
    ipcRenderer.invoke('dialog:save', options),
  downloadFile: (url: string, defaultPath: string) =>
    ipcRenderer.invoke('file:download', { url, defaultPath }),

  // App operations
  getVersion: () => ipcRenderer.invoke('app:version'),
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),

  // Events from main to renderer
  onUpdateAvailable: (callback: () => void) =>
    ipcRenderer.on('update:available', callback),
  onJobNotification: (callback: (job: any) => void) =>
    ipcRenderer.on('job:new', (_event, job) => callback(job)),
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = api;
}
