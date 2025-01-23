import { Architecture } from '@metastable/types';

import { ComfyCheckpoint } from './models.js';
import { ComfyCheckpointPaths } from './types.js';
import { RPCSession } from '../rpc/session.js';
import { RPCRef } from '../rpc/types.js';

export async function loadCheckpoint(
  session: RPCSession,
  {
    type,
    paths,
    clipLayer,
  }: {
    type: Architecture;
    paths: ComfyCheckpointPaths;
    clipLayer?: number;
  },
) {
  let refs: {
    textEncoder?: RPCRef<'TextEncoder'>;
    diffusionModel?: RPCRef<'DiffusionModel'>;
    vae?: RPCRef<'VAE'>;
    latentType: string;
  } = {
    latentType: 'sd',
  };

  if (paths.checkpoint) {
    const data = await session.api.checkpoint.load({
      path: paths.checkpoint,
      embeddingsPath: paths.embeddings,
      configPath: paths.config,
    });
    refs = {
      ...refs,
      diffusionModel: data.diffusion_model,
      textEncoder: data.text_encoder,
      vae: data.vae,
      latentType: data.latent_type,
    };
  }

  if (paths.diffusionModel) {
    const { diffusion_model, latent_type } =
      await session.api.diffusionModel.load({
        path: paths.diffusionModel,
      });
    refs.diffusionModel = diffusion_model;
    refs.latentType = latent_type;
  }

  if (paths.textEncoders?.length) {
    refs.textEncoder = await session.api.textEncoder.load({
      paths: paths.textEncoders,
      type,
      embeddingsPath: paths.embeddings,
    });
  }

  if (paths.vae) {
    refs.vae = await session.api.vae.load({
      path: paths.vae,
    });
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
    refs.textEncoder = await session.api.textEncoder.setLayer({
      textEncoder: refs.textEncoder,
      layer: clipLayer,
    });
  }

  return new ComfyCheckpoint(session, refs as any);
}
