import { InlineParser } from '../../parser/inline-parser';
import {
  ASTNode,
  AbbreviationDefinitionNode,
  AbbreviationNode,
  Attributes,
  AudioNode,
  BlockquoteNode,
  BoldNode,
  CodeBlockNode,
  CodeNode,
  DocumentNode,
  DoubleBracketBlockNode,
  EmbedNode,
  ExpressionNode,
  FileNode,
  FootnoteDefinitionNode,
  FootnoteNode,
  HeadingNode,
  HighlightNode,
  HorizontalRuleNode,
  ImageNode,
  IndentationNode,
  InlineStyleNode,
  ItalicNode,
  LinkNode,
  ListItemNode,
  ListNode,
  ParagraphNode,
  StrikethroughNode,
  SubscriptNode,
  SuperscriptNode,
  TripleColonBlockNode,
  UnderlineNode,
  VariableNode,
  VideoNode,
} from '../../parser/types';
import { Builder } from '../builder';

const DEFAULT_CSS = `
  * {
    box-sizing: border-box;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    color: #333;
    background: #fafafa;
  }
  h1, h2, h3, h4, h5, h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
    line-height: 1.3;
    color: #111;
  }
  h1 { font-size: 2rem; border-bottom: 2px solid #e0e0e0; padding-bottom: 0.3em; }
  h2 { font-size: 1.5rem; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.2em; }
  h3 { font-size: 1.25rem; }
  h4 { font-size: 1rem; }
  p { margin: 1em 0; }
  ul, ol { padding-left: 2rem; margin: 1em 0; }
  li { margin: 0.25em 0; }
  a { color: #0066cc; text-decoration: none; }
  a:hover { text-decoration: underline; }
  blockquote {
    margin: 1em 0;
    padding: 0.5em 1rem;
    border-left: 4px solid #e0e0e0;
    background: #f5f5f5;
    color: #555;
  }
  code {
    font-family: 'SF Mono', Monaco, Consolas, monospace;
    font-size: 0.9em;
    background: #f0f0f0;
    padding: 0.2em 0.4em;
    border-radius: 3px;
  }
  pre {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
  }
  pre code { background: none; padding: 0; color: inherit; }
  hr { border: none; border-top: 2px solid #e0e0e0; margin: 2rem 0; }
  input[type="checkbox"] { margin-right: 0.5em; }
  abbr {
    color: #7c3aed;
    text-decoration: underline;
    text-decoration-color: #c4b5fd;
    text-underline-offset: 2px;
    cursor: help;
    font-weight: 500;
  }
  abbr:hover {
    color: #6d28d9;
    text-decoration-color: #a78bfa;
  }
`.trim();

export class HTMLBuilder implements Builder {
  private inlineParser = new InlineParser();
  private abbreviationDefinitions: Map<string, string> = new Map();
  private static globalAbbreviations: Map<string, string> = new Map();

  static setGlobalAbbreviation(abbreviation: string, definition: string): void {
    this.globalAbbreviations.set(abbreviation, definition);
  }

  static clearGlobalAbbreviations(): void {
    this.globalAbbreviations.clear();
  }

  static getGlobalAbbreviations(): Map<string, string> {
    return this.globalAbbreviations;
  }

  build(node: ASTNode): string {
    switch (node.type) {
      case 'Document':
        return this.visitDocument(node as DocumentNode);
      case 'Heading':
        return this.visitHeading(node as HeadingNode);
      case 'Paragraph':
        return this.visitParagraph(node as ParagraphNode);
      case 'Blockquote':
        return this.visitBlockquote(node as BlockquoteNode);
      case 'List':
        return this.visitList(node as ListNode);
      case 'ListItem':
        return this.visitListItem(node as ListItemNode);
      case 'CodeBlock':
        return this.visitCodeBlock(node as CodeBlockNode);
      case 'TripleColonBlock':
        return this.visitTripleColonBlock(node as TripleColonBlockNode);
      case 'DoubleBracketBlock':
        return this.visitDoubleBracketBlock(node as DoubleBracketBlockNode);
      case 'HorizontalRule':
        return this.visitHorizontalRule(node as HorizontalRuleNode);
      case 'Indentation':
        return this.visitIndentation(node as IndentationNode);
      case 'AbbreviationDefinition':
        return this.visitAbbreviationDefinition(node as AbbreviationDefinitionNode);
      case 'CommentInline':
        return '';
      default:
        return '';
    }
  }

  buildDocument(node: DocumentNode): string {
    this.abbreviationDefinitions.clear();

    // Collect all abbreviations from the document
    this.collectAbbreviations(node);

    const allAbbreviations = new Map<string, string>([
      ...HTMLBuilder.globalAbbreviations.entries(),
      ...this.abbreviationDefinitions.entries(),
    ]);

    this.inlineParser.setGlobalAbbreviations(allAbbreviations);

    const childrenHtml = node.children.map((child) => this.build(child)).join('\n');
    return `<!DOCTYPE html>
<html lang="">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
${DEFAULT_CSS}
  </style>
</head>
<body>
${childrenHtml}
</body>
</html>`;
  }

  private collectAbbreviations(node: ASTNode): void {
    if (node.type === 'AbbreviationDefinition') {
      this.visitAbbreviationDefinition(node as AbbreviationDefinitionNode);
    } else if (node.type === 'Paragraph' || node.type === 'Heading' || node.type === 'ListItem') {
      const content = (node as any).content;
      if (typeof content === 'string') {
        const regex = /([A-Za-z0-9μ]+)\{abbr="([^"]+)"[^}]*\}/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          const abbreviation = match[1];
          const definition = match[2];
          if (!this.abbreviationDefinitions.has(abbreviation)) {
            this.abbreviationDefinitions.set(abbreviation, definition);
          }
        }
      }
    }

    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.collectAbbreviations(child);
      }
    }
  }

  visitDocument(node: DocumentNode): string {
    return node.children.map((child) => this.build(child)).join('\n');
  }

  visitHeading(node: HeadingNode): string {
    const level = Math.min(Math.max(node.level, 1), 6);
    const attrs = this.buildAttributes(node.attributes);
    const content = this.processInlineContent(node.content);
    const trimmed = content.replace(/\s+/g, ' ').trim();
    return `<h${level}${attrs}>${trimmed}</h${level}>`;
  }

  visitParagraph(node: ParagraphNode): string {
    const attrs = this.buildAttributes(node.attributes);
    const content = this.processInlineContent(node.content);
    const trimmed = content.replace(/\s+/g, ' ').trim();
    return `<p${attrs}>${trimmed}</p>`;
  }

  visitBlockquote(node: BlockquoteNode): string {
    const childrenHtml = node.children.map((child) => this.build(child)).join('');

    const attrs = this.buildAttributes(node.attributes);
    return `<blockquote${attrs}>${childrenHtml}</blockquote>`;
  }

  visitList(node: ListNode): string {
    const tag = node.kind === 'numbered' ? 'ol' : 'ul';
    const childrenHtml = node.children.map((child) => this.build(child)).join('\n');

    const attrs = this.buildAttributes(node.attributes);
    return `<${tag}${attrs}>\n${childrenHtml}\n</${tag}>`;
  }

  visitListItem(node: ListItemNode): string {
    const checkbox =
      node.checked !== undefined ? `<input type="checkbox" ${node.checked ? 'checked' : ''} disabled>` : '';
    const childrenHtml = node.children.map((child) => this.build(child)).join('\n');
    const content = childrenHtml || this.processInlineContent(node.content);
    const trimmed = content.replace(/\s+/g, ' ').trim();

    const attrs = this.buildAttributes(node.attributes);
    return `<li${attrs}>${checkbox}${trimmed}</li>`;
  }

  visitCodeBlock(node: CodeBlockNode): string {
    const lang = node.language ? ` class="language-${node.language}"` : '';
    return `<pre><code${lang}>${node.content}</code></pre>`;
  }

  visitTripleColonBlock(node: TripleColonBlockNode): string {
    return `<div class="triple-colon-block" data-type="${node.blockType}">${node.content}</div>`;
  }

  visitDoubleBracketBlock(node: DoubleBracketBlockNode): string {
    return `<div class="double-bracket-block" data-type="${node.blockType}">${node.content}</div>`;
  }

  visitHorizontalRule(node: HorizontalRuleNode): string {
    return '<hr>';
  }

  visitIndentation(node: IndentationNode): string {
    const childrenHtml = node.children.map((child) => this.build(child)).join('\n');

    return `<div class="indented" style="margin-left: ${node.level * 2}em">${childrenHtml}</div>`;
  }

  processInline(text: string): string {
    const nodes = this.inlineParser.parse(text);
    return nodes.map((node) => this.buildInlineNode(node)).join('');
  }

  processInlineContent(text: string): string {
    if (!text) return '';
    return this.processInline(text);
  }

  private buildInlineNode(node: ASTNode): string {
    switch (node.type) {
      case 'Text':
        return (node as any).content;
      case 'Bold':
        return this.visitBold(node as BoldNode);
      case 'Italic':
        return this.visitItalic(node as ItalicNode);
      case 'Underline':
        return this.visitUnderline(node as UnderlineNode);
      case 'Strikethrough':
        return this.visitStrikethrough(node as StrikethroughNode);
      case 'Code':
        return this.visitCode(node as CodeNode);
      case 'Superscript':
        return this.visitSuperscript(node as SuperscriptNode);
      case 'Subscript':
        return this.visitSubscript(node as SubscriptNode);
      case 'Highlight':
        return this.visitHighlight(node as HighlightNode);
      case 'InlineStyle':
        return this.visitInlineStyle(node as InlineStyleNode);
      case 'Link':
        return this.visitLink(node as LinkNode);
      case 'Abbreviation':
        return this.visitAbbreviation(node as AbbreviationNode);
      case 'CommentInline':
        return this.visitCommentInline(node as any);
      default:
        return (node as any).content || '';
    }
  }

  visitBold(node: BoldNode): string {
    return `<strong>${node.content}</strong>`;
  }

  visitItalic(node: ItalicNode): string {
    return `<em>${node.content}</em>`;
  }

  visitUnderline(node: UnderlineNode): string {
    return `<u>${node.content}</u>`;
  }

  visitStrikethrough(node: StrikethroughNode): string {
    return `<del>${node.content}</del>`;
  }

  visitCode(node: CodeNode): string {
    return `<code>${node.content}</code>`;
  }

  visitSuperscript(node: SuperscriptNode): string {
    return `<sup>${node.content}</sup>`;
  }

  visitSubscript(node: SubscriptNode): string {
    return `<sub>${node.content}</sub>`;
  }

  visitHighlight(node: HighlightNode): string {
    return `<mark>${node.content}</mark>`;
  }

  visitInlineStyle(node: InlineStyleNode): string {
    const htmlAttrs = this.filterCssProperties(node.attributes || {});
    const styleStr = this.buildStyleAttribute(node.attributes);
    const attrs = this.buildAttributes(htmlAttrs);
    return `<span${styleStr}${attrs}>${node.content}</span>`;
  }

  private buildStyleAttribute(attrs?: Attributes): string {
    if (!attrs) return '';

    const cssProps: string[] = [];
    const cssPropertyMap: Record<string, string> = {
      'font-weight': 'font-weight',
      'font-size': 'font-size',
      'font-style': 'font-style',
      'font-family': 'font-family',
      'text-decoration': 'text-decoration',
      'text-align': 'text-align',
      color: 'color',
      background: 'background',
      'background-color': 'background-color',
      border: 'border',
      'border-radius': 'border-radius',
      padding: 'padding',
      margin: 'margin',
      display: 'display',
      opacity: 'opacity',
      transform: 'transform',
    };

    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined && cssPropertyMap[key]) {
        cssProps.push(`${cssPropertyMap[key]}: ${value}`);
      }
    }

    return cssProps.length > 0 ? ` style="${cssProps.join('; ')}"` : '';
  }

  private filterCssProperties(attrs: Attributes): Attributes {
    const cssProps = new Set([
      'font-weight',
      'font-size',
      'font-style',
      'font-family',
      'text-decoration',
      'text-align',
      'color',
      'background',
      'background-color',
      'border',
      'border-radius',
      'padding',
      'margin',
      'display',
      'opacity',
      'transform',
    ]);
    const filtered: Attributes = {};
    for (const [key, value] of Object.entries(attrs)) {
      if (!cssProps.has(key)) {
        filtered[key] = value;
      }
    }
    return filtered;
  }

  private transformHref(href: string): string {
    if (href.endsWith('.zlt')) {
      return href.replace(/\.zlt$/, '.html');
    }
    return href;
  }

  visitLink(node: LinkNode): string {
    const attrs = this.buildAttributes(node.attributes);
    const title = node.title ? ` title="${node.title}"` : '';
    const href = this.transformHref(node.href);
    return `<a href="${href}"${title}${attrs}>${node.content}</a>`;
  }

  visitImage(node: ImageNode): string {
    const attrs = this.buildAttributes(node.attributes);
    return `<img src="${node.src}" alt="${node.alt}"${attrs}>`;
  }

  visitVideo(node: VideoNode): string {
    const attrs = this.buildAttributes(node.attributes);
    return `<video src="${node.src}"${attrs}>${node.alt}</video>`;
  }

  visitAudio(node: AudioNode): string {
    const attrs = this.buildAttributes(node.attributes);
    return `<audio src="${node.src}"${attrs}>${node.alt}</audio>`;
  }

  visitEmbed(node: EmbedNode): string {
    const attrs = this.buildAttributes(node.attributes);
    const title = node.title ? ` title="${node.title}"` : '';
    return `<iframe src="${node.src}"${title}${attrs}></iframe>`;
  }

  visitFile(node: FileNode): string {
    const src = this.transformHref(node.src);
    return `<a href="${src}">${node.title || node.src}</a>`;
  }

  visitVariable(node: VariableNode): string {
    return node.isGlobal ? `$${node.name}` : `\$var`;
  }

  visitExpression(node: ExpressionNode): string {
    return `{{${node.expression}}}`;
  }

  visitFootnote(node: FootnoteNode): string {
    return `<sup><a href="#fn-${node.id}" id="fnref-${node.id}">[${node.id}]</a></sup>`;
  }

  visitFootnoteDefinition(node: FootnoteDefinitionNode): string {
    return `<div id="fn-${node.id}"><sup>${node.id}</sup>${node.content}</div>`;
  }

  visitAbbreviation(node: AbbreviationNode): string {
    const attrs = this.buildAttributes(node.attributes);
    return `<abbr title="${node.definition}"${attrs}>${node.abbreviation}</abbr>`;
  }

  visitAbbreviationDefinition(node: AbbreviationDefinitionNode): string {
    if (node.isGlobal) {
      HTMLBuilder.globalAbbreviations.set(node.abbreviation, node.definition);
    } else {
      this.abbreviationDefinitions.set(node.abbreviation, node.definition);
    }
    return '';
  }

  visitCommentInline(node: any): string {
    return '';
  }

  private buildAttributes(attrs?: Attributes): string {
    if (!attrs) return '';

    const parts: string[] = [];
    if (attrs.id) parts.push(`id="${attrs.id}"`);
    if (attrs.class) parts.push(`class="${attrs.class}"`);

    for (const [key, value] of Object.entries(attrs)) {
      if (key !== 'id' && key !== 'class' && value !== undefined) {
        parts.push(`${key}="${value}"`);
      }
    }

    return parts.length > 0 ? ' ' + parts.join(' ') : '';
  }
}
