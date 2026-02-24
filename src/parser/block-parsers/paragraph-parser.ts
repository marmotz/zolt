import { Token, TokenType } from '../../lexer/token-types';
import { InlineParser } from '../inline-parser';
import { Attributes, ParagraphNode } from '../types';

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
    let isFirstLine = true;

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

      if (!isFirstLine && isNewBlockStart()) {
        break;
      }

      content += advance().value;
      isFirstLine = false;
    }

    content = content.trim();

    let attributes: Attributes | undefined;
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

    return {
      type: 'Paragraph',
      children: this.inlineParser.parse(content),
      attributes,
    };
  }
}
