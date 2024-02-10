import { filesize as fsize } from 'filesize';

export function filesize(value: number) {
  return fsize(value, { standard: 'jedec' });
}
