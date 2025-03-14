import path from 'path';

import { ProjectImageMode } from '@metastable/types';
import type { FitEnum } from 'sharp';

import { exists, getMetadataDirectory, tryMkdir } from './fs.js';

export function getThumbnailPath(filePath: string, ext = 'webp') {
  const name = path.basename(filePath);
  const dirName = getMetadataDirectory(filePath);

  const split = name.split('.');
  if (split.length > 1) {
    split.pop();
    const thumbName = `${split.join('.')}.thumb.${ext}`;
    return path.join(dirName, thumbName);
  }

  return undefined;
}

export async function generateThumbnail(filePath: string, force = false) {
  const thumbPath = getThumbnailPath(filePath);

  if (thumbPath) {
    if (!force && (await exists(thumbPath))) {
      return;
    }

    if (!(await tryMkdir(path.dirname(thumbPath)))) {
      return;
    }

    const { default: sharp } = await import('sharp');
    await sharp(filePath)
      .resize(250, 250, { fit: 'inside' })
      .webp()
      .toFile(thumbPath);
  }
}

export const SHARP_FIT_MAP: Record<ProjectImageMode, keyof FitEnum> = {
  cover: 'cover',
  contain: 'contain',
  center: 'inside',
  stretch: 'fill',
};
