export function parseArgString(str: string) {
  str = str.trim();

  const args: string[] = [];
  let currentQuote: '"' | "'" | undefined = undefined;
  let word = '';

  for (let i = 0; i < str.length; i++) {
    const current = str[i];
    switch (current) {
      case "'":
      case '"':
        if (current === currentQuote) {
          currentQuote = undefined;
        } else if (typeof currentQuote === 'undefined') {
          currentQuote = current;
        } else {
          word += current;
        }
        break;
      case ' ':
        if (typeof currentQuote === 'undefined') {
          const trimmed = word.trim();
          if (trimmed) {
            args.push(trimmed);
          }

          word = '';
        } else {
          word += current;
        }
        break;
      default:
        word += current;
    }
  }

  const trimmed = word.trim();
  if (trimmed) {
    args.push(trimmed);
  }

  return args;
}
