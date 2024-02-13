import path from 'node:path';
import url from 'node:url';
import os from 'node:os';
import { app, BrowserWindow, ipcMain, Menu, MenuItem } from 'electron';
import { Project } from '@metastable/types';
import { Metastable } from '@metastable/metastable';

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
  const dataRoot = path.join(app.getPath('documents'), 'Metastable');
  const comfyMainPath = path.join(
    app.isPackaged ? app.getAppPath() : path.resolve('../metastable'),
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

  metastable.on('event', async event => {
    win.webContents.send('event', event);
  });

  ipcMain.on('ready', () => {
    metastable.replayEvents(event => win.webContents.send('event', event));
    win.webContents.send('window:maximized', win.isMaximized());
  });

  ipcMain.on('window:minimize', () => {
    win.minimize();
  });
  ipcMain.on('window:maximize', () => {
    win.maximize();
  });
  ipcMain.on('window:restore', () => {
    win.unmaximize();
  });
  ipcMain.on('window:close', () => {
    win.close();
  });
  win.on('resize', () => {
    win.webContents.send('window:maximized', win.isMaximized());
  });

  ipcMain.handle('instance:info', async () => {
    return {
      ...(await metastable.info()),
      dataDir: url.pathToFileURL(dataRoot).toString(),
    };
  });
  ipcMain.handle('instance:restart', async () => {
    await metastable.restartComfy();
  });

  ipcMain.handle('config:all', async () => {
    return await metastable.storage.config.all();
  });
  ipcMain.handle('config:store', async (_, config: any) => {
    return await metastable.storage.config.store(config);
  });

  ipcMain.handle('setup:status', async () => {
    return await metastable.setup.status();
  });
  ipcMain.handle('setup:details', async () => {
    return await metastable.setup.details();
  });
  ipcMain.handle('setup:start', async (_, settings: any) => {
    return await metastable.setup.start(settings);
  });
  ipcMain.handle(
    'prompts:create',
    async (_, id: Project['id'], settings: any) => {
      return await metastable.prompt(id, settings);
    },
  );

  ipcMain.handle('projects:all', async () => {
    return await metastable.storage.projects.all();
  });
  ipcMain.handle('projects:create', async (_, data: any) => {
    return await metastable.storage.projects.create(data);
  });
  ipcMain.handle('projects:get', async (_, id: Project['id']) => {
    return await metastable.storage.projects.get(id);
  });
  ipcMain.handle('projects:update', async (_, id: Project['id'], data: any) => {
    return await metastable.storage.projects.update(id, data);
  });
  ipcMain.handle('projects:inputs', async (_, id: Project['id']) => {
    return await metastable.storage.projects.inputs(id);
  });
  ipcMain.handle(
    'projects:inputs:getMetadata',
    async (_, id: Project['id'], name: string) => {
      return await metastable.storage.projects.getInputMetadata(id, name);
    },
  );
  ipcMain.handle(
    'projects:inputs:setMetadata',
    async (_, id: Project['id'], name: string, metadata: any) => {
      return await metastable.storage.projects.setInputMetadata(
        id,
        name,
        metadata,
      );
    },
  );
  ipcMain.handle(
    'projects:upload',
    async (_, id: Project['id'], buffer: Buffer, ext: string) => {
      return await metastable.storage.projects.upload(id, buffer, ext);
    },
  );
  ipcMain.handle('projects:outputs', async (_, id: Project['id']) => {
    return await metastable.storage.projects.outputs(id);
  });

  ipcMain.handle('tasks:all', async () => {
    return metastable.tasks.all();
  });
  ipcMain.handle('tasks:queue', async (_, queueId: string) => {
    return metastable.tasks.queue(queueId);
  });
  ipcMain.handle('tasks:cancel', async (_, queueId: string, taskId: string) => {
    return metastable.tasks.cancel(queueId, taskId);
  });
  ipcMain.handle(
    'tasks:dismiss',
    async (_, queueId: string, taskId: string) => {
      return metastable.tasks.dismiss(queueId, taskId);
    },
  );

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
