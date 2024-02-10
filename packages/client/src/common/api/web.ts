import { httpDelete, httpGet, httpPost } from './http';
import { API } from './types';

export const WebAPI: API = {
  instance: {
    async info() {
      return await httpGet('/instance/info');
    },
    async restart() {
      return await httpPost('/instance/restart');
    },
  },
  config: {
    async all() {
      return await httpGet('/instance/config');
    },
    async store(config) {
      return await httpPost('/instance/config', config);
    },
  },
  setup: {
    async status() {
      return await httpGet('/setup/status');
    },
    async details() {
      return await httpGet('/setup/details');
    },
    async start(settings) {
      return await httpPost('/setup/start', settings);
    },
  },
  projects: {
    async all() {
      return await httpGet('/projects');
    },
    async get(id) {
      return await httpGet(`/projects/${encodeURIComponent(id)}`);
    },
    async inputs(id) {
      return await httpGet(`/projects/${encodeURIComponent(id)}/inputs`);
    },
    async upload(id, file: File) {
      return await httpPost(`/projects/${encodeURIComponent(id)}/inputs`, {
        file,
      });
    },
    async outputs(id) {
      return await httpGet(`/projects/${encodeURIComponent(id)}/outputs`);
    },
    async create(data) {
      return await httpPost('/projects', data);
    },
    async update(id, data) {
      return await httpPost(`/projects/${encodeURIComponent(id)}`, data);
    },
  },
  downloads: {
    async create(data) {
      return await httpPost('/downloads', data);
    },
  },
  prompts: {
    async create(projectId, settings) {
      return await httpPost(
        `/prompts/${encodeURIComponent(projectId)}`,
        settings,
      );
    },
  },
  tasks: {
    async all() {
      return await httpGet(`/tasks`);
    },
    async queue(queueId) {
      return await httpGet(`/tasks/${encodeURIComponent(queueId)}`);
    },
    async cancel(queueId, taskId) {
      return await httpPost(
        `/tasks/${encodeURIComponent(queueId)}/${encodeURIComponent(
          taskId,
        )}/cancel`,
      );
    },
    async dismiss(queueId, taskId) {
      return await httpDelete(
        `/tasks/${encodeURIComponent(queueId)}/${encodeURIComponent(taskId)}`,
      );
    },
  },
};
