import { createToken, Lexer, EmbeddedActionsParser } from 'chevrotain';
import semver, { SemVer } from 'semver';

interface DependencyVersion {
  operator: DependencyVersionOperator;
  version: string;
}

interface DependencyURL {
  url: string;
}

interface DependencyEnvComparison {
  type: 'comparison';
  variable: string;
  operator: DependencyEnvOperator;
  value: string;
}

interface DependencyEnvCondition {
  type: 'condition';
  markers: DependencyEnvMarker[];
  operator: DependencyBooleanOperator;
}

type DependencyEnvMarker = DependencyEnvCondition | DependencyEnvComparison;

type DependencyVersionOperator =
  | '<'
  | '<='
  | '!='
  | '=='
  | '>='
  | '>'
  | '~='
  | '===';
type DependencyEnvOperator = DependencyVersionOperator | 'in' | 'not in';
type DependencyBooleanOperator = 'and' | 'or';

interface Dependency {
  name: string;
  extras?: string[];
  version?: DependencyVersion[];
  url?: DependencyURL;
  env?: DependencyEnvMarker;
}

const LParen = createToken({ name: 'LParen', pattern: /\(/, label: '(' });
const RParen = createToken({ name: 'RParen', pattern: /\)/, label: ')' });
const LCurly = createToken({ name: 'LCurly', pattern: /{/, label: '{' });
const RCurly = createToken({ name: 'RCurly', pattern: /}/, label: '}' });
const LSquare = createToken({ name: 'LSquare', pattern: /\[/, label: '[' });
const RSquare = createToken({ name: 'RSquare', pattern: /]/, label: ']' });
const At = createToken({ name: 'At', pattern: /@/, label: '@' });
const Comma = createToken({ name: 'Comma', pattern: /,/, label: ',' });
const Colon = createToken({ name: 'Colon', pattern: /:/, label: ':' });
const Semicolon = createToken({ name: 'Semicolon', pattern: /;/, label: ';' });
const Comparison = createToken({
  name: 'Comparison',
  pattern: /(<|<=|!=|==|>=|>|~=|===)/,
});
const EnvComparison = createToken({
  name: 'EnvComparison',
  pattern: /(not in|in)/,
});
const EnvCondition = createToken({
  name: 'EnvComparison',
  pattern: /(and|or)/,
});
const Identifier = createToken({
  name: 'Identifier',
  pattern: /[a-zA-Z0-9]+([\w\-\.]*[a-zA-Z0-9]+)?/,
});
const Version = createToken({ name: 'Version', pattern: /(\d+\.?)+[\w\-.+]*/ });
const Url = createToken({
  name: 'Url',
  pattern: /\w+:\/\/[\w\.\-\/?&#=]+/,
});
const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /(".*?"|'.*?')/,
});
const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

const tokens = [
  WhiteSpace,
  StringLiteral,
  RParen,
  LParen,
  RCurly,
  LCurly,
  LSquare,
  RSquare,
  At,
  Comparison,
  EnvComparison,
  EnvCondition,
  Comma,
  Colon,
  Semicolon,
  Version,
  Identifier,
  Url,
];

const DependencyLexer = new Lexer(tokens, {
  positionTracking: 'onlyStart',
});

class DependencyParser extends EmbeddedActionsParser {
  public dependency = this.RULE('dependency', () => {
    const name = this.SUBRULE(this.name);
    const extras = this.OPTION(() => this.SUBRULE(this.extras));
    const version = this.OPTION2(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.url) },
        { ALT: () => [this.SUBRULE(this.version)] },
        { ALT: () => this.SUBRULE(this.versions) },
      ]);
    });
    const env = this.OPTION3(() => {
      this.CONSUME(Semicolon);
      return this.SUBRULE(this.envMarker);
    });

    const dependency: Dependency = {
      name,
      extras,
      env,
    };

    if (version) {
      if ('url' in version) {
        dependency.url = version;
      } else {
        dependency.version = version;
      }
    }

    return { name, extras, version, env };
  });

  private name = this.RULE('name', () => {
    return this.CONSUME(Identifier).image;
  });

  private extras = this.RULE('extras', () => {
    this.CONSUME(LSquare);
    const extras: string[] = [];
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => {
        extras.push(this.SUBRULE(this.extra));
      },
    });
    this.CONSUME(RSquare);
    return extras;
  });

  private extra = this.RULE('extra', () => {
    return this.CONSUME(Identifier).image;
  });

  private versions = this.RULE('versions', () => {
    this.CONSUME(LParen);
    const versions: DependencyVersion[] = [];
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => {
        versions.push(this.SUBRULE(this.version));
      },
    });
    this.CONSUME(RParen);

    return versions;
  });

  private version = this.RULE('version', () => {
    return {
      operator: this.CONSUME(Comparison).image,
      version: this.CONSUME(Version).image,
    } as DependencyVersion;
  });

  private url = this.RULE('url', () => {
    this.CONSUME(At);
    return { url: this.CONSUME(Url).image };
  });

  private envMarker = this.RULE('envMarker', () => {
    let marker: DependencyEnvMarker | undefined = undefined;

    this.MANY(() => {
      const item = this.OR([
        { ALT: () => this.SUBRULE(this.envParen) },
        { ALT: () => this.SUBRULE(this.envCondition) },
        { ALT: () => this.SUBRULE(this.envComparison) },
      ]) as DependencyEnvCondition | DependencyEnvComparison;

      if (marker && item.type === 'condition') {
        if (marker.type === 'condition' && marker.operator === item.operator) {
          marker.markers.push(...item.markers);
        } else {
          marker = {
            type: 'condition',
            operator: item.operator,
            markers: [marker, ...item.markers],
          };
        }
      } else {
        marker = item;
      }
    });

    return marker;
  });

  private envParen = this.RULE('envParen', () => {
    this.CONSUME(LParen);
    const item = this.SUBRULE(this.envMarker);
    this.CONSUME(RParen);
    return item;
  });

  private envCondition = this.RULE('envCondition', () => {
    const operator = this.CONSUME(EnvCondition).image;
    const markers: DependencyEnvMarker[] = [this.SUBRULE(this.envMarker)!];

    return {
      type: 'condition',
      operator,
      markers,
    } as DependencyEnvCondition;
  });

  private envComparison = this.RULE('envComparison', () => {
    const variable = this.CONSUME(Identifier).image;
    const operator = this.OR([
      { ALT: () => this.CONSUME(Comparison) },
      { ALT: () => this.CONSUME(EnvComparison) },
    ]).image;
    const value = this.CONSUME(StringLiteral).image;

    return {
      type: 'comparison',
      variable,
      operator,
      value: value.substring(1, value.length - 1),
    } as DependencyEnvComparison;
  });

  constructor() {
    super(tokens, {
      recoveryEnabled: true,
    });

    this.performSelfAnalysis();
  }
}

const parser = new DependencyParser();

export function parseDependency(text: string) {
  const lexResult = DependencyLexer.tokenize(text);
  parser.input = lexResult.tokens;
  return parser.dependency();
}

interface EnvVariableSemver {
  value: SemVer;
  type: 'semver';
}
interface EnvVariableNumber {
  value: number;
  type: 'number';
}
interface EnvVariableString {
  value: string;
  type: 'string';
}

type EnvVariable = EnvVariableSemver | EnvVariableNumber | EnvVariableString;

export function compareEnv(
  marker: DependencyEnvMarker,
  variables: Record<string, EnvVariable>,
) {
  if (marker.type === 'comparison') {
    const variable = variables[marker.variable];
    if (!variable) {
      return false;
    }

    const rawValue = marker.value;

    switch (variable.type) {
      case 'semver':
        {
          if (marker.operator === '~=') {
            return semver.satisfies(variable.value, rawValue);
          }

          const value = semver.coerce(rawValue);
          if (!value) {
            return false;
          }

          switch (marker.operator) {
            case '<':
              return semver.lt(variable.value, value);
            case '<=':
              return semver.lte(variable.value, value);
            case '>':
              return semver.gt(variable.value, value);
            case '>=':
              return semver.gte(variable.value, value);
            case '===':
            case '==':
              return semver.eq(variable.value, value);
            case '!=':
              return semver.neq(variable.value, value);
          }
        }
        break;
      case 'number':
        {
          const value = parseFloat(rawValue);
          switch (marker.operator) {
            case '<':
              return variable.value < value;
            case '<=':
              return variable.value <= value;
            case '>':
              return variable.value > value;
            case '>=':
              return variable.value >= value;
            case '===':
            case '==':
              return variable.value === value;
            case '!=':
              return variable.value !== value;
          }
        }
        break;
      case 'string':
        {
          const value = rawValue;
          switch (marker.operator) {
            case '===':
            case '==':
              return variable.value === value;
            case '!=':
              return variable.value !== value;
            case '~=':
              // TODO: not sure
              return variable.value.includes(value as string);
          }
        }
        break;
    }

    throw new Error('Invalid comparison.');
  } else if (marker.operator === 'and') {
    for (const submarker of marker.markers) {
      if (!compareEnv(submarker, variables)) {
        return false;
      }
    }

    return true;
  } else {
    for (const submarker of marker.markers) {
      if (compareEnv(submarker, variables)) {
        return true;
      }
    }
  }

  return false;
}
