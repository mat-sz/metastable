import { ModelType } from '@metastable/types';

import { DownloadableModelGroup, DownloadableModelWarning } from '$types/model';

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
            url: 'https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors',
            size: 4265146304,
          },
        ],
        description:
          'The most commonly used checkpoint model. Most models on CivitAI are based on this.',
        recommended: true,
        homepage:
          'https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5',
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
        name: 'SDXL 1.0',
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
            metadata: {
              samplerSettings: {
                steps: 1,
                cfg: 1,
                schedulerName: 'turbo',
              },
            },
          },
        ],
        homepage: 'https://huggingface.co/stabilityai/sdxl-turbo',
      },
    ],
  },
  {
    name: 'Stable Diffusion 3',
    type: ModelType.CHECKPOINT,
    description: 'Latest Stable Diffusion models.',
    models: [
      {
        name: 'SD 3 Medium',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            name: 'sd3_medium.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-3-medium/resolve/main/sd3_medium.safetensors',
            size: 4337667306,
          },
          {
            type: ModelType.TEXT_ENCODER,
            name: 'clip_l.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-3-medium/resolve/main/text_encoders/clip_l.safetensors',
            size: 246144152,
            ignoreParentMetadata: true,
          },
          {
            type: ModelType.TEXT_ENCODER,
            name: 'clip_g.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-3-medium/resolve/main/text_encoders/clip_g.safetensors',
            size: 1389382176,
            ignoreParentMetadata: true,
          },
          {
            type: ModelType.TEXT_ENCODER,
            name: 't5xxl_fp16.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-3-medium/resolve/main/text_encoders/t5xxl_fp16.safetensors',
            size: 9787841024,
            ignoreParentMetadata: true,
          },
        ],
        homepage:
          'https://huggingface.co/stabilityai/stable-diffusion-3-medium',
        warnings: [
          DownloadableModelWarning.HF_GATED,
          DownloadableModelWarning.AUTHORIZATION_REQUIRED,
        ],
        createMetamodel: {
          name: 'sd3_medium',
          type: ModelType.CHECKPOINT,
          models: {
            checkpoint: 'mrn:model:checkpoint:sd3_medium.safetensors',
            textEncoders: [
              'mrn:model:text_encoder:clip_g.safetensors',
              'mrn:model:text_encoder:clip_l.safetensors',
              'mrn:model:text_encoder:t5xxl_fp16.safetensors',
            ],
          },
        },
      },
      {
        name: 'SD 3.5 Mdium',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            name: 'sd3.5_medium.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-3.5-medium/resolve/main/sd3.5_medium.safetensors',
            size: 5107104286,
          },
          {
            type: ModelType.TEXT_ENCODER,
            name: 'clip_l.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-3.5-medium/resolve/main/text_encoders/clip_l.safetensors',
            size: 246144152,
            ignoreParentMetadata: true,
          },
          {
            type: ModelType.TEXT_ENCODER,
            name: 'clip_g.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-3.5-medium/resolve/main/text_encoders/clip_g.safetensors',
            size: 1389382176,
            ignoreParentMetadata: true,
          },
          {
            type: ModelType.TEXT_ENCODER,
            name: 't5xxl_fp16.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-3.5-medium/resolve/main/text_encoders/t5xxl_fp16.safetensors',
            size: 9787841024,
            ignoreParentMetadata: true,
          },
        ],
        homepage:
          'https://huggingface.co/stabilityai/stable-diffusion-3-medium',
        warnings: [
          DownloadableModelWarning.HF_GATED,
          DownloadableModelWarning.AUTHORIZATION_REQUIRED,
        ],
        createMetamodel: {
          name: 'sd35_medium',
          type: ModelType.CHECKPOINT,
          models: {
            checkpoint: 'mrn:model:checkpoint:sd3.5_medium.safetensors',
            textEncoders: [
              'mrn:model:text_encoder:clip_g.safetensors',
              'mrn:model:text_encoder:clip_l.safetensors',
              'mrn:model:text_encoder:t5xxl_fp16.safetensors',
            ],
          },
        },
      },
      {
        name: 'SD 3.5 Large Turbo',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            name: 'sd3.5_large_turbo.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-3.5-large-turbo/resolve/main/sd3.5_large_turbo.safetensors',
            size: 16460374454,
          },
          {
            type: ModelType.TEXT_ENCODER,
            name: 'clip_l.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-3.5-large-turbo/resolve/main/text_encoders/clip_l.safetensors',
            size: 246144152,
            ignoreParentMetadata: true,
          },
          {
            type: ModelType.TEXT_ENCODER,
            name: 'clip_g.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-3.5-large-turbo/resolve/main/text_encoders/clip_g.safetensors',
            size: 1389382176,
            ignoreParentMetadata: true,
          },
          {
            type: ModelType.TEXT_ENCODER,
            name: 't5xxl_fp16.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-3.5-large-turbo/resolve/main/text_encoders/t5xxl_fp16.safetensors',
            size: 9787841024,
            ignoreParentMetadata: true,
          },
        ],
        homepage:
          'https://huggingface.co/stabilityai/stable-diffusion-3-medium',
        warnings: [
          DownloadableModelWarning.HF_GATED,
          DownloadableModelWarning.AUTHORIZATION_REQUIRED,
        ],
        createMetamodel: {
          name: 'sd35_large_turbo',
          type: ModelType.CHECKPOINT,
          models: {
            checkpoint: 'mrn:model:checkpoint:sd3.5_large_turbo.safetensors',
            textEncoders: [
              'mrn:model:text_encoder:clip_g.safetensors',
              'mrn:model:text_encoder:clip_l.safetensors',
              'mrn:model:text_encoder:t5xxl_fp16.safetensors',
            ],
          },
        },
      },
      {
        name: 'SD 3.5 Large',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        downloads: [
          {
            type: ModelType.CHECKPOINT,
            name: 'sd3.5_large.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-3.5-large/resolve/main/sd3.5_large.safetensors',
            size: 16460379262,
          },
          {
            type: ModelType.TEXT_ENCODER,
            name: 'clip_l.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-3.5-large/resolve/main/text_encoders/clip_l.safetensors',
            size: 246144152,
            ignoreParentMetadata: true,
          },
          {
            type: ModelType.TEXT_ENCODER,
            name: 'clip_g.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-3.5-large/resolve/main/text_encoders/clip_g.safetensors',
            size: 1389382176,
            ignoreParentMetadata: true,
          },
          {
            type: ModelType.TEXT_ENCODER,
            name: 't5xxl_fp16.safetensors',
            url: 'https://huggingface.co/stabilityai/stable-diffusion-3.5-large/resolve/main/text_encoders/t5xxl_fp16.safetensors',
            size: 9787841024,
            ignoreParentMetadata: true,
          },
        ],
        homepage:
          'https://huggingface.co/stabilityai/stable-diffusion-3-medium',
        warnings: [
          DownloadableModelWarning.HF_GATED,
          DownloadableModelWarning.AUTHORIZATION_REQUIRED,
        ],
        createMetamodel: {
          name: 'sd35_large',
          type: ModelType.CHECKPOINT,
          models: {
            checkpoint: 'mrn:model:checkpoint:sd3.5_large.safetensors',
            textEncoders: [
              'mrn:model:text_encoder:clip_g.safetensors',
              'mrn:model:text_encoder:clip_l.safetensors',
              'mrn:model:text_encoder:t5xxl_fp16.safetensors',
            ],
          },
        },
      },
    ],
  },
  {
    name: 'FLUX.1',
    type: ModelType.CHECKPOINT,
    description:
      'FLUX.1 is a text-to-image model developed by Black Forest Labs.',
    recommended: true,
    models: [
      {
        name: 'FLUX.1 Schnell',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        recommended: true,
        downloads: [
          {
            type: ModelType.DIFFUSION_MODEL,
            name: 'flux1-schnell.safetensors',
            url: 'https://huggingface.co/black-forest-labs/FLUX.1-schnell/resolve/main/flux1-schnell.safetensors',
            size: 23782506688,
          },
          {
            type: ModelType.TEXT_ENCODER,
            name: 'clip_l.safetensors',
            url: 'https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors',
            size: 246144152,
            ignoreParentMetadata: true,
          },
          {
            type: ModelType.TEXT_ENCODER,
            name: 't5xxl_fp16.safetensors',
            url: 'https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp16.safetensors',
            size: 9787841024,
            ignoreParentMetadata: true,
          },
          {
            type: ModelType.VAE,
            name: 'flux_vae.safetensors',
            url: 'https://huggingface.co/black-forest-labs/FLUX.1-schnell/resolve/main/ae.safetensors',
            size: 335304388,
            ignoreParentMetadata: true,
            metadata: {
              name: 'FLUX VAE',
            },
          },
        ],
        homepage: 'https://huggingface.co/black-forest-labs/FLUX.1-schnell',
        createMetamodel: {
          name: 'flux1_schnell',
          type: ModelType.CHECKPOINT,
          models: {
            diffusionModel:
              'mrn:model:diffusion_model:flux1-schnell.safetensors',
            vae: 'mrn:model:vae:flux_vae.safetensors',
            textEncoders: [
              'mrn:model:text_encoder:t5xxl_fp16.safetensors',
              'mrn:model:text_encoder:clip_l.safetensors',
            ],
          },
        },
      },
      {
        name: 'FLUX.1 Dev',
        source: 'huggingface',
        type: ModelType.CHECKPOINT,
        downloads: [
          {
            type: ModelType.DIFFUSION_MODEL,
            name: 'flux1-dev.safetensors',
            url: 'https://huggingface.co/black-forest-labs/FLUX.1-dev/resolve/main/flux1-dev.safetensors',
            size: 23802932552,
          },
          {
            type: ModelType.TEXT_ENCODER,
            name: 'clip_l.safetensors',
            url: 'https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors',
            size: 246144152,
            ignoreParentMetadata: true,
          },
          {
            type: ModelType.TEXT_ENCODER,
            name: 't5xxl_fp16.safetensors',
            url: 'https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp16.safetensors',
            size: 9787841024,
            ignoreParentMetadata: true,
          },
          {
            type: ModelType.VAE,
            name: 'flux_vae.safetensors',
            url: 'https://huggingface.co/black-forest-labs/FLUX.1-dev/resolve/main/ae.safetensors',
            size: 335304388,
            ignoreParentMetadata: true,
            metadata: {
              name: 'FLUX VAE',
            },
          },
        ],
        homepage: 'https://huggingface.co/black-forest-labs/FLUX.1-dev',
        warnings: [
          DownloadableModelWarning.HF_GATED,
          DownloadableModelWarning.AUTHORIZATION_REQUIRED,
        ],
        createMetamodel: {
          name: 'flux1_dev',
          type: ModelType.CHECKPOINT,
          models: {
            diffusionModel: 'mrn:model:diffusion_model:flux1-dev.safetensors',
            vae: 'mrn:model:vae:flux_vae.safetensors',
            textEncoders: [
              'mrn:model:text_encoder:t5xxl_fp16.safetensors',
              'mrn:model:text_encoder:clip_l.safetensors',
            ],
          },
        },
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
      },
    ],
  },
  // {
  //   name: 'Stable Video Diffusion',
  //   type: ModelType.CHECKPOINT,
  //   models: [
  //     {
  //       name: 'Stable Video Diffusion',
  //       description: '14 frames version of SVD',
  //       source: 'huggingface',
  //       type: ModelType.CHECKPOINT,
  //       downloads: [
  //         {
  //           type: ModelType.CHECKPOINT,
  //           name: 'svd.safetensors',
  //           url: 'https://huggingface.co/stabilityai/stable-video-diffusion-img2vid/resolve/main/svd.safetensors',
  //           size: 9559625980,
  //         },
  //       ],
  //       homepage:
  //         'https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt',
  //     },
  //     {
  //       name: 'Stable Video Diffusion XT',
  //       description: '25 frames version of SVD',
  //       source: 'huggingface',
  //       type: ModelType.CHECKPOINT,
  //       downloads: [
  //         {
  //           type: ModelType.CHECKPOINT,
  //           name: 'svd_xt.safetensors',
  //           url: 'https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt/resolve/main/svd_xt.safetensors',
  //           size: 9559625980,
  //         },
  //       ],
  //       homepage:
  //         'https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt',
  //     },
  //   ],
  // },
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
      },
    ],
  },
  {
    name: 'IPAdapter',
    type: ModelType.IPADAPTER,
    models: [
      {
        name: 'IPAdapter Plus - SD 1.5 (ViT-H)',
        source: 'huggingface',
        type: ModelType.IPADAPTER,
        downloads: [
          {
            type: ModelType.IPADAPTER,
            name: 'ipadapter_plus_sd15.safetensors',
            url: 'https://huggingface.co/h94/IP-Adapter/resolve/main/models/ip-adapter-plus_sd15.safetensors',
            size: 98183288,
          },
        ],
        homepage: 'https://huggingface.co/h94/IP-Adapter',
      },
      {
        name: 'IPAdapter Plus - SDXL 1.0 (ViT-H)',
        source: 'huggingface',
        type: ModelType.IPADAPTER,
        downloads: [
          {
            type: ModelType.IPADAPTER,
            name: 'ipadapter_plus_sdxl.safetensors',
            url: 'https://huggingface.co/h94/IP-Adapter/resolve/main/sdxl_models/ip-adapter-plus_sdxl_vit-h.safetensors',
            size: 847517512,
          },
        ],
        homepage: 'https://huggingface.co/h94/IP-Adapter',
      },
      {
        name: 'IPAdapter CLIP Vision - ViT-H',
        source: 'huggingface',
        type: ModelType.IPADAPTER,
        downloads: [
          {
            type: ModelType.CLIP_VISION,
            name: 'ipadapter_clipvision_vit-h.safetensors',
            url: 'https://huggingface.co/h94/IP-Adapter/resolve/main/models/image_encoder/model.safetensors',
            size: 2528373448,
          },
        ],
        homepage: 'https://huggingface.co/h94/IP-Adapter',
      },
      {
        name: 'IPAdapter CLIP Vision - ViT-G',
        source: 'huggingface',
        type: ModelType.IPADAPTER,
        downloads: [
          {
            type: ModelType.CLIP_VISION,
            name: 'ipadapter_clipvision_vit-g.safetensors',
            url: 'https://huggingface.co/h94/IP-Adapter/resolve/main/sdxl_models/image_encoder/model.safetensors',
            size: 3689912664,
          },
        ],
        homepage: 'https://huggingface.co/h94/IP-Adapter',
      },
    ],
  },
  {
    name: 'Segment Anything 2',
    type: ModelType.SEGMENT_ANYTHING,
    models: [
      {
        name: 'Segment Anything 2.1 - Tiny (FP32)',
        source: 'huggingface',
        type: ModelType.IPADAPTER,
        downloads: [
          {
            type: ModelType.CLIP_VISION,
            name: 'sam2.1_hiera_tiny.safetensors',
            url: 'https://huggingface.co/Kijai/sam2-safetensors/resolve/main/sam2.1_hiera_tiny.safetensors',
            size: 155906872,
          },
        ],
        homepage: 'https://huggingface.co/Kijai/sam2-safetensors',
      },
      {
        name: 'Segment Anything 2.1 - Tiny (FP16)',
        source: 'huggingface',
        type: ModelType.IPADAPTER,
        recommended: true,
        downloads: [
          {
            type: ModelType.CLIP_VISION,
            name: 'sam2.1_hiera_tiny-fp16.safetensors',
            url: 'https://huggingface.co/Kijai/sam2-safetensors/resolve/main/sam2.1_hiera_tiny-fp16.safetensors',
            size: 77980668,
          },
        ],
        homepage: 'https://huggingface.co/Kijai/sam2-safetensors',
      },
      {
        name: 'Segment Anything 2.1 - Small (FP32)',
        source: 'huggingface',
        type: ModelType.IPADAPTER,
        downloads: [
          {
            type: ModelType.CLIP_VISION,
            name: 'sam2.1_hiera_small.safetensors',
            url: 'https://huggingface.co/Kijai/sam2-safetensors/resolve/main/sam2.1_hiera_small.safetensors',
            size: 184303872,
          },
        ],
        homepage: 'https://huggingface.co/Kijai/sam2-safetensors',
      },
      {
        name: 'Segment Anything 2.1 - Small (FP16)',
        source: 'huggingface',
        type: ModelType.IPADAPTER,
        recommended: true,
        downloads: [
          {
            type: ModelType.CLIP_VISION,
            name: 'sam2.1_hiera_small-fp16.safetensors',
            url: 'https://huggingface.co/Kijai/sam2-safetensors/resolve/main/sam2.1_hiera_small-fp16.safetensors',
            size: 92181820,
          },
        ],
        homepage: 'https://huggingface.co/Kijai/sam2-safetensors',
      },
      {
        name: 'Segment Anything 2.1 - Base (FP32)',
        source: 'huggingface',
        type: ModelType.IPADAPTER,
        downloads: [
          {
            type: ModelType.CLIP_VISION,
            name: 'sam2.1_hiera_base_plus.safetensors',
            url: 'https://huggingface.co/Kijai/sam2-safetensors/resolve/main/sam2.1_hiera_base_plus.safetensors',
            size: 323474320,
          },
        ],
        homepage: 'https://huggingface.co/Kijai/sam2-safetensors',
      },
      {
        name: 'Segment Anything 2.1 - Base (FP16)',
        source: 'huggingface',
        type: ModelType.IPADAPTER,
        downloads: [
          {
            type: ModelType.CLIP_VISION,
            name: 'sam2.1_hiera_base_plus-fp16.safetensors',
            url: 'https://huggingface.co/Kijai/sam2-safetensors/resolve/main/sam2.1_hiera_base_plus-fp16.safetensors',
            size: 161773292,
          },
        ],
        homepage: 'https://huggingface.co/Kijai/sam2-safetensors',
      },
      {
        name: 'Segment Anything 2.1 - Large (FP32)',
        source: 'huggingface',
        type: ModelType.IPADAPTER,
        downloads: [
          {
            type: ModelType.CLIP_VISION,
            name: 'sam2.1_hiera_large.safetensors',
            url: 'https://huggingface.co/Kijai/sam2-safetensors/resolve/main/sam2.1_hiera_large.safetensors',
            size: 897893808,
          },
        ],
        homepage: 'https://huggingface.co/Kijai/sam2-safetensors',
      },
      {
        name: 'Segment Anything 2.1 - Large (FP16)',
        source: 'huggingface',
        type: ModelType.IPADAPTER,
        downloads: [
          {
            type: ModelType.CLIP_VISION,
            name: 'sam2.1_hiera_large-fp16.safetensors',
            url: 'https://huggingface.co/Kijai/sam2-safetensors/resolve/main/sam2.1_hiera_large-fp16.safetensors',
            size: 448999828,
          },
        ],
        homepage: 'https://huggingface.co/Kijai/sam2-safetensors',
      },
      {
        name: 'Segment Anything 2 - Tiny (FP32)',
        source: 'huggingface',
        type: ModelType.IPADAPTER,
        downloads: [
          {
            type: ModelType.CLIP_VISION,
            name: 'sam2_hiera_tiny.safetensors',
            url: 'https://huggingface.co/Kijai/sam2-safetensors/resolve/main/sam2_hiera_tiny.safetensors',
            size: 155840544,
          },
        ],
        homepage: 'https://huggingface.co/Kijai/sam2-safetensors',
      },
      {
        name: 'Segment Anything 2 - Small (FP32)',
        source: 'huggingface',
        type: ModelType.IPADAPTER,
        downloads: [
          {
            type: ModelType.CLIP_VISION,
            name: 'sam2_hiera_small.safetensors',
            url: 'https://huggingface.co/Kijai/sam2-safetensors/resolve/main/sam2_hiera_small.safetensors',
            size: 184237544,
          },
        ],
        homepage: 'https://huggingface.co/Kijai/sam2-safetensors',
      },
      {
        name: 'Segment Anything 2 - Base (FP32)',
        source: 'huggingface',
        type: ModelType.IPADAPTER,
        downloads: [
          {
            type: ModelType.CLIP_VISION,
            name: 'sam2_hiera_base_plus.safetensors',
            url: 'https://huggingface.co/Kijai/sam2-safetensors/resolve/main/sam2_hiera_base_plus.safetensors',
            size: 323407992,
          },
        ],
        homepage: 'https://huggingface.co/Kijai/sam2-safetensors',
      },
      {
        name: 'Segment Anything 2 - Large (FP32)',
        source: 'huggingface',
        type: ModelType.IPADAPTER,
        downloads: [
          {
            type: ModelType.CLIP_VISION,
            name: 'sam2_hiera_large.safetensors',
            url: 'https://huggingface.co/Kijai/sam2-safetensors/resolve/main/sam2_hiera_large.safetensors',
            size: 897827480,
          },
        ],
        homepage: 'https://huggingface.co/Kijai/sam2-safetensors',
      },
    ],
  },
];
