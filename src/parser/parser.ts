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
import { ASTNode, DocumentNode, FrontmatterNode } from './types';

export class Parser {
  private tokens: Token[];
  private pos: number;
  private currentToken: Token;
  private filePath: string;
  private inlineParser: InlineParser;

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
    this.tripleColonParser = new TripleColonParser(this.inlineParser);
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
    const { abbreviations, linkReferences, globalAbbreviations } = this.definitionCollector.collect(this.tokens);

    const allAbbreviations = new Map<string, string>([ ...globalAbbreviations.entries(), ...abbreviations.entries() ]);
    this.inlineParser.setGlobalAbbreviations(allAbbreviations);
    this.inlineParser.setLinkReferences(linkReferences);

    // Pass 2: Full parse
    this.pos = 0;
    this.currentToken = this.tokens[0];
    const children = this.parseDocument();
    const frontmatter = children.find((child) => child.type === 'Frontmatter') as FrontmatterNode | undefined;

    return {
      type: 'Document', children, frontmatter, sourceFile: this.filePath,
    };
  }

  private advance(): Token {
    const token = this.currentToken;
    this.pos++;
    if (this.pos < this.tokens.length) {
      this.currentToken = this.tokens[this.pos];
    } else {
      this.currentToken = { type: TokenType.EOF, value: '', line: this.line, column: this.column, length: 0 };
    }
    return token;
  }

  private error(message: string, code: string): never {
    throw new ParseError(message, this.currentToken.line, this.currentToken.column, this.filePath, code);
  }

  private expect(type: TokenType): Token {
    if (this.currentToken.type === type) return this.advance();
    return this.error(`Expected ${type} but got ${this.currentToken.type}`, 'EXPECTED_TOKEN');
  }

  private isEof(): boolean {
    return this.currentToken.type === TokenType.EOF;
  }

  private isNewBlockStart(offset: number = 0): boolean {
    const token = this.peek(offset);
    if (token.type === TokenType.TEXT) {
      const trimmed = token.value.trim();
      return /^\{([^}]+)}$/.test(trimmed) && !trimmed.startsWith('{$') && !trimmed.startsWith('{{');
    }
    return [ TokenType.HEADING, TokenType.CODE_BLOCK, TokenType.CODE_BLOCK_START, TokenType.BLOCKQUOTE, TokenType.TECHNICAL_INDENT, TokenType.BULLET_LIST, TokenType.ORDERED_LIST, TokenType.TASK_LIST, TokenType.DEFINITION, TokenType.HORIZONTAL_RULE, TokenType.TRIPLE_COLON_START, TokenType.TRIPLE_COLON_END, TokenType.DOUBLE_BRACKET_START, TokenType.ABBREVIATION_DEF, TokenType.ABBREVIATION_DEF_GLOBAL, TokenType.COMMENT_INLINE, TokenType.FRONTMATTER ].includes(token.type);
  }

  private match(...types: TokenType[]): boolean {
    return types.includes(this.currentToken.type);
  }

  private parseBlock(): ASTNode | null {
    if (this.match(TokenType.HEADING)) {
      return this.headingParser.parseHeading(this.expect.bind(this));
    }
    if (this.match(TokenType.CODE_BLOCK_START)) {
      return this.codeBlockParser.parseCodeBlock(this.expect.bind(this), this.match.bind(this), this.advance.bind(this), this.isEof.bind(this));
    }
    if (this.match(TokenType.BLOCKQUOTE)) {
      return this.blockquoteParser.parseBlockquote(this.tokens, { current: this.pos }, () => this.currentToken, this.advance.bind(this), this.expect.bind(this), this.match.bind(this), this.skipNewlines.bind(this), this.isEof.bind(this), this.parseBlock.bind(this), this.headingParser.parseHeading.bind(this.headingParser, this.expect.bind(this)), this.codeBlockParser.parseCodeBlock.bind(this.codeBlockParser, this.expect.bind(this), this.match.bind(this), this.advance.bind(this), this.isEof.bind(this)), this.specialBlockParser.parseHorizontalRule.bind(this.specialBlockParser, this.expect.bind(this)), this.paragraphParser.parseParagraph.bind(this.paragraphParser, this.match.bind(this), this.advance.bind(this), this.peek.bind(this), this.isEof.bind(this), this.isNewBlockStart.bind(this)), this.error.bind(this));
    }
    if (this.match(TokenType.TECHNICAL_INDENT)) {
      return this.indentationParser.parseTechnicalIndentation(this.tokens, { current: this.pos }, () => this.currentToken, this.advance.bind(this), this.expect.bind(this), this.match.bind(this), this.skipNewlines.bind(this), this.isEof.bind(this), this.parseBlock.bind(this), this.headingParser.parseHeading.bind(this.headingParser, this.expect.bind(this)), this.codeBlockParser.parseCodeBlock.bind(this.codeBlockParser, this.expect.bind(this), this.match.bind(this), this.advance.bind(this), this.isEof.bind(this)), this.specialBlockParser.parseHorizontalRule.bind(this.specialBlockParser, this.expect.bind(this)), this.paragraphParser.parseParagraph.bind(this.paragraphParser, this.match.bind(this), this.advance.bind(this), this.peek.bind(this), this.isEof.bind(this), this.isNewBlockStart.bind(this)), this.error.bind(this));
    }
    if (this.match(TokenType.TRIPLE_COLON_START)) {
      return this.tripleColonParser.parseTripleColonBlock(this.tokens, this.advance.bind(this), this.expect.bind(this), this.match.bind(this), this.skipNewlines.bind(this), this.isEof.bind(this), this.parseBlock.bind(this), this.error.bind(this));
    }
    if (this.match(TokenType.TRIPLE_COLON_END)) {
      this.advance();
      return {
        type: 'Paragraph', children: [ { type: 'Text', content: ':::' } ],
      } as any;
    }
    if (this.match(TokenType.DOUBLE_BRACKET_START)) return this.specialBlockParser.parseDoubleBracketBlock(this.expect.bind(this));
    if (this.match(TokenType.HORIZONTAL_RULE)) return this.specialBlockParser.parseHorizontalRule(this.expect.bind(this));

    if (this.match(TokenType.INDENTATION)) {
      const next = this.peek(1);
      if (next.type === TokenType.BULLET_LIST || next.type === TokenType.ORDERED_LIST || next.type === TokenType.TASK_LIST || next.type === TokenType.DEFINITION) {
        return this.listParser.parseList(this.advance.bind(this), this.peek.bind(this), this.match.bind(this), this.skipNewlines.bind(this), this.isEof.bind(this), this.parseBlock.bind(this), this.currentToken.value);
      }
    }

    if (this.match(TokenType.BULLET_LIST, TokenType.ORDERED_LIST, TokenType.TASK_LIST, TokenType.DEFINITION)) {
      return this.listParser.parseList(this.advance.bind(this), this.peek.bind(this), this.match.bind(this), this.skipNewlines.bind(this), this.isEof.bind(this), this.parseBlock.bind(this));
    }

    if (this.match(TokenType.INDENTATION)) return this.indentationParser.parseIndentation(this.expect.bind(this));
    if (this.match(TokenType.ABBREVIATION_DEF) || this.match(TokenType.ABBREVIATION_DEF_GLOBAL)) return this.specialBlockParser.parseAbbreviationDef(this.expect.bind(this), this.match.bind(this));
    if (this.match(TokenType.LINK_REF_DEF)) return this.specialBlockParser.parseLinkReferenceDef(this.expect.bind(this));
    if (this.match(TokenType.COMMENT_INLINE)) return this.specialBlockParser.parseCommentInline(this.expect.bind(this));

    if (this.tableParser.isTableStart(this.currentToken)) {
      return this.tableParser.parseTable(this.expect.bind(this), this.match.bind(this), this.skipNewlines.bind(this), this.isEof.bind(this), this.peek.bind(this));
    }

    if (this.match(TokenType.TEXT)) {
      const value = this.currentToken.value.trim();
      const attrMatch = value.match(/^\{([^}]+)}$/);
      if (attrMatch) {
        const attrContent = attrMatch[1];
        if (!attrContent.startsWith('$') && !attrContent.startsWith('{')) {
          this.advance();
          return {
            type: 'Attributes', attributes: InlineParser.parseAttributes(attrContent),
          } as any;
        }
      }
    }

    return this.paragraphParser.parseParagraph(this.match.bind(this), this.advance.bind(this), this.peek.bind(this), this.isEof.bind(this), this.isNewBlockStart.bind(this));
  }

  private parseDocument(): ASTNode[] {
    const children: ASTNode[] = [];

    if (this.match(TokenType.FRONTMATTER)) {
      children.push(this.frontmatterParser.parseFrontmatter(this.expect.bind(this)));
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
