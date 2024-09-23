import { PromptStyle } from '@metastable/types';

export const PROMPT_STYLES: PromptStyle[] = [
  {
    id: 'system_1',
    name: 'Cinematic',
    positive:
      'cinematic still {prompt} . emotional, harmonious, vignette, highly detailed, high budget, bokeh, cinemascope, moody, epic, gorgeous, film grain, grainy',
    negative:
      'anime, cartoon, graphic, text, painting, crayon, graphite, abstract, glitch, deformed, mutated, ugly, disfigured',
  },
];
