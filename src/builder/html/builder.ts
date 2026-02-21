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

export class HTMLBuilder implements Builder {
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
  <title>Document</title>
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
    return `<p${attrs}>${node.content}</p>`;
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

    const attrs = this.buildAttributes(node.attributes);
    return `<li${attrs}>${checkbox}${childrenHtml}</li>`;
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
    return text;
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

  visitLink(node: LinkNode): string {
    const attrs = this.buildAttributes(node.attributes);
    const title = node.title ? ` title="${node.title}"` : '';
    return `<a href="${node.href}"${title}${attrs}>${node.content}</a>`;
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
    return `<a href="${node.src}">${node.title || node.src}</a>`;
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
