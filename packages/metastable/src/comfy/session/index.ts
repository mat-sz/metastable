import EventEmitter from 'events';

import { Architecture } from '@metastable/types';

import type { Comfy } from '../index.js';
import {
  ComfyCheckpoint,
  ComfyCLIPVision,
  ComfyControlnet,
  ComfyIPAdapter,
  ComfyLatent,
  ComfyLORA,
} from './models.js';
import {
  ComfySessionLogEvent,
  ComfySessionProgressEvent,
  RPCBytes,
  RPCRef,
} from './types.js';
import { TypedEventEmitter } from '../../types.js';

export type ComfySessionEvents = {
  progress: (event: ComfySessionProgressEvent) => void;
  log: (event: ComfySessionLogEvent) => void;
};

class ComfySessionCheckpoint {
  constructor(private session: ComfySession) {}

  async load(
    path: string,
    embeddingsPath?: string,
    clipLayer?: number,
    configPath?: string,
  ) {
    const data = await this.session.invoke('checkpoint:load', {
      path,
      embeddings_path: embeddingsPath,
      clip_layer: clipLayer,
      config_path: configPath,
    });
    return new ComfyCheckpoint(this.session, data as any);
  }

  async advanced({
    type,
    unetPath,
    clipPaths,
    vaePath,
    embeddingsPath,
  }: {
    type: Architecture;
    unetPath: string;
    clipPaths: string[];
    vaePath: string;
    embeddingsPath?: string;
  }) {
    const model = await this.session.invoke('unet:load', { path: unetPath });
    const clip = await this.session.invoke('clip:load', {
      paths: clipPaths,
      type,
      embeddings_path: embeddingsPath,
    });
    const vae = await this.session.invoke('vae:load', {
      path: vaePath,
    });
    return new ComfyCheckpoint(this.session, {
      clip,
      model,
      vae,
      latent_type: 'sd',
    } as any);
  }
}

class ComfySessionLora {
  constructor(private session: ComfySession) {}

  async load(path: string) {
    const data = (await this.session.invoke('lora:load', {
      path,
    })) as RPCRef;
    return new ComfyLORA(this.session, data);
  }
}

class ComfySessionControlnet {
  constructor(private session: ComfySession) {}

  async load(path: string) {
    const data = (await this.session.invoke('controlnet:load', {
      path,
    })) as RPCRef;
    return new ComfyControlnet(this.session, data);
  }
}

class ComfySessionIpadapter {
  constructor(private session: ComfySession) {}

  async load(path: string) {
    const data = (await this.session.invoke('ipadapter:load', {
      path,
    })) as RPCRef;
    return new ComfyIPAdapter(this.session, data);
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

export class ComfySession extends (EventEmitter as {
  new (): TypedEventEmitter<ComfySessionEvents>;
}) {
  checkpoint = new ComfySessionCheckpoint(this);
  lora = new ComfySessionLora(this);
  controlnet = new ComfySessionControlnet(this);
  clipVision = new ComfySessionClipVision(this);
  ipadapter = new ComfySessionIpadapter(this);
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
