import path from 'node:path';
import url from 'node:url';
import { app, BrowserWindow, ipcMain } from 'electron';
import {
  createPythonInstance,
  Comfy,
  validateRequirements,
} from '@metastable/comfy';
import { filenames, FileSystem } from '@metastable/fs-helpers';

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

async function createWindow() {
  const python = await createPythonInstance();
  const comfyMain = path.join(
    app.isPackaged ? app.getAppPath() : path.resolve('../comfy'),
    'python',
    'main.py',
  );
  const dataDir = path.resolve('../../data');
  const comfy = new Comfy(python, comfyMain);
  const fileSystem = new FileSystem(dataDir);

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

  comfy.on('event', event => {
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
      models: await fileSystem.allModels(),
      dataDir: url.pathToFileURL(dataDir).toString(),
    };
  });
  ipcMain.handle('instance:compatibility', async () => {
    return await validateRequirements(python);
  });
  ipcMain.handle('prompts:create', async (_, settings: any) => {
    return await comfy.prompt(settings, fileSystem);
  });

  const projects: any[] = [];
  ipcMain.handle('projects:all', async () => {
    return projects;
  });
  ipcMain.handle('projects:create', async (_, data: any) => {
    data['id'] = 8 + projects.length - 1;
    projects.push(data);
    return data;
  });
  ipcMain.handle('projects:get', async (_, id: number) => {
    return projects[id];
  });
  ipcMain.handle('projects:update', async (_, id: number, data: any) => {
    projects[id] = { ...projects[id], ...data };
    return projects[id];
  });
  ipcMain.handle('projects:outputs', async (_, id: number) => {
    return await filenames(fileSystem.projectPath(id, 'output'));
  });

  win.setMenu(null);

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
