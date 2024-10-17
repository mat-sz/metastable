import { lexPrompt, preprocessPrompt, PromptTokenType } from './prompt.js';

describe('lexPrompt', () => {
  it('should correctly lex comments', () => {
    expect(lexPrompt('hello #- test -# world')).toEqual([
      { type: PromptTokenType.TEXT, value: 'hello ' },
      { type: PromptTokenType.COMMENT, value: '#- test -#' },
      { type: PromptTokenType.TEXT, value: ' world' },
    ]);
    expect(lexPrompt('hello #- test\ntest -# world')).toEqual([
      { type: PromptTokenType.TEXT, value: 'hello ' },
      { type: PromptTokenType.COMMENT, value: '#- test\ntest -#' },
      { type: PromptTokenType.TEXT, value: ' world' },
    ]);
    expect(lexPrompt('hello # world')).toEqual([
      { type: PromptTokenType.TEXT, value: 'hello ' },
      { type: PromptTokenType.COMMENT, value: '# world' },
    ]);
    expect(lexPrompt('hello # world\ntest')).toEqual([
      { type: PromptTokenType.TEXT, value: 'hello ' },
      { type: PromptTokenType.COMMENT, value: '# world' },
      { type: PromptTokenType.TEXT, value: '\ntest' },
    ]);
  });

  it('should correctly lex weights', () => {
    expect(lexPrompt('hello (world:1.2)')).toEqual([
      { type: PromptTokenType.TEXT, value: 'hello ' },
      { type: PromptTokenType.LPAREN, value: '(' },
      { type: PromptTokenType.TEXT, value: 'world' },
      { type: PromptTokenType.WEIGHT, value: ':1.2' },
      { type: PromptTokenType.RPAREN, value: ')' },
    ]);

    expect(lexPrompt('hello (world)')).toEqual([
      { type: PromptTokenType.TEXT, value: 'hello ' },
      { type: PromptTokenType.LPAREN, value: '(' },
      { type: PromptTokenType.TEXT, value: 'world' },
      { type: PromptTokenType.RPAREN, value: ')' },
    ]);
  });

  it('should correctly lex random groups', () => {
    expect(lexPrompt('hello {red|green|blue}')).toEqual([
      { type: PromptTokenType.TEXT, value: 'hello ' },
      { type: PromptTokenType.LBRACKET, value: '{' },
      { type: PromptTokenType.TEXT, value: 'red' },
      { type: PromptTokenType.PIPE, value: '|' },
      { type: PromptTokenType.TEXT, value: 'green' },
      { type: PromptTokenType.PIPE, value: '|' },
      { type: PromptTokenType.TEXT, value: 'blue' },
      { type: PromptTokenType.RBRACKET, value: '}' },
    ]);
  });

  it('should correctly lex escaped characters', () => {
    expect(lexPrompt('hello \\(\\)')).toEqual([
      { type: PromptTokenType.TEXT, value: 'hello \\(\\)' },
    ]);
    expect(lexPrompt('hello \\{\\}')).toEqual([
      { type: PromptTokenType.TEXT, value: 'hello \\{\\}' },
    ]);
  });
});

describe('preprocessPrompt', () => {
  it('should remove comments from prompts', () => {
    expect(preprocessPrompt('hello #- test -# world')).toEqual('hello  world');
    expect(preprocessPrompt('hello #- test\ntest -# world')).toEqual(
      'hello  world',
    );
    expect(preprocessPrompt('hello # world')).toEqual('hello ');
    expect(preprocessPrompt('hello # world\ntest')).toEqual('hello \ntest');
  });
});
