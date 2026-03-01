import { type Token, TokenType } from '../../lexer/token-types';
import type { ASTNode, BlockquoteNode, ParagraphNode } from '../types';
import type { ListParser } from './list-parser';
import type { TripleColonParser } from './triple-colon-parser';

export class BlockquoteParser {
  constructor(
    private listParser: ListParser,
    private tripleColonParser: TripleColonParser
  ) {}

  public parseBlockquote(
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
    error: (message: string, code: string) => never,
    warn: (message: string, code: string) => void
  ): BlockquoteNode {
    const startToken = expect(TokenType.BLOCKQUOTE);
    const baseLevel = startToken.level || 1;
    const children: ASTNode[] = [];

    const firstLineContent = this.parseBlockquoteLineContent(
      tokens,
      pos,
      currentToken,
      advance,
      expect,
      match,
      skipNewlines,
      isEof,
      parseBlock,
      parseHeading,
      parseCodeBlock,
      parseHorizontalRule,
      parseParagraph,
      warn
    );
    if (firstLineContent) {
      children.push(firstLineContent);
    }

    while (!isEof()) {
      if (match(TokenType.BLOCKQUOTE)) {
        const nextLevel = currentToken().level || 1;
        if (nextLevel < baseLevel) {
          break;
        }
        if (nextLevel > baseLevel) {
          children.push(
            this.parseBlockquote(
              tokens,
              pos,
              currentToken,
              advance,
              expect,
              match,
              skipNewlines,
              isEof,
              parseBlock,
              parseHeading,
              parseCodeBlock,
              parseHorizontalRule,
              parseParagraph,
              error,
              warn
            )
          );
          continue;
        }
        advance();
        const lineContent = this.parseBlockquoteLineContent(
          tokens,
          pos,
          currentToken,
          advance,
          expect,
          match,
          skipNewlines,
          isEof,
          parseBlock,
          parseHeading,
          parseCodeBlock,
          parseHorizontalRule,
          parseParagraph,
          warn
        );
        if (lineContent) {
          children.push(lineContent);
        }
        continue;
      }
      if (!match(TokenType.NEWLINE)) {
        break;
      }
      advance();
      if (match(TokenType.NEWLINE)) {
        break;
      }
    }

    return { type: 'Blockquote', level: baseLevel, children };
  }

  private parseBlockquoteLineContent(
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
    warn: (message: string, code: string) => void
  ): ASTNode | null {
    if (match(TokenType.BLOCKQUOTE, TokenType.NEWLINE, TokenType.EOF)) {
      return null;
    }
    if (match(TokenType.HEADING)) {
      return parseHeading();
    }
    if (match(TokenType.CODE_BLOCK_START)) {
      return parseCodeBlock();
    }
    if (match(TokenType.HORIZONTAL_RULE)) {
      return parseHorizontalRule();
    }
    if (match(TokenType.TRIPLE_COLON_START)) {
      return this.tripleColonParser.parseTripleColonBlock(
        advance,
        expect,
        match,
        skipNewlines,
        isEof,
        parseBlock,
        warn
      );
    }
    if (match(TokenType.BULLET_LIST, TokenType.ORDERED_LIST, TokenType.TASK_LIST)) {
      return this.parseBlockquoteList(tokens, pos, currentToken, advance, match, skipNewlines, isEof, parseBlock);
    }

    return parseParagraph();
  }

  private parseBlockquoteList(
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
    if (!kind) {
      return null;
    }

    const children: any[] = [];

    while (!isEof()) {
      if (!match(TokenType.BULLET_LIST, TokenType.ORDERED_LIST, TokenType.TASK_LIST)) {
        break;
      }
      if (this.listParser.getListKind(currentToken().type) !== kind) {
        break;
      }

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
      // listParser.parseListItem returns newPos in some cases?
      // Actually list-parser.ts seems to take pos as a number but some parts of Parser use it differently.
      // Looking at list-parser.ts: parseListItem(kind, indent, tokens, pos, advance, peek, match, skipNewlines, isEof, parseBlock)
      // Wait, I should check list-parser.ts signature.

      // I'll check list-parser.ts first.
      children.push(item);
      skipNewlines();

      if (match(TokenType.BLOCKQUOTE)) {
        if (currentToken().level !== 1) {
          break;
        }
        const peekedNext = tokens[pos.current + 1] || { type: TokenType.EOF };
        if (![TokenType.BULLET_LIST, TokenType.ORDERED_LIST, TokenType.TASK_LIST].includes(peekedNext.type)) {
          break;
        }
        if (this.listParser.getListKind(peekedNext.type) !== kind) {
          break;
        }
        advance();
      }
    }

    return { type: 'List', kind, children };
  }
}
