import EventEmitter from 'events';
import path from 'path';
import { fileURLToPath } from 'url';
import { LogItem, ModelType, ProjectTaggingSettings } from '@metastable/types';
import { ChildProcess } from 'child_process';

import { CircularBuffer } from '../helpers/buffer.js';
import type { ProjectEntity } from '../data/project.js';
import { PythonInstance } from '../python/index.js';

const baseDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

export class Tagger extends EventEmitter {
  logBuffer = new CircularBuffer<LogItem>(25);
  processes: Record<string, ChildProcess> = {};

  constructor(
    private python: PythonInstance,
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

  async run(project: ProjectEntity, settings: ProjectTaggingSettings) {
    this.stop(project.name);
    await project.resetTemp();

    const mainPath = path.join(baseDir, 'python_kohya', 'run_tags.py');

    const args: string[] = [
      ...settings.inputs.map(input => path.join(project.input.path, input)),
      '--thresh',
      (settings.threshold || 0.35).toString(),
      '--model',
      settings.tagger.path!,
    ];

    if (settings.removeUnderscore) {
      args.push('--remove_underscore');
    }

    const proc = this.python.spawn([mainPath, ...args], this.env);
    this.emit('event', {
      event: 'tagger.start',
      data: { projectId: project.name },
    });

    proc.stdin.setDefaultEncoding('utf-8');
    proc.stdout.setEncoding('utf-8');
    proc.stderr.setEncoding('utf-8');

    proc.stdout.on('data', async data => {
      const split = data.split('\n');
      for (const item of split) {
        if (!item) {
          continue;
        }

        try {
          const e = JSON.parse(item);
          this.emit('event', {
            projectId: project.name,
            ...e,
          });

          if (e.event === 'tagger.result') {
            try {
              const input = await project.input.get(path.basename(e.data.path));
              await input.metadata.update({ caption: e.data.caption });
            } catch {}
          }
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
        event: 'tagger.end',
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
      event: 'tagger.log',
      data: { projectId, ...item },
    });
  }
}
