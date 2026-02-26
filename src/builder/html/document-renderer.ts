import { ASTNode, DocumentNode, HeadingNode } from '../../parser/types';
import { ExpressionEvaluator } from '../evaluator/expression-evaluator';
import { ANCHOR_SCRIPT, CHART_SCRIPT, MERMAID_SCRIPT, TABS_SCRIPT } from './assets/scripts';
import { DEFAULT_CSS } from './assets/styles';

export interface DocumentRendererOptions {
  hasTabs: boolean;
  hasCharts: boolean;
  hasMermaid: boolean;
  hasMath: boolean;
  hasSidebar: boolean;
  sidebarSide: 'left' | 'right';
}

export class DocumentRenderer {
  constructor(
    private evaluator: ExpressionEvaluator,
    private assetResolver?: (path: string) => string
  ) {}

  public renderDocument(
    node: DocumentNode,
    options: DocumentRendererOptions,
    buildChildren: (nodes: ASTNode[]) => string,
    visitFileMetadata: (node: any) => string
  ): string {
    if (node.fileMetadata) {
      visitFileMetadata(node.fileMetadata);
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

    let finalContent = childrenHtml;
    if (options.hasSidebar) {
      const sidebarRegex = /<aside[^>]*class="[^"]*zolt-sidebar[^"]*"[^>]*>([\s\S]*?)<\/aside>/;
      const match = childrenHtml.match(sidebarRegex);
      if (match) {
        const sidebarHtml = match[0];
        const remainingHtml = childrenHtml.replace(sidebarHtml, '');
        finalContent = `${sidebarHtml}\n<main class="zolt-main-content">\n  <div class="zolt-content-container">\n    ${remainingHtml}\n  </div>\n</main>`;
      }
    }

    const lang = this.getMetadata('lang', 'en');
    const title = this.getMetadata('title', 'Document');
    const description = this.getMetadata('description');
    const author = this.getMetadata('author');

    const rawKeywords = this.getMetadata('keywords', null);
    const rawTags = this.getMetadata('tags', null);
    let keywords = '';

    if (Array.isArray(rawKeywords)) {
      keywords = rawKeywords.join(', ');
    } else if (typeof rawKeywords === 'string' && rawKeywords !== '') {
      keywords = rawKeywords;
    } else if (Array.isArray(rawTags)) {
      keywords = rawTags.join(', ');
    }

    const robots = this.getMetadata('robots');
    const ogImage = this.getMetadata('image');

    const theme = this.getMetadata('theme', 'default');
    const colorScheme = this.getMetadata('color-scheme', 'auto');
    const bodyClasses = [
      `theme-${theme}`,
      `color-scheme-${colorScheme}`,
      options.hasSidebar ? 'has-sidebar' : '',
      options.hasSidebar ? `sidebar-${options.sidebarSide}` : '',
    ]
      .filter((c) => c !== '')
      .join(' ');

    const mathCss = options.hasMath
      ? '  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css">\n'
      : '';

    let metaTags = '';
    if (description) metaTags += `  <meta name="description" content="${this.escapeHtml(String(description))}">\n`;
    if (author) metaTags += `  <meta name="author" content="${this.escapeHtml(String(author))}">\n`;
    if (keywords) metaTags += `  <meta name="keywords" content="${this.escapeHtml(String(keywords))}">\n`;
    if (robots) metaTags += `  <meta name="robots" content="${this.escapeHtml(String(robots))}">\n`;

    // Open Graph
    metaTags += `  <meta property="og:title" content="${this.escapeHtml(String(title))}">\n`;
    if (description)
      metaTags += `  <meta property="og:description" content="${this.escapeHtml(String(description))}">\n`;
    if (ogImage) metaTags += `  <meta property="og:image" content="${this.escapeHtml(String(ogImage))}">\n`;
    metaTags += `  <meta property="og:type" content="website">\n`;

    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
${metaTags}  <title>${title}</title>
${mathCss}  <style>
${DEFAULT_CSS}
  </style>
</head>
<body class="${bodyClasses}">
${finalContent}
${tabsScript}
${anchorScript}
${chartScript}
${mermaidScript}
</body>
</html>`;
  }

  public renderDocumentWithContent(
    node: DocumentNode,
    contentHtml: string,
    options: DocumentRendererOptions,
    visitFileMetadata: (node: any) => string
  ): string {
    if (node.fileMetadata) {
      visitFileMetadata(node.fileMetadata);
    }

    const tabsScript = options.hasTabs ? TABS_SCRIPT : '';
    const anchorScript = ANCHOR_SCRIPT;
    const chartScript = options.hasCharts ? CHART_SCRIPT : '';
    const mermaidScript = options.hasMermaid ? MERMAID_SCRIPT : '';

    let finalContent = contentHtml;
    if (options.hasSidebar) {
      const sidebarRegex = /<aside[^>]*class="[^"]*zolt-sidebar[^"]*"[^>]*>([\s\S]*?)<\/aside>/;
      const match = contentHtml.match(sidebarRegex);
      if (match) {
        const sidebarHtml = match[0];
        const remainingHtml = contentHtml.replace(sidebarHtml, '');
        finalContent = `${sidebarHtml}\n<main class="zolt-main-content">\n  <div class="zolt-content-container">\n    ${remainingHtml}\n  </div>\n</main>`;
      }
    }

    const lang = this.getMetadata('lang', 'en');
    const title = this.getMetadata('title', 'Document');
    const description = this.getMetadata('description');
    const author = this.getMetadata('author');

    const rawKeywords = this.getMetadata('keywords', null);
    const rawTags = this.getMetadata('tags', null);
    let keywords = '';

    if (Array.isArray(rawKeywords)) {
      keywords = rawKeywords.join(', ');
    } else if (typeof rawKeywords === 'string' && rawKeywords !== '') {
      keywords = rawKeywords;
    } else if (Array.isArray(rawTags)) {
      keywords = rawTags.join(', ');
    }

    const robots = this.getMetadata('robots');
    const ogImage = this.getMetadata('image');

    const theme = this.getMetadata('theme', 'default');
    const colorScheme = this.getMetadata('color-scheme', 'auto');
    const bodyClasses = [
      `theme-${theme}`,
      `color-scheme-${colorScheme}`,
      options.hasSidebar ? 'has-sidebar' : '',
      options.hasSidebar ? `sidebar-${options.sidebarSide}` : '',
    ]
      .filter((c) => c !== '')
      .join(' ');

    const mathCss = options.hasMath
      ? '  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css">\n'
      : '';

    let metaTags = '';
    if (description) metaTags += `  <meta name="description" content="${this.escapeHtml(String(description))}">\n`;
    if (author) metaTags += `  <meta name="author" content="${this.escapeHtml(String(author))}">\n`;
    if (keywords) metaTags += `  <meta name="keywords" content="${this.escapeHtml(String(keywords))}">\n`;
    if (robots) metaTags += `  <meta name="robots" content="${this.escapeHtml(String(robots))}">\n`;

    // Open Graph
    metaTags += `  <meta property="og:title" content="${this.escapeHtml(String(title))}">\n`;
    if (description)
      metaTags += `  <meta property="og:description" content="${this.escapeHtml(String(description))}">\n`;
    if (ogImage) metaTags += `  <meta property="og:image" content="${this.escapeHtml(String(ogImage))}">\n`;
    metaTags += `  <meta property="og:type" content="website">\n`;

    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
${metaTags}  <title>${title}</title>
${mathCss}  <style>
${DEFAULT_CSS}
  </style>
</head>
<body class="${bodyClasses}">
${finalContent}
${tabsScript}
${anchorScript}
${chartScript}
${mermaidScript}
</body>
</html>`;
  }

  private getMetadata(key: string, defaultValue: any = ''): any {
    let val = this.evaluator.getVariable(key);
    val = val !== null && val !== undefined ? val : defaultValue;

    if (key === 'image' && typeof val === 'string' && val && this.assetResolver) {
      if (!val.startsWith('http://') && !val.startsWith('https://') && !val.startsWith('/')) {
        return this.assetResolver(val);
      }
    }

    return val;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };

    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  }

  public renderDocumentContent(
    node: DocumentNode,
    buildChildren: (nodes: ASTNode[]) => string,
    visitFileMetadata: (node: any) => string
  ): string {
    if (node.fileMetadata) {
      visitFileMetadata(node.fileMetadata);
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
