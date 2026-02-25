import { describe, expect, test } from 'bun:test';
import { Lexer } from './lexer';
import { TokenType } from './token-types';

describe('Lexer', () => {
  test('should tokenize heading', () => {
    const lexer = new Lexer('# Hello World');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.HEADING);
    expect(tokens[0].value).toBe('Hello World');
  });

  test('should tokenize paragraph', () => {
    const lexer = new Lexer('This is a paragraph');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.TEXT);
    expect(tokens[0].value).toBe('This is a paragraph');
  });

  test('should tokenize bullet list', () => {
    const lexer = new Lexer('- item 1\n- item 2');
    const tokens = lexer.tokenize();

    const bulletTokens = tokens.filter((t) => t.type === TokenType.BULLET_LIST);
    expect(bulletTokens.length).toBe(2);
  });

  test('should tokenize numbered list', () => {
    const lexer = new Lexer('1. First\n2. Second');
    const tokens = lexer.tokenize();

    const orderedTokens = tokens.filter((t) => t.type === TokenType.ORDERED_LIST);
    expect(orderedTokens.length).toBe(2);
  });

  test('should tokenize blockquote', () => {
    const lexer = new Lexer('> Quote text');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.BLOCKQUOTE);
  });

  test('should tokenize blockquote with level', () => {
    const lexer = new Lexer('> Quote text');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.BLOCKQUOTE);
    expect(tokens[0].level).toBe(1);
  });

  test('should tokenize nested blockquote level 2', () => {
    const lexer = new Lexer('> > Level 2 quote');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.BLOCKQUOTE);
    expect(tokens[0].level).toBe(2);
  });

  test('should tokenize nested blockquote level 3', () => {
    const lexer = new Lexer('> > > Level 3 quote');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.BLOCKQUOTE);
    expect(tokens[0].level).toBe(3);
  });

  test('should tokenize horizontal rule', () => {
    const lexer = new Lexer('---');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.HORIZONTAL_RULE);
    expect(tokens[0].value).toBe('---:');
  });

  test('should tokenize thick horizontal rule', () => {
    const lexer = new Lexer('***');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.HORIZONTAL_RULE);
    expect(tokens[0].value).toBe('***:');
  });

  test('should tokenize thin horizontal rule', () => {
    const lexer = new Lexer('___');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.HORIZONTAL_RULE);
    expect(tokens[0].value).toBe('___:');
  });

  test('should tokenize horizontal rule with attributes', () => {
    const lexer = new Lexer('--- {color=red}');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.HORIZONTAL_RULE);
    expect(tokens[0].value).toBe('---:{color=red}');
  });

  test('should tokenize thick horizontal rule with attributes', () => {
    const lexer = new Lexer('*** {color=blue style=dashed}');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.HORIZONTAL_RULE);
    expect(tokens[0].value).toBe('***:{color=blue style=dashed}');
  });

  test('should tokenize code block', () => {
    const lexer = new Lexer('```js\nconst x = 1\n```');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.CODE_BLOCK_START);
    expect(tokens[0].value).toBe('js');

    expect(tokens[1].type).toBe(TokenType.CODE_BLOCK);
    expect(tokens[1].value).toBe('const x = 1');

    expect(tokens[2].type).toBe(TokenType.CODE_BLOCK_END);
  });

  test('should tokenize newlines', () => {
    const lexer = new Lexer('Line 1\nLine 2');
    const tokens = lexer.tokenize();

    expect(tokens[1].type).toBe(TokenType.NEWLINE);
  });

  test('should add EOF token', () => {
    const lexer = new Lexer('text');
    const tokens = lexer.tokenize();

    expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);
  });

  test('should tokenize triple colon blocks', () => {
    const lexer = new Lexer(':::columns\ncontent\n:::');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.TRIPLE_COLON_START);
    expect(tokens[0].value).toBe('columns');

    // tokens[1] is NEWLINE
    // tokens[2] is TEXT
    // tokens[3] is NEWLINE

    const endToken = tokens.find((t) => t.type === TokenType.TRIPLE_COLON_END);
    expect(endToken).toBeDefined();
    expect(endToken?.value).toBe('');
  });

  test('should handle empty input', () => {
    const lexer = new Lexer('');
    const tokens = lexer.tokenize();

    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);
  });

  test('should track line numbers', () => {
    const lexer = new Lexer('Line 1\nLine 2\nLine 3');
    const tokens = lexer.tokenize();

    expect(tokens[0].line).toBe(1);
    expect(tokens[1].line).toBe(1); // NEWLINE after line 1
    expect(tokens[2].line).toBe(2); // Line 2
  });

  test('should tokenize heading with correct level', () => {
    const lexer = new Lexer('## Section');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.HEADING);
    expect(tokens[0].value).toBe('Section');
    expect(tokens[0].level).toBe(2);
  });

  test('should tokenize heading level 6', () => {
    const lexer = new Lexer('###### H6');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.HEADING);
    expect(tokens[0].level).toBe(6);
  });

  test('should tokenize list with content', () => {
    const lexer = new Lexer('- item 1\n- item 2');
    const tokens = lexer.tokenize();

    const bulletTokens = tokens.filter((t) => t.type === TokenType.BULLET_LIST);
    expect(bulletTokens.length).toBe(2);
    expect(bulletTokens[0].value).toBe('- item 1');
    expect(bulletTokens[1].value).toBe('- item 2');
  });

  test('should tokenize numbered list with content', () => {
    const lexer = new Lexer('1. First\n2. Second');
    const tokens = lexer.tokenize();

    const orderedTokens = tokens.filter((t) => t.type === TokenType.ORDERED_LIST);
    expect(orderedTokens.length).toBe(2);
    expect(orderedTokens[0].value).toBe('1. First');
    expect(orderedTokens[1].value).toBe('2. Second');
  });

  test('should tokenize standalone inline comments', () => {
    const lexer = new Lexer('%% comment 1 %%\n%% comment 2 %%');
    const tokens = lexer.tokenize();

    const commentTokens = tokens.filter((t) => t.type === TokenType.COMMENT_INLINE);

    expect(commentTokens.length).toBe(2);
    expect(commentTokens[0].value).toBe('comment 1');
    expect(commentTokens[1].value).toBe('comment 2');
  });

  test('should tokenize definition list', () => {
    const lexer = new Lexer(': Term\n:   Definition');
    const tokens = lexer.tokenize();

    const defTokens = tokens.filter((t) => t.type === TokenType.DEFINITION);
    expect(defTokens.length).toBe(2);
    expect(defTokens[0].value).toBe(': Term');
    expect(defTokens[1].value).toBe(':   Definition');
  });

  test('should tokenize plain list', () => {
    const lexer = new Lexer('+ item 1\n+ item 2');
    const tokens = lexer.tokenize();

    const plainTokens = tokens.filter((t) => t.type === TokenType.PLAIN_LIST);
    expect(plainTokens.length).toBe(2);
    expect(plainTokens[0].value).toBe('+ item 1');
    expect(plainTokens[1].value).toBe('+ item 2');
  });

  test('should tokenize link reference definition', () => {
    const lexer = new Lexer('[ref]: https://example.com');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.LINK_REF_DEF);
    expect(tokens[0].value).toBe('ref:https://example.com');
  });

  test('should tokenize math block', () => {
    const lexer = new Lexer('$$\\int x dx$$');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.MATH_BLOCK);
    expect(tokens[0].value).toBe('\\int x dx');
  });

  test('should tokenize math block with newlines', () => {
    const lexer = new Lexer('$$\n\\int x dx\n$$');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.MATH_BLOCK);
    expect(tokens[0].value).toBe('\n\\int x dx\n');
  });
});
