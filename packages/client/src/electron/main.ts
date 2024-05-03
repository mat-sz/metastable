import os from 'node:os';
import path from 'node:path';

import { Metastable, router, setUseFileUrl } from '@metastable/metastable';
import { app, BrowserWindow, Menu, MenuItem } from 'electron';
import { createIPCHandler } from 'trpc-electron/main';

setUseFileUrl(true);

process.env.DIST = path.join(__dirname, '../dist');
process.env.PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

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

function createMenu() {
  const menu = new Menu();

  const menuMain = new MenuItem({
    id: 'metastable',
    label: 'Metastable',
    type: 'submenu',
    submenu: new Menu(),
  });
  menuMain.submenu?.append(
    new MenuItem({
      id: 'metastable:quit',
      label: 'Quit Metastable',
      type: 'normal',
    }),
  );
  menu.append(menuMain);

  const menuProject = new MenuItem({
    id: 'project',
    label: 'Project',
    type: 'submenu',
    submenu: new Menu(),
  });

  menuProject.submenu?.append(
    new MenuItem({
      id: 'project:new',
      label: 'New',
      type: 'normal',
    }),
  );
  menuProject.submenu?.append(
    new MenuItem({
      id: 'project:open',
      label: 'Open',
      type: 'normal',
    }),
  );
  menu.append(menuProject);

  const menuView = new MenuItem({
    id: 'view',
    label: 'View',
    type: 'submenu',
    submenu: new Menu(),
  });
  menuView.submenu?.append(
    new MenuItem({
      id: 'view:modelManager',
      label: 'Model manager',
      type: 'normal',
    }),
  );
  menu.append(menuView);

  return menu;
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
  const metastable = new Metastable(dataRoot, { comfyMainPath });
  await metastable.init();

  const win = new BrowserWindow({
    title: 'Metastable',
    minWidth: 1200,
    minHeight: 1000,
    width: 1200,
    height: 1000,
    resizable: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#11111a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
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
      return { metastable, win };
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

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST!, 'index.html'));
  }

  win.setBackgroundColor('#11111a');
}
