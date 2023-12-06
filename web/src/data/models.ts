import { DownloadableModelGroup, ModelType } from '../types/model';

export const downloadable: DownloadableModelGroup[] = [
  {
    name: 'Stable Diffusion',
    models: [
      {
        name: 'SD 1.5',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            filename: 'sd_v1.5-pruned-emaonly.ckpt',
            url: 'https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.ckpt',
          },
        ],
        recommended: true,
      },
      {
        name: 'SD 1.5 Inpainting',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            filename: 'sd_v1-5-inpainting.ckpt',
            url: 'https://huggingface.co/runwayml/stable-diffusion-inpainting/resolve/main/sd-v1-5-inpainting.ckpt',
          },
        ],
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
          },
        ],
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
          },
        ],
      },
      {
        name: 'SDXL 1.0 - Base',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            filename: 'sd_xl_base_1.0.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors',
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
          },
        ],
      },
    ],
  },
  {
    name: 'Stable Diffusion XL ReVision',
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
          },
        ],
      },
    ],
  },
  {
    name: 'TAESD',
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
          },
          {
            type: ModelType.VAE_APPROX,
            filename: 'taesd_encoder.pth',
            url: 'https://github.com/madebyollin/taesd/raw/main/taesd_encoder.pth',
          },
          {
            type: ModelType.VAE_APPROX,
            filename: 'taesdxl_decoder.pth',
            url: 'https://github.com/madebyollin/taesd/raw/main/taesdxl_decoder.pth',
          },
          {
            type: ModelType.VAE_APPROX,
            filename: 'taesdxl_encoder.pth',
            url: 'https://github.com/madebyollin/taesd/raw/main/taesdxl_encoder.pth',
          },
        ],
      },
    ],
  },
  {
    name: 'RealESRGAN',
    models: [
      {
        name: 'RealESRGAN x4 plus',
        source: 'github',
        type: ModelType.UPSCALE_MODEL,
        downloads: [
          {
            type: ModelType.UPSCALE_MODEL,
            filename: 'realesrgan_x4plus.pth',
            url: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth',
          },
        ],
      },
      {
        name: 'RealESRGAN x4 plus - Anime',
        source: 'github',
        type: ModelType.UPSCALE_MODEL,
        downloads: [
          {
            type: ModelType.UPSCALE_MODEL,
            filename: 'realesrgan_x4plus_anime.pth',
            url: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth',
          },
        ],
      },
      {
        name: 'RealESRGAN x4',
        source: 'huggingface',
        type: ModelType.UPSCALE_MODEL,
        downloads: [
          {
            type: ModelType.UPSCALE_MODEL,
            filename: 'realesrgan_x4.pth',
            url: 'https://huggingface.co/sberbank-ai/Real-ESRGAN/resolve/main/RealESRGAN_x4.pth',
          },
        ],
      },
      {
        name: 'RealESRGAN x2',
        source: 'huggingface',
        type: ModelType.UPSCALE_MODEL,
        downloads: [
          {
            type: ModelType.UPSCALE_MODEL,
            filename: 'realesrgan_x2.pth',
            url: 'https://huggingface.co/sberbank-ai/Real-ESRGAN/resolve/main/RealESRGAN_x2.pth',
          },
        ],
      },
    ],
  },
];
