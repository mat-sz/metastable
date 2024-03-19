import type { Comfy } from './index.js';

export class ComfySession {
  constructor(
    private comfy: Comfy,
    private id: string,
  ) {}

  invoke(method: string, ...params: unknown[]): Promise<unknown> {
    return this.comfy.invoke(this.id, method, ...params);
  }
}
