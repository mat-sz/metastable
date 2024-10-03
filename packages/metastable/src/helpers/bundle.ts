import os from 'os';
import path from 'path';

import { TorchMode } from '@metastable/types';

import { exists } from './fs.js';

export async function getBundleTorchMode(
  pythonPath: string,
): Promise<TorchMode | undefined> {
  switch (os.platform()) {
    case 'win32':
      {
        const packagesDir = path.join(pythonPath, 'Lib', 'site-packages');

        if (
          await exists(path.join(packagesDir, 'torch', 'lib', 'torch_cuda.dll'))
        ) {
          return 'cuda';
        } else if (
          await exists(path.join(packagesDir, 'torch_directml', 'DirectML.dll'))
        ) {
          return 'directml';
        } else if (
          await exists(path.join(packagesDir, 'torch', 'lib', 'torch_cpu.dll'))
        ) {
          return 'cpu';
        }
      }
      break;
    case 'darwin':
      {
        const packagesDir = path.join(
          pythonPath,
          'lib',
          'python3.11',
          'site-packages',
        );

        if (
          await exists(
            path.join(packagesDir, 'torch', 'lib', 'libtorch_cpu.dylib'),
          )
        ) {
          return 'cpu';
        }
      }
      break;
    case 'linux':
      {
        const packagesDir = path.join(
          pythonPath,
          'lib',
          'python3.11',
          'site-packages',
        );

        if (
          await exists(
            path.join(packagesDir, 'torch', 'lib', 'libtorch_cuda.so'),
          )
        ) {
          return 'cuda';
        } else if (
          await exists(
            path.join(packagesDir, 'torch', 'lib', 'libtorch_hip.so'),
          )
        ) {
          return 'rocm';
        } else if (
          await exists(
            path.join(packagesDir, 'torch', 'lib', 'libtorch_cpu.so'),
          )
        ) {
          return 'cpu';
        }
      }
      break;
  }

  return undefined;
}
