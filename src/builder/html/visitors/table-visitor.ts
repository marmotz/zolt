import { ASTNode, TableCellNode, TableNode, TableRowNode } from '../../../parser/types';

export class TableVisitor {
  constructor(
    private joinChildren: (nodes: ASTNode[]) => string,
    private renderAllAttributes: (attrs?: any) => string
  ) {}

  visitTable(node: TableNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    let html = `<table${attrs}>\n`;

    if (node.header) {
      html += '  <thead>\n';
      html += '    ' + this.visitTableRow(node.header, true) + '\n';
      html += '  </thead>\n';
    }

    if (node.rows.length > 0) {
      html += '  <tbody>\n';
      for (const row of node.rows) {
        html += '    ' + this.visitTableRow(row, false) + '\n';
      }
      html += '  </tbody>\n';
    }

    html += '</table>';

    return html;
  }

  visitTableRow(node: TableRowNode, isHeader: boolean): string {
    let html = '<tr>';
    for (const cell of node.cells) {
      html += this.visitTableCell(cell, isHeader);
    }
    html += '</tr>';

    return html;
  }

  visitTableCell(node: TableCellNode, isHeaderRow: boolean): string {
    const tag = node.isHeader || isHeaderRow ? 'th' : 'td';
    const childrenHtml = this.joinChildren(node.children);

    const attrs: string[] = [];
    if (node.alignment) {
      attrs.push(`style="text-align: ${node.alignment};"`);
    }
    if (node.colspan) {
      attrs.push(`colspan="${node.colspan}"`);
    }
    if (node.rowspan) {
      attrs.push(`rowspan="${node.rowspan}"`);
    }

    const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

    return `<${tag}${attrsStr}>${childrenHtml}</${tag}>`;
  }
}
