import { DocumentNode, ASTNode, HeadingNode } from '../../parser/types';
import { ExpressionEvaluator } from '../evaluator/expression-evaluator';
import { DEFAULT_CSS } from './assets/styles';
import { TABS_SCRIPT, ANCHOR_SCRIPT, CHART_SCRIPT, MERMAID_SCRIPT } from './assets/scripts';

export interface DocumentRendererOptions {
  hasTabs: boolean;
  hasCharts: boolean;
  hasMermaid: boolean;
}

export class DocumentRenderer {
  constructor(private evaluator: ExpressionEvaluator) {}

  public renderDocument(
    node: DocumentNode,
    options: DocumentRendererOptions,
    buildChildren: (nodes: ASTNode[]) => string,
    visitFrontmatter: (node: any) => string
  ): string {
    if (node.frontmatter) {
      visitFrontmatter(node.frontmatter);
    }

    const children = [...node.children];
    if (this.evaluator.getVariable('toc') === true) {
      children.unshift({
        type: 'DoubleBracketBlock',
        blockType: 'toc',
        content: '',
        attributes: {},
      } as any);
    }

    const childrenHtml = buildChildren(children);

    const tabsScript = options.hasTabs ? TABS_SCRIPT : '';
    const anchorScript = ANCHOR_SCRIPT;
    const chartScript = options.hasCharts ? CHART_SCRIPT : '';
    const mermaidScript = options.hasMermaid ? MERMAID_SCRIPT : '';

    const lang = node.frontmatter?.data?.lang || 'en';
    const title = node.frontmatter?.data?.title || 'Document';

    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
${DEFAULT_CSS}
  </style>
</head>
<body>
${childrenHtml}
${tabsScript}
${anchorScript}
${chartScript}
${mermaidScript}
</body>
</html>`;
  }

  public renderDocumentContent(
    node: DocumentNode,
    buildChildren: (nodes: ASTNode[]) => string,
    visitFrontmatter: (node: any) => string
  ): string {
    if (node.frontmatter) {
      visitFrontmatter(node.frontmatter);
    }

    const children = [...node.children];
    if (this.evaluator.getVariable('toc') === true) {
      children.unshift({
        type: 'DoubleBracketBlock',
        blockType: 'toc',
        content: '',
        attributes: {},
      } as any);
    }

    return buildChildren(children);
  }

  public findAllHeadings(nodes: ASTNode[]): HeadingNode[] {
    const headings: HeadingNode[] = [];
    for (const node of nodes) {
      if (node.type === 'Heading') {
        headings.push(node as HeadingNode);
      } else if ('children' in node && Array.isArray(node.children)) {
        headings.push(...this.findAllHeadings(node.children as ASTNode[]));
      }
    }
    return headings;
  }
}
