import EventEmitter from 'events';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ComfyLogItem,
  ProjectTrainingInputMetadata,
  ProjectTrainingSettings,
} from '@metastable/types';
import { rimraf } from 'rimraf';
import fs from 'fs/promises';
import { ChildProcess } from 'child_process';

import type { PythonInstance } from '../python/index.js';
import { CircularBuffer } from '../helpers/buffer.js';
import {
  JSONFile,
  TextFile,
  exists,
  filenames,
  imageFilenames,
  removeFileExtension,
} from '../helpers/fs.js';
import sharp from 'sharp';

const baseDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

export class Kohya extends EventEmitter {
  logBuffer = new CircularBuffer<ComfyLogItem>(25);
  processes: Record<string, ChildProcess> = {};

  constructor(
    public python: PythonInstance,
    private env: Record<string, string> = {},
  ) {
    super();
  }

  stopAll() {
    for (const key of Object.keys(this.processes)) {
      this.stop(key);
    }
  }

  stop(projectId: string) {
    this.processes[projectId]?.kill('SIGKILL');
    delete this.processes[projectId];
  }

  async train(
    projectId: string,
    settings: ProjectTrainingSettings,
    inputPath: string,
    outputPath: string,
    tempPath: string,
  ) {
    this.stop(projectId);

    try {
      await rimraf(tempPath);
    } catch {}

    const tempInputPath = path.join(tempPath, 'input');
    await fs.mkdir(tempInputPath, { recursive: true });

    const images = await imageFilenames(inputPath);
    for (const image of images) {
      const name = removeFileExtension(image);
      const inputDataFile = new JSONFile<ProjectTrainingInputMetadata>(
        path.join(inputPath, `${name}.json`),
        {},
      );
      const inputData = await inputDataFile.readJson();

      if (inputData?.caption) {
        const tempFile = new TextFile(path.join(tempInputPath, `${name}.txt`));
        await tempFile.write(inputData.caption);

        const fromPath = path.join(inputPath, image);
        const toPath = path.join(tempInputPath, image);

        if (inputData.crop) {
          await sharp(fromPath)
            .extract({
              left: inputData.crop[0],
              top: inputData.crop[1],
              width: inputData.crop[2],
              height: inputData.crop[3],
            })
            .toFile(toPath);
        } else {
          await fs.copyFile(fromPath, toPath);
        }
      }
    }

    const mainPath = path.join(
      baseDir,
      'python_kohya',
      settings.base.sdxl ? 'sdxl_train_network.py' : 'train_network.py',
    );

    const config = {
      // Network
      pretrained_model_name_or_path: settings.base.path!,
      network_module: 'networks.lora',
      network_dim: settings.network.dimensions,
      network_alpha: settings.network.alpha,

      // Learning rates
      unet_lr: settings.learningRates.unet,
      text_encoder_lr: settings.learningRates.textEncoder,
      learning_rate: settings.learningRates.network,
      lr_scheduler: settings.learningRateScheduler.name,
      lr_scheduler_num_cycles: settings.learningRateScheduler.number,

      // Limits
      max_train_epochs: settings.limits.trainingEpochs,
      save_every_n_epochs: settings.limits.saveEveryXEpochs,
      save_last_n_epochs: settings.limits.keepOnlyXEpochs,
      train_batch_size: settings.limits.batchSize,

      // Data
      output_dir: outputPath,
      output_name: `${Date.now()}`,

      // Other
      cache_latents: true,
    };

    const datasets = {
      general: {
        resolution: settings.resolution.width, // TODO: Do something with height?
        enable_bucket: settings.bucketing,
        caption_prefix:
          settings.dataset.activationTags.join(', ') +
          (settings.dataset.activationTags.length > 0 ? ',' : ''),
        keep_tokens: settings.dataset.activationTags.length,
        shuffle_caption: settings.dataset.shuffleTags,
      },
      datasets: [
        {
          subsets: [
            {
              num_repeats: settings.dataset.repeats,
              image_dir: tempInputPath,
            },
          ],
        },
      ],
    };

    const configPath = path.join(tempPath, 'training_config.json');
    const datasetsPath = path.join(tempPath, 'datasets_config.json');
    const configFile = new JSONFile(configPath, {});
    await configFile.writeJson(config);
    const datasetsFile = new JSONFile(datasetsPath, {});
    await datasetsFile.writeJson(datasets);

    const args: string[] = [
      '--dataset_config',
      datasetsPath,
      '--config_file',
      configPath,
    ];

    const proc = this.python.spawn([mainPath, ...args], this.env);
    this.emit('event', { event: 'training.start', data: { projectId } });

    proc.stdin.setDefaultEncoding('utf-8');
    proc.stdout.setEncoding('utf-8');
    proc.stderr.setEncoding('utf-8');

    proc.stdout.on('data', data => {
      const split = data.split('\n');
      for (const item of split) {
        if (!item) {
          continue;
        }

        try {
          this.emit('event', {
            projectId,
            ...JSON.parse(item),
          });
        } catch {
          this.log(projectId, 'stdout', item);
        }
      }
    });

    proc.stderr.on('data', data => {
      this.log(projectId, 'stderr', data);
    });

    proc.on('close', () => {
      this.emit('event', { event: 'training.end', data: { projectId } });
      delete this.processes[projectId];
      rimraf(tempPath).catch(() => {});
    });

    this.processes[projectId] = proc;
  }

  private log(projectId: string, type: string, text: string) {
    const item = {
      type,
      timestamp: Date.now(),
      text: text.trimEnd(),
    };
    this.logBuffer.push(item);
    this.emit('event', {
      event: 'training.log',
      data: { projectId, ...item },
    });
  }
}