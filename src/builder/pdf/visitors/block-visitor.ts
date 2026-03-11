import type { Content } from 'pdfmake/interfaces';
import type {
  ASTNode,
  BlockquoteNode,
  CodeBlockNode,
  DefinitionDescriptionNode,
  DefinitionTermNode,
  HeadingNode,
  HorizontalRuleNode,
  IndentationNode,
  ListItemNode,
  ListNode,
  ParagraphNode,
} from '../../../parser/types';
import { applyAttributes } from '../utils/attribute-applier';

export class BlockVisitor {
  constructor(private visitNode: (node: ASTNode) => Promise<Content>) {}

  async visitParagraph(node: ParagraphNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    return applyAttributes(
      {
        text: children,
        style: 'paragraph',
      },
      node
    );
  }

  async visitHeading(node: HeadingNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    // On ignore les titres qui ont l'attribut noToc
    const tocItem = !(node.attributes && Object.hasOwn(node.attributes, 'noToc'));

    return applyAttributes(
      {
        text: children,
        style: `header${node.level}`,
        tocItem,
        tocLevel: node.level - 1,
      } as any,
      node
    );
  }

  async visitBlockquote(node: BlockquoteNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    return applyAttributes(
      {
        stack: children,
        style: 'blockquote',
      },
      node
    );
  }

  async visitList(node: ListNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    let listContent: Content;
    if (node.kind === 'numbered') {
      listContent = { ol: children } as Content;
    } else if (node.kind === 'definition' || node.kind === 'plain') {
      listContent = { stack: children } as Content;
    } else {
      // bullet or task
      listContent = { ul: children } as Content;
    }

    if (node.kind === 'task') {
      (listContent as any).listType = 'none';
    }

    return applyAttributes(listContent, node);
  }

  async visitListItem(node: ListItemNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    let listItem: Content;
    if (node.checked !== undefined) {
      // C'est une tâche
      const checkbox = node.checked ? '☑ ' : '☐ ';
      listItem = {
        columns: [
          { text: checkbox, width: 'auto' },
          { stack: children, width: '*' },
        ],
        columnGap: 5,
      };
    } else if (children.length > 1) {
      listItem = { stack: children };
    } else if (children.length === 1) {
      listItem = children[0];
    } else {
      listItem = { text: '' };
    }

    return applyAttributes(listItem, node);
  }

  async visitDefinitionTerm(node: DefinitionTermNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    return {
      text: children,
      bold: true,
      margin: [0, 5, 0, 0],
    };
  }

  async visitDefinitionDescription(node: DefinitionDescriptionNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    return {
      stack: children,
      margin: [15, 0, 0, 5],
    };
  }

  async visitIndentation(node: IndentationNode): Promise<Content> {
    const children = await Promise.all(node.children.map((child) => this.visitNode(child)));

    return {
      stack: children,
      margin: [node.level * 20, 0, 0, 0],
    };
  }

  visitHorizontalRule(_node: HorizontalRuleNode): Content {
    return {
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 5,
          x2: 515,
          y2: 5,
          lineWidth: 1,
          lineColor: '#cccccc',
        },
      ],
      margin: [0, 10, 0, 10],
    };
  }

  visitLineBreak(): Content {
    return { text: '\n' };
  }

  visitPageBreak(): Content {
    return { text: '', pageBreak: 'after' };
  }

  visitCodeBlock(node: CodeBlockNode): Content {
    return {
      table: {
        widths: ['*'],
        body: [
          [
            {
              text: node.content,
              style: 'code',
              margin: [5, 5, 5, 5],
            },
          ],
        ],
      },
      layout: 'noBorders',
      fillColor: '#f4f4f4',
      margin: [0, 5, 0, 10],
    };
  }
}
