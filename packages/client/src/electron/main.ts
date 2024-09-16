import os from 'node:os';
import path from 'node:path';

import { Metastable, router, setUseFileUrl } from '@metastable/metastable';
import { app, BrowserWindow, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
import { createIPCHandler } from 'trpc-electron/main';

setUseFileUrl(true);

process.env.DIST = path.join(import.meta.dirname, '../dist');
process.env.PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

const ELECTRON_RENDERER_URL = process.env['ELECTRON_RENDERER_URL'];

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.whenReady().then(createWindow);
}

app.on('web-contents-created', (_, wc) => {
  wc.on('before-input-event', (e, input) => {
    if (input.key === 'F12') {
      e.preventDefault();
      wc.openDevTools({ mode: 'detach' });
    }
  });
});

autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.autoDownload = true;
autoUpdater.autoRunAppAfterInstall = true;

function createMenu() {
  const menuTemplate: (
    | Electron.MenuItem
    | Electron.MenuItemConstructorOptions
  )[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
  ];

  return Menu.buildFromTemplate(menuTemplate);
}

async function createWindow() {
  const dataRoot = path.join(app.getPath('userData'), 'data');
  const comfyMainPath = path.join(
    app.isPackaged
      ? path.join(
          path.dirname(app.getPath('exe')),
          os.platform() === 'darwin' ? '..' : '.',
        )
      : path.resolve('../metastable'),
    'python',
    'main.py',
  );
  const metastable = new Metastable(dataRoot, {
    comfyMainPath,
    version: __APP_VERSION__,
  });
  await metastable.init();

  const config = await metastable.config.get('app');

  if (config?.autoUpdate) {
    autoUpdater.checkForUpdates();
  }

  const win = new BrowserWindow({
    title: 'Metastable',
    minWidth: 1200,
    minHeight: 1000,
    width: 1200,
    height: 1000,
    resizable: true,
    titleBarStyle: 'hidden',
    frame: false,
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#11111a',
    webPreferences: {
      preload: path.join(import.meta.dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
      webSecurity: false,
    },
  });

  createIPCHandler({
    router,
    windows: [win],
    createContext: async () => {
      return { metastable, win, autoUpdater };
    },
  });

  win.setMenu(null);

  // macOS menu bar
  if (os.platform() === 'darwin') {
    app.applicationMenu = createMenu();
  }

  win.on('closed', () => {
    app.quit();
  });

  if (ELECTRON_RENDERER_URL) {
    win.loadURL(ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST!, 'index.html'));
  }

  win.setBackgroundColor('#11111a');
}
