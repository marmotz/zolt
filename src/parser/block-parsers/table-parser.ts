import { TokenType, Token } from '../../lexer/token-types';
import { InlineParser } from '../inline-parser';
import { TableNode, TableRowNode, TableCellNode } from '../types';

export class TableParser {
  constructor(private inlineParser: InlineParser) {}

  public isTableStart(token: Token): boolean {
    if (token.type !== TokenType.TEXT) return false;
    const value = token.value.trim();
    return value.startsWith('|') && !value.startsWith('||');
  }

  public parseTable(
    expect: (type: TokenType) => Token,
    match: (...types: TokenType[]) => boolean,
    skipNewlines: () => void,
    isEof: () => boolean,
    peek: (offset?: number) => Token
  ): TableNode {
    const rows: TableRowNode[] = [];
    let header: TableRowNode | undefined;
    let alignments: ('left' | 'center' | 'right' | undefined)[] = [];

    while (!isEof() && this.isTableStart(peek())) {
      const { row, rawCells } = this.parseTableRow(expect);

      // Check if this is a separator row (e.g., |---|---|)
      if (this.isSeparatorRow(rawCells)) {
        if (rows.length > 0 && !header) {
          header = rows.pop();
          alignments = this.parseAlignments(rawCells);
        }
      } else {
        rows.push(row);
      }

      skipNewlines();
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

  private parseTableRow(expect: (type: TokenType) => Token): { row: TableRowNode; rawCells: string[] } {
    const token = expect(TokenType.TEXT);
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
    return rawCells.length > 0 && rawCells.every((cell) => /^[ 	]*:?-+:?[ 	]*$/.test(cell));
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
}
