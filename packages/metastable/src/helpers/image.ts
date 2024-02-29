import path from 'path';
import sharp from 'sharp';

import { exists, getMetadataDirectory, tryMkdir } from './fs.js';

export function getThumbnailPath(filePath: string) {
  const name = path.basename(filePath);
  const dirName = getMetadataDirectory(filePath);

  const split = name.split('.');
  if (split.length > 1) {
    split.pop();
    const thumbName = split.join('.') + '.thumb.jpg';
    return path.join(dirName, thumbName);
  }

  return undefined;
}

export async function generateThumbnail(filePath: string) {
  const thumbPath = getThumbnailPath(filePath);

  if (thumbPath) {
    if (await exists(thumbPath)) {
      return;
    }

    if (!(await tryMkdir(path.dirname(thumbPath)))) {
      return;
    }

    await sharp(filePath).resize(250, 250, { fit: 'inside' }).toFile(thumbPath);
  }
}
