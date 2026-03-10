import type { Content } from 'pdfmake/interfaces';
import type { ASTNode, TableCellNode, TableNode, TableRowNode } from '../../../parser/types';
import { applyAttributes } from '../utils/attribute-applier';

export class TableVisitor {
  constructor(private visitNode: (node: ASTNode) => Promise<Content>) {}

  async visitTable(node: TableNode): Promise<Content> {
    const body: any[][] = [];

    if (node.header) {
      const headerRow = await this.visitTableRow(node.header);
      body.push(headerRow);
    }

    for (const row of node.rows) {
      const visitedRow = await this.visitTableRow(row);
      body.push(visitedRow);
    }

    return applyAttributes(
      {
        table: {
          headerRows: node.header ? 1 : 0,
          body,
        },
        margin: [0, 10, 0, 10],
      },
      node
    );
  }

  private async visitTableRow(node: TableRowNode): Promise<any[]> {
    return Promise.all(node.cells.map((cell) => this.visitTableCell(cell)));
  }

  private async visitTableCell(node: TableCellNode): Promise<any> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    const cell: any = {
      stack: children,
    };

    if (node.isHeader) {
      cell.bold = true;
      cell.fillColor = '#eeeeee';
    }

    if (node.alignment) {
      cell.alignment = node.alignment;
    }

    if (node.colspan && node.colspan > 1) {
      cell.colSpan = node.colspan;
    }

    if (node.rowspan && node.rowspan > 1) {
      cell.rowSpan = node.rowspan;
    }

    return cell;
  }
}
