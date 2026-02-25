import { Token, TokenType } from '../../lexer/token-types';
import { InlineParser } from '../inline-parser';
import { ASTNode, Attributes, DefinitionDescriptionNode, DefinitionTermNode, ListItemNode, ListNode } from '../types';

export class ListParser {
  constructor(private inlineParser: InlineParser) {}

  public getListKind(type: TokenType): 'bullet' | 'numbered' | 'task' | 'definition' | 'plain' | null {
    switch (type) {
      case TokenType.BULLET_LIST:
        return 'bullet';
      case TokenType.PLAIN_LIST:
        return 'plain';
      case TokenType.ORDERED_LIST:
        return 'numbered';
      case TokenType.TASK_LIST:
        return 'task';
      case TokenType.DEFINITION:
        return 'definition';
      default:
        return null;
    }
  }

  public parseList(
    advance: () => Token,
    peek: (offset?: number) => Token,
    match: (...types: TokenType[]) => boolean,
    skipNewlines: () => void,
    isEof: () => boolean,
    parseBlock: () => ASTNode | null,
    indent: string = ''
  ): ListNode {
    const firstToken = indent !== '' ? peek(1) : peek();
    const kind = this.getListKind(firstToken.type);
    if (!kind) {
      // Should not happen if called correctly, but for safety:
      return { type: 'List', kind: 'bullet', children: [] };
    }
    const children: (ListItemNode | DefinitionTermNode | DefinitionDescriptionNode)[] = [];

    while (!isEof()) {
      if (indent !== '') {
        if (!match(TokenType.INDENTATION) || peek().value !== indent) {
          break;
        }
        const next = peek(1);
        if (this.getListKind(next.type) !== kind) {
          break;
        }
        advance(); // consume indentation
      } else {
        const currentKind = this.getListKind(peek().type);
        if (!currentKind || currentKind !== kind) {
          break;
        }
      }

      const item = this.parseListItem(kind, indent, advance, peek, match, skipNewlines, isEof, parseBlock);
      children.push(item);
      skipNewlines();
    }

    return {
      type: 'List',
      kind,
      children,
    };
  }

  public parseListItem(
    kind: string,
    currentIndent: string,
    advance: () => Token,
    peek: (offset?: number) => Token,
    match: (...types: TokenType[]) => boolean,
    skipNewlines: () => void,
    isEof: () => boolean,
    parseBlock: () => ASTNode | null
  ): ListItemNode | DefinitionTermNode | DefinitionDescriptionNode {
    let checked: boolean | undefined;
    let content = '';
    let isDescription = false;

    if (match(TokenType.TASK_LIST)) {
      const token = advance();
      checked = /\[x]/i.test(token.value);
      content = token.value.replace(/^([-*+]\s+)?\[[ x]]\s+/i, '');
    } else if (match(TokenType.BULLET_LIST)) {
      const token = advance();
      content = token.value.replace(/^[-*]\s+/, '');
    } else if (match(TokenType.PLAIN_LIST)) {
      const token = advance();
      content = token.value.replace(/^\+\s+/, '');
    } else if (match(TokenType.ORDERED_LIST)) {
      const token = advance();
      content = token.value.replace(/^\d+\.\s+/, '');
    } else if (match(TokenType.DEFINITION)) {
      const token = advance();
      const value = token.value.replace(/^:\s/, '');
      isDescription = value.startsWith('  ');
      content = value.trim();
    }

    // Extract attributes
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

    skipNewlines();

    const children: ASTNode[] = [];
    while (!isEof() && match(TokenType.INDENTATION) && peek().value.length > currentIndent.length) {
      const block = parseBlock();
      if (block) {
        children.push(block);
      }
      skipNewlines();
    }

    if (kind === 'definition') {
      if (isDescription) {
        return {
          type: 'DefinitionDescription',
          children: [...this.inlineParser.parse(content), ...children],
          attributes,
        };
      } else {
        return {
          type: 'DefinitionTerm',
          children: [...this.inlineParser.parse(content), ...children],
          attributes,
        };
      }
    }

    return {
      type: 'ListItem',
      checked,
      children: [...this.inlineParser.parse(content.trim()), ...children],
      attributes,
    };
  }
}
