import { Token, TokenType } from '../lexer/token-types';
import { ParseError } from './errors/parse-error';
import { InlineParser } from './inline-parser';
import {
  AbbreviationDefinitionNode,
  ASTNode,
  Attributes,
  BlockquoteNode,
  CodeBlockNode,
  CommentInlineNode,
  DefinitionDescriptionNode,
  DefinitionTermNode,
  DocumentNode,
  FrontmatterNode,
  HeadingNode,
  HorizontalRuleNode,
  IndentationNode,
  LinkReferenceDefinitionNode,
  ListItemNode,
  ListNode,
  ParagraphNode,
  TableCellNode,
  TableNode,
  TableRowNode,
} from './types';

export class Parser {
  private tokens: Token[];
  private pos: number;
  private currentToken: Token;
  private filePath: string;
  private abbreviationDefinitions: Map<string, string>;
  private linkReferences: Map<string, string>;
  public static globalAbbreviations: Map<string, string> = new Map();
  private inlineParser: InlineParser;

  constructor(tokens: Token[], filePath?: string) {
    this.tokens = tokens;
    this.pos = 0;
    this.currentToken = tokens[0];
    this.filePath = filePath || 'unknown';
    this.abbreviationDefinitions = new Map();
    this.linkReferences = new Map();
    this.inlineParser = new InlineParser();
  }

  static clearGlobalAbbreviations(): void {
    this.globalAbbreviations.clear();
  }

  parse(): DocumentNode {
    // Pass 1: Collect abbreviations and link references
    this.collectDefinitions();
    this.pos = 0;
    this.currentToken = this.tokens[0];

    const allAbbreviations = new Map<string, string>([
      ...Parser.globalAbbreviations.entries(),
      ...this.abbreviationDefinitions.entries(),
    ]);
    this.inlineParser.setGlobalAbbreviations(allAbbreviations);
    this.inlineParser.setLinkReferences(this.linkReferences);

    // Pass 2: Full parse
    const children = this.parseDocument();
    return {
      type: 'Document',
      children,
      sourceFile: this.filePath,
    };
  }

  private collectDefinitions(): void {
    const savedPos = this.pos;
    const savedToken = this.currentToken;

    while (!this.match(TokenType.EOF)) {
      if (this.match(TokenType.ABBREVIATION_DEF, TokenType.ABBREVIATION_DEF_GLOBAL)) {
        const token = this.currentToken;
        const value = token.value;
        const colonIndex = value.indexOf(':');
        if (colonIndex !== -1) {
          const abbreviation = value.substring(0, colonIndex);
          const definition = value.substring(colonIndex + 1);

          if (token.type === TokenType.ABBREVIATION_DEF_GLOBAL) {
            if (!Parser.globalAbbreviations.has(abbreviation)) {
              Parser.globalAbbreviations.set(abbreviation, definition);
            }
          } else {
            if (!this.abbreviationDefinitions.has(abbreviation)) {
              this.abbreviationDefinitions.set(abbreviation, definition);
            }
          }
        }
        this.advance();
      } else if (this.match(TokenType.LINK_REF_DEF)) {
        const token = this.currentToken;
        const value = token.value;
        const colonIndex = value.indexOf(':');
        if (colonIndex !== -1) {
          const ref = value.substring(0, colonIndex);
          const url = value.substring(colonIndex + 1);
          if (!this.linkReferences.has(ref.toLowerCase())) {
            this.linkReferences.set(ref.toLowerCase(), url);
          }
        }
        this.advance();
      } else {
        const token = this.currentToken;
        if (
          token.type === TokenType.TEXT ||
          token.type === TokenType.HEADING ||
          token.type === TokenType.BULLET_LIST ||
          token.type === TokenType.ORDERED_LIST ||
          token.type === TokenType.TASK_LIST ||
          token.type === TokenType.DEFINITION
        ) {
          const value = token.value;
          const regex = /([A-Za-z0-9μ]+)\{abbr="([^"]+)"[^}]*}/g;
          let match;
          while ((match = regex.exec(value)) !== null) {
            const abbreviation = match[1];
            const definition = match[2];
            if (!this.abbreviationDefinitions.has(abbreviation)) {
              this.abbreviationDefinitions.set(abbreviation, definition);
            }
          }
        }
        this.advance();
      }
    }

    this.pos = savedPos;
    this.currentToken = savedToken;
  }

  private parseDocument(): ASTNode[] {
    const children: ASTNode[] = [];

    if (this.match(TokenType.FRONTMATTER)) {
      children.push(this.parseFrontmatter());
    }

    while (!this.match(TokenType.EOF)) {
      const startPos = this.pos;
      this.skipNewlines();

      if (this.isEof()) break;

      const block = this.parseBlock();
      if (block) {
        children.push(block);
      }

      if (this.pos === startPos) {
        this.error(`Parser stuck at token ${this.currentToken.type}`, 'PARSER_STUCK');
      }
    }

    return children;
  }

  private parseBlock(): ASTNode | null {
    if (this.match(TokenType.HEADING)) return this.parseHeading();
    if (this.match(TokenType.CODE_BLOCK_START)) return this.parseCodeBlock();
    if (this.match(TokenType.BLOCKQUOTE)) return this.parseBlockquote();
    if (this.match(TokenType.TECHNICAL_INDENT)) return this.parseTechnicalIndentation();
    if (this.match(TokenType.TRIPLE_COLON_START)) return this.parseTripleColonBlock();
    if (this.match(TokenType.TRIPLE_COLON_END)) {
      this.advance();
      return {
        type: 'Paragraph',
        children: [
          {
            type: 'Text',
            content: ':::',
          },
        ],
      };
    }
    if (this.match(TokenType.DOUBLE_BRACKET_START)) return this.parseDoubleBracketBlock();
    if (this.match(TokenType.HORIZONTAL_RULE)) return this.parseHorizontalRule();

    if (this.match(TokenType.INDENTATION)) {
      const next = this.peek(1);
      if (
        next.type === TokenType.BULLET_LIST ||
        next.type === TokenType.ORDERED_LIST ||
        next.type === TokenType.TASK_LIST ||
        next.type === TokenType.DEFINITION
      ) {
        return this.parseList(this.currentToken.value);
      }
    }

    if (this.match(TokenType.BULLET_LIST, TokenType.ORDERED_LIST, TokenType.TASK_LIST, TokenType.DEFINITION)) {
      return this.parseList();
    }
    if (this.match(TokenType.INDENTATION)) return this.parseIndentation();
    if (this.match(TokenType.ABBREVIATION_DEF)) return this.parseAbbreviationDef();
    if (this.match(TokenType.ABBREVIATION_DEF_GLOBAL)) return this.parseAbbreviationDef();
    if (this.match(TokenType.LINK_REF_DEF)) return this.parseLinkReferenceDef();
    if (this.match(TokenType.COMMENT_INLINE)) return this.parseCommentInline();

    if (this.match(TokenType.CODE_BLOCK, TokenType.CODE_BLOCK_END)) {
      const token = this.advance();
      return {
        type: 'Paragraph',
        children: [{ type: 'Text', content: token.value }],
      };
    }

    if (this.isTableStart()) return this.parseTable();

    return this.parseParagraph();
  }

  private isTableStart(): boolean {
    const token = this.currentToken;
    if (token.type !== TokenType.TEXT) return false;
    const value = token.value.trim();
    return value.startsWith('|') && !value.startsWith('||');
  }

  private parseTable(): TableNode {
    const rows: TableRowNode[] = [];
    let header: TableRowNode | undefined;
    let alignments: ('left' | 'center' | 'right' | undefined)[] = [];

    while (this.isTableStart()) {
      const { row, rawCells } = this.parseTableRow();

      // Check if this is a separator row (e.g., |---|---|)
      if (this.isSeparatorRow(rawCells)) {
        if (rows.length > 0 && !header) {
          header = rows.pop();
          alignments = this.parseAlignments(rawCells);
        }
      } else {
        rows.push(row);
      }

      this.skipNewlines();
      if (this.isEof()) break;
    }

    // Apply alignments to header and all rows
    if (alignments.length > 0) {
      if (header) {
        header.cells.forEach((cell, i) => {
          if (alignments[i]) cell.alignment = alignments[i];
        });
      }
      for (const row of rows) {
        row.cells.forEach((cell, i) => {
          if (alignments[i]) cell.alignment = alignments[i];
        });
      }
    }

    return {
      type: 'Table',
      header,
      rows,
    };
  }

  private parseTableRow(): { row: TableRowNode; rawCells: string[] } {
    const token = this.expect(TokenType.TEXT);
    const line = token.value.trim();

    // Remove leading and trailing pipes
    const content = line.replace(/^\|/, '').replace(/\|$/, '');
    const cellContents = content.split('|');
    const rawCells = cellContents.map((c) => c.trim());

    const cells: TableCellNode[] = rawCells.map((cell) => ({
      type: 'TableCell',
      children: this.inlineParser.parse(cell),
    }));

    return {
      row: {
        type: 'TableRow',
        cells,
      },
      rawCells,
    };
  }

  private isSeparatorRow(rawCells: string[]): boolean {
    return rawCells.length > 0 && rawCells.every((cell) => /^[ \t]*:?-+:?[ \t]*$/.test(cell));
  }

  private parseAlignments(rawCells: string[]): ('left' | 'center' | 'right' | undefined)[] {
    return rawCells.map((cell) => {
      const trimmed = cell.trim();
      const startsWithColon = trimmed.startsWith(':');
      const endsWithColon = trimmed.endsWith(':');

      if (startsWithColon && endsWithColon) return 'center';
      if (endsWithColon) return 'right';
      if (startsWithColon) return 'left';
      return undefined;
    });
  }

  private parseHeading(): HeadingNode {
    const token = this.expect(TokenType.HEADING);
    const level = token.level || 1;
    let content = token.value.trim();

    // Extract attributes at the end of content
    // IMPORTANT: Do NOT treat {$...} (variable references) or {{...}} (expressions) as attributes
    let attributes: Attributes | undefined;
    const attrMatch = content.match(/\s+\{([^}]+)}$/);
    if (attrMatch) {
      const attrContent = attrMatch[1];
      // Skip if this looks like a variable reference {$...} or expression {{...}}
      if (!attrContent.startsWith('$') && !attrContent.startsWith('{')) {
        attributes = InlineParser.parseAttributes(attrContent);
        content = content.slice(0, -attrMatch[0].length).trim();
      }
    }

    return {
      type: 'Heading',
      level,
      children: this.inlineParser.parse(content),
      attributes,
    };
  }

  private parseCommentInline(): CommentInlineNode {
    const token = this.expect(TokenType.COMMENT_INLINE);
    return {
      type: 'CommentInline',
      content: token.value,
    };
  }

  private parseParagraph(requireSpaceBeforeAttrs: boolean = true): ParagraphNode {
    let content = '';

    while (!this.match(TokenType.EOF) && !this.match(TokenType.NEWLINE) && !this.isNewBlockStart()) {
      content += this.advance().value;
    }

    content = content.trim();

    // Check if this is a variable definition
    // Variable definitions like $var = value or $var = {key: value} should NOT have attributes extracted
    const isVariableDef = /^\$+\w+\s*=/.test(content);

    // Extract attributes at the end of content
    // In blockquotes, allow attributes without preceding space
    // In regular paragraphs, require space to avoid stealing attributes from inline elements
    // IMPORTANT: Do NOT treat {$...} (variable references) or {{...}} (expressions) as attributes
    // Also skip if this is a variable definition
    let attributes: Attributes | undefined;
    if (!isVariableDef) {
      const pattern = requireSpaceBeforeAttrs ? /\s+\{([^}]+)}$/ : /\s*\{([^}]+)}$/;
      const attrMatch = content.match(pattern);
      if (attrMatch) {
        const attrContent = attrMatch[1];
        // Skip if this looks like a variable reference {$...} or expression {{...}}
        if (!attrContent.startsWith('$') && !attrContent.startsWith('{')) {
          attributes = InlineParser.parseAttributes(attrContent);
          content = content.slice(0, -attrMatch[0].length).trim();
        }
      }
    }

    return {
      type: 'Paragraph',
      children: this.inlineParser.parse(content),
      attributes,
    };
  }

  private parseBlockquote(): BlockquoteNode {
    const startToken = this.expect(TokenType.BLOCKQUOTE);
    const baseLevel = startToken.level || 1;

    const children: ASTNode[] = [];

    const firstLineContent = this.parseBlockquoteLineContent();
    if (firstLineContent) {
      children.push(firstLineContent);
    }

    while (!this.isEof()) {
      if (this.match(TokenType.BLOCKQUOTE)) {
        const nextLevel = this.currentToken.level || 1;

        if (nextLevel < baseLevel) {
          break;
        }

        if (nextLevel > baseLevel) {
          const nested = this.parseBlockquote();
          children.push(nested);
          continue;
        }

        this.advance();
        const lineContent = this.parseBlockquoteLineContent();
        if (lineContent) {
          children.push(lineContent);
        }
        continue;
      }

      if (!this.match(TokenType.NEWLINE)) {
        break;
      }
      this.advance();

      if (this.match(TokenType.NEWLINE)) {
        break;
      }
    }

    return {
      type: 'Blockquote',
      level: baseLevel,
      children,
    };
  }

  private parseBlockquoteLineContent(): ASTNode | null {
    if (this.match(TokenType.BLOCKQUOTE, TokenType.NEWLINE, TokenType.EOF)) {
      return null;
    }

    if (this.match(TokenType.HEADING)) return this.parseHeading();
    if (this.match(TokenType.CODE_BLOCK_START)) return this.parseCodeBlock();
    if (this.match(TokenType.HORIZONTAL_RULE)) return this.parseHorizontalRule();
    if (this.match(TokenType.TRIPLE_COLON_START)) return this.parseTripleColonBlock();

    if (this.match(TokenType.BULLET_LIST, TokenType.ORDERED_LIST, TokenType.TASK_LIST)) {
      return this.parseBlockquoteList();
    }

    return this.parseParagraph(false);
  }

  private parseBlockquoteList(): ListNode {
    const kind = this.getListKind(this.currentToken.type);
    const children: (ListItemNode | DefinitionTermNode | DefinitionDescriptionNode)[] = [];

    while (!this.isEof()) {
      if (!this.match(TokenType.BULLET_LIST, TokenType.ORDERED_LIST, TokenType.TASK_LIST)) {
        break;
      }

      if (this.getListKind(this.currentToken.type) !== kind) {
        break;
      }

      const item = this.parseListItem(kind, '');
      children.push(item);
      this.skipNewlines();

      if (this.match(TokenType.BLOCKQUOTE)) {
        const nextLevel = this.currentToken.level || 1;
        if (nextLevel !== 1) {
          break;
        }
        const peekedNext = this.peek(1);
        if (
          peekedNext.type !== TokenType.BULLET_LIST &&
          peekedNext.type !== TokenType.ORDERED_LIST &&
          peekedNext.type !== TokenType.TASK_LIST
        ) {
          break;
        }
        if (this.getListKind(peekedNext.type) !== kind) {
          break;
        }
        this.advance();
      }
    }

    return {
      type: 'List',
      kind,
      children,
    };
  }

  private parseList(indent: string = ''): ListNode {
    const firstToken = indent !== '' ? this.peek(1) : this.currentToken;
    const kind = this.getListKind(firstToken.type);
    const children: (ListItemNode | DefinitionTermNode | DefinitionDescriptionNode)[] = [];

    while (!this.isEof()) {
      if (indent !== '') {
        if (!this.match(TokenType.INDENTATION) || this.currentToken.value !== indent) {
          break;
        }
        const next = this.peek(1);
        if (this.getListKind(next.type) !== kind) {
          break;
        }
        this.advance(); // consume indentation
      } else {
        if (!this.match(TokenType.BULLET_LIST, TokenType.ORDERED_LIST, TokenType.TASK_LIST, TokenType.DEFINITION)) {
          break;
        }
        if (this.getListKind(this.currentToken.type) !== kind) {
          break;
        }
      }

      const item = this.parseListItem(kind, indent);
      children.push(item);
      this.skipNewlines();
    }

    return {
      type: 'List',
      kind,
      children,
    };
  }

  private getListKind(type: TokenType): 'bullet' | 'numbered' | 'task' | 'definition' {
    switch (type) {
      case TokenType.BULLET_LIST:
        return 'bullet';
      case TokenType.ORDERED_LIST:
        return 'numbered';
      case TokenType.TASK_LIST:
        return 'task';
      case TokenType.DEFINITION:
        return 'definition';
      default:
        return 'bullet';
    }
  }

  private parseListItem(
    kind: string,
    currentIndent: string
  ): ListItemNode | DefinitionTermNode | DefinitionDescriptionNode {
    let checked: boolean | undefined;
    let content = '';
    let isDescription = false;

    if (this.match(TokenType.TASK_LIST)) {
      const token = this.advance();
      checked = /\[x]/i.test(token.value);
      content = token.value.replace(/^([-*]\s+)?\[[ x]]\s+/i, '');
    } else if (this.match(TokenType.BULLET_LIST)) {
      const token = this.advance();
      content = token.value.replace(/^[-*]\s+/, '');
    } else if (this.match(TokenType.ORDERED_LIST)) {
      const token = this.advance();
      content = token.value.replace(/^\d+\.\s+/, '');
    } else if (this.match(TokenType.DEFINITION)) {
      const token = this.advance();
      const value = token.value.replace(/^:\s/, '');
      isDescription = value.startsWith('  ');
      content = value.trim();
    }

    // Extract attributes at the end of content
    let attributes: Attributes | undefined;
    const attrMatch = content.match(/\s+\{([^}]+)}$/);
    if (attrMatch) {
      const attrContent = attrMatch[1];
      // Skip if this looks like a variable reference {$...} or expression {{...}}
      if (!attrContent.startsWith('$') && !attrContent.startsWith('{')) {
        attributes = InlineParser.parseAttributes(attrContent);
        content = content.slice(0, -attrMatch[0].length).trim();
      }
    }

    this.skipNewlines();

    const children: ASTNode[] = [];

    // Check for nested blocks (indented more than currentIndent)
    while (
      !this.isEof() &&
      this.match(TokenType.INDENTATION) &&
      this.currentToken.value.length > currentIndent.length
    ) {
      const block = this.parseBlock();
      if (block) {
        children.push(block);
      }
      this.skipNewlines();
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

  private parseCodeBlock(): CodeBlockNode {
    const startToken = this.expect(TokenType.CODE_BLOCK_START);
    let value = startToken.value;

    // Extract attributes
    let attributes: Attributes | undefined;
    const attrMatch = value.match(/\s+\{([^}]+)}$/);
    let language = value;
    if (attrMatch) {
      const attrContent = attrMatch[1];
      // Skip if this looks like a variable reference {$...} or expression {{...}}
      if (!attrContent.startsWith('$') && !attrContent.startsWith('{')) {
        attributes = InlineParser.parseAttributes(attrContent);
        language = value.replace(/\s+\{([^}]+)}$/, '').trim();
      }
    }

    let content = '';
    while (!this.isEof() && !this.match(TokenType.CODE_BLOCK_END)) {
      const token = this.advance();
      if (token.type === TokenType.CODE_BLOCK) {
        content += token.value + '\n';
      } else if (token.type === TokenType.NEWLINE) {
        // Handled by lexer producing CODE_BLOCK tokens for each line including newline
        // Wait, readCodeBlockContent advances \n but doesn't include it in value.
        // So I should add \n.
      }
    }

    if (this.match(TokenType.CODE_BLOCK_END)) {
      this.advance();
    }

    // Remove last newline if present
    if (content.endsWith('\n')) {
      content = content.slice(0, -1);
    }

    return {
      type: 'CodeBlock',
      language: language || undefined,
      content,
      attributes,
    };
  }

  private parseTripleColonBlock(): ASTNode {
    const startToken = this.expect(TokenType.TRIPLE_COLON_START);
    const value = startToken.value;

    // Extract attributes
    let attributes: Attributes | undefined;
    const attrMatch = value.match(/\s+\{([^}]+)}$/);
    let remaining = value;
    if (attrMatch) {
      const attrContent = attrMatch[1];
      // Skip if this looks like a variable reference {$...}, expression {{...}}, or foreach/if condition
      const isSpecialBlock = value.trim().startsWith('if ') || value.trim().startsWith('foreach ');
      let shouldSkip =
        attrContent.startsWith('$') ||
        attrContent.startsWith('{') ||
        attrContent.includes(' as $') ||
        attrContent.startsWith('!') ||
        attrContent.startsWith('(');

      if (isSpecialBlock && !shouldSkip) {
        // If it's a special block and we haven't decided to skip yet,
        // check if there are other braces before these attributes.
        // If not, these braces likely contain the condition/loop info.
        const beforeAttrs = value.substring(0, value.length - attrMatch[0].length);
        if (!beforeAttrs.includes('{')) {
          shouldSkip = true;
        }
      }

      if (!shouldSkip) {
        attributes = InlineParser.parseAttributes(attrContent);
        remaining = value.replace(/\s+\{([^}]+)}$/, '').trim();
      }
    }

    // Extract title [Title]
    let title: string | undefined;
    const isSpecialBlock =
      remaining.match(/^(if|foreach)(\s|{|$)/) ||
      remaining === 'if true' ||
      remaining === 'if false' ||
      remaining === 'if null';
    const titleMatch = !isSpecialBlock ? remaining.match(/\s+\[([^\]]+)]$/) : null;
    let blockType = remaining;
    if (titleMatch) {
      title = titleMatch[1];
      blockType = remaining.replace(/\s+\[([^\]]+)]$/, '').trim();
    }

    const children: ASTNode[] = [];
    this.skipNewlines();

    while (!this.match(TokenType.EOF) && !this.match(TokenType.TRIPLE_COLON_END)) {
      const startPos = this.pos;
      const block = this.parseBlock();
      if (block) {
        children.push(block);
      }
      this.skipNewlines();

      if (this.pos === startPos) {
        this.error(`Parser stuck in TripleColonBlock at token ${this.currentToken.type}`, 'PARSER_STUCK');
      }
    }

    if (this.match(TokenType.TRIPLE_COLON_END)) {
      this.advance();
    }

    return {
      type: 'TripleColonBlock',
      blockType,
      title,
      children,
      attributes,
    } as any;
  }

  private parseDoubleBracketBlock(): ASTNode {
    this.expect(TokenType.DOUBLE_BRACKET_START);
    return {
      type: 'DoubleBracketBlock',
      blockType: 'toc',
      content: '',
    } as ASTNode;
  }

  private parseHorizontalRule(): HorizontalRuleNode {
    const token = this.expect(TokenType.HORIZONTAL_RULE);
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
      // Remove leading colon if present
      const cleanAttrs = attrsStr.startsWith(':') ? attrsStr.substring(1) : attrsStr;
      const attrMatch = cleanAttrs.match(/^\{([^}]+)}$/);
      if (attrMatch) {
        const attrContent = attrMatch[1];
        // Skip if this looks like a variable reference {$...} or expression {{...}}
        if (!attrContent.startsWith('$') && !attrContent.startsWith('{')) {
          attributes = InlineParser.parseAttributes(attrContent);
        }
      }
    }

    return {
      type: 'HorizontalRule',
      style,
      attributes,
    };
  }

  private parseIndentation(): ASTNode {
    const token = this.expect(TokenType.INDENTATION);
    return {
      type: 'Indentation',
      level: token.value.length / 2, // assuming 2 spaces per level
      children: [],
    } as any;
  }

  private parseTechnicalIndentation(): IndentationNode {
    const startToken = this.expect(TokenType.TECHNICAL_INDENT);
    const baseLevel = startToken.level || 1;

    const children: ASTNode[] = [];

    const firstLineContent = this.parseIndentationLineContent();
    if (firstLineContent) {
      children.push(firstLineContent);
    }

    while (!this.isEof()) {
      if (this.match(TokenType.TECHNICAL_INDENT)) {
        const nextLevel = this.currentToken.level || 1;

        if (nextLevel < baseLevel) {
          break;
        }

        if (nextLevel > baseLevel) {
          const nested = this.parseTechnicalIndentation();
          children.push(nested);
          continue;
        }

        this.advance();
        const lineContent = this.parseIndentationLineContent();
        if (lineContent) {
          children.push(lineContent);
        }
        continue;
      }

      if (!this.match(TokenType.NEWLINE)) {
        break;
      }
      this.advance();

      if (this.match(TokenType.NEWLINE)) {
        break;
      }
    }

    return {
      type: 'Indentation',
      level: baseLevel,
      children,
    };
  }

  private parseIndentationLineContent(): ASTNode | null {
    if (this.match(TokenType.TECHNICAL_INDENT, TokenType.NEWLINE, TokenType.EOF)) {
      return null;
    }

    if (this.match(TokenType.HEADING)) return this.parseHeading();
    if (this.match(TokenType.CODE_BLOCK_START)) return this.parseCodeBlock();
    if (this.match(TokenType.HORIZONTAL_RULE)) return this.parseHorizontalRule();
    if (this.match(TokenType.TRIPLE_COLON_START)) return this.parseTripleColonBlock();

    if (this.match(TokenType.BULLET_LIST, TokenType.ORDERED_LIST, TokenType.TASK_LIST)) {
      return this.parseIndentationList();
    }

    return this.parseParagraph(false);
  }

  private parseIndentationList(): ListNode {
    const kind = this.getListKind(this.currentToken.type);
    const children: (ListItemNode | DefinitionTermNode | DefinitionDescriptionNode)[] = [];

    while (!this.isEof()) {
      if (!this.match(TokenType.BULLET_LIST, TokenType.ORDERED_LIST, TokenType.TASK_LIST)) {
        break;
      }

      if (this.getListKind(this.currentToken.type) !== kind) {
        break;
      }

      const item = this.parseListItem(kind, '');
      children.push(item);
      this.skipNewlines();

      if (this.match(TokenType.TECHNICAL_INDENT)) {
        const nextLevel = this.currentToken.level || 1;
        if (nextLevel !== 1) {
          break;
        }
        const peekedNext = this.peek(1);
        if (
          peekedNext.type !== TokenType.BULLET_LIST &&
          peekedNext.type !== TokenType.ORDERED_LIST &&
          peekedNext.type !== TokenType.TASK_LIST
        ) {
          break;
        }
        if (this.getListKind(peekedNext.type) !== kind) {
          break;
        }
        this.advance();
      }
    }

    return {
      type: 'List',
      kind,
      children,
    };
  }

  private parseFrontmatter(): FrontmatterNode {
    this.expect(TokenType.FRONTMATTER);

    return {
      type: 'Frontmatter',
      data: {},
    };
  }

  private isNewBlockStart(): boolean {
    const type = this.currentToken.type;
    return (
      type === TokenType.HEADING ||
      type === TokenType.CODE_BLOCK ||
      type === TokenType.CODE_BLOCK_START ||
      type === TokenType.BLOCKQUOTE ||
      type === TokenType.TECHNICAL_INDENT ||
      type === TokenType.BULLET_LIST ||
      type === TokenType.ORDERED_LIST ||
      type === TokenType.TASK_LIST ||
      type === TokenType.DEFINITION ||
      type === TokenType.HORIZONTAL_RULE ||
      type === TokenType.TRIPLE_COLON_START ||
      type === TokenType.TRIPLE_COLON_END ||
      type === TokenType.DOUBLE_BRACKET_START ||
      type === TokenType.ABBREVIATION_DEF ||
      type === TokenType.ABBREVIATION_DEF_GLOBAL ||
      type === TokenType.COMMENT_INLINE ||
      type === TokenType.FRONTMATTER
    );
  }

  private advance(): Token {
    const token = this.currentToken;
    this.pos++;
    if (this.pos < this.tokens.length) {
      this.currentToken = this.tokens[this.pos];
    }
    return token;
  }

  private parseAbbreviationDef(): AbbreviationDefinitionNode {
    const token = this.expect(
      this.match(TokenType.ABBREVIATION_DEF_GLOBAL) ? TokenType.ABBREVIATION_DEF_GLOBAL : TokenType.ABBREVIATION_DEF
    );
    const value = token.value;

    const colonIndex = value.indexOf(':');
    const abbreviation = value.substring(0, colonIndex);
    const definition = value.substring(colonIndex + 1);

    const isGlobal = token.type === TokenType.ABBREVIATION_DEF_GLOBAL;

    return {
      type: 'AbbreviationDefinition',
      abbreviation,
      definition,
      isGlobal,
    };
  }

  private parseLinkReferenceDef(): LinkReferenceDefinitionNode {
    const token = this.expect(TokenType.LINK_REF_DEF);
    const value = token.value;

    const colonIndex = value.indexOf(':');
    const ref = value.substring(0, colonIndex);
    const url = value.substring(colonIndex + 1);

    return {
      type: 'LinkReferenceDefinition',
      ref,
      url,
    };
  }

  private peek(offset: number = 0): Token {
    const idx = this.pos + offset;
    return this.tokens[idx] || { type: TokenType.EOF, value: '', line: 0, column: 0, length: 0 };
  }

  private expect(type: TokenType): Token {
    if (this.currentToken.type === type) {
      return this.advance();
    }
    return this.error(`Expected ${type}`, 'EXPECTED_TOKEN');
  }

  private match(...types: TokenType[]): boolean {
    return types.includes(this.currentToken.type);
  }

  private skipNewlines(): void {
    while (this.match(TokenType.NEWLINE)) {
      this.advance();
    }
  }

  private error(message: string, code: string): never {
    throw new ParseError(message, this.currentToken.line, this.currentToken.column, this.filePath, code);
  }

  private isEof(): boolean {
    return this.currentToken.type === TokenType.EOF;
  }
}
