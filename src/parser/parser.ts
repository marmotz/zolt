import { Token, TokenType } from '../lexer/token-types';
import { BlockquoteParser } from './block-parsers/blockquote-parser';
import { CodeBlockParser } from './block-parsers/code-block-parser';
import { FrontmatterParser } from './block-parsers/frontmatter-parser';
import { HeadingParser } from './block-parsers/heading-parser';
import { IndentationParser } from './block-parsers/indentation-parser';
import { ListParser } from './block-parsers/list-parser';
import { ParagraphParser } from './block-parsers/paragraph-parser';
import { SpecialBlockParser } from './block-parsers/special-block-parser';
import { TableParser } from './block-parsers/table-parser';
import { TripleColonParser } from './block-parsers/triple-colon-parser';
import { DefinitionCollector } from './definition-collector';
import { ParseError } from './errors/parse-error';
import { InlineParser } from './inline-parser';
import {
  ASTNode,
  DocumentNode,
  FootnoteDefinitionNode,
  FrontmatterNode,
  ParagraphNode,
  VariableDefinitionNode,
} from './types';

export class Parser {
  private tokens: Token[];
  private pos: number;
  private currentToken: Token;
  private filePath: string;
  private inlineParser: InlineParser;
  private footnoteIds: Set<string> = new Set();
  public warnings: { line: number; column: number; message: string; code: string }[] = [];

  private definitionCollector: DefinitionCollector;
  private tableParser: TableParser;
  private listParser: ListParser;
  private tripleColonParser: TripleColonParser;
  private frontmatterParser: FrontmatterParser;
  private headingParser: HeadingParser;
  private blockquoteParser: BlockquoteParser;
  private codeBlockParser: CodeBlockParser;
  private indentationParser: IndentationParser;
  private specialBlockParser: SpecialBlockParser;
  private paragraphParser: ParagraphParser;

  constructor(tokens: Token[], filePath?: string) {
    this.tokens = tokens;
    this.pos = 0;
    this.currentToken = tokens[0];
    this.filePath = filePath || 'unknown';
    this.inlineParser = new InlineParser();

    this.definitionCollector = new DefinitionCollector();
    this.tableParser = new TableParser(this.inlineParser);
    this.listParser = new ListParser(this.inlineParser);
    this.tripleColonParser = new TripleColonParser();
    this.frontmatterParser = new FrontmatterParser();
    this.headingParser = new HeadingParser(this.inlineParser);
    this.codeBlockParser = new CodeBlockParser();
    this.specialBlockParser = new SpecialBlockParser();
    this.paragraphParser = new ParagraphParser(this.inlineParser);
    this.indentationParser = new IndentationParser(this.listParser, this.tripleColonParser);
    this.blockquoteParser = new BlockquoteParser(this.listParser, this.tripleColonParser);
  }

  static get globalAbbreviations() {
    return DefinitionCollector.globalAbbreviations;
  }

  static clearGlobalAbbreviations(): void {
    DefinitionCollector.clearGlobalAbbreviations();
  }

  parse(): DocumentNode {
    // Pass 1: Collect abbreviations and link references
    const { abbreviations, linkReferences, globalAbbreviations, footnotes } = this.definitionCollector.collect(
      this.tokens
    );

    this.footnoteIds = footnotes;
    const allAbbreviations = new Map<string, string>([...globalAbbreviations.entries(), ...abbreviations.entries()]);
    this.inlineParser.setGlobalAbbreviations(allAbbreviations);
    this.inlineParser.setLinkReferences(linkReferences);
    this.inlineParser.setFootnotes(footnotes);

    // Pass 2: Full parse
    this.pos = 0;
    this.currentToken = this.tokens[0];
    const children = this.parseDocument();
    const frontmatter = children.find((child) => child.type === 'Frontmatter') as FrontmatterNode | undefined;

    return {
      type: 'Document',
      children,
      frontmatter,
      sourceFile: this.filePath,
      footnoteIds: this.footnoteIds,
    };
  }

  private advance(): Token {
    const token = this.currentToken;
    this.pos++;
    if (this.pos < this.tokens.length) {
      this.currentToken = this.tokens[this.pos];
    } else {
      this.currentToken = {
        type: TokenType.EOF,
        value: '',
        line: token.line,
        column: token.column + (token.length || 0),
        length: 0,
      };
    }

    return token;
  }

  private error(message: string, code: string): never {
    throw new ParseError(message, this.currentToken.line, this.currentToken.column, this.filePath, code);
  }

  private expect(type: TokenType): Token {
    if (this.currentToken.type === type) {
      return this.advance();
    }

    return this.error(`Expected ${type} but got ${this.currentToken.type}`, 'EXPECTED_TOKEN');
  }

  private isEof(): boolean {
    return this.currentToken.type === TokenType.EOF;
  }

  private isNewBlockStart(offset: number = 0): boolean {
    const token = this.peek(offset);
    if (token.type === TokenType.TEXT) {
      const trimmed = token.value.trim();
      if (trimmed.startsWith('$')) {
        return true;
      }

      return /^\{([^}]+)}$/.test(trimmed) && !trimmed.startsWith('{$') && !trimmed.startsWith('{{');
    }

    if (token.type === TokenType.INDENTATION) {
      const next = this.peek(offset + 1);

      return [
        TokenType.BULLET_LIST,
        TokenType.ORDERED_LIST,
        TokenType.TASK_LIST,
        TokenType.DEFINITION,
        TokenType.BLOCKQUOTE,
        TokenType.HEADING,
        TokenType.CODE_BLOCK_START,
        TokenType.TRIPLE_COLON_START,
        TokenType.FOOTNOTE_DEF,
        TokenType.TECHNICAL_INDENT,
      ].includes(next.type);
    }

    return [
      TokenType.HEADING,
      TokenType.CODE_BLOCK,
      TokenType.CODE_BLOCK_START,
      TokenType.BLOCKQUOTE,
      TokenType.TECHNICAL_INDENT,
      TokenType.BULLET_LIST,
      TokenType.ORDERED_LIST,
      TokenType.TASK_LIST,
      TokenType.DEFINITION,
      TokenType.HORIZONTAL_RULE,
      TokenType.TRIPLE_COLON_START,
      TokenType.TRIPLE_COLON_END,
      TokenType.DOUBLE_BRACKET_START,
      TokenType.ABBREVIATION_DEF,
      TokenType.ABBREVIATION_DEF_GLOBAL,
      TokenType.FOOTNOTE_DEF,
      TokenType.LINK_REF_DEF,
      TokenType.COMMENT_INLINE,
      TokenType.FRONTMATTER,
    ].includes(token.type);
  }

  private match(...types: TokenType[]): boolean {
    return types.includes(this.currentToken.type);
  }

  private parseVariableDefinition(): VariableDefinitionNode {
    const token = this.advance();
    let content = token.value.trim();

    // Check if the value is complete (balanced brackets/braces)
    const isComplete = (val: string) => {
      let depth = 0;
      let inString = false;
      let stringChar = '';
      for (let i = 0; i < val.length; i++) {
        const char = val[i];
        if (inString) {
          if (char === stringChar && (i === 0 || val[i - 1] !== '\\')) inString = false;
          continue;
        }
        if (char === '"' || char === "'") {
          inString = true;
          stringChar = char;
          continue;
        }
        if (char === '[' || char === '{' || char === '(') depth++;
        else if (char === ']' || char === '}' || char === ')') depth--;
      }

      return depth <= 0;
    };

    while (!isComplete(content) && !this.isEof()) {
      this.skipNewlines();
      if (this.isEof()) break;
      if (this.match(TokenType.INDENTATION)) this.advance();
      if (this.match(TokenType.TEXT)) {
        content += ' ' + this.advance().value.trim();
      } else {
        break;
      }
    }

    const localVarMatch = content.match(/^\$([a-zA-Z_]\w*)\s*=\s*(.*)$/);
    const globalVarMatch = content.match(/^\$\$([a-zA-Z_]\w*)\s*=\s*(.*)$/);

    const isGlobal = !!globalVarMatch;
    const match = isGlobal ? globalVarMatch : localVarMatch;

    if (!match) {
      return {
        type: 'VariableDefinition',
        name: 'error',
        value: content,
        isGlobal: false,
      };
    }

    return {
      type: 'VariableDefinition',
      name: match[1],
      value: match[2].trim(),
      isGlobal,
    };
  }

  private parseBlock(): ASTNode | null {
    if (this.match(TokenType.HEADING)) {
      return this.headingParser.parseHeading(this.expect.bind(this));
    }
    if (this.match(TokenType.CODE_BLOCK_START)) {
      return this.codeBlockParser.parseCodeBlock(
        this.expect.bind(this),
        this.match.bind(this),
        this.advance.bind(this),
        this.isEof.bind(this)
      );
    }
    if (this.match(TokenType.BLOCKQUOTE)) {
      return this.blockquoteParser.parseBlockquote(
        this.tokens,
        { current: this.pos },
        () => this.currentToken,
        this.advance.bind(this),
        this.expect.bind(this),
        this.match.bind(this),
        this.skipNewlines.bind(this),
        this.isEof.bind(this),
        this.parseBlock.bind(this),
        this.headingParser.parseHeading.bind(this.headingParser, this.expect.bind(this)),
        this.codeBlockParser.parseCodeBlock.bind(
          this.codeBlockParser,
          this.expect.bind(this),
          this.match.bind(this),
          this.advance.bind(this),
          this.isEof.bind(this)
        ),
        this.specialBlockParser.parseHorizontalRule.bind(this.specialBlockParser, this.expect.bind(this)),
        this.paragraphParser.parseParagraph.bind(
          this.paragraphParser,
          this.match.bind(this),
          this.advance.bind(this),
          this.peek.bind(this),
          this.isEof.bind(this),
          this.isNewBlockStart.bind(this)
        ),
        this.error.bind(this)
      );
    }
    if (this.match(TokenType.TECHNICAL_INDENT)) {
      return this.indentationParser.parseTechnicalIndentation(
        this.tokens,
        { current: this.pos },
        () => this.currentToken,
        this.advance.bind(this),
        this.expect.bind(this),
        this.match.bind(this),
        this.skipNewlines.bind(this),
        this.isEof.bind(this),
        this.parseBlock.bind(this),
        this.headingParser.parseHeading.bind(this.headingParser, this.expect.bind(this)),
        this.codeBlockParser.parseCodeBlock.bind(
          this.codeBlockParser,
          this.expect.bind(this),
          this.match.bind(this),
          this.advance.bind(this),
          this.isEof.bind(this)
        ),
        this.specialBlockParser.parseHorizontalRule.bind(this.specialBlockParser, this.expect.bind(this)),
        this.paragraphParser.parseParagraph.bind(
          this.paragraphParser,
          this.match.bind(this),
          this.advance.bind(this),
          this.peek.bind(this),
          this.isEof.bind(this),
          this.isNewBlockStart.bind(this)
        ),
        this.error.bind(this)
      );
    }
    if (this.match(TokenType.TRIPLE_COLON_START)) {
      return this.tripleColonParser.parseTripleColonBlock(
        this.advance.bind(this),
        this.expect.bind(this),
        this.match.bind(this),
        this.skipNewlines.bind(this),
        this.isEof.bind(this),
        this.parseBlock.bind(this)
      );
    }
    if (this.match(TokenType.TRIPLE_COLON_END)) {
      this.advance();

      return {
        type: 'Paragraph',
        children: [{ type: 'Text', content: ':::' }],
      } as any;
    }
    if (this.match(TokenType.DOUBLE_BRACKET_START)) {
      return this.specialBlockParser.parseDoubleBracketBlock(this.expect.bind(this));
    }
    if (this.match(TokenType.HORIZONTAL_RULE)) {
      return this.specialBlockParser.parseHorizontalRule(this.expect.bind(this));
    }
    if (this.match(TokenType.INCLUDE)) {
      const token = this.expect(TokenType.INCLUDE);
      return {
        type: 'Include',
        path: token.value,
      };
    }

    if (this.match(TokenType.INDENTATION)) {
      const next = this.peek(1);
      if (
        next.type === TokenType.BULLET_LIST ||
        next.type === TokenType.ORDERED_LIST ||
        next.type === TokenType.TASK_LIST ||
        next.type === TokenType.DEFINITION
      ) {
        return this.listParser.parseList(
          this.advance.bind(this),
          this.peek.bind(this),
          this.match.bind(this),
          this.skipNewlines.bind(this),
          this.isEof.bind(this),
          this.parseBlock.bind(this),
          this.currentToken.value
        );
      }
    }

    if (this.match(TokenType.BULLET_LIST, TokenType.ORDERED_LIST, TokenType.TASK_LIST, TokenType.DEFINITION)) {
      return this.listParser.parseList(
        this.advance.bind(this),
        this.peek.bind(this),
        this.match.bind(this),
        this.skipNewlines.bind(this),
        this.isEof.bind(this),
        this.parseBlock.bind(this)
      );
    }

    if (this.match(TokenType.INDENTATION)) {
      return this.indentationParser.parseIndentation(this.expect.bind(this));
    }
    if (this.match(TokenType.ABBREVIATION_DEF) || this.match(TokenType.ABBREVIATION_DEF_GLOBAL)) {
      return this.specialBlockParser.parseAbbreviationDef(this.expect.bind(this), this.match.bind(this));
    }
    if (this.match(TokenType.FOOTNOTE_DEF)) {
      return this.parseFootnoteDefinition();
    }
    if (this.match(TokenType.LINK_REF_DEF)) {
      const value = this.currentToken.value;
      const ref = value.substring(0, value.indexOf(':'));
      if (this.footnoteIds.has(ref)) {
        return this.parseFootnoteDefinition();
      }

      return this.specialBlockParser.parseLinkReferenceDef(this.expect.bind(this));
    }
    if (this.match(TokenType.COMMENT_INLINE)) {
      return this.specialBlockParser.parseCommentInline(this.expect.bind(this));
    }

    if (this.tableParser.isTableStart(this.currentToken)) {
      return this.tableParser.parseTable(
        this.expect.bind(this),
        this.match.bind(this),
        this.skipNewlines.bind(this),
        this.isEof.bind(this),
        this.peek.bind(this)
      );
    }

    if (this.match(TokenType.TEXT)) {
      const value = this.currentToken.value.trim();

      // Handle variable definitions
      if (value.startsWith('$')) {
        return this.parseVariableDefinition();
      }

      const attrMatch = value.match(/^\{([^}]+)}$/);
      if (attrMatch) {
        const attrContent = attrMatch[1];
        if (!attrContent.startsWith('$') && !attrContent.startsWith('{')) {
          this.advance();

          return {
            type: 'Attributes',
            attributes: InlineParser.parseAttributes(attrContent),
          } as any;
        }
      }
    }

    return this.paragraphParser.parseParagraph(
      this.match.bind(this),
      this.advance.bind(this),
      this.peek.bind(this),
      this.isEof.bind(this),
      this.isNewBlockStart.bind(this)
    );
  }

  private parseFootnoteDefinition(): FootnoteDefinitionNode {
    const token = this.advance();
    let id = token.value;
    let initialContent = '';

    if (token.type === TokenType.LINK_REF_DEF) {
      const colonIndex = id.indexOf(':');
      id = id.substring(0, colonIndex);
      initialContent = token.value.substring(colonIndex + 1).trim();
    }

    const children: ASTNode[] = [];

    // The rest of the line is a paragraph or other content.
    if (initialContent) {
      children.push({
        type: 'Paragraph',
        children: this.inlineParser.parse(initialContent),
      } as ParagraphNode);
    } else if (!this.match(TokenType.NEWLINE) && !this.isEof()) {
      children.push(
        this.paragraphParser.parseParagraph(
          this.match.bind(this),
          this.advance.bind(this),
          this.peek.bind(this),
          this.isEof.bind(this),
          this.isNewBlockStart.bind(this)
        )
      );
    }

    this.skipNewlines();

    // Check for indented lines that belong to this footnote
    while (!this.isEof()) {
      if (this.match(TokenType.INDENTATION)) {
        const next = this.peek(1);
        if (
          [TokenType.BULLET_LIST, TokenType.ORDERED_LIST, TokenType.TASK_LIST, TokenType.DEFINITION].includes(next.type)
        ) {
          const block = this.parseBlock();
          if (block) children.push(block);
        } else {
          this.advance(); // Skip indentation for non-list blocks
          const block = this.parseBlock();
          if (block) children.push(block);
        }
        this.skipNewlines();
      } else {
        break;
      }
    }

    return {
      type: 'FootnoteDefinition',
      id,
      children,
    };
  }

  private parseDocument(): ASTNode[] {
    const children: ASTNode[] = [];

    if (this.match(TokenType.FRONTMATTER)) {
      children.push(
        this.frontmatterParser.parseFrontmatter(this.expect.bind(this), (message, line, column, code) => {
          this.warnings.push({ line, column, message, code });
        })
      );
    }

    while (!this.match(TokenType.EOF)) {
      const startPos = this.pos;
      this.skipNewlines();

      if (this.isEof()) break;

      const block = this.parseBlock();
      if (block) {
        if (block.type === 'Attributes' && children.length > 0) {
          const lastChild = children[children.length - 1] as any;
          if (lastChild && lastChild.type !== 'Text') {
            lastChild.attributes = { ...(lastChild.attributes || {}), ...(block.attributes || {}) };
          }
        } else {
          children.push(block);
        }
      }

      if (this.pos === startPos) {
        this.error(`Parser stuck at token ${this.currentToken.type}`, 'PARSER_STUCK');
      }
    }

    return children;
  }

  private peek(offset: number = 0): Token {
    const idx = this.pos + offset;

    return this.tokens[idx] || { type: TokenType.EOF, value: '', line: 0, column: 0, length: 0 };
  }

  private skipNewlines(): void {
    while (this.match(TokenType.NEWLINE)) this.advance();
  }
}
