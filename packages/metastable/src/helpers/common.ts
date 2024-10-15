export function parseNumber(input?: number | string | null) {
  if (typeof input === 'undefined' || input === null) {
    return undefined;
  }

  if (typeof input === 'string') {
    input = parseFloat(input);
  }

  if (isNaN(input)) {
    return undefined;
  }

  return input;
}
