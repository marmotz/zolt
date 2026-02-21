import { Token, TokenType } from '../lexer/token-types';
import { ParseError } from './errors/parse-error';
import { InlineParser } from './inline-parser';
import {
  ASTNode,
  AbbreviationDefinitionNode,
  BlockquoteNode,
  CodeBlockNode,
  CommentInlineNode,
  DocumentNode,
  FrontmatterNode,
  HeadingNode,
  HorizontalRuleNode,
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

  constructor(tokens: Token[], filePath?: string) {
    this.tokens = tokens;
    this.pos = 0;
    this.currentToken = tokens[0];
    this.filePath = filePath || 'unknown';
    this.abbreviationDefinitions = new Map();
  }

  parse(): DocumentNode {
    const children = this.parseDocument();
    return {
      type: 'Document',
      children,
      sourceFile: this.filePath,
    };
  }

  private parseDocument(): ASTNode[] {
    const children: ASTNode[] = [];

    if (this.match(TokenType.FRONTMATTER)) {
      children.push(this.parseFrontmatter());
    }

    while (!this.match(TokenType.EOF)) {
      this.skipNewlines();

      if (this.isEof()) break;

      const block = this.parseBlock();
      if (block) {
        children.push(block);
      }
    }

    return children;
  }

  private parseBlock(): ASTNode | null {
    if (this.match(TokenType.HEADING)) return this.parseHeading();
    if (this.match(TokenType.CODE_BLOCK)) return this.parseCodeBlock();
    if (this.match(TokenType.BLOCKQUOTE)) return this.parseBlockquote();
    if (this.match(TokenType.TRIPLE_COLON_START)) return this.parseTripleColonBlock();
    if (this.match(TokenType.DOUBLE_BRACKET_START)) return this.parseDoubleBracketBlock();
    if (this.match(TokenType.HORIZONTAL_RULE)) return this.parseHorizontalRule();
    if (this.match(TokenType.BULLET_LIST, TokenType.ORDERED_LIST, TokenType.TASK_LIST)) {
      return this.parseList();
    }
    if (this.match(TokenType.DEFINITION)) return this.parseDefinitionList();
    if (this.match(TokenType.INDENTATION)) return this.parseIndentation();
    if (this.match(TokenType.ABBREVIATION_DEF)) return this.parseAbbreviationDef();
    if (this.match(TokenType.ABBREVIATION_DEF_GLOBAL)) return this.parseAbbreviationDef();
    if (this.match(TokenType.COMMENT_INLINE)) return this.parseCommentInline();

    if (this.isTableStart()) return this.parseTable();

    return this.parseParagraph();
  }

  private isTableStart(): boolean {
    const token = this.currentToken;
    if (token.type !== TokenType.TEXT) return false;
    return token.value.trim().startsWith('|');
  }

  private parseTable(): TableNode {
    const rows: TableRowNode[] = [];
    let header: TableRowNode | undefined;

    while (this.isTableStart()) {
      const row = this.parseTableRow();
      
      // Check if this is a separator row (e.g., |---|---|)
      if (this.isSeparatorRow(row)) {
        if (rows.length > 0 && !header) {
          header = rows.pop();
          // We don't add the separator row to rows
        }
      } else {
        rows.push(row);
      }
      
      this.skipNewlines();
      if (this.isEof()) break;
    }

    return {
      type: 'Table',
      header,
      rows,
    };
  }

  private parseTableRow(): TableRowNode {
    const token = this.expect(TokenType.TEXT);
    const line = token.value.trim();
    
    // Remove leading and trailing pipes
    const content = line.replace(/^\|/, '').replace(/\|$/, '');
    const cellContents = content.split('|');
    
    const cells: TableCellNode[] = cellContents.map(cell => ({
      type: 'TableCell',
      content: cell.trim(),
    }));

    return {
      type: 'TableRow',
      cells,
    };
  }

  private isSeparatorRow(row: TableRowNode): boolean {
    return row.cells.every(cell => /^[ \t]*:?-+:?[ \t]*$/.test(cell.content));
  }

  private parseHeading(): HeadingNode {
    const token = this.expect(TokenType.HEADING);
    const level = token.level || 1;

    return {
      type: 'Heading',
      level,
      content: token.value.trim(),
    };
  }

  private parseCommentInline(): CommentInlineNode {
    const token = this.expect(TokenType.COMMENT_INLINE);
    return {
      type: 'CommentInline',
      content: token.value,
    };
  }

  private countHeadingLevel(_value: string): number {
    return 1;
  }

  private parseParagraph(): ParagraphNode {
    const token = this.currentToken;
    let content = '';

    while (!this.match(TokenType.EOF) && !this.match(TokenType.NEWLINE) && !this.isNewBlockStart()) {
      content += this.advance().value;
    }

    return {
      type: 'Paragraph',
      content: content.trim(),
    };
  }

  private parseBlockquote(): BlockquoteNode {
    const startToken = this.expect(TokenType.BLOCKQUOTE);
    const level = startToken.value.split('>').length - 1;

    const children: ASTNode[] = [];
    this.skipNewlines();

    while (!this.match(TokenType.EOF) && !this.match(TokenType.BLOCKQUOTE) && !this.isNewBlockStart()) {
      const content = this.parseBlockquoteContent();
      if (content) {
        children.push(content);
      }
      this.skipNewlines();
    }

    return {
      type: 'Blockquote',
      children,
      level,
    };
  }

  private parseBlockquoteContent(): ASTNode | null {
    if (this.peekNext()?.type === TokenType.BLOCKQUOTE) {
      return this.parseBlockquote();
    }

    if (this.match(TokenType.BULLET_LIST, TokenType.ORDERED_LIST, TokenType.TASK_LIST)) {
      return this.parseList();
    }

    return this.parseParagraph();
  }

  private parseList(): ListNode {
    const listToken = this.currentToken;
    const kind = this.getListKind(listToken.type);
    const children: ListItemNode[] = [];

    while (this.match(listToken.type)) {
      const item = this.parseListItem(kind);
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
      default:
        return 'bullet';
    }
  }

  private parseListItem(kind: string): ListItemNode {
    const checked = this.parseTaskMarker();
    let content = '';

    if (this.match(TokenType.BULLET_LIST) || this.match(TokenType.ORDERED_LIST) || this.match(TokenType.TASK_LIST)) {
      const token = this.currentToken;
      content = token.value;
      this.advance();
    }

    return {
      type: 'ListItem',
      content: content.trim(),
      checked,
      children: [],
    };
  }

  private parseTaskMarker(): boolean | undefined {
    if (this.match(TokenType.TASK_LIST)) {
      const token = this.currentToken;
      this.advance();
      return token.value.includes('x');
    }
    return undefined;
  }

  private parseCodeBlock(): CodeBlockNode {
    const token = this.expect(TokenType.CODE_BLOCK);

    return {
      type: 'CodeBlock',
      language: token.value || undefined,
      content: '',
    };
  }

  private parseTripleColonBlock(): ASTNode {
    this.expect(TokenType.TRIPLE_COLON_START);
    return {
      type: 'TripleColonBlock',
      blockType: '',
      content: '',
    } as ASTNode;
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
    this.expect(TokenType.HORIZONTAL_RULE);

    return {
      type: 'HorizontalRule',
      style: 'solid',
    };
  }

  private parseDefinitionList(): ASTNode {
    return { type: 'Paragraph', content: '' } as ASTNode;
  }

  private parseIndentation(): ASTNode {
    return { type: 'Indentation', level: 0, children: [] } as ASTNode;
  }

  private parseFrontmatter(): FrontmatterNode {
    this.expect(TokenType.FRONTMATTER);

    return {
      type: 'Frontmatter',
      data: {},
    };
  }

  private hasIndentedContent(): boolean {
    return false;
  }

  private isNewBlockStart(): boolean {
    const type = this.currentToken.type;
    return (
      type === TokenType.HEADING ||
      type === TokenType.CODE_BLOCK ||
      type === TokenType.BLOCKQUOTE ||
      type === TokenType.BULLET_LIST ||
      type === TokenType.ORDERED_LIST ||
      type === TokenType.TASK_LIST ||
      type === TokenType.HORIZONTAL_RULE
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
    this.abbreviationDefinitions.set(abbreviation, definition);

    return {
      type: 'AbbreviationDefinition',
      abbreviation,
      definition,
      isGlobal,
    };
  }

  private peek(offset: number = 0): Token {
    const idx = this.pos + offset;
    return this.tokens[idx] || { type: TokenType.EOF, value: '', line: 0, column: 0, length: 0 };
  }

  private peekNext(): Token {
    return this.peek(1);
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

  private warn(message: string): void {
    console.warn(`Warning: ${message} at line ${this.currentToken.line}`);
  }
}
