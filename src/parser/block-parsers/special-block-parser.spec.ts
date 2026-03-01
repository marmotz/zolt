import { describe, expect, test } from 'bun:test';
import { Lexer } from '../../lexer/lexer';
import type { Token, TokenType } from '../../lexer/token-types';
import { InlineParser } from '../inline-parser';
import { SpecialBlockParser } from './special-block-parser';

describe('SpecialBlockParser', () => {
  const inlineParser = new InlineParser();
  const parser = new SpecialBlockParser(inlineParser);

  const mockExpect = (tokens: Token[]) => {
    let pos = 0;

    return (type: TokenType) => {
      const token = tokens[pos++];
      if (token.type !== type) {
        throw new Error(`Expected ${type}`);
      }

      return token;
    };
  };

  test('should parse double bracket block', () => {
    const lexer = new Lexer('[[toc]]');
    const tokens = lexer.tokenize();
    const node = parser.parseDoubleBracketBlock(mockExpect(tokens));

    expect(node.type).toBe('DoubleBracketBlock');
    expect(node.blockType).toBe('toc');
  });

  test('should parse horizontal rule', () => {
    const lexer = new Lexer('---');
    const tokens = lexer.tokenize();
    const node = parser.parseHorizontalRule(mockExpect(tokens));

    expect(node.type).toBe('HorizontalRule');
    expect(node.style).toBe('solid');
  });

  test('should parse abbreviation definition', () => {
    const lexer = new Lexer('*[HTML]: HyperText Markup Language');
    const tokens = lexer.tokenize();
    const node = parser.parseAbbreviationDef(mockExpect(tokens), (type) => tokens[0].type === type);

    expect(node.type).toBe('AbbreviationDefinition');
    expect(node.abbreviation).toBe('HTML');
    expect(node.definition.trim()).toBe('HyperText Markup Language');
  });
});
