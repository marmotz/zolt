import { TokenType, Token } from '../../lexer/token-types';
import { Attributes, ParagraphNode } from '../types';
import { InlineParser } from '../inline-parser';

export class ParagraphParser {
  constructor(private inlineParser: InlineParser) {}

  public parseParagraph(
    match: (...types: TokenType[]) => boolean,
    advance: () => Token,
    peek: (offset: number) => Token,
    isEof: () => boolean,
    isNewBlockStart: (offset?: number) => boolean
  ): ParagraphNode {
    let content = '';

    while (!isEof()) {
      if (match(TokenType.NEWLINE)) {
        const next = peek(1);
        if (next.type === TokenType.NEWLINE || isNewBlockStart(1)) {
          break;
        }
        advance();
        content += ' ';
        continue;
      }

      if (isNewBlockStart()) {
        break;
      }

      content += advance().value;
    }

    content = content.trim();
    const isVariableDef = /^\$+\w+\s*=/.test(content);
    let attributes: Attributes | undefined;
    if (!isVariableDef) {
      const attrMatchWithSpace = content.match(/\s+\{([^}]+)}$/);
      if (attrMatchWithSpace) {
        const attrContent = attrMatchWithSpace[1];
        if (!attrContent.startsWith('$') && !attrContent.startsWith('{')) {
          attributes = InlineParser.parseAttributes(attrContent);
          content = content.slice(0, -attrMatchWithSpace[0].length).trim();
        }
      } else {
        const attrMatchNoSpace = content.match(/(\{([^}]+)})$/);
        if (attrMatchNoSpace) {
          const fullMatch = attrMatchNoSpace[1];
          const attrContent = attrMatchNoSpace[2];
          const beforeIndex = content.length - fullMatch.length - 1;
          const charBefore = beforeIndex >= 0 ? content[beforeIndex] : '';
          const inlineDelimiters = [')', '*', '/', '_', '~', '}', '|', '=', '`'];

          if (!attrContent.startsWith('$') && !attrContent.startsWith('{') && !inlineDelimiters.includes(charBefore)) {
            attributes = InlineParser.parseAttributes(attrContent);
            content = content.slice(0, -fullMatch.length).trim();
          }
        }
      }
    }

    return {
      type: 'Paragraph',
      children: this.inlineParser.parse(content),
      attributes,
    };
  }
}
