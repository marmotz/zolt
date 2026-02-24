import { describe, expect, test } from 'bun:test';
import { Lexer } from '../../lexer/lexer';
import { HeadingParser } from './heading-parser';
import { InlineParser } from '../inline-parser';
import { TokenType, Token } from '../../lexer/token-types';

describe('HeadingParser', () => {
  const inlineParser = new InlineParser();
  const parser = new HeadingParser(inlineParser);

  const mockExpect = (tokens: Token[]) => {
    let pos = 0;
    return (type: TokenType) => {
      const token = tokens[pos++];
      if (token.type !== type) throw new Error(`Expected ${type}`);
      return token;
    };
  };

  test('should parse heading level 1', () => {
    const lexer = new Lexer('# Hello World');
    const tokens = lexer.tokenize();
    const node = parser.parseHeading(mockExpect(tokens));

    expect(node.type).toBe('Heading');
    expect(node.level).toBe(1);
    expect(node.children[0].type).toBe('Text');
    expect((node.children[0] as any).content).toBe('Hello World');
  });

  test('should parse heading with attributes', () => {
    const lexer = new Lexer('## Section {#id .class}');
    const tokens = lexer.tokenize();
    const node = parser.parseHeading(mockExpect(tokens));

    expect(node.level).toBe(2);
    expect(node.attributes?.id).toBe('id');
    expect(node.attributes?.class).toBe('class');
    expect((node.children[0] as any).content).toBe('Section');
  });
});
