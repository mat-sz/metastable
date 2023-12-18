import path from 'node:path';
import url from 'node:url';
import os from 'node:os';
import { app, BrowserWindow, ipcMain, Menu, MenuItem } from 'electron';
import {
  createPythonInstance,
  Comfy,
  validateRequirements,
} from '@metastable/comfy';
import { Storage } from '@metastable/storage';
import { Project } from '@metastable/types';

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
  const python = await createPythonInstance();
  const comfyMain = path.join(
    app.isPackaged ? app.getAppPath() : path.resolve('../comfy'),
    'python',
    'main.py',
  );
  const dataDir = path.resolve('../../data');
  const comfy = new Comfy(python, comfyMain);
  const storage = new Storage(dataDir);

  const win = new BrowserWindow({
    title: 'Metastable',
    minWidth: 1200,
    minHeight: 1000,
    width: 1200,
    height: 1000,
    titleBarStyle: 'hidden',
    backgroundColor: '#11111a',
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
      webSecurity: false,
    },
  });

  comfy.on('event', async event => {
    win.webContents.send('comfy:event', event);
  });

  ipcMain.on('ready', () => {
    win.webContents.send('comfy:event', {
      event: 'backend.status',
      data: comfy.status,
    });
  });
  ipcMain.handle('instance:info', async () => {
    return {
      samplers: comfy.samplers,
      schedulers: comfy.schedulers,
      models: await storage.models.all(),
      dataDir: url.pathToFileURL(dataDir).toString(),
    };
  });
  ipcMain.handle('instance:compatibility', async () => {
    return await validateRequirements(python);
  });
  ipcMain.handle('prompts:create', async (_, settings: any) => {
    return await comfy.prompt(settings, storage);
  });

  ipcMain.handle('projects:all', async () => {
    return await storage.projects.all();
  });
  ipcMain.handle('projects:create', async (_, data: any) => {
    return await storage.projects.create(data);
  });
  ipcMain.handle('projects:get', async (_, id: Project['id']) => {
    return await storage.projects.get(id);
  });
  ipcMain.handle('projects:update', async (_, id: Project['id'], data: any) => {
    return await storage.projects.update(id, data);
  });
  ipcMain.handle('projects:outputs', async (_, id: Project['id']) => {
    return await storage.projects.filenames(id, 'output');
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
