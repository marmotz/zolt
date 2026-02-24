import { describe, expect, test } from 'bun:test';
import { Lexer } from '../../lexer/lexer';
import { Token, TokenType } from '../../lexer/token-types';
import { InlineParser } from '../inline-parser';
import { BlockquoteParser } from './blockquote-parser';
import { CodeBlockParser } from './code-block-parser';
import { HeadingParser } from './heading-parser';
import { ListParser } from './list-parser';
import { ParagraphParser } from './paragraph-parser';
import { SpecialBlockParser } from './special-block-parser';
import { TripleColonParser } from './triple-colon-parser';

describe('BlockquoteParser', () => {
  const inlineParser = new InlineParser();
  const listParser = new ListParser(inlineParser);
  const tripleColonParser = new TripleColonParser();
  const headingParser = new HeadingParser(inlineParser);
  const codeBlockParser = new CodeBlockParser();
  const specialBlockParser = new SpecialBlockParser();
  const paragraphParser = new ParagraphParser(inlineParser);

  const parser = new BlockquoteParser(listParser, tripleColonParser);

  const mockContext = (tokens: Token[]) => {
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
      error: (msg: string) => {
        throw new Error(msg);
      },
    };

    return ctx;
  };

  test('should parse simple blockquote', () => {
    const lexer = new Lexer('> Hello');
    const tokens = lexer.tokenize();
    const ctx = mockContext(tokens);

    const node = parser.parseBlockquote(
      tokens,
      ctx.pos,
      ctx.currentToken,
      ctx.advance,
      ctx.expect,
      ctx.match,
      ctx.skipNewlines,
      ctx.isEof,
      () => null,
      () => headingParser.parseHeading(ctx.expect),
      () => codeBlockParser.parseCodeBlock(ctx.expect, ctx.match, ctx.advance, ctx.isEof),
      () => specialBlockParser.parseHorizontalRule(ctx.expect),
      () =>
        paragraphParser.parseParagraph(
          ctx.match,
          ctx.advance,
          (off) => tokens[ctx.pos.current + off],
          ctx.isEof,
          () => false
        ),
      ctx.error as any
    );

    expect(node.type).toBe('Blockquote');
    expect(node.level).toBe(1);
    expect(node.children[0].type).toBe('Paragraph');
  });
});
