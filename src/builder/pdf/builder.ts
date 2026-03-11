import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { ASTNode, DocumentNode } from '../../parser/types';
import type { Builder } from '../builder';
import type { ExpressionEvaluator } from '../evaluator/expression-evaluator';
import { defaultPDFStyles } from './styles';
import { BlockVisitor } from './visitors/block-visitor';
import { InlineVisitor } from './visitors/inline-visitor';
import { SpecialBlockVisitor } from './visitors/special-block-visitor';
import { TableVisitor } from './visitors/table-visitor';

export class PDFBuilder implements Builder {
  private inlineVisitor: InlineVisitor;
  private blockVisitor: BlockVisitor;
  private tableVisitor: TableVisitor;
  private specialBlockVisitor: SpecialBlockVisitor;
  private footnoteDefinitions: Map<string, { children: ASTNode[]; attributes?: any }> = new Map();

  constructor(
    private assetResolver?: (path: string) => string,
    private evaluator?: ExpressionEvaluator
  ) {
    const visitNodeBound = this.visitNode.bind(this);

    this.inlineVisitor = new InlineVisitor(visitNodeBound, this.assetResolver, this.evaluator);
    this.blockVisitor = new BlockVisitor(visitNodeBound);
    this.tableVisitor = new TableVisitor(visitNodeBound);
    this.specialBlockVisitor = new SpecialBlockVisitor(visitNodeBound);
  }

  async build(node: ASTNode): Promise<string> {
    const doc = await this.buildToDefinition(node);

    return JSON.stringify(doc);
  }

  async buildDocument(node: DocumentNode): Promise<string> {
    const docDef = await this.buildToDefinition(node);

    return JSON.stringify(docDef);
  }

  public async buildToDefinition(node: ASTNode): Promise<TDocumentDefinitions> {
    this.footnoteDefinitions.clear();
    const content: Content[] = [];

    if (node.type === 'Document') {
      for (const child of (node as DocumentNode).children) {
        const visited = await this.visitNode(child);
        if (visited && !this.isEmptyText(visited)) {
          content.push(visited);
        }
      }
    } else {
      content.push(await this.visitNode(node));
    }

    // Ajouter les notes de bas de page à la fin
    if (this.footnoteDefinitions.size > 0) {
      content.push({ text: '', margin: [0, 20, 0, 0] });
      content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, lineWidth: 1 }] });

      const footnotes: Content[] = [];
      for (const [id, def] of this.footnoteDefinitions.entries()) {
        const footnoteContent = await Promise.all(def.children.map((c) => this.visitNode(c)));
        footnotes.push({
          columns: [
            { text: `[${id}] `, width: 'auto', id: `fn-${id}` },
            { stack: footnoteContent, width: '*' },
          ],
          margin: [0, 5, 0, 5],
          fontSize: 9,
        });
      }
      content.push({ stack: footnotes });
    }

    return {
      content,
      styles: defaultPDFStyles,
      defaultStyle: {
        fontSize: 11,
      },
    };
  }

  private isEmptyText(content: Content): boolean {
    return (
      typeof content === 'object' &&
      'text' in content &&
      content.text === '' &&
      !('id' in content) &&
      !('pageBreak' in content)
    );
  }

  private async visitNode(node: ASTNode): Promise<Content> {
    switch (node.type) {
      case 'Text':
        return this.inlineVisitor.visitText(node as any);
      case 'Anchor':
        return this.inlineVisitor.visitAnchor(node as any);
      case 'Paragraph':
        return await this.blockVisitor.visitParagraph(node as any);
      case 'Heading':
        return await this.blockVisitor.visitHeading(node as any);
      case 'Bold':
      case 'Italic':
      case 'Underline':
      case 'Strikethrough':
        return await this.inlineVisitor.visitInlineStyle(node as any);
      case 'Superscript':
        return await this.inlineVisitor.visitSuperscript(node as any);
      case 'Subscript':
        return await this.inlineVisitor.visitSubscript(node as any);
      case 'Highlight':
        return await this.inlineVisitor.visitHighlight(node as any);
      case 'Code':
        return this.inlineVisitor.visitCode(node as any);
      case 'Link':
        return await this.inlineVisitor.visitLink(node as any);
      case 'Image':
        return await this.inlineVisitor.visitImage(node as any);
      case 'Video':
        return await this.inlineVisitor.visitVideo(node as any);
      case 'Audio':
        return await this.inlineVisitor.visitAudio(node as any);
      case 'Embed':
        return await this.inlineVisitor.visitEmbed(node as any);
      case 'File':
        return await this.inlineVisitor.visitFile(node as any);
      case 'Footnote':
        return await this.inlineVisitor.visitFootnote(node as any);
      case 'FootnoteDefinition':
        this.footnoteDefinitions.set((node as any).id, {
          children: (node as any).children,
          attributes: (node as any).attributes,
        });
        return { text: '' };
      case 'Abbreviation':
        return this.inlineVisitor.visitAbbreviation(node as any);
      case 'CommentInline':
        return this.inlineVisitor.visitCommentInline(node as any);
      case 'Math':
        return this.inlineVisitor.visitMath(node as any);
      case 'Blockquote':
        return await this.blockVisitor.visitBlockquote(node as any);
      case 'List':
        return await this.blockVisitor.visitList(node as any);
      case 'ListItem':
        return await this.blockVisitor.visitListItem(node as any);
      case 'DefinitionTerm':
        return await this.blockVisitor.visitDefinitionTerm(node as any);
      case 'DefinitionDescription':
        return await this.blockVisitor.visitDefinitionDescription(node as any);
      case 'Table':
        return await this.tableVisitor.visitTable(node as any);
      case 'Indentation':
        return await this.blockVisitor.visitIndentation(node as any);
      case 'TripleColonBlock':
        return await this.specialBlockVisitor.visitTripleColonBlock(node as any);
      case 'VariableDefinition':
        return { text: '' };
      case 'DoubleBracketBlock':
        return await this.specialBlockVisitor.visitDoubleBracketBlock(node as any);
      case 'CodeBlock':
        return this.blockVisitor.visitCodeBlock(node as any);
      case 'HorizontalRule':
        return this.blockVisitor.visitHorizontalRule(node as any);
      case 'LineBreak':
        return this.blockVisitor.visitLineBreak();
      case 'PageBreak':
        return this.blockVisitor.visitPageBreak();
      default:
        return { text: `[Unsupported node: ${node.type}]`, color: 'red' };
    }
  }
}
