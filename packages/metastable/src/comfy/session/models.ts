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

export class ComfyGuider {
  constructor(
    private session: ComfySession,
    public ref: RPCRef,
  ) {}

  async sample(
    {
      noise,
      sampler,
      sigmas,
      latent,
    }: {
      noise: RPCRef;
      sampler: RPCRef;
      sigmas: RPCRef;
      latent: ComfyLatent;
    },
    preview?: ComfyPreviewSettings,
  ) {
    return (await this.session.invoke('sampling:sample_custom', {
      noise,
      guider: this.ref,
      sampler,
      sigmas,
      latent,
      preview,
    })) as RPCRef;
  }
}

export class ComfyCheckpoint {
  constructor(
    private session: ComfySession,
    public data: {
      diffusionModel: RPCRef;
      textEncoder: RPCRef;
      vae: RPCRef;
      latentType: string;
    },
  ) {}

  async conditioning(positiveText: string, negativeText: string) {
    return new ComfyConditioning(
      await this.encodeText(positiveText),
      await this.encodeText(negativeText),
    );
  }

  async encodeText(text: string) {
    return (await this.session.invoke('text_encoder:encode', {
      text_encoder: this.data.textEncoder,
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
    return (await this.session.invoke('sampling:sample', {
      diffusion_model: this.data.diffusionModel,
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

  async decodeTiled(
    samples: RPCRef,
    tileSize: number,
    overlap: number,
    temporalSize: number,
    temporalOverlap: number,
  ) {
    return (await this.session.invoke('vae:decode_tiled', {
      vae: this.data.vae,
      samples,
      tile_size: tileSize,
      overlap,
      temporal_size: temporalSize,
      temporal_overlap: temporalOverlap,
    })) as RPCRef[];
  }

  async encode(image: RPCRef, mask?: RPCRef) {
    return (await this.session.invoke('vae:encode', {
      vae: this.data.vae,
      image,
      mask,
    })) as ComfyLatent;
  }

  async getGuider(conditioning: RPCRef) {
    const ref = (await this.session.invoke('sampling:basic_guider', {
      diffusion_model: this.data.diffusionModel,
      conditioning,
    })) as RPCRef;
    return new ComfyGuider(this.session, ref);
  }

  async getSigmas(schedulerName: string, steps: number, denoise: number) {
    return (await this.session.invoke('sampling:get_sigmas', {
      diffusion_model: this.data.diffusionModel,
      scheduler_name: schedulerName,
      steps,
      denoise,
    })) as RPCRef;
  }
}

export class ComfyCLIPVision {
  constructor(public ref: RPCRef) {}
}
