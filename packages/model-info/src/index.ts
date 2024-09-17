import { CheckpointType, ModelDetails, ModelType } from '@metastable/types';

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

interface StatePattern {
  key: string | string[];
  details: ModelDetails;
}

const PATTERNS: StatePattern[] = [
  {
    key: 'lora_unet_double_blocks_12_img_mod_lin.lora_down.weight',
    details: {
      checkpointType: CheckpointType.FLUX1,
      type: ModelType.LORA,
    },
  },
  {
    key: 'encoder.mid.attn_1.v.weight',
    details: {
      checkpointType: CheckpointType.FLUX1,
      type: ModelType.VAE,
    },
  },
  {
    key: 'double_blocks.18.txt_mod.lin.weight',
    details: {
      checkpointType: CheckpointType.FLUX1,
      type: ModelType.UNET,
    },
  },
  {
    key: 'add_embedding.linear_1.bias',
    details: {
      checkpointType: CheckpointType.SDXL,
      type: ModelType.CONTROLNET,
    },
  },
  {
    key: 'input_blocks.4.0.emb_layers.1.bias',
    details: {
      checkpointType: CheckpointType.SD1,
      type: ModelType.CONTROLNET,
    },
  },
  {
    key: 'lora_unet_down_blocks_0_downsamplers_0_conv.alpha',
    details: {
      checkpointType: CheckpointType.SD2,
      type: ModelType.LORA,
    },
  },
  {
    key: 'lora_te_text_model_encoder_layers_0_mlp_fc1.alpha',
    details: {
      checkpointType: CheckpointType.SD1,
      type: ModelType.LORA,
    },
  },
  {
    key: [
      'lora_unet_input_blocks_8_1_transformer_blocks_9_ff_net_2.lora_up.weight',
      'lora_te1_text_model_encoder_layers_0_mlp_fc1.alpha',
    ],
    details: {
      checkpointType: CheckpointType.SDXL,
      type: ModelType.LORA,
    },
  },
  {
    key: 'y_embedder.y_embedding',
    details: {
      checkpointType: CheckpointType.PIXART,
      type: ModelType.CHECKPOINT,
    },
  },
  {
    key: 'model.diffusion_model.output_blocks.3.1.time_stack.0.norm2.weight',
    details: {
      checkpointType: CheckpointType.SVD,
      type: ModelType.CHECKPOINT,
    },
  },
  {
    key: 'model.diffusion_model.joint_blocks.9.x_block.mlp.fc2.weight',
    details: {
      checkpointType: CheckpointType.SD3,
      type: ModelType.CHECKPOINT,
    },
  },
  {
    key: 'conditioner.embedders.1.model.transformer.resblocks.21.attn.out_proj.bias',
    details: {
      checkpointType: CheckpointType.SDXL,
      type: ModelType.CHECKPOINT,
    },
  },
  {
    key: 'cond_stage_model.model.transformer.resblocks.14.attn.out_proj.weight',
    details: {
      checkpointType: CheckpointType.SD2,
      type: ModelType.CHECKPOINT,
    },
  },
  {
    key: 'model.diffusion_model.output_blocks.9.1.transformer_blocks.0.norm3.weight',
    details: {
      checkpointType: CheckpointType.SD1,
      type: ModelType.CHECKPOINT,
    },
  },
];

export async function getModelDetails(
  modelPath: string,
): Promise<ModelDetails> {
  const dict = await getDict(modelPath);
  let details: ModelDetails = {};

  if (dict['state_dict']) {
    const state = dict['state_dict'];

    for (const pattern of PATTERNS) {
      if (typeof pattern.key === 'string') {
        if (state[pattern.key]) {
          details = { ...details, ...pattern.details };
          break;
        }
      } else {
        for (const key of pattern.key) {
          if (state[key]) {
            details = { ...details, ...pattern.details };
            break;
          }
        }
      }
    }
  }

  return details;
}
