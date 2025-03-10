import { Project as APIProject, ProjectType } from '@metastable/types';
import { makeAutoObservable, runInAction } from 'mobx';

import { API, linkManager } from '$api';
import { arrayMove, arrayUnique } from '$utils/array';
import { tryParse } from '$utils/json';
import { wrapAround } from '$utils/math';
import { filterDraft } from '$utils/project';
import { combineUnsubscribables } from '$utils/trpc';
import { createProject } from './project';
import { BaseProject } from './project/base';
import { defaultSettings } from './project/simple';
import { uiStore } from './UIStore';

const LS_RECENT = 'metastable_recent_projects';
const MAX_RECENT_ITEMS = 15;
export class ProjectStore {
  projects: BaseProject[] = [];
  currentId: APIProject['id'] | undefined = undefined;
  recent: APIProject[] = [];
  all: APIProject[] = [];
  loading = false;
  unsavedProjectsModalData:
    | { projects: BaseProject[]; onClose?: () => void }
    | undefined = undefined;

  private tagCache: string[] = [];

  constructor() {
    makeAutoObservable(this);

    linkManager.subscribe(
      combineUnsubscribables(() => [
        API.project.file.onChange.subscribe(undefined, {
          onData: ({ id, type }) => {
            this.find(id)?.refreshFiles(type);
          },
        }),
      ]),
    );
  }

  get draft() {
    return filterDraft(this.projects);
  }

  get current() {
    return this.projects.find(project => project.id === this.currentId);
  }

  get favorite() {
    return this.all.filter(project => project.favorite);
  }

  async refresh() {
    const json = await API.project.all.query();
    if (!json) {
      return;
    }

    runInAction(() => {
      this.all = json as any;
      this.tagCache = arrayUnique(
        this.all.flatMap(project => project.tags ?? []),
      );

      const recentArray = tryParse(localStorage.getItem(LS_RECENT)) || [];
      const recent: APIProject[] = Array.isArray(recentArray)
        ? (recentArray
            .slice(0, MAX_RECENT_ITEMS)
            .map(id => json.find(project => project.id === id))
            .filter(item => !!item) as APIProject[])
        : [];
      this.recent =
        recent.length > 0 ? recent : (json.slice(0, MAX_RECENT_ITEMS) as any);
    });
  }

  findMultiple(ids: string[]) {
    return this.projects.filter(project => ids.includes(project.id));
  }

  find(id: string) {
    return this.projects.find(project => project.id === id);
  }

  async get(id: string) {
    const project = this.find(id);
    if (project) {
      return project;
    }

    const projectData = await API.project.get.query({
      projectId: id,
    });
    return createProject(projectData);
  }

  pushRecent(id: string) {
    const recentArray: string[] =
      tryParse(localStorage.getItem(LS_RECENT)) || [];
    const recent = Array.isArray(recentArray)
      ? recentArray.filter(itemId => itemId !== id)
      : [];
    recent.unshift(id);
    localStorage.setItem(
      LS_RECENT,
      JSON.stringify(recent.slice(0, MAX_RECENT_ITEMS)),
    );
  }

  removeRecent(id: string) {
    const recentArray: string[] =
      tryParse(localStorage.getItem(LS_RECENT)) || [];
    const recent = Array.isArray(recentArray)
      ? recentArray.filter(itemId => itemId !== id)
      : [];
    localStorage.setItem(
      LS_RECENT,
      JSON.stringify(recent.slice(0, MAX_RECENT_ITEMS)),
    );
  }

  async create(
    name: string = 'Untitled',
    type: ProjectType = ProjectType.SIMPLE,
    draft = true,
    settings: any = defaultSettings(),
    ui?: any,
  ) {
    if (this.loading) {
      return;
    }

    if (!name.trim()) {
      return;
    }

    this.loading = true;
    const project = {
      name,
      type,
      settings,
      draft,
      ui,
    };

    try {
      const json = await API.project.create.mutate(project);
      json.settings = settings;

      runInAction(() => {
        this.projects.push(createProject(json));
        this.select(json.id);
      });

      if (!draft) {
        this.pushRecent(json.id);
      }
      this.refresh();
    } finally {
      this.loading = false;
    }
  }

  async open(id: APIProject['id'], select = true) {
    if (this.loading) {
      return;
    }

    this.loading = true;

    try {
      const json = await API.project.get.query({ projectId: id });
      if (!json) {
        return;
      }

      if (json.settings?.version !== 1) {
        json.settings = undefined;
      }

      const project = createProject(json);
      runInAction(() => {
        this.projects = [
          ...this.projects.filter(project => project.id !== id),
          project,
        ];

        if (select) {
          this.select(json.id);
        }
      });

      if (!json.draft) {
        this.pushRecent(json.id);
      }
      this.refresh();
    } finally {
      this.loading = false;
    }
  }

  async setFavorite(id: APIProject['id'], value: boolean) {
    await API.project.update.mutate({ projectId: id, favorite: value });
    await this.refresh();
  }

  get currentIndex() {
    return this.projects.findIndex(p => p.id === this.currentId);
  }

  selectOffset(offset: number) {
    const index = wrapAround(
      this.currentIndex + offset,
      0,
      this.projects.length - 1,
    );
    this.select(this.projects[index].id);
  }

  select(id?: APIProject['id']) {
    this.currentId = id;
    uiStore.setView(id ? 'project' : 'home');
  }

  move(fromId: APIProject['id'], toId?: APIProject['id']) {
    const from = this.projects.findIndex(p => p.id === fromId);
    const to = toId ? this.projects.findIndex(p => p.id === toId) : undefined;
    if (from !== -1 && to !== -1) {
      this.projects = arrayMove(this.projects, from, to);
    }
  }

  dismiss(id: APIProject['id']) {
    const index = this.currentIndex ?? 0;
    this.projects = this.projects.filter(project => project.id !== id);

    if (id === this.currentId) {
      const selectId = this.projects[index === 0 ? 0 : index - 1]?.id;
      if (uiStore.view === 'project') {
        this.select(selectId);
      } else {
        this.currentId = selectId;
      }
    }
  }

  close(id: APIProject['id'], force?: boolean) {
    return this.find(id)?.close(force);
  }

  async closeMultiple(ids: APIProject['id'][], force?: boolean) {
    const projects = this.findMultiple(ids);

    if (!force) {
      const draft = filterDraft(projects);
      if (draft.length) {
        this.unsavedProjectsModalData = { projects };
        return;
      }
    }

    await Promise.all(projects.map(project => project.close(true)));
  }

  get tags() {
    return this.tagCache;
  }

  async setTags(id: APIProject['id'], tags: string[]) {
    this.all = this.all.map(project =>
      project.id === id ? { ...project, tags } : project,
    );
    await API.project.update.mutate({ projectId: id, tags: arrayUnique(tags) });
  }

  async addTag(id: APIProject['id'], tag: string) {
    const project = this.all.find(project => project.id == id);
    if (!project) {
      return;
    }

    if (!this.tagCache.includes(tag)) {
      this.tagCache.push(tag);
    }

    const { tags = [] } = project;
    await this.setTags(id, [...tags, tag]);
  }

  async removeTag(id: APIProject['id'], tag: string) {
    const project = this.all.find(project => project.id == id);
    if (!project) {
      return;
    }

    const { tags = [] } = project;
    await this.setTags(
      id,
      tags.filter(item => item !== tag),
    );
  }
}
