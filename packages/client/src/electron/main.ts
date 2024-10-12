import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { Metastable, router, setUseFileUrl } from '@metastable/metastable';
import { TaskState } from '@metastable/types';
import {
  app,
  BrowserWindow,
  Menu,
  net,
  protocol,
  shell,
  WindowOpenHandlerResponse,
} from 'electron';
import contextMenu from 'electron-context-menu';
import settings from 'electron-settings';
import { autoUpdater } from 'electron-updater';
import { createIPCHandler } from 'trpc-electron/main';

contextMenu({
  showSearchWithGoogle: false,
  showSaveImageAs: true,
});

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

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized?: boolean;
}

const windowStateKeeper = async (windowName: string) => {
  let window: BrowserWindow, windowState: WindowState;
  const settingsKey = `windowState.${windowName}`;

  const setBounds = async () => {
    if (await settings.has(settingsKey)) {
      windowState = (await settings.get(settingsKey)) as any;
      return windowState;
    }

    windowState = {
      x: undefined,
      y: undefined,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
    };

    return windowState;
  };

  let saveTimeout: any = undefined;
  const updateState = async () => {
    const isMaximized = window.isMaximized();
    if (!isMaximized) {
      windowState = window.getBounds();
    }
    windowState.isMaximized = isMaximized;

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveState();
    }, 100);
  };

  const saveState = async () => {
    await settings.set(settingsKey, windowState as any);
  };

  const track = async (win: BrowserWindow) => {
    window = win;
    ['resize', 'move', 'close'].forEach(event => {
      win.on(event as any, updateState);
    });
  };

  return {
    ...(await setBounds()),
    track,
    saveState,
  };
};

const IS_WINDOWS = os.platform() === 'win32';
const IS_MAC = os.platform() === 'darwin';

function createMenu() {
  const menuTemplate: (
    | Electron.MenuItem
    | Electron.MenuItemConstructorOptions
  )[] = [
    {
      role: 'appMenu',
    },
    {
      role: 'fileMenu',
    },
    {
      role: 'editMenu',
    },
    {
      role: 'viewMenu',
    },
    {
      role: 'windowMenu',
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://metastable.studio');
          },
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(menuTemplate);
}

async function createWindow() {
  const dataRoot = path.join(app.getPath('userData'), 'data');
  const comfyMainPath = path.join(
    app.isPackaged
      ? path.join(path.dirname(app.getPath('exe')), IS_MAC ? '..' : '.')
      : path.resolve('../metastable'),
    'python',
    'main.py',
  );
  const metastable = new Metastable(dataRoot, {
    comfyMainPath,
    version: __APP_VERSION__,
  });
  await metastable.init();

  async function checkForUpdates() {
    const config = await metastable.config.get('app');

    if (config?.autoUpdate) {
      autoUpdater.checkForUpdates();
    }
  }

  checkForUpdates();
  setInterval(checkForUpdates, 15 * 60 * 1000);

  const mainWindowStateKeeper = await windowStateKeeper('main');

  const win = new BrowserWindow({
    title: 'Metastable',
    minWidth: 1200,
    minHeight: 800,
    x: mainWindowStateKeeper.x,
    y: mainWindowStateKeeper.y,
    width: mainWindowStateKeeper.width,
    height: mainWindowStateKeeper.height,
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

  if (mainWindowStateKeeper.isMaximized) {
    win.maximize();
  }

  mainWindowStateKeeper.track(win);

  createIPCHandler({
    router,
    windows: [win],
    createContext: async () => {
      return { metastable, win, autoUpdater };
    },
  });

  protocol.handle('metastable+resolve', async request => {
    const split = request.url.split('/');

    try {
      const resolved = await metastable.resolve(decodeURIComponent(split[2]));
      return await net.fetch(pathToFileURL(resolved).toString());
    } catch {
      //
    }

    const res = new Response(null, { status: 404 });
    return res;
  });

  win.setMenu(null);

  // macOS menu bar
  if (IS_MAC) {
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

  win.webContents.setWindowOpenHandler(details => {
    if (details.url?.startsWith('http')) {
      shell.openExternal(details.url);
      return { action: 'deny' } as WindowOpenHandlerResponse;
    }

    return { action: 'allow' } as WindowOpenHandlerResponse;
  });

  const PROGRESS_BAR_INDETERMINATE = IS_WINDOWS ? 2 : 0;
  let lastTaskId: string | undefined = undefined;
  metastable.tasks.on('update', e => {
    if (e.queueId === 'project') {
      if (e.data?.stepMax || e.state === TaskState.RUNNING) {
        let progress = PROGRESS_BAR_INDETERMINATE;
        if (e.data?.stepValue && e.data?.stepMax) {
          progress = e.data.stepValue / e.data.stepMax;
        }

        lastTaskId = e.id;
        win.setProgressBar(progress);
      }

      if (e.state && e.state !== TaskState.RUNNING && lastTaskId === e.id) {
        win.setProgressBar(-1);
      }
    }
  });

  metastable.tasks.on('delete', e => {
    if (lastTaskId === e.id) {
      win.setProgressBar(-1);
    }
  });
}
