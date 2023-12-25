import { httpDelete, httpGet, httpPost } from '../http';
import { API } from './types';

export const WebAPI: API = {
  instance: {
    async info() {
      return await httpGet('/instance/info');
    },
    async compatibility() {
      return await httpGet('/instance/compatibility');
    },
  },
  projects: {
    async all() {
      return await httpGet('/projects');
    },
    async get(id) {
      return await httpGet(`/projects/${encodeURIComponent(id)}`);
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
    async cancel(id) {
      return await httpDelete(`/downloads/${encodeURIComponent(id)}`);
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
};
