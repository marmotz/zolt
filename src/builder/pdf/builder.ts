import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { ASTNode, DocumentNode, HeadingNode, ParagraphNode, TextNode } from '../../parser/types';
import type { Builder } from '../builder';
import { defaultPDFStyles } from './styles';

export class PDFBuilder implements Builder {
  async build(node: ASTNode): Promise<string> {
    // PDFBuilder ne retourne pas directement une string mais génère un buffer.
    // Cette méthode pourra être utilisée pour des exports intermédiaires ou de debug.
    const doc = await this.buildToDefinition(node);

    return JSON.stringify(doc);
  }

  async buildDocument(node: DocumentNode): Promise<string> {
    const docDef = await this.buildToDefinition(node);

    return JSON.stringify(docDef);
  }

  /**
   * Transforme un DocumentNode Zolt en définition pdfmake.
   */
  public async buildToDefinition(node: ASTNode): Promise<TDocumentDefinitions> {
    const content: Content[] = [];

    if (node.type === 'Document') {
      for (const child of (node as DocumentNode).children) {
        content.push(await this.visitNode(child));
      }
    } else {
      content.push(await this.visitNode(node));
    }

    return {
      content,
      styles: defaultPDFStyles,
      defaultStyle: {
        fontSize: 11,
      },
    };
  }

  private async visitNode(node: ASTNode): Promise<Content> {
    switch (node.type) {
      case 'Text':
        return this.visitText(node as TextNode);
      case 'Paragraph':
        return await this.visitParagraph(node as ParagraphNode);
      case 'Heading':
        return await this.visitHeading(node as HeadingNode);
      case 'Bold':
      case 'Italic':
      case 'Underline':
      case 'Strikethrough':
        return await this.visitInlineStyle(node as any);
      default:
        // Fallback pour les nœuds non encore supportés
        return { text: `[Unsupported node: ${node.type}]`, color: 'red' };
    }
  }

  private visitText(node: TextNode): Content {
    return { text: node.content };
  }

  private async visitParagraph(node: ParagraphNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    return {
      text: children,
      style: 'paragraph',
    };
  }

  private async visitHeading(node: HeadingNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    return {
      text: children,
      style: `header${node.level}`,
    };
  }

  private async visitInlineStyle(node: any): Promise<Content> {
    const children = await Promise.all(node.children.map((child: ASTNode) => this.visitNode(child)));
    const styleMap: Record<string, string> = {
      Bold: 'bold',
      Italic: 'italic',
      Underline: 'underline',
      Strikethrough: 'strikethrough',
    };

    return {
      text: children,
      style: styleMap[node.type] || '',
    };
  }
}
