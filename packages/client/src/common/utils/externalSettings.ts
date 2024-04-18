import { ProjectSimpleSettings } from '@metastable/types';
import ExifReader from 'exifreader';

export interface ExternalSettings {
  prompt?: Partial<ProjectSimpleSettings['prompt']>;
  sampler?: Partial<ProjectSimpleSettings['sampler']>;
}

const A1111_SAMPLER_MAP: Record<
  string,
  { samplerName: string; schedulerName?: string }
> = {
  'DPM++ 2M': {
    samplerName: 'dpmpp_2m',
    schedulerName: 'karras',
  },
  'DPM++ SDE': {
    samplerName: 'dpmpp_sde',
    schedulerName: 'karras',
  },
  'DPM++ 2M SDE': {
    samplerName: 'dpmpp_2m_sde',
    schedulerName: 'karras',
  },
  'DPM++ 2M SDE Heun': {
    // Map it to the closest thing available.
    samplerName: 'dpmpp_2m_sde',
    schedulerName: 'exponential',
  },
  'DPM++ 2S a': {
    samplerName: 'dpmpp_2s_ancestral',
    schedulerName: 'karras',
  },
  'DPM++ 3M SDE': {
    samplerName: 'dpmpp_3m_sde',
    schedulerName: 'exponential',
  },
  'Euler a': {
    samplerName: 'euler_ancestral',
    schedulerName: 'normal',
  },
  Euler: {
    samplerName: 'euler',
    schedulerName: 'normal',
  },
  LMS: {
    samplerName: 'lms',
    schedulerName: 'normal',
  },
  Heun: {
    samplerName: 'heun',
    schedulerName: 'normal',
  },
  DPM2: {
    samplerName: 'dpm_2',
    schedulerName: 'karras',
  },
  'DPM2 a': {
    samplerName: 'dpm_2_ancestral',
    schedulerName: 'karras',
  },
  'DPM fast': {
    samplerName: 'dpm_fast',
    schedulerName: 'normal',
  },
  'DPM adaptive': {
    samplerName: 'dpm_adaptive',
    schedulerName: 'normal',
  },
};

export async function loadSettingsFromFile(
  file: File,
): Promise<ExternalSettings | undefined> {
  try {
    const tags = await ExifReader.load(file);

    if (typeof tags['metastable']?.value === 'string') {
      // Metastable metadata
      const json: ProjectSimpleSettings = JSON.parse(tags['metastable'].value);

      return {
        prompt: json.prompt,
        sampler: json.sampler,
      };
    } else if (typeof tags['parameters']?.value === 'string') {
      // AUTOMATIC1111 metadata
      const data = tags['parameters'].value;
      const lines = data.split('\n');
      if (lines.length > 1) {
        const settings: ExternalSettings = {};
        const samplerInfo = lines.pop()!.split(', ');
        if (samplerInfo.length) {
          settings.sampler = {};
          for (const item of samplerInfo) {
            const [key, value] = item.split(': ');
            switch (key) {
              case 'Steps':
                settings.sampler.steps = parseInt(value) || 1;
                break;
              case 'Sampler':
                settings.sampler = {
                  ...settings.sampler,
                  ...A1111_SAMPLER_MAP[value],
                };
                break;
              case 'CFG scale':
                settings.sampler.cfg = parseFloat(value) || 1;
                break;
              case 'Seed':
                settings.sampler.seed = parseInt(value) || 1;
                break;
              case 'Size':
                // NUMxNUM
                break;
              case 'Clip skip':
                break;
              case 'ENSD':
                break;
              case 'Denoising Strength':
                settings.sampler.denoise = parseFloat(value) || 1;
                break;
            }
          }
        }

        const negativePromptStart = lines.findIndex(value =>
          value.startsWith('Negative prompt: '),
        );
        if (negativePromptStart !== -1) {
          const positivePrompt = lines.slice(0, negativePromptStart).join('\n');
          const negativePrompt = lines
            .slice(negativePromptStart)
            .join('\n')
            .replace('Negative prompt: ', '')
            .trim();
          settings.prompt = {
            positive: positivePrompt,
            negative: negativePrompt,
          };
        } else {
          settings.prompt = {
            positive: lines.join('\n').trim(),
            negative: '',
          };
        }

        return settings;
      }
    } else if (tags['Software']?.value === 'NovelAI') {
      // NovelAI metadata
      const comment = tags['Comment']?.value;
      const positivePrompt = tags['Description']?.value;

      if (typeof comment === 'string' && typeof positivePrompt === 'string') {
        const settings: ExternalSettings = {};
        const novelaiSettings = JSON.parse(tags['Comment']?.value);

        settings.prompt = {
          positive: positivePrompt.trim(),
          negative: novelaiSettings['uc']?.trim() || '',
        };

        settings.sampler = {
          steps: novelaiSettings['steps'],
          seed: novelaiSettings['seed'],
          cfg: novelaiSettings['scale'],
          denoise: 1 - (novelaiSettings['noise'] || 0),
        };

        return settings;
      }
    } else if (typeof tags['prompt']?.value === 'string') {
      // ComfyUI metadata (likely)
      const json: any = JSON.parse(tags['prompt'].value);
      const samplerNode = Object.values(json).find(
        (node: any) =>
          node.class_type === 'KSamplerAdvanced' ||
          node.class_type === 'KSampler',
      ) as any;

      if (samplerNode) {
        const settings: ExternalSettings = {};
        const positiveNode = json[samplerNode.inputs?.positive?.[0]];
        const negativeNode = json[samplerNode.inputs?.negative?.[0]];

        settings.prompt = {
          positive: positiveNode?.inputs?.text?.trim() || '',
          negative: negativeNode?.inputs?.text?.trim() || '',
        };

        settings.sampler = {
          samplerName: samplerNode.inputs?.sampler_name,
          schedulerName: samplerNode.inputs?.scheduler,
          cfg: samplerNode.inputs?.cfg,
          seed: samplerNode.inputs?.noise_seed || samplerNode.inputs?.seed,
          steps: samplerNode.inputs?.steps,
          denoise: samplerNode.inputs?.denoise,
        };
        return settings;
      }
    } else if (typeof tags['UserComment']?.value === 'object') {
      const textDecoder = new TextDecoder();
      const text = textDecoder.decode(
        new Uint8Array(tags['UserComment'].value as any),
      );
      const json = JSON.parse(text.replace('UNICODE', '').replace(/\0/g, ''));

      const settings: ExternalSettings = {};
      settings.prompt = {
        positive: json.prompt || '',
        negative: json.negative_prompt || '',
      };

      settings.sampler = {
        steps: json.num_inference_steps,
        seed: json.seed,
        samplerName: json.sampler_name,
        cfg: json.guidance_scale,
      };
      return settings;
    }
  } catch {
    //
  }

  return undefined;
}
