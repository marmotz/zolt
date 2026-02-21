import {
  ASTNode,
  BoldNode,
  CodeNode,
  HighlightNode,
  InlineStyleNode,
  ItalicNode,
  LinkNode,
  StrikethroughNode,
  SubscriptNode,
  SuperscriptNode,
  TextNode,
  UnderlineNode,
} from './types';

export class InlineParser {
  parse(text: string): ASTNode[] {
    const nodes: ASTNode[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      const result = this.parseInlineElement(remaining);
      if (result) {
        nodes.push(result.node);
        remaining = result.remaining;
      } else {
        const char = remaining[0];
        nodes.push(this.createTextNode(char));
        remaining = remaining.slice(1);
      }
    }

    return nodes;
  }

  private parseInlineElement(text: string): { node: ASTNode; remaining: string } | null {
    if (this.matchPattern(text, /^\[([^\]]+)]\(([^)]+)\)/)) return this.parseLink(text);
    if (this.matchPattern(text, /^\^\{([^}]+)}/)) return this.parseSuperscript(text);
    if (this.matchPattern(text, /^_\{([^}]+)}/)) return this.parseSubscript(text);
    if (this.matchPattern(text, /^\|\|([^|]+)\|\|(\{[^}]+\})?/)) return this.parseInlineStyle(text);
    if (this.matchPattern(text, /^\*\*([^*]+)\*\*/)) return this.parseBold(text);
    if (this.matchPattern(text, /^\/\/([^/]+)\/\//)) return this.parseItalic(text);
    if (this.matchPattern(text, /^__([^_]+)__/)) return this.parseUnderline(text);
    if (this.matchPattern(text, /^~~([^~]+)~~/)) return this.parseStrikethrough(text);
    if (this.matchPattern(text, /^==([^=]+)==/)) return this.parseHighlight(text);
    if (this.matchPattern(text, /^`([^`]+)`/)) return this.parseCode(text);
    if (this.matchPattern(text, /^\[\[include\s+([^\]]+)]]/i)) return this.parseInclude(text);

    return null;
  }

  private matchPattern(text: string, pattern: RegExp): RegExpMatchArray | null {
    return text.match(pattern);
  }

  private parseLink(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^\[([^\]]+)]\(([^)]+)\)/);
    if (!match) return null;

    return {
      node: {
        type: 'Link',
        content: match[1],
        href: match[2],
      } as LinkNode,
      remaining: text.slice(match[0].length),
    };
  }

  private parseBold(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^\*\*([^*]+)\*\*/);
    if (!match) return null;

    return {
      node: { type: 'Bold', content: match[1] } as BoldNode,
      remaining: text.slice(match[0].length),
    };
  }

  private parseItalic(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^\/\/([^/]+)\/\//);
    if (!match) return null;

    return {
      node: { type: 'Italic', content: match[1] } as ItalicNode,
      remaining: text.slice(match[0].length),
    };
  }

  private parseUnderline(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^__([^_]+)__/);
    if (!match) return null;

    return {
      node: { type: 'Underline', content: match[1] } as UnderlineNode,
      remaining: text.slice(match[0].length),
    };
  }

  private parseStrikethrough(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^~~([^~]+)~~/);
    if (!match) return null;

    return {
      node: { type: 'Strikethrough', content: match[1] } as StrikethroughNode,
      remaining: text.slice(match[0].length),
    };
  }

  private parseHighlight(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^==([^=]+)==/);
    if (!match) return null;

    return {
      node: { type: 'Highlight', content: match[1] } as HighlightNode,
      remaining: text.slice(match[0].length),
    };
  }

  private parseCode(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^`([^`]+)`/);
    if (!match) return null;

    return {
      node: { type: 'Code', content: match[1] } as CodeNode,
      remaining: text.slice(match[0].length),
    };
  }

  private parseSuperscript(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^\^\{([^}]+)}/);
    if (!match) return null;

    return {
      node: { type: 'Superscript', content: match[1] } as SuperscriptNode,
      remaining: text.slice(match[0].length),
    };
  }

  private parseSubscript(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^_\{([^}]+)}/);
    if (!match) return null;

    return {
      node: { type: 'Subscript', content: match[1] } as SubscriptNode,
      remaining: text.slice(match[0].length),
    };
  }

  private parseInlineStyle(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^\|\|([^|]+)\|\|(\{[^}]+\})?/);
    if (!match) return null;

    const content = match[1];
    const attributesStr = match[2];
    const attributes = this.parseAttributes(attributesStr);

    return {
      node: { type: 'InlineStyle', content, attributes } as InlineStyleNode,
      remaining: text.slice(match[0].length),
    };
  }

  private parseAttributes(attrStr?: string): Attributes | undefined {
    if (!attrStr) return undefined;

    const attrs: Attributes = {};
    const content = attrStr.slice(1, -1);
    let remaining = content;

    while (remaining.length > 0) {
      remaining = remaining.trimStart();

      const quotedMatch = remaining.match(/^([a-zA-Z-]+)="([^"]*)"/);
      const quotedMatch2 = remaining.match(/^([a-zA-Z-]+)='([^']*)'/);

      if (quotedMatch) {
        const key = quotedMatch[1];
        const value = quotedMatch[2];
        this.setAttribute(attrs, key, value);
        remaining = remaining.slice(quotedMatch[0].length);
      } else if (quotedMatch2) {
        const key = quotedMatch2[1];
        const value = quotedMatch2[2];
        this.setAttribute(attrs, key, value);
        remaining = remaining.slice(quotedMatch2[0].length);
      } else {
        const keyValueMatch = remaining.match(/^([a-zA-Z-]+)=/);
        if (keyValueMatch) {
          const key = keyValueMatch[1];
          const afterKey = remaining.slice(keyValueMatch[0].length);
          let value = '';

          const nextKeyMatch = afterKey.match(/ [a-zA-Z-]+=/);
          if (nextKeyMatch) {
            value = afterKey.slice(0, nextKeyMatch.index);
          } else {
            value = afterKey;
          }

          this.setAttribute(attrs, key, value.trim());
          remaining = remaining.slice(key.length + 1 + value.length);
        } else {
          remaining = remaining.slice(1);
        }
      }
    }

    return Object.keys(attrs).length > 0 ? attrs : undefined;
  }

  private setAttribute(attrs: Attributes, key: string, value: string): void {
    if (key === 'visually-hidden' || key === 'sr-only') {
      attrs['aria-hidden'] = 'true';
      attrs['class'] =
        (attrs['class'] ? attrs['class'] + ' ' : '') + (key === 'sr-only' ? 'sr-only' : 'visually-hidden');
    } else {
      attrs[key] = value;
    }
  }

  private parseInclude(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^\[\[include\s+([^\]]+)]]/i);
    if (!match) return null;

    return {
      node: { type: 'Include', path: match[1] } as any,
      remaining: text.slice(match[0].length),
    };
  }

  private createTextNode(content: string): TextNode {
    return { type: 'Text', content };
  }
}
