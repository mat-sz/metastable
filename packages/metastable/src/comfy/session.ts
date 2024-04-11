import EventEmitter from 'events';

import { ProjectSettings } from '@metastable/types';

import type { Comfy } from './index.js';
import { TypedEventEmitter } from '../types.js';

interface RPCRef {
  $ref: string | number;
}

interface RPCBytes {
  $bytes: string;
}

interface ComfyLatent {
  samples: RPCRef;
}
type ComfyConditioning = [positive: RPCRef, negative: RPCRef];

export class ComfyCheckpoint {
  constructor(
    private session: ComfySession,
    private data: {
      model: RPCRef;
      clip: RPCRef;
      vae: RPCRef;
    },
  ) {}

  async applyLora(path: string, strength: number) {
    const result = (await this.session.invoke('checkpoint:lora.apply', {
      model: this.data.model,
      clip: this.data.clip,
      path,
      strength,
    })) as { model: RPCRef; clip: RPCRef };

    this.data.model = result.model;
    this.data.clip = result.clip;
  }

  async applyControlnet(
    conditioning: ComfyConditioning,
    path: string,
    image: RPCRef,
    strength: number,
  ) {
    return (await this.session.invoke('checkpoint:controlnet.apply', {
      conditioning,
      path,
      image,
      strength,
    })) as ComfyConditioning;
  }

  async applyIpadapter(
    path: string,
    clipVisionPath: string,
    image: RPCRef,
    strength: number,
  ) {
    const result = (await this.session.invoke('checkpoint:ipadapter.apply', {
      model: this.data.model,
      path,
      clip_vision_path: clipVisionPath,
      image,
      strength,
    })) as { model: RPCRef };
    this.data.model = result.model;
  }

  async conditioning(positive: string, negative: string) {
    return (await this.session.invoke('checkpoint:clip.conditioning', {
      clip: this.data.clip,
      positive,
      negative,
    })) as ComfyConditioning;
  }

  async sample(
    latent: ComfyLatent,
    conditioning: ComfyConditioning,
    settings: {
      samplerName: string;
      schedulerName: string;
      steps: number;
      denoise: number;
      cfg: number;
      seed: number;
      isCircular?: boolean;
      preview?: ProjectSettings['sampler']['preview'];
    },
  ) {
    return (await this.session.invoke('checkpoint:sample', {
      model: this.data.model,
      latent,
      conditioning,
      sampler_name: settings.samplerName,
      scheduler_name: settings.schedulerName,
      steps: settings.steps,
      denoise: settings.denoise,
      cfg: settings.cfg,
      seed: settings.seed,
      is_circular: settings.isCircular,
      preview: settings.preview,
    })) as RPCRef;
  }

  async decode(samples: RPCRef, isCircular?: boolean) {
    return (await this.session.invoke('checkpoint:vae.decode', {
      vae: this.data.vae,
      samples,
      is_circular: isCircular,
    })) as RPCRef[];
  }

  async encode(image: RPCRef, mask?: RPCRef) {
    return (await this.session.invoke('checkpoint:vae.encode', {
      vae: this.data.vae,
      image,
      mask,
    })) as ComfyLatent;
  }
}

interface ComfySessionProgressEvent {
  value: number;
  max: number;
  preview?: string;
}

interface ComfySessionLogEvent {
  type: 'stdout' | 'stderr';
  text: string;
}

type ComfySessionEvents = {
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

  async upscaleImages(modelPath: string, images: RPCRef[]) {
    return (await this.invoke('image:upscale', {
      images,
      model_path: modelPath,
    })) as RPCRef[];
  }
}
