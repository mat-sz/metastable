import path from 'path';
import fs from 'fs/promises';
import { Project } from '@metastable/types';

import { JSONFile, TextFile } from './helpers.js';
import { freeDirName, filenames } from '@metastable/fs-helpers';
import { rimraf } from 'rimraf';

export class Projects {
  constructor(private projectsDir: string) {}

  async init() {
    await fs.mkdir(this.projectsDir, { recursive: true });
  }

  projectFile(
    id: Project['id'],
  ): JSONFile<Omit<Project, 'id' | 'name' | 'settings'> | undefined> {
    return new JSONFile(
      path.join(this.projectsDir, `${id}`, 'project.json'),
      undefined,
    );
  }

  settingsFile(id: Project['id']): TextFile {
    return new TextFile(path.join(this.projectsDir, `${id}`, 'settings.json'));
  }

  async all() {
    const items = await fs.readdir(this.projectsDir, { withFileTypes: true });
    const projects: Pick<Project, 'name' | 'lastOutput' | 'id'>[] = [];

    for (const item of items) {
      if (item.isDirectory()) {
        const data = await this.getMetadata(item.name);
        if (data) {
          const outputs = await this.filenames(item.name, 'output');
          projects.push({
            ...data,
            lastOutput: outputs[outputs.length - 1],
          });
        }
      }
    }

    return projects;
  }

  async create(data: Pick<Project, 'name' | 'settings'>) {
    data.name = data.name.trim();
    if (!data.name) {
      throw new Error('Empty project name');
    }

    const dirName = await freeDirName(this.projectsDir, data.name);
    const project = { ...data, id: dirName, name: dirName };

    await fs.mkdir(this.path(dirName, 'output'), { recursive: true });
    await fs.mkdir(this.path(dirName, 'input'), { recursive: true });
    await this.save(project);

    return project;
  }

  async getMetadata(
    id: Project['id'],
  ): Promise<Omit<Project, 'settings'> | undefined> {
    const projectFile = this.projectFile(id);
    const data = await projectFile.readJson();
    if (!data) {
      return undefined;
    }

    return {
      id,
      name: id,
      ...data,
    };
  }

  async get(id: Project['id']) {
    const data = await this.getMetadata(id);
    if (!data) {
      return undefined;
    }

    const settingsFile = this.settingsFile(id);
    return {
      ...data,
      settings: await settingsFile.read(),
    };
  }

  async update(id: Project['id'], data: Partial<Omit<Project, 'id'>>) {
    const project = await this.getMetadata(id);
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

  path(id: Project['id'], ...paths: string[]) {
    return path.join(this.projectsDir, id, ...paths);
  }

  async filenames(id: Project['id'], ...paths: string[]) {
    const projectPath = this.path(id, ...paths);
    const output = await filenames(projectPath);
    output.sort();
    return output;
  }

  async delete(id: Project['id']) {
    const projectPath = this.path(id);
    await rimraf(projectPath);
  }

  private async save(
    project: Omit<Project, 'settings'> & Partial<Pick<Project, 'settings'>>,
  ) {
    let id = project.id;
    const data: Partial<Project> = { ...project };

    delete data['id'];
    delete data['name'];
    delete data['settings'];

    const name = project.name.trim();
    if (name && project.id !== name) {
      const dirName = await freeDirName(this.projectsDir, name);
      fs.rename(
        path.join(this.projectsDir, id),
        path.join(this.projectsDir, dirName),
      );
      id = dirName;
    }

    const projectFile = this.projectFile(id);
    await projectFile.writeJson(data);

    if (project.settings) {
      const settingsFile = this.settingsFile(id);
      await settingsFile.write(project.settings);
    }

    return {
      ...project,
      id,
      name: id,
    };
  }
}
