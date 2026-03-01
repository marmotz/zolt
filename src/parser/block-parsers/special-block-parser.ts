import { type Token, TokenType } from '../../lexer/token-types';
import type { InlineParser } from '../inline-parser';
import type { Attributes } from '../types';

export class SpecialBlockParser {
  constructor(private inlineParser: InlineParser) {}

  public parseDoubleBracketBlock(expect: (type: TokenType) => Token): any {
    const token = expect(TokenType.DOUBLE_BRACKET_START);
    const value = token.value.trim();

    let blockType = value;
    let attributes: Attributes | undefined;

    const attrMatch = value.match(/^([a-zA-Z0-9/-]+)\s*\{([^}]+)}$/);
    if (attrMatch) {
      blockType = attrMatch[1];
      attributes = this.inlineParser.parseAttributes(attrMatch[2]);
    } else {
      const firstSpaceIndex = value.indexOf(' ');
      if (firstSpaceIndex !== -1) {
        blockType = value.substring(0, firstSpaceIndex);
        const attrStr = value.substring(firstSpaceIndex + 1).trim();
        const innerAttrMatch = attrStr.match(/^\{([^}]+)}$/);
        if (innerAttrMatch) {
          attributes = this.inlineParser.parseAttributes(innerAttrMatch[1]);
        }
      }
    }

    return { type: 'DoubleBracketBlock', blockType, content: '', attributes };
  }

  public parseHorizontalRule(expect: (type: TokenType) => Token): any {
    const token = expect(TokenType.HORIZONTAL_RULE);
    const value = token.value;
    const colonIndex = value.indexOf(':');
    const styleChar = colonIndex !== -1 ? value.substring(0, colonIndex) : value;
    const attrsStr = colonIndex !== -1 ? value.substring(colonIndex + 1) : '';

    let style: 'solid' | 'thick' | 'thin' = 'solid';
    if (styleChar.includes('*')) {
      style = 'thick';
    } else if (styleChar.includes('_')) {
      style = 'thin';
    }

    let attributes: Attributes | undefined;
    if (attrsStr) {
      const cleanAttrs = attrsStr.startsWith(':') ? attrsStr.substring(1) : attrsStr;
      const attrMatch = cleanAttrs.match(/^\{([^}]+)}$/);
      if (attrMatch && !attrMatch[1].startsWith('$') && !attrMatch[1].startsWith('{')) {
        attributes = this.inlineParser.parseAttributes(attrMatch[1]);
      }
    }

    return { type: 'HorizontalRule', style, attributes };
  }

  public parseAbbreviationDef(expect: (type: TokenType) => Token, match: (...types: TokenType[]) => boolean): any {
    const type = match(TokenType.ABBREVIATION_DEF_GLOBAL)
      ? TokenType.ABBREVIATION_DEF_GLOBAL
      : TokenType.ABBREVIATION_DEF;
    const token = expect(type);
    const value = token.value;
    const colonIndex = value.indexOf(':');

    return {
      type: 'AbbreviationDefinition',
      abbreviation: value.substring(0, colonIndex),
      definition: value.substring(colonIndex + 1),
      isGlobal: type === TokenType.ABBREVIATION_DEF_GLOBAL,
    };
  }

  public parseLinkReferenceDef(expect: (type: TokenType) => Token): any {
    const token = expect(TokenType.LINK_REF_DEF);
    const value = token.value;
    const colonIndex = value.indexOf(':');

    return {
      type: 'LinkReferenceDefinition',
      ref: value.substring(0, colonIndex),
      url: value.substring(colonIndex + 1),
    };
  }

  public parseCommentInline(expect: (type: TokenType) => Token): any {
    const token = expect(TokenType.COMMENT_INLINE);

    return {
      type: 'CommentInline',
      content: token.value,
    };
  }

  public parseMathBlock(expect: (type: TokenType) => Token): any {
    const token = expect(TokenType.MATH_BLOCK);

    return {
      type: 'Math',
      content: token.value.trim(),
      isBlock: true,
    };
  }
}
