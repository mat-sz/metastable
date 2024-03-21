import type { Comfy } from './index.js';

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
    private data: any,
  ) {}

  async conditioning(positive: string, negative: string) {
    return (await this.session.invoke(
      'checkpoint:clip.conditioning',
      this.data.clip,
      positive,
      negative,
    )) as ComfyConditioning;
  }

  async sample(
    latent: ComfyLatent,
    conditioning: ComfyConditioning,
    sampler_name: string,
    scheduler_name: string,
    steps: number,
    denoise: number,
    cfg: number,
    seed: number,
  ) {
    return (await this.session.invoke(
      'checkpoint:sample',
      this.data.model,
      latent,
      conditioning,
      sampler_name,
      scheduler_name,
      steps,
      denoise,
      cfg,
      seed,
    )) as RPCRef;
  }

  async decode(samples: RPCRef) {
    return (await this.session.invoke(
      'checkpoint:vae.decode',
      this.data.vae,
      samples,
    )) as RPCRef[];
  }
}

export class ComfySession {
  constructor(
    private comfy: Comfy,
    private id: string,
  ) {}

  invoke(method: string, ...params: unknown[]): Promise<unknown> {
    return this.comfy.invoke(this.id, method, ...params);
  }

  async checkpoint(path: string) {
    const data = await this.invoke('checkpoint:load', path);
    return new ComfyCheckpoint(this, data);
  }

  async emptyLatent(width: number, height: number) {
    return (await this.invoke(
      'image:latent.empty',
      width,
      height,
    )) as ComfyLatent;
  }

  async dump(image: RPCRef) {
    return (await this.invoke('image:dump', image)) as RPCBytes;
  }
}
