export enum PromptTokenType {
  TEXT,
  COMMENT,
  LPAREN,
  RPAREN,
  WEIGHT,
  LBRACKET,
  RBRACKET,
  PIPE,
}

export interface PromptToken {
  type: PromptTokenType;
  value: string;
}

interface PromptTokenDef {
  match?: RegExp | string;
  group?: number;
  type: PromptTokenType;
}

const TOKEN_DEFS: PromptTokenDef[] = [
  {
    match: /^(\\[(){}|])/,
    type: PromptTokenType.TEXT,
  },
  {
    match: /^(#-(.*?)-#)/s,
    type: PromptTokenType.COMMENT,
  },
  {
    match: /^((#(.*?))\n)/,
    type: PromptTokenType.COMMENT,
    group: 2,
  },
  {
    match: /^(#(.*?)$)/,
    type: PromptTokenType.COMMENT,
  },
  {
    match: '(',
    type: PromptTokenType.LPAREN,
  },
  {
    match: ')',
    type: PromptTokenType.RPAREN,
  },
  {
    match: /^(:(\d+|\.\d+|\d+\.\d+))\)/,
    type: PromptTokenType.WEIGHT,
    group: 1,
  },
  {
    match: '{',
    type: PromptTokenType.LBRACKET,
  },
  {
    match: '}',
    type: PromptTokenType.RBRACKET,
  },
  {
    match: '|',
    type: PromptTokenType.PIPE,
  },
];

export function lexPrompt(str: string): PromptToken[] {
  const tokens: PromptToken[] = [];

  let text = '';
  function pushText() {
    if (text) {
      tokens.push({
        type: PromptTokenType.TEXT,
        value: text,
      });
      text = '';
    }
  }

  while (str.length) {
    let matchLength = 1;
    let matchType: PromptTokenType = PromptTokenType.TEXT;

    for (const { type, match, group = 0 } of TOKEN_DEFS) {
      if (!match) {
        continue;
      }

      if (typeof match === 'string') {
        if (str.startsWith(match)) {
          matchLength = match.length;
          matchType = type;
          break;
        }
      } else {
        const out = match.exec(str);
        const matched = out?.[group];
        if (matched) {
          matchLength = matched.length;
          matchType = type;
          break;
        }
      }
    }

    if (matchType === PromptTokenType.TEXT) {
      text += str.substring(0, matchLength);
      str = str.substring(matchLength);
    } else {
      pushText();
      tokens.push({
        type: matchType,
        value: str.substring(0, matchLength),
      });
      str = str.substring(matchLength);
    }
  }

  pushText();
  return tokens;
}

export function preprocessPrompt(prompt: string): string {
  const tokens = lexPrompt(prompt);
  return tokens
    .filter(token => token.type !== PromptTokenType.COMMENT)
    .map(token => token.value)
    .join('');
}
