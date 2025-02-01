import attrAccept from 'attr-accept';

const BYTES = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

export function filesize(value?: number) {
  if (typeof value !== 'number') {
    return 'Unknown';
  }

  let i = 0;
  while (value >= 1024 && i < BYTES.length) {
    value /= 1024;
    i++;
  }

  return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${BYTES[i]}`;
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

export function basename(path: string) {
  if (path.includes('/')) {
    return path.split('/').pop()!;
  }

  return path.split('\\').pop()!;
}
