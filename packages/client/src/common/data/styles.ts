import { Architecture, PromptStyleNode } from '@metastable/types';

export const PROMPT_STYLE_NONE_ID = 'undefined';

export const PROMPT_STYLES: PromptStyleNode[] = [
  {
    id: PROMPT_STYLE_NONE_ID,
    nodeType: 'item',
    name: 'No style',
  },
  {
    id: 'system.group',
    nodeType: 'group',
    name: 'Built-in styles',
  },
  {
    id: 'system.sdxl.fooocus.enhance',
    parentId: 'system.group',
    nodeType: 'item',
    architecture: Architecture.SDXL,
    name: 'Enhance',
    negative:
      '(worst quality, low quality, normal quality, lowres, low details, oversaturated, undersaturated, overexposed, underexposed, grayscale, bw, bad photo, bad photography, bad art:1.4), (watermark, signature, text font, username, error, logo, words, letters, digits, autograph, trademark, name:1.2), (blur, blurry, grainy), morbid, ugly, asymmetrical, mutated malformed, mutilated, poorly lit, bad shadow, draft, cropped, out of frame, cut off, censored, jpeg artifacts, out of focus, glitch, duplicate, (airbrushed, cartoon, anime, semi-realistic, cgi, render, blender, digital art, manga, amateur:1.3), (3D ,3D Game, 3D Game Scene, 3D Character:1.1), (bad hands, bad anatomy, bad body, bad face, bad teeth, bad arms, bad legs, deformities:1.3)',
  },
  {
    id: 'system.sdxl.fooocus.semi_realistic',
    parentId: 'system.group',
    nodeType: 'item',
    architecture: Architecture.SDXL,
    name: 'Semi Realistic',
    negative:
      '(worst quality, low quality, normal quality, lowres, low details, oversaturated, undersaturated, overexposed, underexposed, bad photo, bad photography, bad art:1.4), (watermark, signature, text font, username, error, logo, words, letters, digits, autograph, trademark, name:1.2), (blur, blurry, grainy), morbid, ugly, asymmetrical, mutated malformed, mutilated, poorly lit, bad shadow, draft, cropped, out of frame, cut off, censored, jpeg artifacts, out of focus, glitch, duplicate, (bad hands, bad anatomy, bad body, bad face, bad teeth, bad arms, bad legs, deformities:1.3)',
  },
  {
    id: 'system.sdxl.fooocus.sharp',
    parentId: 'system.group',
    nodeType: 'item',
    architecture: Architecture.SDXL,
    name: 'Sharp',
    positive:
      'cinematic still {prompt} . emotional, harmonious, vignette, 4k epic detailed, shot on kodak, 35mm photo, sharp focus, high budget, cinemascope, moody, epic, gorgeous, film grain, grainy',
    negative:
      'anime, cartoon, graphic, (blur, blurry, bokeh), text, painting, crayon, graphite, abstract, glitch, deformed, mutated, ugly, disfigured',
  },
  {
    id: 'system.sdxl.fooocus.masterpiece',
    parentId: 'system.group',
    nodeType: 'item',
    architecture: Architecture.SDXL,
    name: 'Masterpiece',
    positive:
      '(masterpiece), (best quality), (ultra-detailed), {prompt}, illustration, disheveled hair, detailed eyes, perfect composition, moist skin, intricate details, earrings',
    negative:
      'longbody, lowres, bad anatomy, bad hands, missing fingers, pubic hair,extra digit, fewer digits, cropped, worst quality, low quality',
  },
  {
    id: 'system.sdxl.fooocus.photograph',
    parentId: 'system.group',
    nodeType: 'item',
    architecture: Architecture.SDXL,
    name: 'Photograph',
    positive:
      'photograph {prompt}, 50mm . cinematic 4k epic detailed 4k epic detailed photograph shot on kodak detailed cinematic hbo dark moody, 35mm photo, grainy, vignette, vintage, Kodachrome, Lomography, stained, highly detailed, found footage',
    negative:
      'Brad Pitt, bokeh, depth of field, blurry, cropped, regular face, saturated, contrast, deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime, text, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck',
  },
  {
    id: 'system.sdxl.fooocus.negative',
    parentId: 'system.group',
    nodeType: 'item',
    architecture: Architecture.SDXL,
    name: 'Negative',
    negative:
      'deformed, bad anatomy, disfigured, poorly drawn face, mutated, extra limb, ugly, poorly drawn hands, missing limb, floating limbs, disconnected limbs, disconnected head, malformed hands, long neck, mutated hands and fingers, bad hands, missing fingers, cropped, worst quality, low quality, mutation, poorly drawn, huge calf, bad hands, fused hand, missing hand, disappearing arms, disappearing thigh, disappearing calf, disappearing legs, missing fingers, fused fingers, abnormal eye proportion, Abnormal hands, abnormal legs, abnormal feet, abnormal fingers, drawing, painting, crayon, sketch, graphite, impressionist, noisy, blurry, soft, deformed, ugly, anime, cartoon, graphic, text, painting, crayon, graphite, abstract, glitch',
  },
  {
    id: 'system.sdxl.fooocus.cinematic',
    parentId: 'system.group',
    nodeType: 'item',
    architecture: Architecture.SDXL,
    name: 'Cinematic',
    positive:
      'cinematic still {prompt} . emotional, harmonious, vignette, highly detailed, high budget, bokeh, cinemascope, moody, epic, gorgeous, film grain, grainy',
    negative:
      'anime, cartoon, graphic, text, painting, crayon, graphite, abstract, glitch, deformed, mutated, ugly, disfigured',
  },
];
