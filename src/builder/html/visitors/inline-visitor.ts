import katex from 'katex';
import type {
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
import { escapeHtml, formatValue, transformHref } from '../utils/string-utils';

export class InlineVisitor {
  constructor(
    private joinChildren: (nodes: ASTNode[]) => Promise<string>,
    private renderAllAttributes: (attrs?: any) => string,
    _processInline: (text: string) => Promise<string>,
    private evaluator: any,
    private registerFootnoteRef: (id: string) => { index: number; refId: string },
    private assetResolver?: (path: string) => string
  ) {}

  public async visit(node: ASTNode): Promise<string> {
    switch (node.type) {
      case 'Text':
        return this.visitText(node as any);
      case 'Bold':
        return await this.visitBold(node as any);
      case 'Italic':
        return await this.visitItalic(node as any);
      case 'Underline':
        return await this.visitUnderline(node as any);
      case 'Strikethrough':
        return await this.visitStrikethrough(node as any);
      case 'Code':
        return this.visitCode(node as any);
      case 'Superscript':
        return await this.visitSuperscript(node as any);
      case 'Subscript':
        return await this.visitSubscript(node as any);
      case 'Highlight':
        return await this.visitHighlight(node as any);
      case 'InlineStyle':
        return await this.visitInlineStyle(node as any);
      case 'LineBreak':
        return this.visitLineBreak();
      case 'Link':
        return await this.visitLink(node as any);
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
      case 'Math':
        return this.visitMath(node as any);
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
    const { index, refId } = this.registerFootnoteRef(node.id);
    const attrs = this.renderAllAttributes(node.attributes);

    return `<sup><a href="#fn-${node.id}" id="fnref-${refId}"${attrs}>[${index}]</a></sup>`;
  }

  async visitBold(node: BoldNode): Promise<string> {
    const attrs = this.renderAllAttributes(node.attributes);
    const childrenHtml = await this.joinChildren(node.children);

    return `<strong${attrs}>${childrenHtml}</strong>`;
  }

  async visitItalic(node: ItalicNode): Promise<string> {
    const attrs = this.renderAllAttributes(node.attributes);
    const childrenHtml = await this.joinChildren(node.children);

    return `<em${attrs}>${childrenHtml}</em>`;
  }

  async visitUnderline(node: UnderlineNode): Promise<string> {
    const attrs = this.renderAllAttributes(node.attributes);
    const childrenHtml = await this.joinChildren(node.children);

    return `<u${attrs}>${childrenHtml}</u>`;
  }

  async visitStrikethrough(node: StrikethroughNode): Promise<string> {
    const attrs = this.renderAllAttributes(node.attributes);
    const childrenHtml = await this.joinChildren(node.children);

    return `<del${attrs}>${childrenHtml}</del>`;
  }

  visitCode(node: CodeNode): string {
    const attrs = this.renderAllAttributes(node.attributes);

    return `<code${attrs}>${escapeHtml(node.content)}</code>`;
  }

  async visitSuperscript(node: SuperscriptNode): Promise<string> {
    const attrs = this.renderAllAttributes(node.attributes);
    const childrenHtml = await this.joinChildren(node.children);

    return `<sup${attrs}>${childrenHtml}</sup>`;
  }

  async visitSubscript(node: SubscriptNode): Promise<string> {
    const attrs = this.renderAllAttributes(node.attributes);
    const childrenHtml = await this.joinChildren(node.children);

    return `<sub${attrs}>${childrenHtml}</sub>`;
  }

  async visitHighlight(node: HighlightNode): Promise<string> {
    const attrs = this.renderAllAttributes(node.attributes);
    const childrenHtml = await this.joinChildren(node.children);

    return `<mark${attrs}>${childrenHtml}</mark>`;
  }

  visitMath(node: any): string {
    const attrs = this.renderAllAttributes(node.attributes);
    try {
      const html = katex.renderToString(node.content, {
        displayMode: node.isBlock,
        throwOnError: false,
      });

      if (node.isBlock) {
        return `<div${attrs} class="zolt-math-block">${html}</div>`;
      }

      return `<span${attrs} class="zolt-math-inline">${html}</span>`;
    } catch (_e) {
      return `<span${attrs} class="zolt-math-error">${node.content}</span>`;
    }
  }

  async visitInlineStyle(node: InlineStyleNode): Promise<string> {
    const attrs = this.renderAllAttributes(node.attributes);
    const childrenHtml = await this.joinChildren(node.children);

    return `<span${attrs}>${childrenHtml}</span>`;
  }

  async visitLink(node: LinkNode): Promise<string> {
    const nodeAttrs = { ...node.attributes };

    if (node.title && !nodeAttrs.title) {
      nodeAttrs.title = node.title;
    }

    if (nodeAttrs.target === '_blank') {
      const currentRel = nodeAttrs.rel || '';
      if (!currentRel.includes('noopener')) {
        nodeAttrs.rel = currentRel ? `${currentRel} noopener` : 'noopener';
      }
    }

    const attrs = this.renderAllAttributes(nodeAttrs);
    let href = this.evaluateString(node.href);

    const isExternal = href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:');
    const isAnchor = href.startsWith('#');
    const isZlt = href.endsWith('.zlt');

    if (!isExternal && !isAnchor && !isZlt && this.assetResolver) {
      href = this.assetResolver(href);
    } else {
      href = transformHref(href);
    }

    const childrenHtml = await this.joinChildren(node.children);

    return `<a href="${href}"${attrs}>${childrenHtml}</a>`;
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

    const youtubeMatch = resolvedSrc.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/
    );
    const vimeoMatch = resolvedSrc.match(/(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);

    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      const embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}`;
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

    // Remove controls from attributes if present to avoid duplicate
    delete (nodeAttrs as any)['controls'];
    const attrs = this.renderAllAttributes(nodeAttrs);

    return `<video src="${resolvedSrc}" controls${attrs}>${alt}</video>`;
  }

  visitAudio(node: AudioNode): string {
    const nodeAttrs = { ...node.attributes };
    // Remove controls from attributes if present to avoid duplicate
    delete nodeAttrs['controls'];
    const attrs = this.renderAllAttributes(nodeAttrs);
    const src = this.evaluateString(node.src);
    const alt = this.evaluateString(node.alt ?? '');

    const isRemote = src.startsWith('http://') || src.startsWith('https://');
    const resolvedSrc = !isRemote && this.assetResolver ? this.assetResolver(src) : src;

    return `<audio src="${resolvedSrc}" controls${attrs}>${alt}</audio>`;
  }

  visitEmbed(node: EmbedNode): string {
    const src = this.evaluateString(node.src);
    const title = this.evaluateString(node.title ?? '');
    const titleAttr = title ? ` title="${title}"` : '';

    const isRemote = src.startsWith('http://') || src.startsWith('https://');
    const resolvedSrc = !isRemote && this.assetResolver ? this.assetResolver(src) : src;

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
    const nodeAttrs: any = { ...node.attributes, target: '_blank' };

    const currentRel = nodeAttrs.rel || '';
    if (!currentRel.includes('noopener')) {
      nodeAttrs.rel = currentRel ? `${currentRel} noopener` : 'noopener';
    }

    const attrs = this.renderAllAttributes(nodeAttrs);
    let src = this.evaluateString(node.src);
    const title = node.title ? this.evaluateString(node.title) : null;

    const isRemote = src.startsWith('http://') || src.startsWith('https://');

    if (!isRemote && this.assetResolver && !src.endsWith('.zlt')) {
      src = this.assetResolver(src);
    } else {
      src = transformHref(src);
    }

    return `<a href="${src}"${attrs}>${title || src}</a>`;
  }

  visitVariable(node: VariableNode): string {
    try {
      const value = this.evaluator.evaluate(`$${node.name}`);
      if (value === null || value === undefined) {
        return `{$${node.name}}`;
      }

      return escapeHtml(formatValue(value));
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

      return escapeHtml(formatValue(value));
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

    return parts.length > 0 ? ` ${parts.join(' ')}` : '';
  }

  private evaluateString(text: string): string {
    return text.replace(/\{\$([a-zA-Z_][a-zA-Z0-9_]*[^}]*)?}/g, (_, name) => {
      try {
        const val = this.evaluator.evaluate(`$${name}`);

        return escapeHtml(formatValue(val));
      } catch {
        return `{$${name}}`;
      }
    });
  }
}
