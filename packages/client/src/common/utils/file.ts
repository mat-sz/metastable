import { filesize as fsize } from 'filesize';

export function filesize(value?: number) {
  if (typeof value !== 'number') {
    return 'Unknown';
  }

  return fsize(value, { standard: 'jedec' });
}
