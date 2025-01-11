import { EventEmitter } from 'events';

import { Architecture } from '@metastable/types';

import type { Comfy } from '../index.js';
import { ComfyCheckpoint, ComfyCLIPVision, ComfyLatent } from './models.js';
import {
  ComfyCheckpointPaths,
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
    paths,
    clipLayer,
  }: {
    type: Architecture;
    paths: ComfyCheckpointPaths;
    clipLayer?: number;
  }) {
    let refs: {
      textEncoder?: RPCRef;
      diffusionModel?: RPCRef;
      vae?: RPCRef;
      latentType: string;
    } = {
      latentType: 'sd',
    };

    if (paths.checkpoint) {
      const data: {
        diffusion_model: RPCRef;
        text_encoder: RPCRef;
        vae: RPCRef;
        latent_type: string;
      } = (await this.session.invoke('checkpoint:load', {
        path: paths.checkpoint,
        embeddings_path: paths.embeddings,
        config_path: paths.config,
      })) as any;
      refs = {
        ...refs,
        diffusionModel: data.diffusion_model,
        textEncoder: data.text_encoder,
        vae: data.vae,
        latentType: data.latent_type,
      };
    }

    if (paths.diffusionModel) {
      refs.diffusionModel = (await this.session.invoke('diffusion_model:load', {
        path: paths.diffusionModel,
      })) as any;
    }

    if (paths.textEncoders?.length) {
      refs.textEncoder = (await this.session.invoke('text_encoder:load', {
        paths: paths.textEncoders,
        type,
        embeddings_path: paths.embeddings,
      })) as any;
    }

    if (paths.vae) {
      refs.vae = (await this.session.invoke('vae:load', {
        path: paths.vae,
      })) as any;
    }

    if (!refs.diffusionModel) {
      throw new Error('Checkpoint loading error: missing diffusion model');
    }

    if (!refs.vae) {
      throw new Error('Checkpoint loading error: missing VAE');
    }

    if (!refs.textEncoder) {
      throw new Error('Checkpoint loading error: missing text encoder');
    }

    if (clipLayer) {
      refs.textEncoder = (await this.session.invoke('text_encoder:set_layer', {
        text_encoder: refs.textEncoder,
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

class ComfySessionLatent {
  constructor(private session: ComfySession) {}

  async empty(
    width: number,
    height: number,
    batchSize?: number,
    latentType?: string,
  ) {
    return (await this.session.invoke('latent:empty', {
      width,
      height,
      batch_size: batchSize,
      latent_type: latentType,
    })) as ComfyLatent;
  }
}

class ComfySessionImage {
  constructor(private session: ComfySession) {}

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
  latent = new ComfySessionLatent(this);

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
