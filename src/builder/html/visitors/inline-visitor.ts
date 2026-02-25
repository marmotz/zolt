import {
  AbbreviationNode,
  ASTNode,
  AudioNode,
  BoldNode,
  CodeNode,
  EmbedNode,
  ExpressionNode,
  FileNode,
  HighlightNode,
  ImageNode,
  InlineStyleNode,
  ItalicNode,
  LinkNode,
  StrikethroughNode,
  SubscriptNode,
  SuperscriptNode,
  TextNode,
  UnderlineNode,
  VariableNode,
  VideoNode,
} from '../../../parser/types';
import { formatValue, transformHref } from '../utils/string-utils';

export class InlineVisitor {
  constructor(
    private joinChildren: (nodes: ASTNode[]) => string,
    private renderAllAttributes: (attrs?: any) => string,
    private processInline: (text: string) => string,
    private evaluator: any,
    private registerFootnoteRef: (id: string) => number
  ) {}

  public visit(node: ASTNode): string {
    switch (node.type) {
      case 'Text':
        return this.visitText(node as any);
      case 'Bold':
        return this.visitBold(node as any);
      case 'Italic':
        return this.visitItalic(node as any);
      case 'Underline':
        return this.visitUnderline(node as any);
      case 'Strikethrough':
        return this.visitStrikethrough(node as any);
      case 'Code':
        return this.visitCode(node as any);
      case 'Superscript':
        return this.visitSuperscript(node as any);
      case 'Subscript':
        return this.visitSubscript(node as any);
      case 'Highlight':
        return this.visitHighlight(node as any);
      case 'InlineStyle':
        return this.visitInlineStyle(node as any);
      case 'Link':
        return this.visitLink(node as any);
      case 'Image':
        return this.visitImage(node as any);
      case 'Video':
        return this.visitVideo(node as any);
      case 'Audio':
        return this.visitAudio(node as any);
      case 'Embed':
        return this.visitEmbed(node as any);
      case 'File':
        return this.visitFile(node as any);
      case 'Variable':
        return this.visitVariable(node as any);
      case 'Expression':
        return this.visitExpression(node as any);
      case 'Abbreviation':
        return this.visitAbbreviation(node as any);
      case 'Footnote':
        return this.visitFootnote(node as any);
      case 'CommentInline':
        return '';
      default:
        return (node as any).content || '';
    }
  }

  visitText(node: TextNode): string {
    return node.content;
  }

  visitFootnote(node: any): string {
    const index = this.registerFootnoteRef(node.id);

    return `<sup><a href="#fn:${node.id}" id="fnref:${node.id}">[${index}]</a></sup>`;
  }

  visitBold(node: BoldNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const childrenHtml = this.joinChildren(node.children);

    return `<strong${attrs}>${childrenHtml}</strong>`;
  }

  visitItalic(node: ItalicNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const childrenHtml = this.joinChildren(node.children);

    return `<em${attrs}>${childrenHtml}</em>`;
  }

  visitUnderline(node: UnderlineNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const childrenHtml = this.joinChildren(node.children);

    return `<u${attrs}>${childrenHtml}</u>`;
  }

  visitStrikethrough(node: StrikethroughNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const childrenHtml = this.joinChildren(node.children);

    return `<del${attrs}>${childrenHtml}</del>`;
  }

  visitCode(node: CodeNode): string {
    const attrs = this.renderAllAttributes(node.attributes);

    return `<code${attrs}>${node.content}</code>`;
  }

  visitSuperscript(node: SuperscriptNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const childrenHtml = this.joinChildren(node.children);

    return `<sup${attrs}>${childrenHtml}</sup>`;
  }

  visitSubscript(node: SubscriptNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const childrenHtml = this.joinChildren(node.children);

    return `<sub${attrs}>${childrenHtml}</sub>`;
  }

  visitHighlight(node: HighlightNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const childrenHtml = this.joinChildren(node.children);

    return `<mark${attrs}>${childrenHtml}</mark>`;
  }

  visitInlineStyle(node: InlineStyleNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const childrenHtml = this.joinChildren(node.children);

    return `<span${attrs}>${childrenHtml}</span>`;
  }

  visitLink(node: LinkNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const title = node.title ? ` title="${this.evaluateString(node.title)}"` : '';
    const href = transformHref(this.evaluateString(node.href));
    const childrenHtml = this.joinChildren(node.children);

    return `<a href="${href}"${title}${attrs}>${childrenHtml}</a>`;
  }

  visitImage(node: ImageNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const src = this.evaluateString(node.src);
    const alt = this.evaluateString(node.alt);

    return `<img src="${src}" alt="${alt}"${attrs}>`;
  }

  visitVideo(node: VideoNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const src = this.evaluateString(node.src);
    const alt = this.evaluateString(node.alt ?? '');

    return `<video src="${src}"${attrs}>${alt}</video>`;
  }

  visitAudio(node: AudioNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const src = this.evaluateString(node.src);
    const alt = this.evaluateString(node.alt ?? '');

    return `<audio src="${src}"${attrs}>${alt}</audio>`;
  }

  visitEmbed(node: EmbedNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const src = this.evaluateString(node.src);
    const title = node.title ? ` title="${this.evaluateString(node.title)}"` : '';

    return `<iframe src="${src}"${title}${attrs}></iframe>`;
  }

  visitFile(node: FileNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const src = transformHref(this.evaluateString(node.src));
    const title = node.title ? this.evaluateString(node.title) : null;

    return `<a href="${src}"${attrs}>${title || src}</a>`;
  }

  visitVariable(node: VariableNode): string {
    try {
      const value = this.evaluator.evaluate('$' + node.name);
      if (value === null || value === undefined) {
        return `{$${node.name}}`;
      }

      return formatValue(value);
    } catch {
      return `{$${node.name}}`;
    }
  }

  visitExpression(node: ExpressionNode): string {
    try {
      const value = this.evaluator.evaluate(node.expression);
      if (value === null || value === undefined) {
        return `{{${node.expression}}}`;
      }

      return formatValue(value);
    } catch {
      return `{{${node.expression}}}`;
    }
  }

  visitAbbreviation(node: AbbreviationNode): string {
    const attrs = this.buildAttributes(node.attributes);

    return `<abbr title="${node.definition}"${attrs}>${node.abbreviation}</abbr>`;
  }

  private buildAttributes(attrs?: any): string {
    if (!attrs) {
      return '';
    }
    const parts: string[] = [];
    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined) {
        if (value === '') {
          parts.push(key);
        } else {
          const processedValue = this.evaluateString(String(value));
          parts.push(`${key}="${processedValue}"`);
        }
      }
    }

    return parts.length > 0 ? ' ' + parts.join(' ') : '';
  }

  private evaluateString(text: string): string {
    // Basic evaluation for string attributes that might contain variables
    return text.replace(/\{\$([a-zA-Z_][a-zA-Z0-9_]*[^}]*)?}/g, (_, name) => {
      try {
        const val = this.evaluator.evaluate('$' + name);

        return formatValue(val);
      } catch {
        return `{$${name}}`;
      }
    });
  }
}
