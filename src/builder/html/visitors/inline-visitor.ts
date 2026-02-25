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
    private registerFootnoteRef: (id: string) => number,
    private assetResolver?: (path: string) => string
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
      case 'LineBreak':
        return this.visitLineBreak();
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

  visitLineBreak(): string {
    return '<br />';
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
    let href = this.evaluateString(node.href);

    const isExternal = href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:');
    const isAnchor = href.startsWith('#');
    const isZlt = href.endsWith('.zlt');

    if (!isExternal && !isAnchor && !isZlt && this.assetResolver) {
      href = this.assetResolver(href);
    } else {
      href = transformHref(href);
    }

    const childrenHtml = this.joinChildren(node.children);

    return `<a href="${href}"${title}${attrs}>${childrenHtml}</a>`;
  }

  visitImage(node: ImageNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const src = this.evaluateString(node.src);
    const alt = this.evaluateString(node.alt);

    const isRemote = src.startsWith('http://') || src.startsWith('https://');
    const resolvedSrc = !isRemote && this.assetResolver ? this.assetResolver(src) : src;

    return `<img src="${resolvedSrc}" alt="${alt}"${attrs}>`;
  }

  visitVideo(node: VideoNode): string {
    const nodeAttrs = { ...node.attributes, class: 'zolt-video' };
    const src = this.evaluateString(node.src);
    const alt = this.evaluateString(node.alt ?? '');

    const isRemote = src.startsWith('http://') || src.startsWith('https://');
    const resolvedSrc = !isRemote && this.assetResolver ? this.assetResolver(src) : src;

    // Detect if it's an embeddable remote video
    const youtubeMatch = resolvedSrc.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/
    );
    const vimeoMatch = resolvedSrc.match(/(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);

    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      const embedSrc = 'https://www.youtube-nocookie.com/embed/' + videoId;
      const videoAttrs = { ...nodeAttrs, border: '0' };
      const renderedAttrs = this.renderAllAttributes(videoAttrs);

      return `<iframe src="${embedSrc}" title="${alt}"${renderedAttrs} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    }

    if (vimeoMatch) {
      const videoId = vimeoMatch[1];
      const embedSrc = `https://player.vimeo.com/video/${videoId}`;
      const videoAttrs = { ...nodeAttrs, border: '0' };
      const renderedAttrs = this.renderAllAttributes(videoAttrs);

      return `<iframe src="${embedSrc}" title="${alt}"${renderedAttrs} allow="autoplay; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    }

    const attrs = this.renderAllAttributes({ ...nodeAttrs, controls: true });

    return `<video src="${resolvedSrc}"${attrs}>${alt}</video>`;
  }

  visitAudio(node: AudioNode): string {
    const attrs = this.renderAllAttributes({ ...node.attributes, controls: true });
    const src = this.evaluateString(node.src);
    const alt = this.evaluateString(node.alt ?? '');

    const isRemote = src.startsWith('http://') || src.startsWith('https://');
    const resolvedSrc = !isRemote && this.assetResolver ? this.assetResolver(src) : src;

    return `<audio src="${resolvedSrc}"${attrs}>${alt}</audio>`;
  }

  visitEmbed(node: EmbedNode): string {
    const src = this.evaluateString(node.src);
    const title = this.evaluateString(node.title ?? '');
    const titleAttr = title ? ` title="${title}"` : '';

    const isRemote = src.startsWith('http://') || src.startsWith('https://');
    const resolvedSrc = !isRemote && this.assetResolver ? this.assetResolver(src) : src;

    // Add standard permissions for common embed types if not present
    const isVideoEmbed =
      resolvedSrc.includes('youtube.com') ||
      resolvedSrc.includes('vimeo.com') ||
      resolvedSrc.includes('youtube-nocookie.com');
    const allowAttr = isVideoEmbed
      ? ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen'
      : '';

    const embedAttrs = { ...node.attributes, border: '0', class: 'zolt-embed' };
    const renderedAttrs = this.renderAllAttributes(embedAttrs);

    return `<iframe src="${resolvedSrc}"${titleAttr}${renderedAttrs}${allowAttr}></iframe>`;
  }

  visitFile(node: FileNode): string {
    const attrs = this.renderAllAttributes({ ...node.attributes, target: '_blank' });
    const src = this.evaluateString(node.src);
    const title = node.title ? this.evaluateString(node.title) : null;

    const isRemote = src.startsWith('http://') || src.startsWith('https://');
    const resolvedSrc = !isRemote && this.assetResolver ? this.assetResolver(src) : src;

    return `<a href="${resolvedSrc}"${attrs}>${title || resolvedSrc}</a>`;
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
