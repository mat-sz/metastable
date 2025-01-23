import { type RPC } from './rpc.js';
import { type RPCSession } from './session.js';
import { type RPCRef } from './types.js';
export function getApi(rpc: RPC) {
  return {
    session: {
      destroy(): Promise<void> {
        return rpc.invoke(undefined, 'session:destroy') as any;
      },
      start(): Promise<string> {
        return rpc.invoke(undefined, 'session:start') as any;
      },
    },
    instance: {
      info(): Promise<{
        torch: {
          memory: {
            vram: number;
            ram: number;
          };
          device: {
            type: string;
            index?: number;
            name: string;
            allocator_backend?: string;
          };
          vae: {
            dtype: string;
          };
        };
        samplers: string[];
        schedulers: string[];
      }> {
        return rpc.invoke(undefined, 'instance:info') as any;
      },
    },
  };
}
export function getSessionApi(session: RPCSession) {
  return {
    session: {
      destroy(): Promise<void> {
        return session.invoke('session:destroy') as any;
      },
      start(): Promise<string> {
        return session.invoke('session:start') as any;
      },
    },
    instance: {
      info(): Promise<{
        torch: {
          memory: {
            vram: number;
            ram: number;
          };
          device: {
            type: string;
            index?: number;
            name: string;
            allocator_backend?: string;
          };
          vae: {
            dtype: string;
          };
        };
        samplers: string[];
        schedulers: string[];
      }> {
        return session.invoke('instance:info') as any;
      },
    },
    clipVision: {
      load(args: { path: string }): Promise<RPCRef<'ClipVisionModel'>> {
        return session.invoke('clip_vision:load', {
          path: args.path,
        }) as any;
      },
    },
    checkpoint: {
      load(args: {
        path: string;
        embeddingsPath?: string;
        configPath?: string;
      }): Promise<{
        diffusion_model: RPCRef<'DiffusionModel'>;
        text_encoder?: RPCRef<'TextEncoder'>;
        vae?: RPCRef<'VAE'>;
        latent_type: string;
      }> {
        return session.invoke('checkpoint:load', {
          path: args.path,
          embeddings_path: args.embeddingsPath,
          config_path: args.configPath,
        }) as any;
      },
    },
    image: {
      dump(args: {
        image: RPCRef<'ImageTensor'>;
        format?: string;
      }): Promise<Buffer> {
        return session.invoke('image:dump', {
          image: args.image,
          format: args.format,
        }) as any;
      },
      load(args: { data: Buffer }): Promise<{
        image: RPCRef<'ImageTensor'>;
        mask: RPCRef<'ImageTensor'>;
      }> {
        return session.invoke('image:load', {
          data: args.data,
        }) as any;
      },
    },
    vae: {
      decode(args: {
        vae: RPCRef<'VAE'>;
        samples: RPCRef<'LatentTensor'>;
        isCircular?: boolean;
      }): Promise<RPCRef<'ImageTensor'>[]> {
        return session.invoke('vae:decode', {
          vae: args.vae,
          samples: args.samples,
          is_circular: args.isCircular,
        }) as any;
      },
      decodeTiled(args: {
        vae: RPCRef<'VAE'>;
        samples: RPCRef<'LatentTensor'>;
        tileSize: number;
        overlap: number;
        temporalSize: number;
        temporalOverlap: number;
      }): Promise<RPCRef<'ImageTensor'>[]> {
        return session.invoke('vae:decode_tiled', {
          vae: args.vae,
          samples: args.samples,
          tile_size: args.tileSize,
          overlap: args.overlap,
          temporal_size: args.temporalSize,
          temporal_overlap: args.temporalOverlap,
        }) as any;
      },
      encode(args: {
        vae: RPCRef<'VAE'>;
        image: RPCRef<'ImageTensor'>;
        mask?: RPCRef<'ImageTensor'>;
      }): Promise<{
        samples: RPCRef<'LatentTensor'>;
        noise_mask?: RPCRef<'LatentTensor'>;
      }> {
        return session.invoke('vae:encode', {
          vae: args.vae,
          image: args.image,
          mask: args.mask,
        }) as any;
      },
      load(args: { path: string }): Promise<RPCRef<'VAE'>> {
        return session.invoke('vae:load', {
          path: args.path,
        }) as any;
      },
    },
    latent: {
      empty(args: {
        width: number;
        height: number;
        length?: number;
        batchSize?: number;
        latentType?: string;
      }): Promise<{
        samples: RPCRef<'LatentTensor'>;
        noise_mask?: RPCRef<'LatentTensor'>;
      }> {
        return session.invoke('latent:empty', {
          width: args.width,
          height: args.height,
          length: args.length,
          batch_size: args.batchSize,
          latent_type: args.latentType,
        }) as any;
      },
    },
    diffusionModel: {
      load(args: { path: string }): Promise<{
        diffusion_model: RPCRef<'DiffusionModel'>;
        latent_type: string;
      }> {
        return session.invoke('diffusion_model:load', {
          path: args.path,
        }) as any;
      },
    },
    textEncoder: {
      encode(args: {
        textEncoder: RPCRef<'TextEncoder'>;
        text: string;
      }): Promise<RPCRef<'Conditioning'>> {
        return session.invoke('text_encoder:encode', {
          text_encoder: args.textEncoder,
          text: args.text,
        }) as any;
      },
      load(args: {
        paths: string[];
        type: string;
        embeddingsPath?: string;
      }): Promise<RPCRef<'TextEncoder'>> {
        return session.invoke('text_encoder:load', {
          paths: args.paths,
          type: args.type,
          embeddings_path: args.embeddingsPath,
        }) as any;
      },
      setLayer(args: {
        textEncoder: RPCRef<'TextEncoder'>;
        layer: number;
      }): Promise<RPCRef<'TextEncoder'>> {
        return session.invoke('text_encoder:set_layer', {
          text_encoder: args.textEncoder,
          layer: args.layer,
        }) as any;
      },
    },
    sampling: {
      basicGuider(args: {
        diffusionModel: RPCRef<'DiffusionModel'>;
        conditioning: RPCRef<'Conditioning'>;
      }): Promise<RPCRef<'Guider'>> {
        return session.invoke('sampling:basic_guider', {
          diffusion_model: args.diffusionModel,
          conditioning: args.conditioning,
        }) as any;
      },
      cfgGuider(args: {
        diffusionModel: RPCRef<'DiffusionModel'>;
        positive: RPCRef<'Conditioning'>;
        negative: RPCRef<'Conditioning'>;
        cfg: number;
      }): Promise<RPCRef<'Guider'>> {
        return session.invoke('sampling:cfg_guider', {
          diffusion_model: args.diffusionModel,
          positive: args.positive,
          negative: args.negative,
          cfg: args.cfg,
        }) as any;
      },
      fluxGuidance(args: {
        conditioning: RPCRef<'Conditioning'>;
        guidance: number;
      }): Promise<RPCRef<'Conditioning'>> {
        return session.invoke('sampling:flux_guidance', {
          conditioning: args.conditioning,
          guidance: args.guidance,
        }) as any;
      },
      getSampler(args: { samplerName: string }): Promise<RPCRef<'Sampler'>> {
        return session.invoke('sampling:get_sampler', {
          sampler_name: args.samplerName,
        }) as any;
      },
      getSigmas(args: {
        diffusionModel: RPCRef<'DiffusionModel'>;
        schedulerName: string;
        steps: number;
        denoise?: number;
      }): Promise<RPCRef<'Sigmas'>> {
        return session.invoke('sampling:get_sigmas', {
          diffusion_model: args.diffusionModel,
          scheduler_name: args.schedulerName,
          steps: args.steps,
          denoise: args.denoise,
        }) as any;
      },
      randomNoise(args: { seed: number }): Promise<RPCRef<'Noise'>> {
        return session.invoke('sampling:random_noise', {
          seed: args.seed,
        }) as any;
      },
      sample(args: {
        diffusionModel: RPCRef<'DiffusionModel'>;
        latent: {
          samples: RPCRef<'LatentTensor'>;
          noiseMask?: RPCRef<'LatentTensor'>;
        };
        positive: RPCRef<'Conditioning'>;
        negative: RPCRef<'Conditioning'>;
        samplerName: string;
        schedulerName: string;
        steps: number;
        denoise: number;
        cfg: number;
        seed: number;
        isCircular?: boolean;
        preview?: any;
      }): Promise<RPCRef<'LatentTensor'>> {
        return session.invoke('sampling:sample', {
          diffusion_model: args.diffusionModel,
          latent: args.latent,
          positive: args.positive,
          negative: args.negative,
          sampler_name: args.samplerName,
          scheduler_name: args.schedulerName,
          steps: args.steps,
          denoise: args.denoise,
          cfg: args.cfg,
          seed: args.seed,
          is_circular: args.isCircular,
          preview: args.preview,
        }) as any;
      },
      sampleCustom(args: {
        noise: RPCRef<'Noise'>;
        guider: RPCRef<'Guider'>;
        sampler: RPCRef<'Sampler'>;
        sigmas: RPCRef<'Sigmas'>;
        latent: {
          samples: RPCRef<'LatentTensor'>;
          noiseMask?: RPCRef<'LatentTensor'>;
        };
        preview?: any;
      }): Promise<RPCRef<'LatentTensor'>> {
        return session.invoke('sampling:sample_custom', {
          noise: args.noise,
          guider: args.guider,
          sampler: args.sampler,
          sigmas: args.sigmas,
          latent: args.latent,
          preview: args.preview,
        }) as any;
      },
    },
    controlnet: {
      apply(args: {
        controlnet: RPCRef<'ControlNet'>;
        positive: RPCRef<'Conditioning'>;
        negative: RPCRef<'Conditioning'>;
        image: RPCRef<'ImageTensor'>;
        strength: number;
      }): Promise<{
        positive: RPCRef<'Conditioning'>;
        negative: RPCRef<'Conditioning'>;
      }> {
        return session.invoke('controlnet:apply', {
          controlnet: args.controlnet,
          positive: args.positive,
          negative: args.negative,
          image: args.image,
          strength: args.strength,
        }) as any;
      },
      load(args: { path: string }): Promise<RPCRef<'ControlNet'>> {
        return session.invoke('controlnet:load', {
          path: args.path,
        }) as any;
      },
    },
    ipadapter: {
      apply(args: {
        diffusionModel: RPCRef<'DiffusionModel'>;
        ipadapter: RPCRef<'IpAdapter'>;
        clipVision: RPCRef<'ClipVisionModel'>;
        image: RPCRef<'ImageTensor'>;
        strength: number;
      }): Promise<RPCRef<'DiffusionModel'>> {
        return session.invoke('ipadapter:apply', {
          diffusion_model: args.diffusionModel,
          ipadapter: args.ipadapter,
          clip_vision: args.clipVision,
          image: args.image,
          strength: args.strength,
        }) as any;
      },
      load(args: { path: string }): Promise<RPCRef<'IpAdapter'>> {
        return session.invoke('ipadapter:load', {
          path: args.path,
        }) as any;
      },
    },
    lora: {
      apply(args: {
        diffusionModel: RPCRef<'DiffusionModel'>;
        textEncoder: RPCRef<'TextEncoder'>;
        lora: RPCRef<'LORA'>;
        strength: number;
      }): Promise<{
        diffusion_model: RPCRef<'DiffusionModel'>;
        text_encoder: RPCRef<'TextEncoder'>;
      }> {
        return session.invoke('lora:apply', {
          diffusion_model: args.diffusionModel,
          text_encoder: args.textEncoder,
          lora: args.lora,
          strength: args.strength,
        }) as any;
      },
      load(args: { path: string }): Promise<RPCRef<'LORA'>> {
        return session.invoke('lora:load', {
          path: args.path,
        }) as any;
      },
    },
    pulid: {
      apply(args: {
        diffusionModel: RPCRef<'DiffusionModel'>;
        pulid: RPCRef<'PULID'>;
        evaClip: RPCRef<'EvaClip'>;
        faceAnalysis: RPCRef<'FaceAnalysis'>;
        image: RPCRef<'ImageTensor'>;
        projection?: string;
        strength?: number;
        fidelity?: number;
        noise?: number;
        startAt?: number;
        endAt?: number;
        attnMask?: any;
      }): Promise<RPCRef<'DiffusionModel'>> {
        return session.invoke('pulid:apply', {
          diffusion_model: args.diffusionModel,
          pulid: args.pulid,
          eva_clip: args.evaClip,
          face_analysis: args.faceAnalysis,
          image: args.image,
          projection: args.projection,
          strength: args.strength,
          fidelity: args.fidelity,
          noise: args.noise,
          start_at: args.startAt,
          end_at: args.endAt,
          attn_mask: args.attnMask,
        }) as any;
      },
      load(args: { path: string }): Promise<RPCRef<'PULID'>> {
        return session.invoke('pulid:load', {
          path: args.path,
        }) as any;
      },
      loadEvaClip(): Promise<RPCRef<'EvaClip'>> {
        return session.invoke('pulid:load_eva_clip') as any;
      },
      loadInsightface(args: { root: string }): Promise<RPCRef<'FaceAnalysis'>> {
        return session.invoke('pulid:load_insightface', {
          root: args.root,
        }) as any;
      },
    },
    tagger: {
      tag(args: {
        modelPath: any;
        images: any;
        generalThreshold: any;
        characterThreshold: any;
        removeUnderscore?: any;
        undesiredTags?: any;
        captionSeparator?: any;
        csvPath?: any;
      }): Promise<{
        [K: string]: string;
      }> {
        return session.invoke('tagger:tag', {
          model_path: args.modelPath,
          images: args.images,
          general_threshold: args.generalThreshold,
          character_threshold: args.characterThreshold,
          remove_underscore: args.removeUnderscore,
          undesired_tags: args.undesiredTags,
          caption_separator: args.captionSeparator,
          csv_path: args.csvPath,
        }) as any;
      },
    },
    upscaleModel: {
      apply(args: {
        upscaleModel: RPCRef<'UpscaleModel'>;
        images: RPCRef<'ImageTensor'>[];
      }): Promise<RPCRef<'ImageTensor'>[]> {
        return session.invoke('upscale_model:apply', {
          upscale_model: args.upscaleModel,
          images: args.images,
        }) as any;
      },
      load(args: { path: string }): Promise<RPCRef<'UpscaleModel'>> {
        return session.invoke('upscale_model:load', {
          path: args.path,
        }) as any;
      },
    },
    segment: {
      load(args: { path: string }): Promise<RPCRef<'SegmentModel'>> {
        return session.invoke('segment:load', {
          path: args.path,
        }) as any;
      },
      segment(args: {
        model: RPCRef<'SegmentModel'>;
        image: RPCRef<'ImageTensor'>;
      }): Promise<RPCRef<'ImageTensor'>> {
        return session.invoke('segment:segment', {
          model: args.model,
          image: args.image,
        }) as any;
      },
    },
  };
}
