import { LexerState } from './state/lexer-state';
import { Token, TokenType } from './token-types';

export class Lexer {
  private source: string;
  private pos: number;
  private line: number;
  private column: number;
  private tokens: Token[];
  private state: LexerState;

  constructor(source: string) {
    this.source = source;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    this.state = new LexerState();
  }

  tokenize(): Token[] {
    while (!this.isEof()) {
      if (this.peekChar() === '\n') {
        this.advanceChar();
        this.tokens.push({ type: TokenType.NEWLINE, value: '\n', line: this.line, column: this.column, length: 1 });
        continue;
      }

      if (this.column === 1) {
        const indentation = this.readIndentation();
        if (indentation) {
          this.tokens.push(indentation);
        }
      }

      this.skipWhitespace();
      if (this.isEof()) break;

      const token = this.nextToken();
      if (token) {
        this.tokens.push(token);
      }
    }
    this.tokens.push({ type: TokenType.EOF, value: '', line: this.line, column: this.column, length: 0 });
    return this.tokens;
  }

  private readIndentation(): Token | null {
    const start = this.pos;
    const line = this.line;
    const column = this.column;
    let value = '';

    while (!this.isEof() && (this.peekChar() === ' ' || this.peekChar() === '\t')) {
      value += this.advanceChar();
    }

    if (value.length > 0) {
      return {
        type: TokenType.INDENTATION,
        value,
        line,
        column,
        length: this.pos - start,
      };
    }

    return null;
  }

  private nextToken(): Token | null {
    if (this.state.mode === 'CODE') {
      return this.readCodeBlockContent();
    }

    if (this.matchHeading()) return this.readHeading();
    if (this.matchCodeBlock()) return this.readCodeBlock();
    if (this.matchTripleColon()) return this.readTripleColon();
    if (this.matchDoubleBracket()) return this.readDoubleBracket();
    if (this.matchBlockquote()) return this.readBlockquote();
    if (this.matchList()) return this.readList();
    if (this.matchHorizontalRule()) return this.readHorizontalRule();
    if (this.matchFrontmatter()) return this.readFrontmatter();
    if (this.matchGlobalAbbreviationDef()) return this.readGlobalAbbreviationDef();
    if (this.matchAbbreviationDef()) return this.readAbbreviationDef();
    if (this.matchInlineComment()) return this.readInlineComment();

    return this.readText();
  }

  private matchHeading(): boolean {
    const remaining = this.source.slice(this.pos);
    return /^#{1,6}\s/.test(remaining);
  }

  private readHeading(): Token {
    const start = this.pos;
    const line = this.line;
    const column = this.column;

    let level = 0;
    while (this.peekChar() === '#' && level < 6) {
      this.advanceChar();
      level++;
    }

    this.skipWhitespace();

    let content = '';
    while (!this.isEof() && this.peekChar() !== '\n') {
      content += this.advanceChar();
    }

    return {
      type: TokenType.HEADING,
      value: content.trim(),
      line,
      column,
      length: this.pos - start,
      level,
    };
  }

  private matchCodeBlock(): boolean {
    return this.source.slice(this.pos).startsWith('```');
  }

  private readCodeBlock(): Token {
    const start = this.pos;
    const line = this.line;
    const column = this.column;

    this.advanceChar();
    this.advanceChar();
    this.advanceChar();

    let language = '';
    while (!this.isEof() && this.peekChar() !== '\n' && this.peekChar() !== '`') {
      language += this.advanceChar();
    }

    this.state.enterCodeBlock(language.trim());

    return {
      type: TokenType.CODE_BLOCK,
      value: language.trim(),
      line,
      column,
      length: this.pos - start,
    };
  }

  private readCodeBlockContent(): Token {
    if (this.source.slice(this.pos).startsWith('```')) {
      this.state.exitCodeBlock();
      return this.readCodeBlockEnd();
    }

    const start = this.pos;
    const line = this.line;
    const column = this.column;

    let content = '';
    while (!this.isEof() && this.peekChar() !== '\n') {
      content += this.advanceChar();
    }
    if (!this.isEof()) {
      this.advanceChar();
    }

    return {
      type: TokenType.CODE_BLOCK,
      value: content,
      line,
      column,
      length: this.pos - start,
    };
  }

  private readCodeBlockEnd(): Token {
    const start = this.pos;
    const line = this.line;
    const column = this.column;

    this.advanceChar();
    this.advanceChar();
    this.advanceChar();

    while (!this.isEof() && this.peekChar() !== '\n') {
      this.advanceChar();
    }

    return {
      type: TokenType.CODE_BLOCK,
      value: '',
      line,
      column,
      length: this.pos - start,
    };
  }

  private matchTripleColon(): boolean {
    return this.source.slice(this.pos).startsWith(':::');
  }

  private readTripleColon(): Token {
    const start = this.pos;
    const line = this.line;
    const column = this.column;

    this.advanceChar();
    this.advanceChar();
    this.advanceChar();

    let blockType = '';
    while (!this.isEof() && this.peekChar() !== '\n') {
      blockType += this.advanceChar();
    }

    return {
      type: TokenType.TRIPLE_COLON_START,
      value: blockType.trim(),
      line,
      column,
      length: this.pos - start,
    };
  }

  private matchDoubleBracket(): boolean {
    return this.source.slice(this.pos).startsWith('[[');
  }

  private readDoubleBracket(): Token {
    const start = this.pos;
    const line = this.line;
    const column = this.column;

    this.advanceChar();
    this.advanceChar();

    let content = '';
    while (!this.isEof() && !this.source.slice(this.pos).startsWith(']]')) {
      content += this.advanceChar();
    }

    if (!this.isEof()) {
      this.advanceChar();
      this.advanceChar();
    }

    return {
      type: TokenType.DOUBLE_BRACKET_START,
      value: content.trim(),
      line,
      column,
      length: this.pos - start,
    };
  }

  private matchBlockquote(): boolean {
    const remaining = this.source.slice(this.pos);
    return /^>\s?/.test(remaining);
  }

  private readBlockquote(): Token {
    const start = this.pos;
    const line = this.line;
    const column = this.column;

    let value = '';
    while (this.peekChar() === '>') {
      value += this.advanceChar();
    }
    if (this.peekChar() === ' ') {
      value += this.advanceChar();
    }

    return {
      type: TokenType.BLOCKQUOTE,
      value,
      line,
      column,
      length: this.pos - start,
    };
  }

  private matchList(): boolean {
    const remaining = this.source.slice(this.pos);
    return (
      /^[-*]\s+\[[ x]]\s/.test(remaining) ||
      /^[-*]\s/.test(remaining) ||
      /^\d+\.\s/.test(remaining) ||
      /^\[[ x]]\s/.test(remaining)
    );
  }

  private readList(): Token {
    const start = this.pos;
    const line = this.line;
    const column = this.column;
    const remaining = this.source.slice(this.pos);

    let type: TokenType;
    if (/^[-*]\s+\[[ x]]\s/.test(remaining)) {
      type = TokenType.TASK_LIST;
    } else if (/^[-*]\s/.test(remaining)) {
      type = TokenType.BULLET_LIST;
    } else if (/^\d+\.\s/.test(remaining)) {
      type = TokenType.ORDERED_LIST;
    } else if (/^\[[ x]]\s/.test(remaining)) {
      type = TokenType.TASK_LIST;
    } else {
      type = TokenType.BULLET_LIST;
    }

    let value = '';
    while (!this.isEof() && this.peekChar() !== '\n') {
      value += this.advanceChar();
    }

    return {
      type,
      value: value.trim(),
      line,
      column,
      length: this.pos - start,
    };
  }

  private matchHorizontalRule(): boolean {
    const remaining = this.source.slice(this.pos);
    return /^[-*_]{3,}\s*$/.test(remaining);
  }

  private readHorizontalRule(): Token {
    const start = this.pos;
    const line = this.line;
    const column = this.column;

    while (
      !this.isEof() &&
      this.peekChar() !== '\n' &&
      (this.peekChar() === '-' || this.peekChar() === '*' || this.peekChar() === '_')
    ) {
      this.advanceChar();
    }

    return {
      type: TokenType.HORIZONTAL_RULE,
      value: '',
      line,
      column,
      length: this.pos - start,
    };
  }

  private matchFrontmatter(): boolean {
    return this.source.slice(this.pos).startsWith('---') && (this.pos === 0 || this.source[this.pos - 1] === '\n');
  }

  private readFrontmatter(): Token {
    const start = this.pos;
    const line = this.line;
    const column = this.column;

    this.advanceChar();
    this.advanceChar();
    this.advanceChar();

    let content = '';
    while (!this.source.slice(this.pos).startsWith('---') && !this.isEof()) {
      content += this.advanceChar();
    }

    if (!this.isEof()) {
      this.advanceChar();
      this.advanceChar();
      this.advanceChar();
    }

    return {
      type: TokenType.FRONTMATTER,
      value: content,
      line,
      column,
      length: this.pos - start,
    };
  }

  private matchAbbreviationDef(): boolean {
    const remaining = this.source.slice(this.pos);
    return /^\*\[([A-Z0-9μ]+)]:\s+/.test(remaining);
  }

  private matchGlobalAbbreviationDef(): boolean {
    const remaining = this.source.slice(this.pos);
    return /^\*\*\[([A-Z0-9μ]+)]:\s+/.test(remaining);
  }

  private readGlobalAbbreviationDef(): Token {
    const start = this.pos;
    const line = this.line;
    const column = this.column;

    this.advanceChar();
    this.advanceChar();
    this.advanceChar();

    let abbreviation = '';
    while (!this.isEof() && this.peekChar() !== ']') {
      abbreviation += this.advanceChar();
    }

    if (!this.isEof()) {
      this.advanceChar();
    }

    if (!this.isEof() && this.peekChar() === ':') {
      this.advanceChar();
    }

    this.skipWhitespace();

    let definition = '';
    while (!this.isEof() && this.peekChar() !== '\n') {
      definition += this.advanceChar();
    }

    return {
      type: TokenType.ABBREVIATION_DEF_GLOBAL,
      value: `${abbreviation}:${definition.trim()}`,
      line,
      column,
      length: this.pos - start,
    };
  }

  private readAbbreviationDef(): Token {
    const start = this.pos;
    const line = this.line;
    const column = this.column;

    this.advanceChar();
    this.advanceChar();

    let abbreviation = '';
    while (!this.isEof() && this.peekChar() !== ']') {
      abbreviation += this.advanceChar();
    }

    if (!this.isEof()) {
      this.advanceChar();
    }

    if (!this.isEof() && this.peekChar() === ':') {
      this.advanceChar();
    }

    this.skipWhitespace();

    let definition = '';
    while (!this.isEof() && this.peekChar() !== '\n') {
      definition += this.advanceChar();
    }

    return {
      type: TokenType.ABBREVIATION_DEF,
      value: `${abbreviation}:${definition.trim()}`,
      line,
      column,
      length: this.pos - start,
    };
  }

  private readText(): Token {
    const start = this.pos;
    const line = this.line;
    const column = this.column;

    let value = '';
    while (!this.isEof() && this.peekChar() !== '\n') {
      value += this.advanceChar();
    }

    return {
      type: TokenType.TEXT,
      value,
      line,
      column,
      length: this.pos - start,
    };
  }

  private skipWhitespace(): void {
    while (!this.isEof() && this.peekChar() === ' ') {
      this.advanceChar();
    }
  }

  private peekChar(): string {
    return this.source[this.pos] || '';
  }

  private advanceChar(): string {
    const char = this.source[this.pos] || '';
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    this.pos++;
    return char;
  }

  private matchInlineComment(): boolean {
    const remaining = this.source.slice(this.pos);
    return /^%%/.test(remaining);
  }

  private readInlineComment(): Token {
    const start = this.pos;
    const line = this.line;
    const column = this.column;

    this.advanceChar(); // %
    this.advanceChar(); // %

    const commentStart = this.pos;

    while (!this.isEof() && this.peekChar() !== '\n') {
      if (this.peekChar() === '%' && this.source[this.pos + 1] === '%') {
        const content = this.source.slice(commentStart, this.pos);
        this.advanceChar(); // %
        this.advanceChar(); // %
        return {
          type: TokenType.COMMENT_INLINE,
          value: content.trim(),
          line,
          column,
          length: this.pos - start,
        };
      }
      this.advanceChar();
    }

    const content = this.source.slice(commentStart, this.pos);
    return {
      type: TokenType.COMMENT_INLINE,
      value: content.trim(),
      line,
      column,
      length: this.pos - start,
    };
  }

  private isEof(): boolean {
    return this.pos >= this.source.length;
  }
}
