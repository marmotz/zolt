import {
  ASTNode,
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
import { InlineParser } from '../../parser/inline-parser';

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
`.trim();

export class HTMLBuilder implements Builder {
  private inlineParser = new InlineParser();

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
      default:
        return '';
    }
  }

  buildDocument(node: DocumentNode): string {
    const childrenHtml = node.children.map((child) => this.build(child)).join('\n');
    return `<!DOCTYPE html>
<html>
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

  visitDocument(node: DocumentNode): string {
    return node.children.map((child) => this.build(child)).join('\n');
  }

  visitHeading(node: HeadingNode): string {
    const level = Math.min(Math.max(node.level, 1), 6);
    const attrs = this.buildAttributes(node.attributes);
    return `<h${level}${attrs}>${node.content}</h${level}>`;
  }

  visitParagraph(node: ParagraphNode): string {
    const attrs = this.buildAttributes(node.attributes);
    const content = this.processInlineContent(node.content);
    return `<p${attrs}>${content}</p>`;
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

    const attrs = this.buildAttributes(node.attributes);
    return `<li${attrs}>${checkbox}${content}</li>`;
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
    const attrs = this.buildAttributes(node.attributes);
    return `<span${attrs}>${node.content}</span>`;
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
