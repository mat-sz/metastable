import type { ComfySession } from './index.js';
import type { ComfyPreviewSettings, RPCRef } from './types.js';

export interface ComfyLatent {
  samples: RPCRef;
}

export class ComfyConditioning {
  constructor(
    public positive: RPCRef,
    public negative: RPCRef,
  ) {}
}

export class ComfyCheckpoint {
  constructor(
    private session: ComfySession,
    public data: {
      model: RPCRef;
      clip: RPCRef;
      vae: RPCRef;
      latent_type: string;
    },
  ) {}

  async conditioning(positiveText: string, negativeText: string) {
    return new ComfyConditioning(
      await this.clipEncode(positiveText),
      await this.clipEncode(negativeText),
    );
  }

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
    },
    preview?: ComfyPreviewSettings,
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
      preview,
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

export class ComfyControlnet {
  constructor(
    private session: ComfySession,
    private ref: RPCRef,
  ) {}

  async applyTo(
    conditioning: ComfyConditioning,
    image: RPCRef,
    strength: number,
  ) {
    const { positive, negative } = (await this.session.invoke(
      'controlnet:apply',
      {
        controlnet: this.ref,
        positive: conditioning.positive,
        negative: conditioning.negative,
        image,
        strength,
      },
    )) as { positive: RPCRef; negative: RPCRef };
    conditioning.positive = positive;
    conditioning.negative = negative;
  }
}

export class ComfyLORA {
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

export class ComfyIPAdapter {
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

export class ComfyCLIPVision {
  constructor(public ref: RPCRef) {}
}

export class ComfyUpscaleModel {
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

export class ComfyPulid {
  constructor(
    private session: ComfySession,
    private ref: RPCRef,
  ) {}

  async applyTo(
    checkpoint: ComfyCheckpoint,
    evaClip: RPCRef,
    faceAnalysis: RPCRef,
    image: RPCRef,
    strength: number,
  ) {
    const model = (await this.session.invoke('pulid:apply', {
      model: checkpoint.data.model,
      pulid: this.ref,
      eva_clip: evaClip,
      face_analysis: faceAnalysis,
      image,
      strength,
    })) as RPCRef;
    checkpoint.data.model = model;
  }
}
