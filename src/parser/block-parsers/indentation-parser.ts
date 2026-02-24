import { TokenType, Token } from '../../lexer/token-types';
import { ASTNode, IndentationNode, ParagraphNode } from '../types';
import { ListParser } from './list-parser';
import { TripleColonParser } from './triple-colon-parser';

export class IndentationParser {
  constructor(
    private listParser: ListParser,
    private tripleColonParser: TripleColonParser
  ) {}

  public parseIndentation(expect: (type: TokenType) => Token): any {
    const token = expect(TokenType.INDENTATION);
    return { type: 'Indentation', level: token.value.length / 2, children: [] };
  }

  public parseTechnicalIndentation(
    tokens: Token[],
    pos: { current: number },
    currentToken: () => Token,
    advance: () => Token,
    expect: (type: TokenType) => Token,
    match: (...types: TokenType[]) => boolean,
    skipNewlines: () => void,
    isEof: () => boolean,
    parseBlock: () => ASTNode | null,
    parseHeading: () => ASTNode,
    parseCodeBlock: () => ASTNode,
    parseHorizontalRule: () => ASTNode,
    parseParagraph: () => ParagraphNode,
    error: (message: string, code: string) => never
  ): IndentationNode {
    const startToken = expect(TokenType.TECHNICAL_INDENT);
    const baseLevel = startToken.level || 1;
    const children: ASTNode[] = [];

    const firstLineContent = this.parseIndentationLineContent(
      tokens, pos, currentToken, advance, expect, match, skipNewlines, isEof,
      parseBlock, parseHeading, parseCodeBlock, parseHorizontalRule, parseParagraph, error
    );
    if (firstLineContent) children.push(firstLineContent);

    while (!isEof()) {
      if (match(TokenType.TECHNICAL_INDENT)) {
        const nextLevel = currentToken().level || 1;
        if (nextLevel < baseLevel) break;
        if (nextLevel > baseLevel) {
          children.push(this.parseTechnicalIndentation(
            tokens, pos, currentToken, advance, expect, match, skipNewlines, isEof,
            parseBlock, parseHeading, parseCodeBlock, parseHorizontalRule, parseParagraph, error
          ));
          continue;
        }
        advance();
        const lineContent = this.parseIndentationLineContent(
          tokens, pos, currentToken, advance, expect, match, skipNewlines, isEof,
          parseBlock, parseHeading, parseCodeBlock, parseHorizontalRule, parseParagraph, error
        );
        if (lineContent) children.push(lineContent);
        continue;
      }
      if (!match(TokenType.NEWLINE)) break;
      advance();
      if (match(TokenType.NEWLINE)) break;
    }
    return { type: 'Indentation', level: baseLevel, children };
  }

  private parseIndentationLineContent(
    tokens: Token[],
    pos: { current: number },
    currentToken: () => Token,
    advance: () => Token,
    expect: (type: TokenType) => Token,
    match: (...types: TokenType[]) => boolean,
    skipNewlines: () => void,
    isEof: () => boolean,
    parseBlock: () => ASTNode | null,
    parseHeading: () => ASTNode,
    parseCodeBlock: () => ASTNode,
    parseHorizontalRule: () => ASTNode,
    parseParagraph: () => ParagraphNode,
    error: (message: string, code: string) => never
  ): ASTNode | null {
    if (match(TokenType.TECHNICAL_INDENT, TokenType.NEWLINE, TokenType.EOF)) return null;
    if (match(TokenType.HEADING)) return parseHeading();
    if (match(TokenType.CODE_BLOCK_START)) return parseCodeBlock();
    if (match(TokenType.HORIZONTAL_RULE)) return parseHorizontalRule();
    if (match(TokenType.TRIPLE_COLON_START)) {
      const { node, newPos } = this.tripleColonParser.parseTripleColonBlock(
        tokens,
        pos.current,
        advance,
        expect,
        match,
        skipNewlines,
        isEof,
        parseBlock,
        error
      );
      pos.current = newPos;
      return node;
    }
    if (match(TokenType.BULLET_LIST, TokenType.ORDERED_LIST, TokenType.TASK_LIST)) {
      return this.parseIndentationList(tokens, pos, currentToken, advance, match, skipNewlines, isEof, parseBlock);
    }
    return parseParagraph();
  }

  private parseIndentationList(
    tokens: Token[],
    pos: { current: number },
    currentToken: () => Token,
    advance: () => Token,
    match: (...types: TokenType[]) => boolean,
    skipNewlines: () => void,
    isEof: () => boolean,
    parseBlock: () => ASTNode | null
  ): any {
    const kind = this.listParser.getListKind(currentToken().type);
    const children: any[] = [];

    while (!isEof()) {
      if (!match(TokenType.BULLET_LIST, TokenType.ORDERED_LIST, TokenType.TASK_LIST)) break;
      if (this.listParser.getListKind(currentToken().type) !== kind) break;

      const item = this.listParser.parseListItem(
        kind,
        '',
        advance,
        (offset) => tokens[pos.current + (offset || 0)] || { type: TokenType.EOF },
        match,
        skipNewlines,
        isEof,
        parseBlock
      );
      children.push(item);
      skipNewlines();

      if (match(TokenType.TECHNICAL_INDENT)) {
        if (currentToken().level !== 1) break;
        const peekedNext = tokens[pos.current + 1] || { type: TokenType.EOF };
        if (![TokenType.BULLET_LIST, TokenType.ORDERED_LIST, TokenType.TASK_LIST].includes(peekedNext.type)) break;
        if (this.listParser.getListKind(peekedNext.type) !== kind) break;
        advance();
      }
    }
    return { type: 'List', kind, children };
  }
}
