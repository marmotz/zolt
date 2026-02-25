import {
  AbbreviationNode,
  ASTNode,
  Attributes,
  AudioNode,
  BoldNode,
  CodeNode,
  CommentInlineNode,
  EmbedNode,
  ExpressionNode,
  FileNode,
  FootnoteNode,
  HighlightNode,
  ImageNode,
  InlineStyleNode,
  ItalicNode,
  LinkNode,
  MathNode,
  StrikethroughNode,
  SubscriptNode,
  SuperscriptNode,
  TextNode,
  UnderlineNode,
  VariableNode,
  VideoNode,
} from './types';

export class InlineParser {
  private globalAbbreviations: Map<string, string> = new Map();
  private linkReferences: Map<string, string> = new Map();
  private footnoteIds: Set<string> = new Set();
  private onWarning?: (message: string, code: string) => void;

  setWarningCallback(callback: (message: string, code: string) => void): void {
    this.onWarning = callback;
  }

  setGlobalAbbreviations(abbreviations: Map<string, string>): void {
    this.globalAbbreviations = abbreviations;
  }

  setLinkReferences(references: Map<string, string>): void {
    this.linkReferences = references;
  }

  setFootnotes(footnotes: Set<string>): void {
    this.footnoteIds = footnotes;
  }

  parse(text: string): ASTNode[] {
    if (!text) {
      return [];
    }
    const nodes: ASTNode[] = [];
    let remaining = text;
    let lastChar = '';

    while (remaining.length > 0) {
      // Handle escaped characters
      if (remaining[0] === '\\' && remaining.length > 1) {
        const nextChar = remaining[1];
        if (nextChar === 'n') {
          nodes.push({ type: 'LineBreak' });
          remaining = remaining.slice(2);
          lastChar = '\n';
          continue;
        }
        const lastNode = nodes[nodes.length - 1];
        if (lastNode && lastNode.type === 'Text') {
          (lastNode as TextNode).content += nextChar;
        } else {
          nodes.push(this.createTextNode(nextChar));
        }
        remaining = remaining.slice(2);
        lastChar = nextChar;
        continue;
      }

      const result = this.parseInlineElement(remaining, lastChar);
      if (result) {
        nodes.push(result.node);
        const matchLength = remaining.length - result.remaining.length;
        const matchedText = remaining.slice(0, matchLength);
        remaining = result.remaining;
        lastChar = matchedText[matchedText.length - 1] || '';
      } else {
        const char = remaining[0];
        const lastNode = nodes[nodes.length - 1];
        if (lastNode && lastNode.type === 'Text') {
          (lastNode as TextNode).content += char;
        } else {
          nodes.push(this.createTextNode(char));
        }
        remaining = remaining.slice(1);
        lastChar = char;
      }
    }

    return this.applyAutoAbbreviations(nodes);
  }

  private applyAutoAbbreviations(nodes: ASTNode[]): ASTNode[] {
    if (this.globalAbbreviations.size === 0) {
      return nodes;
    }

    const result: ASTNode[] = [];
    const abbrs = Array.from(this.globalAbbreviations.keys());
    abbrs.sort((a, b) => b.length - a.length);
    const escapedAbbrs = abbrs.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(?<![\\w])(${escapedAbbrs.join('|')})(?![\\w])`, 'g');

    for (const node of nodes) {
      if (node.type === 'Text') {
        const text = (node as TextNode).content;
        let lastIndex = 0;
        let match;
        let hasMatches = false;

        while ((match = regex.exec(text)) !== null) {
          hasMatches = true;
          if (match.index > lastIndex) {
            result.push(this.createTextNode(text.slice(lastIndex, match.index)));
          }
          const abbreviation = match[1];
          const definition = this.globalAbbreviations.get(abbreviation)!;
          result.push({
            type: 'Abbreviation',
            abbreviation,
            definition,
          } as AbbreviationNode);
          lastIndex = regex.lastIndex;
        }

        if (hasMatches) {
          if (lastIndex < text.length) {
            result.push(this.createTextNode(text.slice(lastIndex)));
          }
        } else {
          result.push(node);
        }
      } else {
        result.push(node);
      }
    }

    return result;
  }

  private parseInlineElement(text: string, lastChar: string): { node: ASTNode; remaining: string } | null {
    if (this.matchPattern(text, /^\{\{(.+?)}}/)) {
      return this.parseExpression(text);
    }
    if (this.matchPattern(text, /^\{\$([a-zA-Z_][a-zA-Z0-9_]*[^}]*)?}/)) {
      return this.parseVariable(text);
    }
    if (this.matchPattern(text, /^%%/)) {
      return this.parseCommentInline(text);
    }
    if (this.matchPattern(text, /^!!\[([^\]]*)]\(([^)]+)\)/)) {
      return this.parseVideo(text);
    }
    if (this.matchPattern(text, /^\?\?\[([^\]]*)]\(([^)]+)\)/)) {
      return this.parseAudio(text);
    }
    if (this.matchPattern(text, /^@@\[([^\]]*)]\(([^)]+)\)/)) {
      return this.parseEmbed(text);
    }
    if (this.matchPattern(text, /^&&\[([^\]]*)]\(([^)]+)\)/)) {
      return this.parseFile(text);
    }
    if (this.matchPattern(text, /^!\[([^\]]*)]\(([^)]+)\)/)) {
      return this.parseImage(text);
    }
    if (this.matchPattern(text, /^\[([^\]]+)]\(([^)]+)\)/) || this.matchPattern(text, /^\[([^\]]+)]\[([^\]]*)]/)) {
      return this.parseLink(text);
    }
    if (this.matchPattern(text, /^\[\^?([^\]]+)]/)) {
      return this.parseFootnote(text);
    }
    if (this.matchPattern(text, /^\^\{([^}]+)}/)) {
      return this.parseSuperscript(text);
    }
    if (this.matchPattern(text, /^_\{([^}]+)}/)) {
      return this.parseSubscript(text);
    }
    if (this.matchPattern(text, /^\|\|([^|]+)\|\|/)) {
      return this.parseInlineStyle(text);
    }
    if (this.matchPattern(text, /^\*\*(.+?)\*\*/)) {
      return this.parseBold(text);
    }
    if (lastChar !== ':' && this.matchPattern(text, /^\/\/(.+?)\/\//)) {
      return this.parseItalic(text);
    }
    if (this.matchPattern(text, /^__(.+?)__/)) {
      return this.parseUnderline(text);
    }
    if (this.matchPattern(text, /^~~(.+?)~~/)) {
      return this.parseStrikethrough(text);
    }
    if (this.matchPattern(text, /^==(.+?)==/)) {
      return this.parseHighlight(text);
    }
    if (this.matchPattern(text, /^\$([^$]+)\$/)) {
      return this.parseMathInline(text);
    }
    if (this.matchPattern(text, /^`([^`]+)`/)) {
      return this.parseCode(text);
    }
    if (this.matchPattern(text, /^\[\[include\s+([^\]]+)]]/i)) {
      return this.parseInclude(text);
    }
    if (this.matchPattern(text, /^([A-Za-z0-9μ]+)\{abbr="([^"]+)"([^}]*)}/)) {
      return this.parseAbbreviation(text);
    }

    return null;
  }

  private matchPattern(text: string, pattern: RegExp): RegExpMatchArray | null {
    return text.match(pattern);
  }

  private parseLink(text: string): { node: ASTNode; remaining: string } | null {
    // Standard link [text](url)
    const standardMatch = this.matchPattern(text, /^\[([^\]]+)]\(([^)]+)\)/);
    if (standardMatch) {
      const content = standardMatch[1];
      const href = standardMatch[2];
      let remaining = text.slice(standardMatch[0].length);
      let attributes: Attributes | undefined;

      if (remaining.startsWith('{')) {
        const attrContent = this.extractBalancedBraces(remaining, 1);
        if (attrContent !== null) {
          attributes = this.parseAttributes(attrContent);
          remaining = remaining.slice(1 + attrContent.length + 1);
        }
      }

      return {
        node: {
          type: 'Link',
          children: this.parse(content),
          href,
          attributes,
        } as LinkNode,
        remaining,
      };
    }

    // Reference-style link [text][ref] or [ref][]
    const refMatch = this.matchPattern(text, /^\[([^\]]+)]\[([^\]]*)]/);
    if (refMatch) {
      const content = refMatch[1];
      const ref = refMatch[2] || content;
      const href = this.linkReferences.get(ref.toLowerCase()) || '';
      let remaining = text.slice(refMatch[0].length);
      let attributes: Attributes | undefined;

      if (remaining.startsWith('{')) {
        const attrContent = this.extractBalancedBraces(remaining, 1);
        if (attrContent !== null) {
          attributes = this.parseAttributes(attrContent);
          remaining = remaining.slice(1 + attrContent.length + 1);
        }
      }

      return {
        node: {
          type: 'Link',
          children: this.parse(content),
          href,
          attributes,
        } as LinkNode,
        remaining,
      };
    }

    return null;
  }

  private parseImage(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^!\[([^\]]*)]\(([^)]+)\)/);
    if (!match) {
      return null;
    }

    const alt = match[1];
    const src = match[2];
    let remaining = text.slice(match[0].length);
    let attributes: Attributes | undefined;

    if (remaining.startsWith('{')) {
      const attrContent = this.extractBalancedBraces(remaining, 1);
      if (attrContent !== null) {
        attributes = this.parseAttributes(attrContent);
        remaining = remaining.slice(1 + attrContent.length + 1);
      }
    }

    return {
      node: {
        type: 'Image',
        src,
        alt,
        attributes,
      } as ImageNode,
      remaining,
    };
  }

  private parseFootnote(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^\[(\^?)([^\]]+)]/);
    if (!match) {
      return null;
    }

    const hasCaret = match[1] === '^';
    const id = match[2];
    const fullMatch = match[0];
    const remainingAfterMatch = text.slice(fullMatch.length);

    // If it's [label](url), [label][ref], or [label]{attrs}, it's likely a link, not a footnote.
    // EXCEPT if it starts with ^, then it's definitely a footnote.
    if (!hasCaret) {
      if (
        remainingAfterMatch.startsWith('(') ||
        remainingAfterMatch.startsWith('[') ||
        remainingAfterMatch.startsWith('{')
      ) {
        return null;
      }
      // If it doesn't have a caret, it MUST be a known footnote ID
      if (!this.footnoteIds.has(id)) {
        return null;
      }
    }

    let remaining = text.slice(fullMatch.length);
    let attributes: Attributes | undefined;

    if (remaining.startsWith('{')) {
      const attrContent = this.extractBalancedBraces(remaining, 1);
      if (attrContent !== null) {
        attributes = this.parseAttributes(attrContent);
        remaining = remaining.slice(1 + attrContent.length + 1);
      }
    }

    return {
      node: {
        type: 'Footnote',
        id,
        attributes,
      } as FootnoteNode,
      remaining,
    };
  }

  private parseVideo(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^!!\[([^\]]*)]\(([^)]+)\)/);
    if (!match) {
      return null;
    }

    const alt = match[1];
    const src = match[2];
    let remaining = text.slice(match[0].length);
    let attributes: Attributes | undefined;

    if (remaining.startsWith('{')) {
      const attrContent = this.extractBalancedBraces(remaining, 1);
      if (attrContent !== null) {
        attributes = this.parseAttributes(attrContent);
        remaining = remaining.slice(1 + attrContent.length + 1);
      }
    }

    return {
      node: {
        type: 'Video',
        src,
        alt,
        attributes,
      } as VideoNode,
      remaining,
    };
  }

  private parseAudio(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^\?\?\[([^\]]*)]\(([^)]+)\)/);
    if (!match) {
      return null;
    }

    const alt = match[1];
    const src = match[2];
    let remaining = text.slice(match[0].length);
    let attributes: Attributes | undefined;

    if (remaining.startsWith('{')) {
      const attrContent = this.extractBalancedBraces(remaining, 1);
      if (attrContent !== null) {
        attributes = this.parseAttributes(attrContent);
        remaining = remaining.slice(1 + attrContent.length + 1);
      }
    }

    return {
      node: {
        type: 'Audio',
        src,
        alt,
        attributes,
      } as AudioNode,
      remaining,
    };
  }

  private parseEmbed(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^@@\[([^\]]*)]\(([^)]+)\)/);
    if (!match) {
      return null;
    }

    const title = match[1];
    const src = match[2];
    let remaining = text.slice(match[0].length);
    let attributes: Attributes | undefined;

    if (remaining.startsWith('{')) {
      const attrContent = this.extractBalancedBraces(remaining, 1);
      if (attrContent !== null) {
        attributes = this.parseAttributes(attrContent);
        remaining = remaining.slice(1 + attrContent.length + 1);
      }
    }

    return {
      node: {
        type: 'Embed',
        src,
        title,
        attributes,
      } as EmbedNode,
      remaining,
    };
  }

  private parseFile(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^&&\[([^\]]*)]\(([^)]+)\)/);
    if (!match) {
      return null;
    }

    const title = match[1];
    const src = match[2];
    let remaining = text.slice(match[0].length);
    let attributes: Attributes | undefined;

    if (remaining.startsWith('{')) {
      const attrContent = this.extractBalancedBraces(remaining, 1);
      if (attrContent !== null) {
        attributes = this.parseAttributes(attrContent);
        remaining = remaining.slice(1 + attrContent.length + 1);
      }
    }

    return {
      node: {
        type: 'File',
        src,
        title,
        attributes,
      } as FileNode,
      remaining,
    };
  }

  private parseBold(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^\*\*(.+?)\*\*/);
    if (!match) {
      return null;
    }

    const content = match[1];
    let remaining = text.slice(match[0].length);
    let attributes: Attributes | undefined;

    if (remaining.startsWith('{')) {
      const attrContent = this.extractBalancedBraces(remaining, 1);
      if (attrContent !== null) {
        attributes = this.parseAttributes(attrContent);
        remaining = remaining.slice(1 + attrContent.length + 1);
      }
    }

    return {
      node: { type: 'Bold', children: this.parse(content), attributes } as BoldNode,
      remaining,
    };
  }

  private parseItalic(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^\/\/(.+?)\/\//);
    if (!match) {
      return null;
    }

    const content = match[1];
    let remaining = text.slice(match[0].length);
    let attributes: Attributes | undefined;

    if (remaining.startsWith('{')) {
      const attrContent = this.extractBalancedBraces(remaining, 1);
      if (attrContent !== null) {
        attributes = this.parseAttributes(attrContent);
        remaining = remaining.slice(1 + attrContent.length + 1);
      }
    }

    return {
      node: { type: 'Italic', children: this.parse(content), attributes } as ItalicNode,
      remaining,
    };
  }

  private parseUnderline(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^__(.+?)__/);
    if (!match) {
      return null;
    }

    const content = match[1];
    let remaining = text.slice(match[0].length);
    let attributes: Attributes | undefined;

    if (remaining.startsWith('{')) {
      const attrContent = this.extractBalancedBraces(remaining, 1);
      if (attrContent !== null) {
        attributes = this.parseAttributes(attrContent);
        remaining = remaining.slice(1 + attrContent.length + 1);
      }
    }

    return {
      node: { type: 'Underline', children: this.parse(content), attributes } as UnderlineNode,
      remaining,
    };
  }

  private parseStrikethrough(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^~~(.+?)~~/);
    if (!match) {
      return null;
    }

    const content = match[1];
    let remaining = text.slice(match[0].length);
    let attributes: Attributes | undefined;

    if (remaining.startsWith('{')) {
      const attrContent = this.extractBalancedBraces(remaining, 1);
      if (attrContent !== null) {
        attributes = this.parseAttributes(attrContent);
        remaining = remaining.slice(1 + attrContent.length + 1);
      }
    }

    return {
      node: { type: 'Strikethrough', children: this.parse(content), attributes } as StrikethroughNode,
      remaining,
    };
  }

  private parseHighlight(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^==(.+?)==/);
    if (!match) {
      return null;
    }

    const content = match[1];
    let remaining = text.slice(match[0].length);
    let attributes: Attributes | undefined;

    if (remaining.startsWith('{')) {
      const attrContent = this.extractBalancedBraces(remaining, 1);
      if (attrContent !== null) {
        attributes = this.parseAttributes(attrContent);
        remaining = remaining.slice(1 + attrContent.length + 1);
      }
    }

    return {
      node: { type: 'Highlight', children: this.parse(content), attributes } as HighlightNode,
      remaining,
    };
  }

  private parseMathInline(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^\$([^$]+)\$/);
    if (!match) {
      return null;
    }

    const content = match[1];
    let remaining = text.slice(match[0].length);
    let attributes: Attributes | undefined;

    if (remaining.startsWith('{')) {
      const attrContent = this.extractBalancedBraces(remaining, 1);
      if (attrContent !== null) {
        attributes = this.parseAttributes(attrContent);
        remaining = remaining.slice(1 + attrContent.length + 1);
      }
    }

    return {
      node: { type: 'Math', content, isBlock: false, attributes } as MathNode,
      remaining,
    };
  }

  private parseCode(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^`([^`]+)`/);
    if (!match) {
      return null;
    }

    const content = match[1];
    let remaining = text.slice(match[0].length);
    let attributes: Attributes | undefined;

    if (remaining.startsWith('{')) {
      const attrContent = this.extractBalancedBraces(remaining, 1);
      if (attrContent !== null) {
        attributes = this.parseAttributes(attrContent);
        remaining = remaining.slice(1 + attrContent.length + 1);
      }
    }

    return {
      node: { type: 'Code', content, attributes } as CodeNode,
      remaining,
    };
  }

  private parseSuperscript(text: string): { node: ASTNode; remaining: string } | null {
    if (!text.startsWith('^{')) {
      return null;
    }

    const content = this.extractBalancedBraces(text, 2);
    if (content === null) {
      return null;
    }

    let remaining = text.slice(2 + content.length + 1);
    let attributes: Attributes | undefined;

    if (remaining.startsWith('{')) {
      const attrContent = this.extractBalancedBraces(remaining, 1);
      if (attrContent !== null) {
        attributes = this.parseAttributes(attrContent);
        remaining = remaining.slice(1 + attrContent.length + 1);
      }
    }

    return {
      node: { type: 'Superscript', children: this.parse(content), attributes } as SuperscriptNode,
      remaining,
    };
  }

  private parseSubscript(text: string): { node: ASTNode; remaining: string } | null {
    if (!text.startsWith('_{')) {
      return null;
    }

    const content = this.extractBalancedBraces(text, 2);
    if (content === null) {
      return null;
    }

    let remaining = text.slice(2 + content.length + 1);
    let attributes: Attributes | undefined;

    if (remaining.startsWith('{')) {
      const attrContent = this.extractBalancedBraces(remaining, 1);
      if (attrContent !== null) {
        attributes = this.parseAttributes(attrContent);
        remaining = remaining.slice(1 + attrContent.length + 1);
      }
    }

    return {
      node: { type: 'Subscript', children: this.parse(content), attributes } as SubscriptNode,
      remaining,
    };
  }

  private extractBalancedBraces(text: string, startIndex: number): string | null {
    if (startIndex >= text.length || text[startIndex - 1] !== '{') {
      return null;
    }

    let depth = 1;
    let i = startIndex;

    while (i < text.length && depth > 0) {
      const char = text[i];
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
      }
      i++;
    }

    if (depth !== 0) {
      return null;
    }

    return text.slice(startIndex, i - 1);
  }

  private parseInlineStyle(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^\|\|([^|]+)\|\|/);
    if (!match) {
      return null;
    }

    const content = match[1];
    let remaining = text.slice(match[0].length);
    let attributes: Attributes | undefined;

    if (remaining.startsWith('{')) {
      const attrContent = this.extractBalancedBraces(remaining, 1);
      if (attrContent !== null) {
        attributes = this.parseAttributes(attrContent);
        remaining = remaining.slice(1 + attrContent.length + 1);
      }
    }

    return {
      node: { type: 'InlineStyle', children: this.parse(content), attributes } as InlineStyleNode,
      remaining,
    };
  }

  public static parseAttributes(
    attrStr?: string,
    onWarning?: (message: string, code: string) => void
  ): Attributes | undefined {
    if (!attrStr) {
      return undefined;
    }

    const attrs: Attributes = {};
    let remaining = attrStr.startsWith('{') && attrStr.endsWith('}') ? attrStr.slice(1, -1) : attrStr;

    while (remaining.length > 0) {
      remaining = remaining.trimStart();
      // Handle leading commas or spaces
      if (remaining.startsWith(',')) {
        remaining = remaining.slice(1).trimStart();
      }
      if (remaining.length === 0) break;

      const startLen = remaining.length;

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

          // Look for next attribute separator (space or comma) followed by a key, shortcut or boolean
          const nextKeyMatch = afterKey.match(/[ ,]([a-zA-Z-]+=|#|\.)/);
          if (nextKeyMatch) {
            value = afterKey.slice(0, nextKeyMatch.index);
          } else {
            value = afterKey;
          }

          // Trim and remove trailing comma if present
          this.setAttribute(attrs, key, value.trim().replace(/,$/, ''));
          remaining = remaining.slice(keyValueMatch[0].length + value.length);
        } else {
          // Handle shortcuts like .class or #id, or boolean attributes
          const shortcutMatch = remaining.match(/^([.#][a-zA-Z0-9_-]+)/);
          const booleanMatch = remaining.match(/^([a-zA-Z-]+)/);
          if (shortcutMatch) {
            const val = shortcutMatch[1];
            if (val.startsWith('.')) {
              const className = val.slice(1);
              attrs['class'] = (attrs['class'] ? attrs['class'] + ' ' : '') + className;
            } else {
              attrs['id'] = val.slice(1);
            }
            remaining = remaining.slice(val.length);
          } else if (booleanMatch) {
            const key = booleanMatch[1];
            this.setAttribute(attrs, key, '');
            remaining = remaining.slice(key.length);
          } else {
            if (onWarning) {
              onWarning(`Invalid attribute syntax near: "${remaining.slice(0, 10)}..."`, 'INVALID_ATTRIBUTE_SYNTAX');
            }
            remaining = remaining.slice(1);
          }
        }
      }

      // Safety to prevent infinite loops if no progress is made
      if (remaining.length === startLen) {
        if (onWarning) {
          onWarning(`Stuck parsing attributes at: "${remaining.slice(0, 10)}..."`, 'ATTRIBUTE_PARSER_STUCK');
        }
        remaining = remaining.slice(1);
      }
    }

    return Object.keys(attrs).length > 0 ? attrs : undefined;
  }

  private static setAttribute(attrs: Attributes, key: string, value: string): void {
    if (key === 'visually-hidden' || key === 'sr-only') {
      attrs['aria-hidden'] = 'true';
      attrs['class'] =
        (attrs['class'] ? attrs['class'] + ' ' : '') + (key === 'sr-only' ? 'sr-only' : 'visually-hidden');
    } else {
      attrs[key] = value;
    }
  }

  public parseAttributes(attrStr?: string): Attributes | undefined {
    return InlineParser.parseAttributes(attrStr, this.onWarning);
  }

  private setAttribute(attrs: Attributes, key: string, value: string): void {
    InlineParser.setAttribute(attrs, key, value);
  }

  private parseInclude(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^\[\[include\s+([^\]]+)]]/i);
    if (!match) {
      return null;
    }

    return {
      node: { type: 'Include', path: match[1] } as any,
      remaining: text.slice(match[0].length),
    };
  }

  private parseAbbreviation(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^([A-Za-z0-9μ]+)\{abbr="([^"]+)"([^}]*)}/);
    if (!match) {
      return null;
    }

    const abbreviation = match[1];
    const definition = match[2];
    const attributesStr = match[3];
    const attributes = attributesStr ? this.parseAbbreviationAttributes(attributesStr) : undefined;

    return {
      node: { type: 'Abbreviation', abbreviation, definition, attributes } as AbbreviationNode,
      remaining: text.slice(match[0].length),
    };
  }

  private parseAbbreviationAttributes(attrStr: string): Attributes | undefined {
    const attrs: Attributes = {};
    let remaining = attrStr.trim();

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

          const nextKeyMatch = afterKey.match(/ ([a-zA-Z-]+=|#|\.)/);
          if (nextKeyMatch) {
            value = afterKey.slice(0, nextKeyMatch.index);
          } else {
            value = afterKey;
          }

          this.setAttribute(attrs, key, value.trim());
          remaining = remaining.slice(key.length + 1 + value.length);
        } else {
          // Handle boolean attributes
          const booleanMatch = remaining.match(/^([a-zA-Z-]+)/);
          if (booleanMatch) {
            const key = booleanMatch[1];
            this.setAttribute(attrs, key, '');
            remaining = remaining.slice(key.length);
          } else {
            remaining = remaining.slice(1);
          }
        }
      }
    }

    return Object.keys(attrs).length > 0 ? attrs : undefined;
  }

  private parseExpression(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^\{\{(.+?)}}/);
    if (!match) {
      return null;
    }

    return {
      node: { type: 'Expression', expression: match[1] } as ExpressionNode,
      remaining: text.slice(match[0].length),
    };
  }

  private parseVariable(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^\{\$([a-zA-Z_][a-zA-Z0-9_]*[^}]*)?}/);
    if (!match) {
      return null;
    }

    return {
      node: { type: 'Variable', name: match[1], isGlobal: true } as VariableNode,
      remaining: text.slice(match[0].length),
    };
  }

  private createTextNode(content: string): TextNode {
    return { type: 'Text', content };
  }

  private parseCommentInline(text: string): { node: ASTNode; remaining: string } | null {
    const match = this.matchPattern(text, /^%%/);
    if (!match) {
      return null;
    }

    let content = '';
    let i = 2;

    while (i < text.length) {
      if (text[i] === '%' && i + 1 < text.length && text[i + 1] === '%') {
        i += 2;
        break;
      }
      content += text[i];
      i++;
    }

    return {
      node: { type: 'CommentInline', content } as CommentInlineNode,
      remaining: text.slice(i),
    };
  }
}
