import { readPytorch } from './pytorch.js';
import { readSafetensors } from './safetensors.js';

export const PYTORCH_EXTENSIONS = ['ckpt', 'pt', 'bin', 'pth'];
export const SAFETENSORS_EXTENSIONS = ['safetensors'];

export async function getModelInfo(modelPath: string) {
  const ext = modelPath.split('.').pop()!;
  if (PYTORCH_EXTENSIONS.includes(ext)) {
    await readPytorch(modelPath);
  } else if (SAFETENSORS_EXTENSIONS.includes(ext)) {
    await readSafetensors(modelPath);
  } else {
    throw new Error(`Unsupported model format ${ext}`);
  }
}
