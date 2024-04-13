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
type ComfyConditioning = { positive: RPCRef; negative: RPCRef };

export class ComfyCheckpoint {
  constructor(
    private session: ComfySession,
    public data: {
      model: RPCRef;
      clip: RPCRef;
      vae: RPCRef;
    },
  ) {}

  async clipEncode(text: string) {
    return (await this.session.invoke('clip:encode', {
      clip: this.data.clip,
      text,
    })) as RPCRef;
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
      positive: conditioning.positive,
      negative: conditioning.negative,
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
    return (await this.session.invoke('vae:decode', {
      vae: this.data.vae,
      samples,
      is_circular: isCircular,
    })) as RPCRef[];
  }

  async encode(image: RPCRef, mask?: RPCRef) {
    return (await this.session.invoke('vae:encode', {
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

class ComfyControlnet {
  constructor(
    private session: ComfySession,
    private ref: RPCRef,
  ) {}

  async applyTo(
    positive: RPCRef,
    negative: RPCRef,
    image: RPCRef,
    strength: number,
  ) {
    return (await this.session.invoke('controlnet:apply', {
      controlnet: this.ref,
      positive,
      negative,
      image,
      strength,
    })) as ComfyConditioning;
  }
}

class ComfyLORA {
  constructor(
    private session: ComfySession,
    private ref: RPCRef,
  ) {}

  async applyTo(checkpoint: ComfyCheckpoint, strength: number) {
    const { model, clip } = (await this.session.invoke('lora:apply', {
      lora: this.ref,
      model: checkpoint.data.model,
      clip: checkpoint.data.clip,
      strength,
    })) as { model: RPCRef; clip: RPCRef };
    checkpoint.data.model = model;
    checkpoint.data.clip = clip;
  }
}

class ComfyIPAdapter {
  constructor(
    private session: ComfySession,
    private ref: RPCRef,
  ) {}

  async applyTo(
    checkpoint: ComfyCheckpoint,
    clipVision: ComfyCLIPVision,
    image: RPCRef,
    strength: number,
  ) {
    const { model } = (await this.session.invoke('ipadapter:apply', {
      ipadapter: this.ref,
      clip_vision: clipVision.ref,
      model: checkpoint.data.model,
      image,
      strength,
    })) as { model: RPCRef };
    checkpoint.data.model = model;
  }
}

class ComfyCLIPVision {
  constructor(
    private session: ComfySession,
    public ref: RPCRef,
  ) {}
}

class ComfyUpscaleModel {
  constructor(
    private session: ComfySession,
    private ref: RPCRef,
  ) {}

  async applyTo(images: RPCRef[]) {
    return (await this.session.invoke('upscale_model:apply', {
      upscale_model: this.ref,
      images: images,
    })) as RPCRef[];
  }
}

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
    return new ComfyCLIPVision(this, data);
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
