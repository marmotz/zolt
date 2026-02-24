import { describe, expect, test } from 'bun:test';
import { Lexer } from '../../lexer/lexer';
import { Token, TokenType } from '../../lexer/token-types';
import { CodeBlockParser } from './code-block-parser';

describe('CodeBlockParser', () => {
  const parser = new CodeBlockParser();

  const mockContext = (tokens: Token[]) => {
    let pos = 0;

    return {
      expect: (type: TokenType) => {
        const token = tokens[pos++];
        if (token.type !== type) throw new Error(`Expected ${type}`);

        return token;
      },
      match: (...types: TokenType[]) => types.includes(tokens[pos]?.type),
      advance: () => tokens[pos++],
      isEof: () => pos >= tokens.length || tokens[pos].type === TokenType.EOF,
    };
  };

  test('should parse code block', () => {
    const lexer = new Lexer(`\`\`\`typescript
const x = 1;
\`\`\``);
    const tokens = lexer.tokenize();
    const ctx = mockContext(tokens);
    const node = parser.parseCodeBlock(ctx.expect, ctx.match, ctx.advance, ctx.isEof);

    expect(node.type).toBe('CodeBlock');
    expect(node.language).toBe('typescript');
    expect(node.content).toBe('const x = 1;');
  });
});
