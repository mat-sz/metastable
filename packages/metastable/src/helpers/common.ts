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

export function splitAt(str: string, index: number): [string, string] {
  return [str.substring(0, index), str.substring(index)];
}

export function arrayParseInt(array: string[], radix = 10) {
  return array.map(str => parseInt(str, radix));
}

export function memoized<T>(
  fn: () => Promise<T> | T,
): () => Promise<T | undefined> {
  let called = false;
  let result: T | undefined;

  return async () => {
    if (!called) {
      called = true;
      try {
        result = await fn();
      } catch {
        result = undefined;
      }
    }

    return result;
  };
}

export async function allResolved<T extends readonly unknown[] | []>(
  values: T,
): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> | undefined }> {
  const results = await Promise.allSettled(values);
  return results.map(result =>
    result.status === 'fulfilled' ? result.value : undefined,
  ) as any;
}
