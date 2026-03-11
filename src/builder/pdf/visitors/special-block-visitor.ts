import type { Content } from 'pdfmake/interfaces';
import type { ASTNode, DoubleBracketBlockNode, TripleColonBlockNode } from '../../../parser/types';
import { applyAttributes } from '../utils/attribute-applier';

export class SpecialBlockVisitor {
  private hasToc = false;

  constructor(private visitNode: (node: ASTNode) => Promise<Content>) {}

  /**
   * Réinitialise l'état du visiteur (appelé au début d'un nouveau document).
   */
  public reset(): void {
    this.hasToc = false;
  }

  async visitTripleColonBlock(node: TripleColonBlockNode): Promise<Content> {
    let blockContent: Content;

    switch (node.blockType) {
      case 'columns': {
        const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

        blockContent = {
          columns: children.map((child) => ({ stack: [child] })),
          columnGap: 10,
          margin: [0, 10, 0, 10],
        };
        break;
      }

      case 'tabs': {
        const tabContents: Content[] = [];
        for (const child of node.children) {
          if (child.type === 'TripleColonBlock' && (child as TripleColonBlockNode).blockType === 'tab') {
            const tabNode = child as TripleColonBlockNode;
            if (tabNode.title) {
              tabContents.push({ text: tabNode.title, bold: true, margin: [0, 10, 0, 5], fontSize: 12 });
            }
            const children = await Promise.all(tabNode.children.map((c) => this.visitNode(c)));
            tabContents.push({ stack: children, margin: [0, 0, 0, 10] });
          }
        }
        blockContent = {
          stack: tabContents,
          margin: [0, 10, 0, 10],
        };
        break;
      }

      case 'sidebar':
        // On ignore totalement la sidebar comme demandé
        return { text: '' };

      case 'details': {
        const children = await Promise.all(node.children.map((child) => this.visitNode(child)));
        blockContent = {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [{ text: node.title || 'Details', bold: true, margin: [0, 0, 0, 5] }, ...children],
                  margin: [10, 10, 10, 10],
                },
              ],
            ],
          },
          margin: [0, 10, 0, 10],
        };
        break;
      }

      case 'info':
      case 'warning':
      case 'error':
      case 'success':
      case 'note': {
        const children = await Promise.all(node.children.map((child) => this.visitNode(child)));
        const alertStyles: Record<string, { color: string; background: string; title: string }> = {
          info: { color: '#004085', background: '#cce5ff', title: 'INFO' },
          warning: { color: '#856404', background: '#fff3cd', title: 'WARNING' },
          error: { color: '#721c24', background: '#f8d7da', title: 'ERROR' },
          success: { color: '#155724', background: '#d4edda', title: 'SUCCESS' },
          note: { color: '#383d41', background: '#e2e3e5', title: 'NOTE' },
        };

        const style = alertStyles[node.blockType];
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
        break;
      }

      default: {
        const children = await Promise.all(node.children.map((child) => this.visitNode(child)));
        blockContent = {
          stack: children,
          margin: [0, 10, 0, 10],
        };
      }
    }

    return applyAttributes(blockContent, node);
  }

  async visitDoubleBracketBlock(node: DoubleBracketBlockNode): Promise<Content> {
    let blockContent: Content;

    switch (node.blockType) {
      case 'toc':
        if (this.hasToc) {
          return { text: '' };
        }
        this.hasToc = true;
        blockContent = {
          toc: {
            title: { text: node.attributes?.title || 'Table of Contents', style: 'header2' },
          },
          margin: [0, 10, 0, 20],
        };
        break;

      case 'filetree':
      case 'filetree-nav':
        // On ignore totalement le filetree comme demandé
        return { text: '' };

      default:
        // Pour les autres types, on ignore ou on affiche le contenu brut
        return { text: '' };
    }

    return applyAttributes(blockContent, node);
  }
}
