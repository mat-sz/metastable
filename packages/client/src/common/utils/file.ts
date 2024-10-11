import attrAccept from 'attr-accept';
import { filesize as fsize } from 'filesize';

export function filesize(value?: number) {
  if (typeof value !== 'number') {
    return 'Unknown';
  }

  return fsize(value, { standard: 'jedec' });
}

interface FilesEvent {
  dataTransfer?: DataTransfer | null;
  clipboardData?: DataTransfer | null;
  target?: EventTarget | null;
}

export function filesFromEvent(e: FilesEvent) {
  const transfer = e.dataTransfer || e.clipboardData;
  if (transfer) {
    return [...transfer.items]
      .map(item => item.getAsFile())
      .filter(item => !!item) as File[];
  }

  if (e.target instanceof HTMLInputElement && e.target.files) {
    return [...e.target.files];
  }

  return [];
}

export function filterFiles(files: File[], accept?: string): File[] {
  if (!accept) {
    return files;
  }

  return files.filter(item => attrAccept(item, accept));
}

export function handleFilesEvent(
  e: FilesEvent,
  onFiles?: (file: File[]) => void,
  accept?: string,
) {
  const files = filterFiles(filesFromEvent(e), accept);
  if (files.length) {
    onFiles?.(files);
  }
}

export const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
};
