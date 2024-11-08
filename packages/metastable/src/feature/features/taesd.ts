import path from 'path';

import { download } from '#helpers/download.js';
import { exists, tryMkdir } from '#helpers/fs.js';
import { Metastable } from '#metastable';
import { FeatureBase } from '../base.js';
import { PromptTask } from 'src/comfy/tasks/prompt.js';

const TAESD_EXTENSION = '.pth';
const TAESD_NAMES = [
  'taesd_decoder',
  'taesd_encoder',
  'taesdxl_decoder',
  'taesdxl_encoder',
];
const TAESD_BASE_URL = 'https://github.com/madebyollin/taesd/raw/main/';

export class FeatureTaesd extends FeatureBase {
  readonly id = 'taesd';
  readonly name = 'TAESD';
  readonly description =
    'Enables use of TAESD for generation previews. (SD1.5/SDXL)';

  private getDirPath() {
    return path.join(Metastable.instance.internalPath, 'models', 'taesd');
  }

  private getDict() {
    return Object.fromEntries(
      TAESD_NAMES.map(name => [name, this.getPath(name)]),
    );
  }

  private getUrl(name: string) {
    return `${TAESD_BASE_URL}${name}${TAESD_EXTENSION}`;
  }

  private getPath(name: string) {
    return path.join(this.getDirPath(), `${name}${TAESD_EXTENSION}`);
  }

  async install(onLog?: (data: string) => void) {
    await tryMkdir(this.getDirPath());

    for (const name of TAESD_NAMES) {
      const filePath = this.getPath(name);
      if (!(await exists(filePath))) {
        onLog?.(`Downloading ${name}...`);
        await download(this.getUrl(name), filePath);
      }
    }
  }

  async isInstalled() {
    return !(
      await Promise.all(TAESD_NAMES.map(name => exists(this.getPath(name))))
    ).includes(false);
  }

  async onPromptInit(task: PromptTask) {
    task.preview = {
      method: 'taesd',
      taesd: this.getDict(),
    };
  }
}
