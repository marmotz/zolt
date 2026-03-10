import type { Content } from 'pdfmake/interfaces';
import type { ASTNode, TripleColonBlockNode } from '../../../parser/types';
import { applyAttributes } from '../utils/attribute-applier';

export class SpecialBlockVisitor {
  constructor(private visitNode: (node: ASTNode) => Promise<Content>) {}

  async visitTripleColonBlock(node: TripleColonBlockNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    let blockContent: Content;
    if (node.blockType === 'columns') {
      blockContent = {
        columns: children.map((child) => ({ stack: [child] })),
        columnGap: 10,
        margin: [0, 10, 0, 10],
      };
    } else {
      const alertStyles: Record<string, { color: string; background: string; title: string }> = {
        info: { color: '#004085', background: '#cce5ff', title: 'INFO' },
        warning: { color: '#856404', background: '#fff3cd', title: 'WARNING' },
        error: { color: '#721c24', background: '#f8d7da', title: 'ERROR' },
        success: { color: '#155724', background: '#d4edda', title: 'SUCCESS' },
        note: { color: '#383d41', background: '#e2e3e5', title: 'NOTE' },
      };

      const style = alertStyles[node.blockType];
      if (style) {
        blockContent = {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [{ text: node.title || style.title, bold: true, margin: [0, 0, 0, 5] }, ...children],
                  margin: [10, 10, 10, 10],
                },
              ],
            ],
          },
          layout: 'noBorders',
          fillColor: style.background,
          color: style.color,
          margin: [0, 10, 0, 10],
        };
      } else {
        blockContent = {
          stack: children,
          margin: [0, 10, 0, 10],
        };
      }
    }

    return applyAttributes(blockContent, node);
  }
}
