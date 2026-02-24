import { describe, expect, test } from 'bun:test';
import { Lexer } from '../../lexer/lexer';
import { IndentationParser } from './indentation-parser';
import { ListParser } from './list-parser';
import { TripleColonParser } from './triple-colon-parser';
import { InlineParser } from '../inline-parser';
import { HeadingParser } from './heading-parser';
import { CodeBlockParser } from './code-block-parser';
import { SpecialBlockParser } from './special-block-parser';
import { ParagraphParser } from './paragraph-parser';
import { TokenType, Token } from '../../lexer/token-types';

describe('IndentationParser', () => {
  const inlineParser = new InlineParser();
  const listParser = new ListParser(inlineParser);
  const tripleColonParser = new TripleColonParser(inlineParser);
  const headingParser = new HeadingParser(inlineParser);
  const codeBlockParser = new CodeBlockParser();
  const specialBlockParser = new SpecialBlockParser();
  const paragraphParser = new ParagraphParser(inlineParser);
  
  const parser = new IndentationParser(listParser, tripleColonParser);

  const mockContext = (tokens: Token[]) => {
    let pos = 0;
    const ctx = {
      pos: { current: 0 },
      currentToken: () => tokens[ctx.pos.current],
      advance: () => tokens[ctx.pos.current++],
      expect: (type: TokenType) => {
        const token = tokens[ctx.pos.current++];
        if (token.type !== type) throw new Error(`Expected ${type} but got ${token.type}`);
        return token;
      },
      match: (...types: TokenType[]) => types.includes(tokens[ctx.pos.current]?.type),
      skipNewlines: () => {
        while (tokens[ctx.pos.current]?.type === TokenType.NEWLINE) ctx.pos.current++;
      },
      isEof: () => ctx.pos.current >= tokens.length || tokens[ctx.pos.current].type === TokenType.EOF,
      error: (msg: string) => { throw new Error(msg); }
    };
    return ctx;
  };

  test('should parse simple indentation', () => {
    const lexer = new Lexer('  ');
    const tokens = lexer.tokenize();
    const node = parser.parseIndentation(mockContext(tokens).expect);

    expect(node.type).toBe('Indentation');
    expect(node.level).toBe(1);
  });

  test('should parse technical indentation', () => {
    const lexer = new Lexer('& Hello');
    const tokens = lexer.tokenize();
    const ctx = mockContext(tokens);
    
    const node = parser.parseTechnicalIndentation(
      tokens, ctx.pos, ctx.currentToken, ctx.advance, ctx.expect, ctx.match, ctx.skipNewlines, ctx.isEof,
      () => null, 
      () => headingParser.parseHeading(ctx.expect),
      () => codeBlockParser.parseCodeBlock(ctx.expect, ctx.match, ctx.advance, ctx.isEof),
      () => specialBlockParser.parseHorizontalRule(ctx.expect),
      () => paragraphParser.parseParagraph(ctx.match, ctx.advance, (off) => tokens[ctx.pos.current + off], ctx.isEof, () => false),
      ctx.error as any
    );

    expect(node.type).toBe('Indentation');
    expect(node.level).toBe(1);
    expect(node.children[0].type).toBe('Paragraph');
  });
});
