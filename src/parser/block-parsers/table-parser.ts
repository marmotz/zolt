import { Token, TokenType } from '../../lexer/token-types';
import { InlineParser } from '../inline-parser';
import { Attributes, TableCellNode, TableNode, TableRowNode } from '../types';

export class TableParser {
  constructor(private inlineParser: InlineParser) {}

  public isTableStart(token: Token): boolean {
    if (token.type === TokenType.DOUBLE_BRACKET_START) {
      return token.value.startsWith('table');
    }
    if (token.type !== TokenType.TEXT) {
      return false;
    }
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
    let attributes: Attributes | undefined;
    let isWrapped = false;

    if (match(TokenType.DOUBLE_BRACKET_START) && peek().value.startsWith('table')) {
      const token = expect(TokenType.DOUBLE_BRACKET_START);
      isWrapped = true;
      const value = token.value;
      const firstSpaceIndex = value.indexOf(' ');
      if (firstSpaceIndex !== -1) {
        const attrStr = value.substring(firstSpaceIndex + 1).trim();
        // Check if it's already an attribute string like {id=foo} or just raw like id=foo
        if (attrStr.startsWith('{') && attrStr.endsWith('}')) {
          attributes = this.inlineParser.parseAttributes(attrStr.substring(1, attrStr.length - 1));
        } else {
          attributes = this.inlineParser.parseAttributes(attrStr);
        }
      }
      skipNewlines();
    }

    while (
      !isEof() &&
      (this.isTableStart(peek()) ||
        (isWrapped && peek().type === TokenType.TEXT && peek().value.trim().startsWith('|')))
    ) {
      if (match(TokenType.DOUBLE_BRACKET_START)) {
        if (this.currentTokenIsTableEnd(peek())) {
          break;
        }
      }

      if (!peek().value.trim().startsWith('|')) {
        break;
      }

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

    if (isWrapped && match(TokenType.DOUBLE_BRACKET_START) && this.currentTokenIsTableEnd(peek())) {
      expect(TokenType.DOUBLE_BRACKET_START);
    }

    this.applyAlignments(header, rows, alignments);

    return {
      type: 'Table',
      header,
      rows,
      attributes,
    };
  }

  private applyAlignments(
    header: TableRowNode | undefined,
    rows: TableRowNode[],
    alignments: ('left' | 'center' | 'right' | undefined)[]
  ): void {
    if (alignments.length === 0) return;

    const allRows = header ? [header, ...rows] : rows;
    const occupied: Set<number>[] = [];

    allRows.forEach((row, rowIndex) => {
      let currentCol = 0;
      if (!occupied[rowIndex]) occupied[rowIndex] = new Set();
      const rowOccupied = occupied[rowIndex];

      row.cells.forEach((cell) => {
        // Find next free column in current row
        while (rowOccupied.has(currentCol)) {
          currentCol++;
        }

        // Apply alignment from the logical column index
        if (currentCol < alignments.length && alignments[currentCol]) {
          cell.alignment = alignments[currentCol];
        }

        const colspan = cell.colspan || 1;
        const rowspan = cell.rowspan || 1;

        // Mark occupied cells for current and subsequent rows
        for (let r = 0; r < rowspan; r++) {
          const targetRowIndex = rowIndex + r;
          if (!occupied[targetRowIndex]) occupied[targetRowIndex] = new Set();
          for (let c = 0; c < colspan; c++) {
            occupied[targetRowIndex].add(currentCol + c);
          }
        }

        currentCol += colspan;
      });
    });
  }

  private currentTokenIsTableEnd(token: Token): boolean {
    return token.type === TokenType.DOUBLE_BRACKET_START && token.value === '/table';
  }

  private parseTableRow(expect: (type: TokenType) => Token): { row: TableRowNode; rawCells: string[] } {
    const token = expect(TokenType.TEXT);
    const line = token.value.trim();

    // Remove leading and trailing pipes
    const content = line.replace(/^\|/, '').replace(/\|$/, '');
    const rawCells = this.splitCells(content);

    const cells: TableCellNode[] = rawCells.map((cell) => {
      let isHeader = false;
      let colspan: number | undefined;
      let rowspan: number | undefined;
      let cellContent = cell;

      // Match markers: [h], [colspan=N], [rowspan=N]
      const markerRegex = /^\[(h|colspan=(\d+)|rowspan=(\d+))]\s*/g;
      let match;
      while ((match = markerRegex.exec(cellContent)) !== null) {
        if (match[1] === 'h') {
          isHeader = true;
        } else if (match[1].startsWith('colspan=')) {
          colspan = parseInt(match[2], 10);
        } else if (match[1].startsWith('rowspan=')) {
          rowspan = parseInt(match[3], 10);
        }
        // Move cellContent past the marker
        cellContent = cellContent.substring(match[0].length);
        // Reset regex because we modified cellContent
        markerRegex.lastIndex = 0;
      }

      return {
        type: 'TableCell',
        children: this.inlineParser.parse(cellContent.trim()),
        isHeader: isHeader || undefined,
        colspan,
        rowspan,
      };
    });

    return {
      row: {
        type: 'TableRow',
        cells,
      },
      rawCells,
    };
  }

  private splitCells(content: string): string[] {
    const cells: string[] = [];
    let currentCell = '';
    let inBackticks = false;
    let backtickCount = 0;
    let escaped = false;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      if (escaped) {
        currentCell += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        currentCell += char;
        continue;
      }

      if (char === '`') {
        let count = 1;
        while (i + 1 < content.length && content[i + 1] === '`') {
          count++;
          i++;
        }
        const backticks = '`'.repeat(count);
        currentCell += backticks;

        if (!inBackticks) {
          inBackticks = true;
          backtickCount = count;
        } else if (count === backtickCount) {
          inBackticks = false;
          backtickCount = 0;
        }
        continue;
      }

      if (char === '|' && !inBackticks) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    cells.push(currentCell.trim());

    return cells;
  }

  private isSeparatorRow(rawCells: string[]): boolean {
    return rawCells.length > 0 && rawCells.every((cell) => /^[ 	]*:?-+:?[ 	]*$/.test(cell));
  }

  private parseAlignments(rawCells: string[]): ('left' | 'center' | 'right' | undefined)[] {
    return rawCells.map((cell) => {
      const trimmed = cell.trim();
      const startsWithColon = trimmed.startsWith(':');
      const endsWithColon = trimmed.endsWith(':');

      if (startsWithColon && endsWithColon) {
        return 'center';
      }
      if (endsWithColon) {
        return 'right';
      }
      if (startsWithColon) {
        return 'left';
      }

      return undefined;
    });
  }
}
