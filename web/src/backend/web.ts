import { BasicEventEmitter } from '../views/project/editor/src';

export class WebBackend extends BasicEventEmitter<{
  'prompt.start': (id: string, projectId: number) => void;
  'prompt.queue': (remaining: number) => void;
}> {}
