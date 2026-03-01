import { describe, expect, test } from 'bun:test';
import { Lexer } from '../../lexer/lexer';
import { type Token, TokenType } from '../../lexer/token-types';
import { InlineParser } from '../inline-parser';
import { ParagraphParser } from './paragraph-parser';

describe('ParagraphParser', () => {
  const inlineParser = new InlineParser();
  const parser = new ParagraphParser(inlineParser);

  const mockContext = (tokens: Token[]) => {
    let pos = 0;

    return {
      match: (...types: TokenType[]) => types.includes(tokens[pos]?.type),
      advance: () => tokens[pos++],
      peek: (offset: number) => tokens[pos + offset] || { type: TokenType.EOF },
      isEof: () => pos >= tokens.length || tokens[pos].type === TokenType.EOF,
      isNewBlockStart: () => false, // Simplified for this test
    };
  };

  test('should parse simple paragraph', () => {
    const lexer = new Lexer('Hello World');
    const tokens = lexer.tokenize();
    const ctx = mockContext(tokens);
    const node = parser.parseParagraph(ctx.match, ctx.advance, ctx.peek, ctx.isEof, ctx.isNewBlockStart);

    expect(node.type).toBe('Paragraph');
    expect((node.children[0] as any).content).toBe('Hello World');
  });

  test('should parse paragraph with attributes', () => {
    const lexer = new Lexer('Hello World {#id}');
    const tokens = lexer.tokenize();
    const ctx = mockContext(tokens);
    const node = parser.parseParagraph(ctx.match, ctx.advance, ctx.peek, ctx.isEof, ctx.isNewBlockStart);

    expect(node.attributes?.id).toBe('id');
    expect((node.children[0] as any).content).toBe('Hello World');
  });
});
