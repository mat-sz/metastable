import * as fsize from 'filesize';

export function randomSeed() {
  const min = -1125899906842624;
  const max = 1125899906842624;
  const range = max - min;
  return Math.random() * range + min;
}

export function arrayMove<T>(array: T[], from: number, to?: number): T[] {
  to ??= array.length - 1;
  const newArray = [...array];
  newArray.splice(to, 0, ...newArray.splice(from, 1));
  return newArray;
}

export function filesize(value: number) {
  return fsize.filesize(value, { standard: 'jedec' });
}
