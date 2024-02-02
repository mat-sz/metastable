const diacriticsRegex = /[\u0300-\u036f]/g;
const regexŁ = /ł/g;
const regexÑ = /ñ/g;

function normalizeString(string: string): string {
  return string
    .toLowerCase()
    .normalize('NFD')
    .replace(diacriticsRegex, '')
    .replace(regexŁ, 'l')
    .replace(regexÑ, 'n')
    .trim();
}

function fuzzyWordMatch(a: string, b: string): boolean {
  if (b.length > a.length) {
    return false;
  }

  for (let aIdx = 0; aIdx < a.length; aIdx++) {
    if (a[aIdx] !== b[0]) {
      continue;
    }

    let changes = 0;
    let offset = 0;
    let fail = false;

    for (let bIdx = 0; bIdx < b.length; bIdx++) {
      const current = a[aIdx + bIdx + offset];
      if (current === b[bIdx]) {
        // Only allow one change between matching characters.
        if (changes > 1) {
          fail = true;
          break;
        }

        changes = 0;
      } else {
        changes++;
        offset++;
      }
    }

    if (!fail && changes <= 2) {
      return true;
    }
  }

  return false;
}

const SPLIT_REGEX = /[\s_\.-]/;

export function fuzzy<T>(
  items: T[],
  pattern: string,
  toString: (item: T) => string,
) {
  const normalizedPattern = normalizeString(pattern);
  const patternSplit = normalizedPattern.split(SPLIT_REGEX);
  const itemStrings = items.map(toString);

  const matchFn = (str: string) => {
    const normalized = normalizeString(str);
    if (normalized.includes(normalizedPattern)) {
      return 2;
    }

    const split = normalized.split(SPLIT_REGEX);

    for (const patternWord of patternSplit) {
      let found = false;
      for (const stringWord of split) {
        if (fuzzyWordMatch(stringWord, patternWord)) {
          found = true;
          break;
        }
      }

      if (!found) {
        return 0;
      }
    }

    return 1;
  };

  return items
    .map((item, index) => {
      const str = itemStrings[index];

      return [matchFn(itemStrings[index]), str, item] as const;
    })
    .filter(([score]) => !!score)
    .sort(([a, aStr], [b, bStr]) =>
      a === b ? aStr.localeCompare(bStr) : b - a,
    )
    .map(entry => entry[2]);
}
