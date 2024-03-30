import { ChildProcess } from 'child_process';
import EventEmitter from 'events';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  LogItem,
  ProjectTrainingInputMetadata,
  ProjectTrainingSettings,
} from '@metastable/types';
import sharp from 'sharp';

import type { ProjectEntity } from '../data/project.js';
import { CircularBuffer } from '../helpers/buffer.js';
import { JSONFile, removeFileExtension, TextFile } from '../helpers/fs.js';
import type { PythonInstance } from '../python/index.js';


const baseDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

export class Kohya extends EventEmitter {
  logBuffer = new CircularBuffer<LogItem>(25);
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

  async train(project: ProjectEntity, settings: ProjectTrainingSettings) {
    this.stop(project.name);
    await project.resetTemp();

    const tempInputPath = path.join(project.tempPath, 'input');
    await fs.mkdir(tempInputPath, { recursive: true });

    const inputs = await project.input.all();
    for (const input of inputs) {
      const name = removeFileExtension(input.name);
      const inputData =
        (await input.metadata.get()) as ProjectTrainingInputMetadata;

      if (inputData?.caption) {
        const tempFile = new TextFile(path.join(tempInputPath, `${name}.txt`));
        await tempFile.write(inputData.caption);

        const fromPath = input.path;
        const toPath = path.join(tempInputPath, input.name);

        if (inputData.crop) {
          await sharp(fromPath)
            .extract({
              left: Math.floor(inputData.crop[0]),
              top: Math.floor(inputData.crop[1]),
              width: Math.floor(inputData.crop[2]),
              height: Math.floor(inputData.crop[3]),
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
      output_dir: project.output.path,
      output_name: `${Date.now()}`,

      // Optimizer
      optimizer_type: settings.optimizer.name,
      optimizer_args: settings.optimizer.arguments,

      // Other
      cache_latents: true,
    };

    const datasets = {
      general: {
        resolution: settings.resolution.width, // TODO: Do something with height?
        enable_bucket: settings.dataset.bucketing,
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

    const configPath = path.join(project.tempPath, 'training_config.json');
    const datasetsPath = path.join(project.tempPath, 'datasets_config.json');
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
    this.emit('event', {
      event: 'training.start',
      data: { projectId: project.name },
    });

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
            projectId: project.name,
            ...JSON.parse(item),
          });
        } catch {
          this.log(project.name, 'stdout', item);
        }
      }
    });

    proc.stderr.on('data', data => {
      this.log(project.name, 'stderr', data);
    });

    proc.on('close', () => {
      this.emit('event', {
        event: 'training.end',
        data: { projectId: project.name },
      });
      delete this.processes[project.name];
      project.cleanup().catch(() => {});
    });

    this.processes[project.name] = proc;
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
