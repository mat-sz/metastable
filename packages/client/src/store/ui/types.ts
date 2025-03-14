export type Theme = 'dark' | 'light';

export type ViewName = 'home' | 'models' | 'settings' | 'project';

export interface CivitAIArgs {
  query: string;
  type: string;
  nsfw: boolean;
  sort?: string;
  limit?: number;
  cursor?: string;
  baseModels?: string;
}
