import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs/promises';
import os from 'node:os';
import { app, BrowserWindow, ipcMain, Menu, MenuItem } from 'electron';
import { nanoid } from 'nanoid/non-secure';
import {
  createPythonInstance,
  Comfy,
  validateRequirements,
} from '@metastable/comfy';
import { filenames, FileSystem } from '@metastable/fs-helpers';
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

export class JSONFile<T> {
  constructor(
    private path: string,
    private fallback: T,
  ) {}

  async read(): Promise<T> {
    try {
      return JSON.parse(await fs.readFile(this.path, { encoding: 'utf-8' }));
    } catch {
      return this.fallback;
    }
  }

  async write(data: T) {
    await fs.writeFile(this.path, JSON.stringify(data));
  }
}

export class Projects {
  mainFile: JSONFile<
    Record<Project['id'], Pick<Project, 'name' | 'lastOutput'>>
  >;
  constructor(private projectsDir: string) {
    this.mainFile = new JSONFile(path.join(projectsDir, 'index.json'), {});
  }

  projectFile(id: Project['id']): JSONFile<Project | undefined> {
    return new JSONFile(
      path.join(this.projectsDir, `${id}`, 'project.json'),
      undefined,
    );
  }

  async all() {
    return await this.mainFile.read();
  }

  async create(data: Pick<Project, 'name' | 'settings'>) {
    const id = nanoid();
    const project = { id, ...data };
    await fs.mkdir(path.join(this.projectsDir, `${id}`), { recursive: true });
    await this.save(project);
    return project;
  }

  async get(id: Project['id']) {
    const projectFile = this.projectFile(id);
    return await projectFile.read();
  }

  async update(id: Project['id'], data: Partial<Omit<Project, 'id'>>) {
    const projectFile = this.projectFile(id);
    const project = await projectFile.read();
    if (!project) {
      return;
    }

    const newProject = {
      ...project,
      ...data,
    };
    await this.save(newProject);

    return newProject;
  }

  private async save(project: Project) {
    const all = await this.all();
    all[project.id] = {
      name: project.name,
      lastOutput: project.lastOutput,
    };

    const projectFile = this.projectFile(project.id);
    await projectFile.write(project);

    await this.mainFile.write(all);
  }
}

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
  const fileSystem = new FileSystem(dataDir);
  const projects = new Projects(fileSystem.projectsDir);

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

    if (event.event === 'prompt.end') {
      const filename = event.data?.output_filenames?.[0];

      if (filename) {
        const projectId = event.data.project_id;
        await projects.update(projectId, { lastOutput: filename });
      }
    }
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

  ipcMain.handle('projects:all', async () => {
    const all = await projects.all();
    return Object.entries(all).map(([id, data]) => ({ id, ...data }));
  });
  ipcMain.handle('projects:create', async (_, data: any) => {
    const project = await projects.create(data);
    await fileSystem.createProjectTree(project.id);
    return project;
  });
  ipcMain.handle('projects:get', async (_, id: Project['id']) => {
    return await projects.get(id);
  });
  ipcMain.handle('projects:update', async (_, id: Project['id'], data: any) => {
    return await projects.update(id, data);
  });
  ipcMain.handle('projects:outputs', async (_, id: Project['id']) => {
    return await filenames(fileSystem.projectPath(id, 'output'));
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
