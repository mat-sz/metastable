import { Architecture, ModelDetails, ModelType } from '@metastable/types';

import { readPytorch } from './pytorch.js';
import { readSafetensors } from './safetensors.js';

export const PYTORCH_EXTENSIONS = ['ckpt', 'pt', 'bin', 'pth'];
export const SAFETENSORS_EXTENSIONS = ['safetensors', 'sft', 'st'];
export const SUPPORTED_MODEL_TYPES = [
  ModelType.CHECKPOINT,
  ModelType.LORA,
  ModelType.CONTROLNET,
  ModelType.DIFFUSION_MODEL,
  ModelType.VAE,
];

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
  matchLists: string[][];
  details: ModelDetails;
}

const PATTERNS: StatePattern[] = [
  {
    matchLists: [
      ['txt_in.individual_token_refiner.blocks.0.norm1.weight'],
      ['model.model.txt_in.individual_token_refiner.blocks.0.norm1.weight'],
    ],
    details: {
      architecture: Architecture.HUNYUAN_VIDEO,
      type: ModelType.DIFFUSION_MODEL,
    },
  },
  {
    matchLists: [
      ['encoder.down.1.downsample.conv.conv.bias', 'post_quant_conv.bias'],
      [
        'encoder.down_blocks.1.downsamplers.0.conv.conv.bias',
        'post_quant_conv.bias',
      ],
    ],
    details: {
      architecture: Architecture.HUNYUAN_VIDEO,
      type: ModelType.VAE,
    },
  },
  {
    matchLists: [['lora_unet_double_blocks_12_img_mod_lin.lora_down.weight']],
    details: {
      architecture: Architecture.FLUX1,
      type: ModelType.LORA,
    },
  },
  {
    matchLists: [['encoder.mid.attn_1.v.weight']],
    details: {
      architecture: Architecture.FLUX1,
      type: ModelType.VAE,
    },
  },
  {
    matchLists: [['double_blocks.0.img_attn.norm.key_norm.scale']],
    details: {
      architecture: Architecture.FLUX1,
      type: ModelType.DIFFUSION_MODEL,
    },
  },
  {
    matchLists: [['add_embedding.linear_1.bias']],
    details: {
      architecture: Architecture.SDXL,
      type: ModelType.CONTROLNET,
    },
  },
  {
    matchLists: [['input_blocks.4.0.emb_layers.1.bias']],
    details: {
      architecture: Architecture.SD1,
      type: ModelType.CONTROLNET,
    },
  },
  {
    matchLists: [['lora_unet_down_blocks_0_downsamplers_0_conv.alpha']],
    details: {
      architecture: Architecture.SD2,
      type: ModelType.LORA,
    },
  },
  {
    matchLists: [['lora_te_text_model_encoder_layers_0_mlp_fc1.alpha']],
    details: {
      architecture: Architecture.SD1,
      type: ModelType.LORA,
    },
  },
  {
    matchLists: [
      [
        'lora_unet_input_blocks_8_1_transformer_blocks_9_ff_net_2.lora_up.weight',
      ],
      ['lora_te1_text_model_encoder_layers_0_mlp_fc1.alpha'],
    ],
    details: {
      architecture: Architecture.SDXL,
      type: ModelType.LORA,
    },
  },
  {
    matchLists: [['y_embedder.y_embedding']],
    details: {
      architecture: Architecture.PIXART,
      type: ModelType.CHECKPOINT,
    },
  },
  {
    matchLists: [
      ['model.diffusion_model.output_blocks.3.1.time_stack.0.norm2.weight'],
    ],
    details: {
      architecture: Architecture.SVD,
      type: ModelType.CHECKPOINT,
    },
  },
  {
    matchLists: [
      ['model.diffusion_model.joint_blocks.9.x_block.mlp.fc2.weight'],
    ],
    details: {
      architecture: Architecture.SD3,
      type: ModelType.CHECKPOINT,
    },
  },
  {
    matchLists: [
      [
        'conditioner.embedders.1.model.transformer.resblocks.21.attn.out_proj.bias',
      ],
    ],
    details: {
      architecture: Architecture.SDXL,
      type: ModelType.CHECKPOINT,
    },
  },
  {
    matchLists: [
      ['cond_stage_model.model.transformer.resblocks.14.attn.out_proj.weight'],
    ],
    details: {
      architecture: Architecture.SD2,
      type: ModelType.CHECKPOINT,
    },
  },
  {
    matchLists: [
      [
        'model.diffusion_model.output_blocks.9.1.transformer_blocks.0.norm3.weight',
        'model.diffusion_model.input_blocks.3.0.op.weight',
        'model.diffusion_model.input_blocks.6.0.op.weight',
        'model.diffusion_model.input_blocks.9.0.op.weight',
        'model.diffusion_model.output_blocks.2.1.conv.weight',
        'model.diffusion_model.output_blocks.5.2.conv.weight',
        'model.diffusion_model.output_blocks.8.2.conv.weight',
      ],
    ],
    details: {
      architecture: Architecture.SD1,
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
      if (pattern.matchLists.some(list => list.every(key => !!state[key]))) {
        details = { ...details, ...pattern.details };
        break;
      }
    }
  }

  return details;
}
