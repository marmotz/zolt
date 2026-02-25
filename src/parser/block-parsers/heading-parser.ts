import { Token, TokenType } from '../../lexer/token-types';
import { InlineParser } from '../inline-parser';
import { Attributes, HeadingNode } from '../types';

export class HeadingParser {
  constructor(private inlineParser: InlineParser) {}

  public parseHeading(expect: (type: TokenType) => Token): HeadingNode {
    const token = expect(TokenType.HEADING);
    const level = token.level || 1;
    let content = token.value.trim();

    let attributes: Attributes | undefined;
    const attrMatchWithSpace = content.match(/\s+\{([^}]+)}$/);
    if (attrMatchWithSpace) {
      const attrContent = attrMatchWithSpace[1];
      if (!attrContent.startsWith('$') && !attrContent.startsWith('{')) {
        attributes = this.inlineParser.parseAttributes(attrContent);
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
          attributes = this.inlineParser.parseAttributes(attrContent);
          content = content.slice(0, -fullMatch.length).trim();
        }
      }
    }

    return {
      type: 'Heading',
      level,
      children: this.inlineParser.parse(content),
      attributes,
    };
  }
}
