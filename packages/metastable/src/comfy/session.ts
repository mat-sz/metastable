import EventEmitter from 'events';

import { CheckpointType } from '@metastable/types';

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

  async checkpoint(
    path: string,
    embeddingsPath?: string,
    clipLayer?: number,
    configPath?: string,
  ) {
    const data = await this.invoke('checkpoint:load', {
      path,
      embeddings_path: embeddingsPath,
      clip_layer: clipLayer,
      config_path: configPath,
    });
    return new ComfyCheckpoint(this, data as any);
  }

  async checkpointAdvanced({
    type,
    unetPath,
    clipPaths,
    vaePath,
    embeddingsPath,
  }: {
    type: CheckpointType;
    unetPath: string;
    clipPaths: string[];
    vaePath: string;
    embeddingsPath?: string;
  }) {
    const model = await this.invoke('unet:load', { path: unetPath });
    const clip = await this.invoke('clip:load', {
      paths: clipPaths,
      type,
      embeddings_path: embeddingsPath,
    });
    const vae = await this.invoke('vae:load', {
      path: vaePath,
    });
    return new ComfyCheckpoint(this, {
      clip,
      model,
      vae,
      latent_type: 'sd',
    } as any);
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

  async emptyLatent(
    width: number,
    height: number,
    batchSize?: number,
    latentType?: string,
  ) {
    return (await this.invoke('image:latent.empty', {
      width,
      height,
      batch_size: batchSize,
      latent_type: latentType,
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

  async tag(
    modelPath: string,
    imagePaths: string[],
    generalThreshold: number,
    characterThreshold: number,
    removeUnderscore = true,
    undesiredTags = [],
    captionSeparator = ', ',
  ) {
    return (await this.invoke('tagger:tag', {
      model_path: modelPath,
      images: imagePaths,
      general_threshold: generalThreshold,
      character_threshold: characterThreshold,
      remove_underscore: removeUnderscore,
      undesired_tags: undesiredTags,
      caption_separator: captionSeparator,
    })) as Record<string, string>;
  }

  async destroy() {
    try {
      await this.invoke('session:destroy');
    } catch {}
  }
}
