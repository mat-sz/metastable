import EventEmitter from 'events';

import type { Comfy } from './index.js';
import {
  ComfyCheckpoint,
  ComfyCLIPVision,
  ComfyControlnet,
  ComfyIPAdapter,
  ComfyLatent,
  ComfyLORA,
  ComfyUpscaleModel,
} from './models.js';
import {
  ComfySessionLogEvent,
  ComfySessionProgressEvent,
  RPCBytes,
  RPCRef,
} from './types.js';
import { TypedEventEmitter } from '../types.js';

export type ComfySessionEvents = {
  progress: (event: ComfySessionProgressEvent) => void;
  log: (event: ComfySessionLogEvent) => void;
};

export class ComfySession extends (EventEmitter as {
  new (): TypedEventEmitter<ComfySessionEvents>;
}) {
  constructor(
    private comfy: Comfy,
    private id: string,
  ) {
    super();
  }

  invoke(method: string, params?: unknown): Promise<unknown> {
    return this.comfy.invoke(this.id, method, params);
  }

  async checkpoint(path: string, embeddingsPath?: string, clipLayer?: number) {
    const data = await this.invoke('checkpoint:load', {
      path,
      embeddings_path: embeddingsPath,
      clip_layer: clipLayer,
    });
    return new ComfyCheckpoint(this, data as any);
  }

  async controlnet(path: string) {
    const data = (await this.invoke('controlnet:load', {
      path,
    })) as RPCRef;
    return new ComfyControlnet(this, data);
  }

  async lora(path: string) {
    const data = (await this.invoke('lora:load', {
      path,
    })) as RPCRef;
    return new ComfyLORA(this, data);
  }

  async clipVision(path: string) {
    const data = (await this.invoke('clip_vision:load', {
      path,
    })) as RPCRef;
    return new ComfyCLIPVision(data);
  }

  async ipadapter(path: string) {
    const data = (await this.invoke('ipadapter:load', {
      path,
    })) as RPCRef;
    return new ComfyIPAdapter(this, data);
  }

  async upscaleModel(path: string) {
    const data = (await this.invoke('upscale_model:load', {
      path,
    })) as RPCRef;
    return new ComfyUpscaleModel(this, data);
  }

  async emptyLatent(width: number, height: number, batchSize?: number) {
    return (await this.invoke('image:latent.empty', {
      width,
      height,
      batch_size: batchSize,
    })) as ComfyLatent;
  }

  async dumpImage(image: RPCRef, format: string = 'png') {
    return (await this.invoke('image:dump', {
      image,
      format: format.toUpperCase(),
    })) as RPCBytes;
  }

  async loadImage(data: RPCBytes) {
    return (await this.invoke('image:load', { data })) as {
      image: RPCRef;
      mask: RPCRef;
    };
  }
}
