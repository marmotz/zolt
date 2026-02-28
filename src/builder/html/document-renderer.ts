import { ASTNode, DocumentNode, HeadingNode } from '../../parser/types';
import { ExpressionEvaluator } from '../evaluator/expression-evaluator';
import {
  ANCHOR_SCRIPT,
  CHART_SCRIPT,
  CODE_COPY_SCRIPT,
  FILETREE_SCRIPT,
  MERMAID_SCRIPT,
  SIDEBAR_SCRIPT,
  TABS_SCRIPT,
} from './assets/scripts';
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

    return this.renderFullHtml(childrenHtml, options);
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

    return this.renderFullHtml(contentHtml, options);
  }

  private renderFullHtml(bodyContent: string, options: DocumentRendererOptions): string {
    const anchorScript = ANCHOR_SCRIPT;
    const chartScript = options.hasCharts ? CHART_SCRIPT : '';
    const mermaidScript = options.hasMermaid ? MERMAID_SCRIPT : '';
    const sidebarScript = options.hasSidebar ? SIDEBAR_SCRIPT : '';

    let finalContent = bodyContent;
    if (options.hasSidebar) {
      const sidebarRegex = /<aside[^>]*class="[^"]*zolt-sidebar[^"]*"[^>]*>([\s\S]*?)<\/aside>/;
      const match = bodyContent.match(sidebarRegex);
      if (match) {
        const sidebarHtml = match[0];
        const remainingHtml = bodyContent.replace(sidebarHtml, '');
        finalContent = `${sidebarHtml}\n<main class="zolt-main-content">\n  <div class="zolt-content-container">\n    ${remainingHtml}\n  </div>\n</main>`;
      }
    }

    const lang = this.getMetadata('lang', 'en');
    const title = this.getDocumentTitle();
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

    const metaTags = this.generateAllMetaTags(title);
    const linkTags = this.generateLinkTags();

    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
${metaTags}${linkTags}  <title>${title}</title>
${mathCss}  <style>
${DEFAULT_CSS}
  </style>
</head>
<body class="${bodyClasses}">
${finalContent}
${TABS_SCRIPT}
${anchorScript}
${chartScript}
${mermaidScript}
${sidebarScript}
${FILETREE_SCRIPT}
${CODE_COPY_SCRIPT}
</body>
</html>`;
  }

  private generateAllMetaTags(title: string): string {
    const description = this.getMetadata('description');
    const author = this.getMetadata('author');
    const robots = this.getMetadata('robots');
    const siteName = this.getMetadata('site_name') || title;
    const ogTitle = this.getMetadata('og_title') || title;
    const ogDescription = this.getMetadata('og_description') || description;
    let ogImage = this.getMetadata('image');
    const ogType = this.getMetadata('og_type', 'website');
    const ogUrl = this.getMetadata('url');

    // Make image URL absolute if base URL exists
    if (ogImage && typeof ogImage === 'string' && ogUrl && typeof ogUrl === 'string') {
      if (!ogImage.startsWith('http://') && !ogImage.startsWith('https://')) {
        const base = String(ogUrl).endsWith('/') ? String(ogUrl).slice(0, -1) : String(ogUrl);
        const img = String(ogImage).startsWith('/') ? String(ogImage) : '/' + String(ogImage);
        ogImage = base + img;
      }
    }

    const ogImageWidth = this.getMetadata('og_image_width');
    const ogImageHeight = this.getMetadata('og_image_height');
    const twitterSite = this.getMetadata('twitter_site');
    const twitterCreator = this.getMetadata('twitter_creator');

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

    let meta = '';
    // Standard Meta
    if (description) meta += `  <meta name="description" content="${this.escapeHtml(String(description))}">\n`;
    if (author) meta += `  <meta name="author" content="${this.escapeHtml(String(author))}">\n`;
    if (keywords) meta += `  <meta name="keywords" content="${this.escapeHtml(String(keywords))}">\n`;
    if (robots) meta += `  <meta name="robots" content="${this.escapeHtml(String(robots))}">\n`;

    // Open Graph
    if (siteName) meta += `  <meta property="og:site_name" content="${this.escapeHtml(String(siteName))}">\n`;
    meta += `  <meta property="og:type" content="${this.escapeHtml(String(ogType))}">\n`;
    meta += `  <meta property="og:title" content="${this.escapeHtml(String(ogTitle))}">\n`;
    if (ogDescription)
      meta += `  <meta property="og:description" content="${this.escapeHtml(String(ogDescription))}">\n`;
    if (ogUrl) meta += `  <meta property="og:url" content="${this.escapeHtml(String(ogUrl))}">\n`;
    if (ogImage) {
      meta += `  <meta property="og:image" content="${this.escapeHtml(String(ogImage))}">\n`;
      if (ogImageWidth)
        meta += `  <meta property="og:image:width" content="${this.escapeHtml(String(ogImageWidth))}">\n`;
      if (ogImageHeight)
        meta += `  <meta property="og:image:height" content="${this.escapeHtml(String(ogImageHeight))}">\n`;
    }

    // Twitter
    const twitterCard = ogImage ? 'summary_large_image' : 'summary';
    meta += `  <meta name="twitter:card" content="${twitterCard}">\n`;
    if (twitterSite) meta += `  <meta name="twitter:site" content="${this.escapeHtml(String(twitterSite))}">\n`;
    if (twitterCreator)
      meta += `  <meta name="twitter:creator" content="${this.escapeHtml(String(twitterCreator))}">\n`;
    meta += `  <meta name="twitter:title" content="${this.escapeHtml(String(ogTitle))}">\n`;
    if (ogDescription)
      meta += `  <meta name="twitter:description" content="${this.escapeHtml(String(ogDescription))}">\n`;
    if (ogImage) meta += `  <meta name="twitter:image" content="${this.escapeHtml(String(ogImage))}">\n`;

    return meta;
  }

  private generateLinkTags(): string {
    const iconPng = this.getMetadata('icon_png');
    const iconSvg = this.getMetadata('icon_svg');
    const iconIco = this.getMetadata('icon_ico');
    const iconApple = this.getMetadata('icon_apple');
    const genericIcon = this.getMetadata('icon');
    const manifest = this.getMetadata('manifest');

    let links = '';

    // Handle generic icon if specific ones are not provided
    if (genericIcon && !iconPng && !iconSvg && !iconIco) {
      const ext = String(genericIcon).split('.').pop()?.toLowerCase();
      if (ext === 'png') {
        links += `  <link rel="icon" type="image/png" href="${this.escapeHtml(String(genericIcon))}">\n`;
      } else if (ext === 'svg') {
        links += `  <link rel="icon" type="image/svg+xml" href="${this.escapeHtml(String(genericIcon))}">\n`;
      } else if (ext === 'ico') {
        links += `  <link rel="icon" type="image/x-icon" href="${this.escapeHtml(String(genericIcon))}">\n`;
      } else {
        links += `  <link rel="icon" href="${this.escapeHtml(String(genericIcon))}">\n`;
      }
    }

    if (iconPng)
      links += `  <link rel="icon" type="image/png" href="${this.escapeHtml(String(iconPng))}" sizes="96x96">\n`;
    if (iconSvg) links += `  <link rel="icon" type="image/svg+xml" href="${this.escapeHtml(String(iconSvg))}">\n`;
    if (iconIco) links += `  <link rel="shortcut icon" href="${this.escapeHtml(String(iconIco))}">\n`;
    if (iconApple)
      links += `  <link rel="apple-touch-icon" sizes="180x180" href="${this.escapeHtml(String(iconApple))}">\n`;
    if (manifest) links += `  <link rel="manifest" href="${this.escapeHtml(String(manifest))}">\n`;

    return links;
  }

  private getMetadata(key: string, defaultValue: any = ''): any {
    let val = this.evaluator.getVariable(key);
    val = val !== null && val !== undefined ? val : defaultValue;

    if (
      (key === 'image' ||
        key === 'icon' ||
        key === 'icon_png' ||
        key === 'icon_svg' ||
        key === 'icon_ico' ||
        key === 'icon_apple' ||
        key === 'manifest') &&
      typeof val === 'string' &&
      val &&
      this.assetResolver
    ) {
      if (!val.startsWith('http://') && !val.startsWith('https://') && !val.startsWith('/')) {
        return this.assetResolver(val);
      }
    }

    return val;
  }

  private getDocumentTitle(): string {
    const projectTitle = this.evaluator.getVariable('projectTitle');
    const fileTitle = this.evaluator.getVariable('title');

    if (projectTitle && fileTitle && String(projectTitle) !== String(fileTitle)) {
      return `${String(projectTitle)} - ${String(fileTitle)}`;
    }

    return String(fileTitle || projectTitle || 'Document');
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
