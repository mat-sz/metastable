import type { ComfyPreviewSettings } from './types.js';
import { RPCSession } from '../rpc/session.js';
import { RPCRef } from '../rpc/types.js';

export interface ComfyLatent {
  samples: RPCRef<'LatentTensor'>;
}

export class ComfyConditioning {
  constructor(
    public positive: RPCRef<'Conditioning'>,
    public negative: RPCRef<'Conditioning'>,
  ) {}
}

export class ComfyGuider {
  constructor(
    private session: RPCSession,
    public ref: RPCRef<'Guider'>,
  ) {}

  async sample(
    {
      noise,
      sampler,
      sigmas,
      latent,
    }: {
      noise: RPCRef<'Noise'>;
      sampler: RPCRef<'Sampler'>;
      sigmas: RPCRef<'Sigmas'>;
      latent: ComfyLatent;
    },
    preview?: ComfyPreviewSettings,
  ) {
    return await this.session.api.sampling.sampleCustom({
      noise,
      guider: this.ref,
      sampler,
      sigmas,
      latent,
      preview,
    });
  }
}

export class ComfyCheckpoint {
  constructor(
    private session: RPCSession,
    public data: {
      diffusionModel: RPCRef<'DiffusionModel'>;
      textEncoder: RPCRef<'TextEncoder'>;
      vae: RPCRef<'VAE'>;
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
    return await this.session.api.textEncoder.encode({
      textEncoder: this.data.textEncoder,
      text,
    });
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
    return await this.session.api.sampling.sample({
      diffusionModel: this.data.diffusionModel,
      latent,
      positive: conditioning.positive,
      negative: conditioning.negative,
      samplerName: settings.samplerName,
      schedulerName: settings.schedulerName,
      steps: settings.steps,
      denoise: settings.denoise,
      cfg: settings.cfg,
      seed: settings.seed,
      isCircular: settings.isCircular,
      preview,
    });
  }

  async decode(samples: RPCRef<'LatentTensor'>, isCircular?: boolean) {
    return await this.session.api.vae.decode({
      vae: this.data.vae,
      samples,
      isCircular,
    });
  }

  async decodeTiled(
    samples: RPCRef<'LatentTensor'>,
    tileSize: number,
    overlap: number,
    temporalSize: number,
    temporalOverlap: number,
  ) {
    return await this.session.api.vae.decodeTiled({
      vae: this.data.vae,
      samples,
      tileSize: tileSize,
      overlap,
      temporalSize: temporalSize,
      temporalOverlap: temporalOverlap,
    });
  }

  async encode(image: RPCRef<'ImageTensor'>, mask?: RPCRef<'ImageTensor'>) {
    return (await this.session.api.vae.encode({
      vae: this.data.vae,
      image,
      mask,
    })) as ComfyLatent;
  }

  async getBasicGuider(conditioning: RPCRef<'Conditioning'>) {
    const ref = await this.session.api.sampling.basicGuider({
      diffusionModel: this.data.diffusionModel,
      conditioning,
    });
    return new ComfyGuider(this.session, ref);
  }

  async getCfgGuider(conditioning: ComfyConditioning, cfg: number) {
    const ref = await this.session.api.sampling.cfgGuider({
      diffusionModel: this.data.diffusionModel,
      positive: conditioning.positive,
      negative: conditioning.negative,
      cfg,
    });
    return new ComfyGuider(this.session, ref);
  }

  async getSigmas(schedulerName: string, steps: number, denoise: number) {
    return await this.session.api.sampling.getSigmas({
      diffusionModel: this.data.diffusionModel,
      schedulerName: schedulerName,
      steps,
      denoise,
    });
  }
}
