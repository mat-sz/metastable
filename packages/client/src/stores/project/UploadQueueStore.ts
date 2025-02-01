import { ProjectFileType } from '@metastable/types';
import { fromByteArray } from 'base64-js';
import { action, makeObservable, observable } from 'mobx';
import { nanoid } from 'nanoid';

import { API } from '$api';

export interface ProjectUploadQueueItem {
  id: string;
  file: File;
  url: string;
  state?: 'uploading' | 'done' | 'error';
}

export class UploadQueueStore {
  items: ProjectUploadQueueItem[] = [];
  isRunning = false;

  constructor(
    public type: ProjectFileType,
    private projectId: string,
  ) {
    makeObservable(this, {
      items: observable,
      isRunning: observable,
      add: action,
      remove: action,
      reset: action,
      update: action,
    });
  }

  add(file: File) {
    this.items.push({
      id: nanoid(),
      file,
      url: URL.createObjectURL(file),
    });
  }

  remove(id: string) {
    this.items = this.items.filter(item => item.id !== id);
  }

  reset() {
    this.items = [];
  }

  update(id: string, data: Partial<ProjectUploadQueueItem>) {
    this.items = this.items.map(item =>
      item.id === id ? { ...item, ...data } : item,
    );
  }

  async run() {
    this.isRunning = true;
    for (const item of this.items) {
      this.update(item.id, { state: 'uploading' });
      try {
        await API.project.file.create.mutate({
          type: ProjectFileType.INPUT,
          projectId: this.projectId,
          data: fromByteArray(new Uint8Array(await item.file.arrayBuffer())),
          name: item.file.name,
          ext: item.file.name.split('.').pop()!,
        });
      } catch {
        this.update(item.id, { state: 'error' });
      }

      URL.revokeObjectURL(item.url);
      this.update(item.id, { state: 'done' });
    }
    this.isRunning = false;
  }
}
