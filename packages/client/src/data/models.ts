import { ModelType } from '@metastable/types';

import { DownloadableModelGroup } from '../types/model';

export const TYPE_NAMES: Record<ModelType, string> = {
  [ModelType.CHECKPOINT]: 'Checkpoint',
  [ModelType.CLIP]: 'CLIP',
  [ModelType.CLIP_VISION]: 'CLIP Vision',
  [ModelType.CONTROLNET]: 'ControlNet',
  [ModelType.DIFFUSER]: 'Diffuser',
  [ModelType.EMBEDDING]: 'Embedding',
  [ModelType.GLIGEN]: 'GLIGEN',
  [ModelType.HYPERNETWORK]: 'HyperNetwork',
  [ModelType.IPADAPTER]: 'IPAdapter',
  [ModelType.LORA]: 'LoRA',
  [ModelType.STYLE_MODEL]: 'Style model',
  [ModelType.UPSCALE_MODEL]: 'Upscale model',
  [ModelType.VAE]: 'VAE',
  [ModelType.VAE_APPROX]: 'VAE Approximation',
};

export const downloadable: DownloadableModelGroup[] = [
  {
    name: 'Stable Diffusion',
    type: ModelType.CHECKPOINT,
    recommended: true,
    description:
      'The original Stable Diffusion model, with most of the ecosystem built around the 1.5 version.',
    models: [
      {
        name: 'SD 1.5',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            name: 'sd_v1.5-pruned-emaonly.safetensors',
            url: 'https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors',
            size: 4265146304,
          },
        ],
        description:
          'The most commonly used checkpoint model. Most models on CivitAI are based on this.',
        recommended: true,
        homepage: 'https://huggingface.co/runwayml/stable-diffusion-v1-5',
        baseModel: 'SD 1.5',
      },
      {
        name: 'SD 2.1 512x',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            name: 'sd_v2.1_512-ema-pruned.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-2-1-base/resolve/main/v2-1_512-ema-pruned.safetensors',
            size: 5214604494,
          },
        ],
        description:
          'A newer version of Stable Diffusion with some censorship around artist names.',
        homepage:
          'https://huggingface.co/stabilityai/stable-diffusion-2-1-base',
        baseModel: 'SD 2.1',
      },
      {
        name: 'SD 2.1 768x',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            name: 'sd_v2.1_768-ema-pruned.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-2-1/resolve/main/v2-1_768-ema-pruned.safetensors',
            size: 5214604494,
          },
        ],
        description: 'A version of SD 2.1 made for 768x768 image generation.',
        homepage: 'https://huggingface.co/stabilityai/stable-diffusion-2-1',
        baseModel: 'SD 2.1 768',
      },
    ],
  },
  {
    name: 'Stable Diffusion XL Turbo',
    type: ModelType.CHECKPOINT,
    recommended: true,
    description: 'A faster version of the SDXL checkpoint.',
    models: [
      {
        name: 'SDXL Turbo 1.0',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        recommended: true,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            name: 'sd_xl_turbo_1.0_fp16.safetensors',
            url: 'https://huggingface.co/stabilityai/sdxl-turbo/resolve/main/sd_xl_turbo_1.0_fp16.safetensors',
            size: 6938081905,
          },
        ],
        homepage: 'https://huggingface.co/stabilityai/sdxl-turbo',
        samplerSettings: {
          steps: 1,
          cfg: 1,
          scheduler: 'turbo',
        },
        baseModel: 'SDXL Turbo',
      },
    ],
  },
  {
    name: 'Stable Diffusion XL',
    type: ModelType.CHECKPOINT,
    recommended: true,
    description:
      'Stable Diffusion checkpoint model built for high resolution image generation.',
    models: [
      {
        name: 'SDXL 1.0 - Base',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        recommended: true,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            name: 'sd_xl_base_1.0.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors',
            size: 6938078334,
          },
        ],
        homepage:
          'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0',
        baseModel: 'SDXL 1.0',
      },
      {
        name: 'SDXL 1.0 - Refiner',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            name: 'sd_xl_refiner_1.0.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-xl-refiner-1.0/resolve/main/sd_xl_refiner_1.0.safetensors',
            size: 6075981930,
          },
        ],
        description:
          'A model designed for improving the output from base SDXL.',
        homepage:
          'https://huggingface.co/stabilityai/stable-diffusion-xl-refiner-1.0',
        baseModel: 'SDXL 1.0',
      },
    ],
  },
  {
    name: 'Stable Diffusion Inpainting',
    type: ModelType.CHECKPOINT,
    description: 'Checkpoint models built for use with inpainting.',
    models: [
      {
        name: 'SD 1.5 Inpainting',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            name: 'sd_v1.5-inpainting.ckpt',
            url: 'https://huggingface.co/runwayml/stable-diffusion-inpainting/resolve/main/sd-v1-5-inpainting.ckpt',
            size: 4265437280,
          },
        ],
        homepage: 'https://huggingface.co/runwayml/stable-diffusion-inpainting',
        baseModel: 'SD 1.5',
      },
      {
        name: 'SD 2.0 Inpainting',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            name: 'sd_v2.0-inpainting.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-2-inpainting/resolve/main/512-inpainting-ema.safetensors',
            size: 5214662094,
          },
        ],
        homepage:
          'https://huggingface.co/stabilityai/stable-diffusion-2-inpainting',
        baseModel: 'SD 2.0',
      },
    ],
  },
  // {
  //   name: 'Stable Diffusion XL ReVision',
  //   type: ModelType.CLIP_VISION,
  //   description: 'Allows usage of images to prompt SDXL.',
  //   models: [
  //     {
  //       name: 'CLIP Vision',
  //       source: 'huggingface',
  //       type: ModelType.CLIP_VISION,
  //       downloads: [
  //         {
  //           type: ModelType.CLIP_VISION,
  //           name: 'sd_xl_revision.safetensors',
  //           url: 'https://huggingface.co/comfyanonymous/clip_vision_g/resolve/main/clip_vision_g.safetensors',
  //           size: 3689911098,
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   name: 'TAESD',
  //   type: ModelType.VAE_APPROX,
  //   description:
  //     'Allows steps to be previewed while the image is being generated.',
  //   models: [
  //     {
  //       name: 'TAESD',
  //       source: 'github',
  //       type: ModelType.VAE_APPROX,
  //       downloads: [
  //         {
  //           type: ModelType.VAE_APPROX,
  //           name: 'taesd_decoder.pth',
  //           url: 'https://github.com/madebyollin/taesd/raw/main/taesd_decoder.pth',
  //           size: 4915980,
  //         },
  //         {
  //           type: ModelType.VAE_APPROX,
  //           name: 'taesd_encoder.pth',
  //           url: 'https://github.com/madebyollin/taesd/raw/main/taesd_encoder.pth',
  //           size: 4915788,
  //         },
  //         {
  //           type: ModelType.VAE_APPROX,
  //           name: 'taesdxl_decoder.pth',
  //           url: 'https://github.com/madebyollin/taesd/raw/main/taesdxl_decoder.pth',
  //           size: 4915221,
  //         },
  //         {
  //           type: ModelType.VAE_APPROX,
  //           name: 'taesdxl_encoder.pth',
  //           url: 'https://github.com/madebyollin/taesd/raw/main/taesdxl_encoder.pth',
  //           size: 4915029,
  //         },
  //       ],
  //     },
  //   ],
  // },
  {
    name: 'RealESRGAN',
    type: ModelType.UPSCALE_MODEL,
    description: 'Allows for upscaling of output images.',
    models: [
      {
        name: 'RealESRGAN x4 plus',
        source: 'github',
        type: ModelType.UPSCALE_MODEL,
        recommended: true,
        description: 'A better universal 4x upscale model.',
        downloads: [
          {
            type: ModelType.UPSCALE_MODEL,
            name: 'realesrgan_x4plus.pth',
            url: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth',
            size: 67040989,
          },
        ],
        homepage: 'https://github.com/xinntao/Real-ESRGAN',
      },
      {
        name: 'RealESRGAN x4 plus - Anime',
        source: 'github',
        type: ModelType.UPSCALE_MODEL,
        recommended: true,
        description: 'A 4x upscale model tailored for anime/cartoon art.',
        downloads: [
          {
            type: ModelType.UPSCALE_MODEL,
            name: 'realesrgan_x4plus_anime.pth',
            url: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth',
            size: 17938799,
          },
        ],
        homepage: 'https://github.com/xinntao/Real-ESRGAN',
      },
      {
        name: 'RealESRGAN x4',
        source: 'huggingface',
        type: ModelType.UPSCALE_MODEL,
        description: 'An universal 4x upscale model.',
        downloads: [
          {
            type: ModelType.UPSCALE_MODEL,
            name: 'realesrgan_x4.pth',
            url: 'https://huggingface.co/sberbank-ai/Real-ESRGAN/resolve/main/RealESRGAN_x4.pth',
            size: 67040989,
          },
        ],
        homepage: 'https://huggingface.co/sberbank-ai/Real-ESRGAN',
      },
      {
        name: 'RealESRGAN x2',
        source: 'huggingface',
        type: ModelType.UPSCALE_MODEL,
        description: 'An universal 2x upscale model.',
        downloads: [
          {
            type: ModelType.UPSCALE_MODEL,
            name: 'realesrgan_x2.pth',
            url: 'https://huggingface.co/sberbank-ai/Real-ESRGAN/resolve/main/RealESRGAN_x2.pth',
            size: 67061725,
          },
        ],
        homepage: 'https://huggingface.co/sberbank-ai/Real-ESRGAN',
      },
    ],
  },
  {
    name: 'QRCode ControlNet',
    type: ModelType.CONTROLNET,
    models: [
      {
        name: 'QRCode ControlNet - SD 1.5',
        source: 'huggingface',
        type: ModelType.CONTROLNET,
        downloads: [
          {
            type: ModelType.CONTROLNET,
            name: 'sd1.5_qrcode_controlnet.safetensors',
            url: 'https://huggingface.co/DionTimmer/controlnet_qrcode/resolve/main/control_v1p_sd15_qrcode.safetensors',
            size: 1445154814,
          },
        ],
        homepage: 'https://huggingface.co/DionTimmer/controlnet_qrcode',
        baseModel: 'SD 1.5',
      },
      {
        name: 'QRCode ControlNet - SD 2.1',
        source: 'huggingface',
        type: ModelType.CONTROLNET,
        downloads: [
          {
            type: ModelType.CONTROLNET,
            name: 'sd2.1_qrcode_controlnet.safetensors',
            url: 'https://huggingface.co/DionTimmer/controlnet_qrcode/resolve/main/control_v11p_sd21_qrcode.safetensors',
            size: 1456951266,
          },
        ],
        homepage: 'https://huggingface.co/DionTimmer/controlnet_qrcode',
        baseModel: 'SD 2.1',
      },
    ],
  },
  {
    name: 'IPAdapter',
    type: ModelType.IPADAPTER,
    models: [
      {
        name: 'IPAdapter Plus - SD 1.5',
        source: 'huggingface',
        type: ModelType.IPADAPTER,
        downloads: [
          {
            type: ModelType.IPADAPTER,
            name: 'ipadapter_plus_sd15.bin',
            url: 'https://huggingface.co/h94/IP-Adapter/resolve/main/models/ip-adapter-plus_sd15.bin',
            size: 158033179,
          },
          {
            type: ModelType.CLIP_VISION,
            name: 'ipadapter_clipvision_sd15.safetensors',
            url: 'https://huggingface.co/h94/IP-Adapter/resolve/main/sdxl_models/image_encoder/model.safetensors',
            size: 2528373448,
          },
        ],
        homepage: 'https://huggingface.co/h94/IP-Adapter',
        baseModel: 'SD 1.5',
      },
      {
        name: 'IPAdapter Plus - SDXL 1.0',
        source: 'huggingface',
        type: ModelType.IPADAPTER,
        downloads: [
          {
            type: ModelType.IPADAPTER,
            name: 'ipadapter_plus_sdxl.safetensors',
            url: 'https://huggingface.co/h94/IP-Adapter/resolve/main/sdxl_models/ip-adapter-plus_sdxl_vit-h.safetensors',
            size: 847517512,
          },
          {
            type: ModelType.CLIP_VISION,
            name: 'ipadapter_clipvision_sdxl.safetensors',
            url: 'https://huggingface.co/h94/IP-Adapter/resolve/main/sdxl_models/image_encoder/model.safetensors',
            size: 3689912664,
          },
        ],
        homepage: 'https://huggingface.co/h94/IP-Adapter',
        baseModel: 'SDXL 1.0',
      },
    ],
  },
];
