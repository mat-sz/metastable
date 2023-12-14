import { ModelType } from '@metastable/types';

import { DownloadableModelGroup } from '../types/model';

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
            filename: 'sd_v1.5-pruned-emaonly.safetensors',
            url: 'https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors',
            size: 4265146304,
          },
        ],
        description:
          'The most commonly used checkpoint model. Most models on CivitAI are based on this.',
        recommended: true,
      },
      {
        name: 'SD 2.1 512x',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            filename: 'sd_v2.1_512-ema-pruned.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-2-1-base/resolve/main/v2-1_512-ema-pruned.safetensors',
            size: 5214604494,
          },
        ],
        description:
          'A newer version of Stable Diffusion with some censorship around artist names.',
      },
      {
        name: 'SD 2.1 768x',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            filename: 'sd_v2.1_768-ema-pruned.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-2-1/resolve/main/v2-1_768-ema-pruned.safetensors',
            size: 5214604494,
          },
        ],
        description: 'A version of SD 2.1 made for 768x768 image generation.',
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
            filename: 'sd_xl_base_1.0.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors',
            size: 6938078334,
          },
        ],
      },
      {
        name: 'SDXL 1.0 - Refiner',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            filename: 'sd_xl_refiner_1.0.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-xl-refiner-1.0/resolve/main/sd_xl_refiner_1.0.safetensors',
            size: 6075981930,
          },
        ],
        description:
          'A model designed for improving the output from base SDXL.',
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
            filename: 'sd_v1.5-inpainting.ckpt',
            url: 'https://huggingface.co/runwayml/stable-diffusion-inpainting/resolve/main/sd-v1-5-inpainting.ckpt',
            size: 4265437280,
          },
        ],
      },
      {
        name: 'SD 2.0 Inpainting',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            filename: 'sd_v2.0-inpainting.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-2-inpainting/resolve/main/512-inpainting-ema.safetensors',
            size: 5214662094,
          },
        ],
      },
    ],
  },
  {
    name: 'Stable Diffusion XL ReVision',
    type: ModelType.CLIP_VISION,
    description: 'Allows usage of images to prompt SDXL.',
    models: [
      {
        name: 'CLIP Vision',
        source: 'huggingface',
        type: ModelType.CLIP_VISION,
        downloads: [
          {
            type: ModelType.CLIP_VISION,
            filename: 'sd_xl_revision.safetensors',
            url: 'https://huggingface.co/comfyanonymous/clip_vision_g/resolve/main/clip_vision_g.safetensors',
            size: 3689911098,
          },
        ],
      },
    ],
  },
  {
    name: 'TAESD',
    type: ModelType.VAE_APPROX,
    description:
      'Allows steps to be previewed while the image is being generated.',
    models: [
      {
        name: 'TAESD',
        source: 'github',
        type: ModelType.VAE_APPROX,
        downloads: [
          {
            type: ModelType.VAE_APPROX,
            filename: 'taesd_decoder.pth',
            url: 'https://github.com/madebyollin/taesd/raw/main/taesd_decoder.pth',
            size: 4915980,
          },
          {
            type: ModelType.VAE_APPROX,
            filename: 'taesd_encoder.pth',
            url: 'https://github.com/madebyollin/taesd/raw/main/taesd_encoder.pth',
            size: 4915788,
          },
          {
            type: ModelType.VAE_APPROX,
            filename: 'taesdxl_decoder.pth',
            url: 'https://github.com/madebyollin/taesd/raw/main/taesdxl_decoder.pth',
            size: 4915221,
          },
          {
            type: ModelType.VAE_APPROX,
            filename: 'taesdxl_encoder.pth',
            url: 'https://github.com/madebyollin/taesd/raw/main/taesdxl_encoder.pth',
            size: 4915029,
          },
        ],
      },
    ],
  },
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
            filename: 'realesrgan_x4plus.pth',
            url: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth',
            size: 67040989,
          },
        ],
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
            filename: 'realesrgan_x4plus_anime.pth',
            url: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth',
            size: 17938799,
          },
        ],
      },
      {
        name: 'RealESRGAN x4',
        source: 'huggingface',
        type: ModelType.UPSCALE_MODEL,
        description: 'An universal 4x upscale model.',
        downloads: [
          {
            type: ModelType.UPSCALE_MODEL,
            filename: 'realesrgan_x4.pth',
            url: 'https://huggingface.co/sberbank-ai/Real-ESRGAN/resolve/main/RealESRGAN_x4.pth',
            size: 67040989,
          },
        ],
      },
      {
        name: 'RealESRGAN x2',
        source: 'huggingface',
        type: ModelType.UPSCALE_MODEL,
        description: 'An universal 2x upscale model.',
        downloads: [
          {
            type: ModelType.UPSCALE_MODEL,
            filename: 'realesrgan_x2.pth',
            url: 'https://huggingface.co/sberbank-ai/Real-ESRGAN/resolve/main/RealESRGAN_x2.pth',
            size: 67061725,
          },
        ],
      },
    ],
  },
  {
    name: 'QRCode ControlNet',
    type: ModelType.CONTROLNET,
    models: [
      {
        name: 'QRCode ControlNet - SD 1.5',
        source: 'github',
        type: ModelType.CONTROLNET,
        downloads: [
          {
            type: ModelType.CONTROLNET,
            filename: 'sd1.5_qrcode_controlnet.safetensors',
            url: 'https://huggingface.co/DionTimmer/controlnet_qrcode/resolve/main/control_v1p_sd15_qrcode.safetensors',
            size: 1445154814,
          },
        ],
      },
      {
        name: 'QRCode ControlNet - SD 2.1',
        source: 'github',
        type: ModelType.CONTROLNET,
        downloads: [
          {
            type: ModelType.CONTROLNET,
            filename: 'sd2.1_qrcode_controlnet.safetensors',
            url: 'https://huggingface.co/DionTimmer/controlnet_qrcode/resolve/main/control_v11p_sd21_qrcode.safetensors',
            size: 1456951266,
          },
        ],
      },
    ],
  },
];
