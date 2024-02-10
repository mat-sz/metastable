export function removeFileExtension(string: string): string {
  const split = string.split('.');
  split.pop();
  return split.join('.');
}
