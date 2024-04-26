export function removeFileExtension(string: string): string {
  const split = string.split('.');
  split.pop();
  return split.join('.');
}

export function stringToColor(str?: string) {
  if (!str) {
    return 'hsl(0deg, 0%, 0%)';
  }

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }

  const H = (((hash >> 8) & 0xff) / 0xff) * 360;
  const S = (((hash >> 0) & 0xff) / 0xff) * 25 + 10;
  const L = (((hash >> 16) & 0xff) / 0xff) * 25 + 15;

  return `hsl(${H}deg, ${S}%, ${L}%)`;
}

export function timestr(time?: number): string {
  if (typeof time === 'undefined') {
    return '';
  }

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
