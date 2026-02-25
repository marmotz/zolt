import {
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
import { slugify, toAlpha, toRoman } from '../utils/string-utils';

export class BlockVisitor {
  public headingCounters: number[] = new Array(7).fill(0);

  constructor(
    private build: (node: ASTNode) => string,
    private joinChildren: (nodes: ASTNode[]) => string,
    private renderAllAttributes: (attrs?: any) => string,
    private processInlineContent: (text: string) => string,
    private evaluator: any
  ) {}

  public reset(): void {
    this.headingCounters.fill(0);
  }

  visitHeading(node: HeadingNode): string {
    const level = Math.min(Math.max(node.level, 1), 6);
    const childrenHtml = this.joinChildren(node.children);
    const renderedContent = childrenHtml.trim();

    if (!renderedContent) {
      return '';
    }

    if (!node.attributes) {
      node.attributes = {};
    }

    const isGlobalNumbering = this.evaluator.getVariable('numbering') === true;
    const isLocalNumbering = node.attributes.numbered === 'true';
    const isNumberingDisabled = node.attributes.numbered === 'false';

    let numberStr = '';
    if ((isGlobalNumbering && !isNumberingDisabled) || isLocalNumbering) {
      this.headingCounters[level]++;
      for (let i = level + 1; i <= 6; i++) this.headingCounters[i] = 0;

      const numberingStyle = this.evaluator.getVariable('numbering_style') || 'decimal';
      const parts = this.headingCounters.slice(1, level + 1);

      if (numberingStyle === 'decimal') {
        numberStr = `<span class="zolt-heading-number">${parts.join('.')} </span>`;
      } else if (numberingStyle === 'roman-lower') {
        numberStr = `<span class="zolt-heading-number">${parts.map((p) => toRoman(p).toLowerCase()).join('.')} </span>`;
      } else if (numberingStyle === 'roman-upper') {
        numberStr = `<span class="zolt-heading-number">${parts.map((p) => toRoman(p).toUpperCase()).join('.')} </span>`;
      } else if (numberingStyle === 'alpha-lower') {
        numberStr = `<span class="zolt-heading-number">${parts.map((p) => toAlpha(p).toLowerCase()).join('.')} </span>`;
      } else if (numberingStyle === 'alpha-upper') {
        numberStr = `<span class="zolt-heading-number">${parts.map((p) => toAlpha(p).toUpperCase()).join('.')} </span>`;
      }
    }

    if (!node.attributes.id) {
      const textContent = renderedContent.replace(/<[^>]+>/g, '').trim();
      node.attributes.id = slugify(textContent);
    }

    const attrs = this.renderAllAttributes(node.attributes);

    return `<h${level}${attrs}>${numberStr}${renderedContent}</h${level}>`;
  }

  visitParagraph(node: ParagraphNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const childrenHtml = this.joinChildren(node.children);
    const trimmed = childrenHtml.replace(/\s+/g, ' ').trim();
    if (!trimmed) {
      return '';
    }

    return `<p${attrs}>${trimmed}</p>`;
  }

  visitBlockquote(node: BlockquoteNode): string {
    const childrenHtml = this.joinChildren(node.children);
    const attrs = this.renderAllAttributes(node.attributes);

    return `<blockquote${attrs}>${childrenHtml}</blockquote>`;
  }

  visitList(node: ListNode): string {
    let tag = 'ul';
    if (node.kind === 'numbered') {
      tag = 'ol';
    } else if (node.kind === 'definition') {
      tag = 'dl';
    }

    if (node.kind === 'plain') {
      if (!node.attributes) {
        node.attributes = {};
      }
      node.attributes.class = (node.attributes.class ? node.attributes.class + ' ' : '') + 'zolt-list-plain';
    }

    const childrenHtml = this.joinChildren(node.children);
    const attrs = this.renderAllAttributes(node.attributes);

    return `<${tag}${attrs}>
${childrenHtml}
</${tag}>`;
  }

  visitListItem(node: ListItemNode): string {
    const checkbox =
      node.checked !== undefined
        ? `<input type="checkbox" ${node.checked ? 'checked' : ''} onclick="return false;">`
        : '';
    const childrenHtml = this.joinChildren(node.children);
    const trimmed = childrenHtml.replace(/\s+/g, ' ').trim();

    const attrs = this.renderAllAttributes(node.attributes);

    return `<li${attrs}>${checkbox}${trimmed}</li>`;
  }

  visitDefinitionTerm(node: DefinitionTermNode): string {
    const childrenHtml = this.joinChildren(node.children);
    const trimmed = childrenHtml.replace(/\s+/g, ' ').trim();

    const attrs = this.renderAllAttributes(node.attributes);

    return `<dt${attrs}>${trimmed}</dt>`;
  }

  visitDefinitionDescription(node: DefinitionDescriptionNode): string {
    const childrenHtml = this.joinChildren(node.children);
    const trimmed = childrenHtml.replace(/\s+/g, ' ').trim();

    const attrs = this.renderAllAttributes(node.attributes);

    return `<dd${attrs}>${trimmed}</dd>`;
  }

  visitCodeBlock(node: CodeBlockNode): string {
    const lang = node.language ? ` class="language-${node.language}"` : '';
    const attrs = this.renderAllAttributes(node.attributes);
    const escapedContent = node.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return `<pre${attrs}><code${lang}>${escapedContent}</code></pre>`;
  }

  visitIndentation(node: IndentationNode): string {
    const childrenHtml = this.joinChildren(node.children);
    if (!childrenHtml.trim()) {
      return '';
    }
    const attrs = this.renderAllAttributes(node.attributes);

    return `<div${attrs} class="indented" style="margin-left: 2em">${childrenHtml}</div>`;
  }

  visitHorizontalRule(node: HorizontalRuleNode, renderAllAttributes: (attrs?: any) => string): string {
    const attrs: any = node.attributes ? { ...node.attributes } : {};
    const cssProps: string[] = [];

    if (node.style === 'thick') {
      cssProps.push('border-top-width: 4px');
    } else if (node.style === 'thin') {
      cssProps.push('border-top-width: 1px');
    } else {
      cssProps.push('border-top-width: 2px');
    }

    let borderStyle = 'solid';
    if (attrs.style) {
      if (attrs.style === 'dashed' || attrs.style === 'dotted' || attrs.style === 'solid' || attrs.style === 'double') {
        borderStyle = attrs.style;
        delete attrs.style;
      }
    }
    cssProps.push(`border-top-style: ${borderStyle}`);

    if (attrs.color) {
      cssProps.push(`border-top-color: ${attrs.color}`);
      delete attrs.color;
    }
    if (attrs.width) {
      if (
        attrs.width.endsWith('%') ||
        attrs.width.endsWith('px') ||
        attrs.width.endsWith('em') ||
        attrs.width.endsWith('rem')
      ) {
        cssProps.push(`width: ${attrs.width}`);
        delete attrs.width;
      }
    }
    if (attrs.align) {
      if (attrs.align === 'center') {
        cssProps.push(`margin-left: auto`);
        cssProps.push(`margin-right: auto`);
      } else if (attrs.align === 'left') {
        cssProps.push(`margin-right: auto`);
      } else if (attrs.align === 'right') {
        cssProps.push(`margin-left: auto`);
      }
      delete attrs.align;
    }

    const styleStr = cssProps.length > 0 ? ` style="${cssProps.join('; ')}"` : '';
    const otherAttrs = renderAllAttributes(attrs);

    return `<hr${styleStr}${otherAttrs}>`;
  }
}
