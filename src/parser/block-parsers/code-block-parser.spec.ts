import { describe, expect, test } from 'bun:test';
import { Lexer } from '../../lexer/lexer';
import { type Token, TokenType } from '../../lexer/token-types';
import { InlineParser } from '../inline-parser';
import { CodeBlockParser } from './code-block-parser';

describe('CodeBlockParser', () => {
  const inlineParser = new InlineParser();
  const parser = new CodeBlockParser(inlineParser);

  const mockContext = (tokens: Token[]) => {
    let pos = 0;

    return {
      expect: (type: TokenType) => {
        const token = tokens[pos++];
        if (token.type !== type) {
          throw new Error(`Expected ${type}`);
        }

        return token;
      },
      match: (...types: TokenType[]) => types.includes(tokens[pos]?.type),
      advance: () => tokens[pos++],
      isEof: () => pos >= tokens.length || tokens[pos].type === TokenType.EOF,
      error: (msg: string) => {
        throw new Error(msg);
      },
      warn: () => {},
    };
  };

  test('should parse code block', () => {
    const lexer = new Lexer(`\`\`\`typescript
const x = 1;
\`\`\``);
    const tokens = lexer.tokenize();
    const ctx = mockContext(tokens);
    const node = parser.parseCodeBlock(ctx.expect, ctx.match, ctx.advance, ctx.isEof, ctx.warn);

    expect(node.type).toBe('CodeBlock');
    expect(node.language).toBe('typescript');
    expect(node.content).toBe('const x = 1;');
  });
});
