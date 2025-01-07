import { EventEmitter } from 'events';

import { Architecture } from '@metastable/types';

import type { Comfy } from '../index.js';
import { ComfyCheckpoint, ComfyCLIPVision, ComfyLatent } from './models.js';
import {
  ComfySessionLogEvent,
  ComfySessionProgressEvent,
  RPCBytes,
  RPCRef,
} from './types.js';

export type ComfySessionEvents = {
  progress: [event: ComfySessionProgressEvent];
  log: [event: ComfySessionLogEvent];
};

class ComfySessionCheckpoint {
  constructor(private session: ComfySession) {}

  async load({
    type,
    checkpointPath,
    unetPath,
    clipPaths,
    vaePath,
    embeddingsPath,
    clipLayer,
    configPath,
  }: {
    type: Architecture;
    checkpointPath?: string;
    unetPath?: string;
    clipPaths?: string[];
    vaePath?: string;
    embeddingsPath?: string;
    clipLayer?: number;
    configPath?: string;
  }) {
    let refs: {
      clip?: RPCRef;
      unet?: RPCRef;
      vae?: RPCRef;
      latent_type: string;
    } = {
      latent_type: 'sd',
    };

    if (checkpointPath) {
      const data: any = await this.session.invoke('checkpoint:load', {
        path: checkpointPath,
        embeddings_path: embeddingsPath,
        config_path: configPath,
      });
      refs = { ...refs, ...data };
    }

    if (unetPath) {
      refs.unet = (await this.session.invoke('unet:load', {
        path: unetPath,
      })) as any;
    }

    if (clipPaths?.length) {
      refs.clip = (await this.session.invoke('clip:load', {
        paths: clipPaths,
        type,
        embeddings_path: embeddingsPath,
      })) as any;
    }

    if (vaePath) {
      refs.vae = (await this.session.invoke('vae:load', {
        path: vaePath,
      })) as any;
    }

    if (!refs.unet) {
      throw new Error('Checkpoint loading error: missing UNET');
    }

    if (!refs.vae) {
      throw new Error('Checkpoint loading error: missing VAE');
    }

    if (!refs.clip) {
      throw new Error('Checkpoint loading error: missing CLIP');
    }

    if (clipLayer) {
      refs.clip = (await this.session.invoke('clip:set_layer', {
        clip: refs.clip,
        layer: clipLayer,
      })) as any;
    }

    return new ComfyCheckpoint(this.session, refs as any);
  }
}

class ComfySessionClipVision {
  constructor(private session: ComfySession) {}

  async load(path: string) {
    const data = (await this.session.invoke('clip_vision:load', {
      path,
    })) as RPCRef;
    return new ComfyCLIPVision(data);
  }
}

class ComfySessionImage {
  constructor(private session: ComfySession) {}

  async emptyLatent(
    width: number,
    height: number,
    batchSize?: number,
    latentType?: string,
  ) {
    return (await this.session.invoke('image:latent.empty', {
      width,
      height,
      batch_size: batchSize,
      latent_type: latentType,
    })) as ComfyLatent;
  }

  async dump(image: RPCRef, format: string = 'png') {
    return (await this.session.invoke('image:dump', {
      image,
      format: format.toUpperCase(),
    })) as RPCBytes;
  }

  async load(data: RPCBytes) {
    return (await this.session.invoke('image:load', { data })) as {
      image: RPCRef;
      mask: RPCRef;
    };
  }
}

class ComfySessionTag {
  constructor(private session: ComfySession) {}

  async run(
    modelPath: string,
    imagePaths: string[],
    generalThreshold: number,
    characterThreshold: number,
    removeUnderscore = true,
    undesiredTags = [],
    captionSeparator = ', ',
  ) {
    return (await this.session.invoke('tagger:tag', {
      model_path: modelPath,
      images: imagePaths,
      general_threshold: generalThreshold,
      character_threshold: characterThreshold,
      remove_underscore: removeUnderscore,
      undesired_tags: undesiredTags,
      caption_separator: captionSeparator,
    })) as Record<string, string>;
  }
}

export class ComfySession extends EventEmitter<ComfySessionEvents> {
  checkpoint = new ComfySessionCheckpoint(this);
  clipVision = new ComfySessionClipVision(this);
  image = new ComfySessionImage(this);
  tag = new ComfySessionTag(this);

  constructor(
    private comfy: Comfy,
    private id: string,
  ) {
    super();
  }

  invoke(method: string, params?: unknown): Promise<unknown> {
    return this.comfy.invoke(this.id, method, params);
  }

  async destroy() {
    try {
      await this.invoke('session:destroy');
    } catch {}
  }
}
