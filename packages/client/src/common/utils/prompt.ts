import { indexOfWhitespace, lastIndexOfWhitespace } from './string';

export function findClosestTokenOrImportance(
  str: string,
  start: number,
  end: number,
) {
  const replaced = str.replace(/(\\\(|\\\))/g, '  ');

  if (start === end) {
    const previousOpeningParenIndex = replaced
      .substring(0, start)
      .lastIndexOf('(');
    const previousClosingParenIndex = replaced
      .substring(0, start)
      .lastIndexOf(')');
    const nextOpeningParenIndex = replaced.indexOf('(', start);
    const nextClosingParenIndex = replaced.indexOf(')', start);

    if (
      previousOpeningParenIndex < start &&
      nextClosingParenIndex !== -1 &&
      previousOpeningParenIndex > previousClosingParenIndex &&
      (nextOpeningParenIndex === -1 ||
        nextClosingParenIndex < nextOpeningParenIndex)
    ) {
      start = previousOpeningParenIndex;
      end = nextClosingParenIndex + 1;
    } else {
      const startSpaceIndex = lastIndexOfWhitespace(str, 0, start);
      const endSpaceIndex = indexOfWhitespace(str, start);
      start = startSpaceIndex + 1;
      end = endSpaceIndex === -1 ? str.length : endSpaceIndex;
    }
  }

  if (
    replaced[start - 1] === '(' &&
    (replaced[end + 1] === ':' || replaced[end + 1] === ')')
  ) {
    const nextClosingParenIndex = replaced.indexOf(')', start);
    if (nextClosingParenIndex !== -1) {
      start -= 1;
      end = nextClosingParenIndex + 1;
    }
  }

  if (str[end - 1] === ',') {
    end--;
  }

  const text = str.substring(start, end);
  if (!text.trim()) {
    return undefined;
  }

  return {
    start,
    end,
    text,
  };
}

export function parseImportance(str: string) {
  if (!str.startsWith('(') || !str.endsWith(')')) {
    return { text: str, weight: 1 };
  }

  let weight = 1;
  const split = str.substring(1, str.length - 1).split(':');
  if (split.length > 1) {
    const parsed = parseFloat(split.pop()!);
    if (!isNaN(parsed)) {
      weight = parsed;
    }
  }
  const text = split.join(':');

  return { text, weight };
}

export function serializeImportance(text: string, weight: number = 1) {
  if (weight === 1) {
    return text;
  }

  return `(${text}:${weight.toFixed(2)})`;
}
