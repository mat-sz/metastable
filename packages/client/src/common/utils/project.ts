import { BaseProject } from '$stores/project';

export function filterDraft(projects: BaseProject[]) {
  return projects.filter(project => project.draft && project.changed);
}
