import { app, shell, BrowserWindow, ipcMain, Tray, Menu } from 'electron';
import { join } from 'path';
import { autoUpdater } from 'electron-updater';
import { setupPrinterHandlers } from './ipc/printer.handlers';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#ffffff',
      symbolColor: '#374151',
      height: 40
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function createTray() {
  // Use a blank icon for now, will be replaced with real icon
  tray = new Tray(join(__dirname, '../../resources/icon.ico'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Print Sathi', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => {
      app.isQuiting = true;
      app.quit();
    }}
  ]);
  tray.setToolTip('Print Sathi');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow?.show();
  });
}

// Keep app running in background when window is closed
app.on('window-all-closed', (e: Event) => {
  if (process.platform !== 'darwin') {
    e.preventDefault(); // Prevent app from quitting
  }
});

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.printsathi.desktop');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  setupIpcHandlers();
  setupPrinterHandlers();

  createMainWindow();
  createTray();

  // Setup auto updater
  autoUpdater.checkForUpdatesAndNotify();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

function setupIpcHandlers() {
  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow?.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('window:close', () => {
    mainWindow?.hide(); // Hide instead of close to keep running in tray
  });

  ipcMain.handle('app:version', () => {
    return app.getVersion();
  });

  ipcMain.handle('shell:openExternal', (_, url) => {
    shell.openExternal(url);
  });
}
