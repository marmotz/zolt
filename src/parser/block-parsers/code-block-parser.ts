import { type Token, TokenType } from '../../lexer/token-types';
import type { InlineParser } from '../inline-parser';
import type { Attributes, CodeBlockNode } from '../types';

export class CodeBlockParser {
  constructor(private inlineParser: InlineParser) {}

  public parseCodeBlock(
    expect: (type: TokenType) => Token,
    match: (...types: TokenType[]) => boolean,
    advance: () => Token,
    isEof: () => boolean,
    warn: (message: string, code: string) => void
  ): CodeBlockNode {
    const startToken = expect(TokenType.CODE_BLOCK_START);
    const value = startToken.value;
    let attributes: Attributes | undefined;
    const attrMatch = value.match(/\s+\{([^}]+)}$/);
    let language = value;
    if (attrMatch && !attrMatch[1].startsWith('$') && !attrMatch[1].startsWith('{')) {
      attributes = this.inlineParser.parseAttributes(attrMatch[1]);
      language = value.replace(/\s+\{([^}]+)}$/, '').trim();
    }

    let content = '';
    while (!isEof() && !match(TokenType.CODE_BLOCK_END)) {
      const token = advance();
      if (token.type === TokenType.CODE_BLOCK) {
        content += `${token.value}\n`;
      } else {
        // Handle unexpected tokens inside code block if any (should normally be only CODE_BLOCK tokens)
        content += `${token.value}\n`;
      }
    }

    if (match(TokenType.CODE_BLOCK_END)) {
      advance();
    } else {
      warn(`Unclosed code block starting with \`\`\`${language}`, 'UNCLOSED_CODE_BLOCK');
    }

    if (content.endsWith('\n')) {
      content = content.slice(0, -1);
    }

    return { type: 'CodeBlock', language: language || undefined, content, attributes };
  }
}
