import { CheckpointType, ModelDetails } from '@metastable/types';

import { readPytorch } from './pytorch.js';
import { readSafetensors } from './safetensors.js';

export const PYTORCH_EXTENSIONS = ['ckpt', 'pt', 'bin', 'pth'];
export const SAFETENSORS_EXTENSIONS = ['safetensors'];

async function getDict(modelPath: string) {
  const ext = modelPath.split('.').pop()!;
  if (PYTORCH_EXTENSIONS.includes(ext)) {
    return await readPytorch(modelPath);
  } else if (SAFETENSORS_EXTENSIONS.includes(ext)) {
    return await readSafetensors(modelPath);
  } else {
    throw new Error(`Unsupported model format ${ext}`);
  }
}

export async function getModelDetails(
  modelPath: string,
): Promise<ModelDetails> {
  const dict = await getDict(modelPath);
  let checkpointType: CheckpointType | undefined = undefined;

  if (dict['state_dict']) {
    const state = dict['state_dict'];

    if (state['y_embedder.y_embedding']) {
      checkpointType = CheckpointType.PIXART;
    } else if (
      state['model.diffusion_model.output_blocks.3.1.time_stack.0.norm2.weight']
    ) {
      checkpointType = CheckpointType.SVD;
    } else if (
      state['model.diffusion_model.joint_blocks.9.x_block.mlp.fc2.weight']
    ) {
      checkpointType = CheckpointType.SD3;
    } else if (
      state[
        'conditioner.embedders.1.model.transformer.resblocks.21.attn.out_proj.bias'
      ]
    ) {
      checkpointType = CheckpointType.SDXL;
    } else if (
      state[
        'cond_stage_model.model.transformer.resblocks.14.attn.out_proj.weight'
      ]
    ) {
      checkpointType = CheckpointType.SD2;
    } else if (
      state[
        'model.diffusion_model.output_blocks.9.1.transformer_blocks.0.norm3.weight'
      ]
    ) {
      checkpointType = CheckpointType.SD1;
    }
  }

  return { checkpointType };
}
