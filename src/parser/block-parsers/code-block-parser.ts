import { TokenType, Token } from '../../lexer/token-types';
import { Attributes, CodeBlockNode } from '../types';
import { InlineParser } from '../inline-parser';

export class CodeBlockParser {
  public parseCodeBlock(
    expect: (type: TokenType) => Token,
    match: (...types: TokenType[]) => boolean,
    advance: () => Token,
    isEof: () => boolean
  ): CodeBlockNode {
    const startToken = expect(TokenType.CODE_BLOCK_START);
    let value = startToken.value;
    let attributes: Attributes | undefined;
    const attrMatch = value.match(/\s+\{([^}]+)}$/);
    let language = value;
    if (attrMatch && !attrMatch[1].startsWith('$') && !attrMatch[1].startsWith('{')) {
      attributes = InlineParser.parseAttributes(attrMatch[1]);
      language = value.replace(/\s+\{([^}]+)}$/, '').trim();
    }

    let content = '';
    while (!isEof() && !match(TokenType.CODE_BLOCK_END)) {
      const token = advance();
      if (token.type === TokenType.CODE_BLOCK) content += token.value + '\n';
    }
    if (match(TokenType.CODE_BLOCK_END)) advance();
    if (content.endsWith('\n')) content = content.slice(0, -1);

    return { type: 'CodeBlock', language: language || undefined, content, attributes };
  }
}
