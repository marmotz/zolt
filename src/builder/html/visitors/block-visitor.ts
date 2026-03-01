import type {
  ASTNode,
  BlockquoteNode,
  DefinitionDescriptionNode,
  DefinitionTermNode,
  HeadingNode,
  HorizontalRuleNode,
  ImageNode,
  IndentationNode,
  ListItemNode,
  ListNode,
  ParagraphNode,
} from '../../../parser/types';
import { slugify, toAlpha, toRoman } from '../utils/string-utils';

export class BlockVisitor {
  public headingCounters: number[] = new Array(7).fill(0);
  public h1Count: number = 0;

  constructor(
    _build: (node: ASTNode) => Promise<string>,
    private joinChildren: (nodes: ASTNode[]) => Promise<string>,
    private joinInlineChildren: (nodes: ASTNode[]) => Promise<string>,
    private renderAllAttributes: (attrs?: any) => string,
    _processInlineContent: (text: string) => Promise<string>,
    private evaluator: any
  ) {}

  public reset(): void {
    this.headingCounters.fill(0);
    this.h1Count = 0;
  }

  async visitHeading(node: HeadingNode): Promise<string> {
    const level = Math.min(Math.max(node.level, 1), 6);
    const childrenHtml = await this.joinInlineChildren(node.children);
    const renderedContent = childrenHtml.trim();

    if (!renderedContent) {
      return '';
    }

    if (!node.attributes) {
      node.attributes = {};
    }

    const numberingVar = this.evaluator.getVariable('numbering');
    const isGlobalNumbering = numberingVar === true || (typeof numberingVar === 'string' && numberingVar !== 'false');
    const isLocalNumbering =
      node.attributes.numbering === 'true' ||
      (node.attributes && Object.hasOwn(node.attributes, 'numbering') && node.attributes.numbering !== 'false');
    const isNumberingDisabled = node.attributes.numbering === 'false';

    // Always increment the counter for every heading to track structure
    this.headingCounters[level]++;
    for (let i = level + 1; i <= 6; i++) {
      this.headingCounters[i] = 0;
    }

    let numberStr = '';
    if ((isGlobalNumbering && !isNumberingDisabled) || isLocalNumbering) {
      const numberingVar = this.evaluator.getVariable('numbering');
      const localValue = node.attributes.numbering;
      const globalValue = typeof numberingVar === 'string' ? numberingVar : 'decimal';

      // Determine the list of styles to use
      const styleSource = (localValue && localValue !== 'true' ? localValue : globalValue) || 'decimal';
      const styles = styleSource.split(',').map((s) => s.trim());

      const formatPart = (val: number, style: string) => {
        switch (style) {
          case 'roman-lower':
            return toRoman(val).toLowerCase();
          case 'roman-upper':
            return toRoman(val).toUpperCase();
          case 'alpha-lower':
            return toAlpha(val).toLowerCase();
          case 'alpha-upper':
            return toAlpha(val).toUpperCase();
          case 'decimal':
          default:
            return val.toString();
        }
      };

      // Rule: If there is only one H1 in the document, we don't number it
      // and we start numbering from H2 as the first level.
      const startLevel = this.h1Count === 1 ? 2 : 1;

      if (level >= startLevel) {
        const parts = this.headingCounters.slice(startLevel, level + 1);

        // If selective numbering is used (not global), skip leading zeros
        let effectiveParts = parts;
        let styleOffset = 0;
        if (!isGlobalNumbering) {
          const firstNonZero = parts.findIndex((p) => p > 0);
          if (firstNonZero !== -1) {
            effectiveParts = parts.slice(firstNonZero);
            styleOffset = firstNonZero;
          }
        }

        if (effectiveParts.length > 0) {
          const formattedParts = effectiveParts.map((p, i) => {
            const styleIdx = styleOffset + i;
            const style = styles[styleIdx] || styles[styles.length - 1] || 'decimal';

            return formatPart(p, style);
          });

          numberStr = `<span class="zolt-heading-number">${formattedParts.join('.')} </span>`;
        }
      }
    }

    if (!node.attributes.id) {
      const textContent = renderedContent.replace(/<[^>]+>/g, '').trim();
      node.attributes.id = slugify(textContent);
    }

    const cleanAttributes = { ...node.attributes };
    delete cleanAttributes.numbering;
    const attrs = this.renderAllAttributes(cleanAttributes);

    return `<h${level}${attrs}>${numberStr}${renderedContent}</h${level}>`;
  }

  async visitParagraph(node: ParagraphNode): Promise<string> {
    // Check for single image with align=center
    if (node.children.length === 1 && node.children[0].type === 'Image') {
      const imageNode = node.children[0] as ImageNode;
      if (imageNode.attributes && imageNode.attributes.align === 'center') {
        // Add style to paragraph
        if (!node.attributes) {
          node.attributes = {};
        }
        const currentStyle = node.attributes.style ? `${node.attributes.style};` : '';
        node.attributes.style = `${currentStyle}text-align: center`;
        // Remove align from image to avoid invalid attribute
        delete imageNode.attributes.align;
      }
    }

    const attrs = this.renderAllAttributes(node.attributes);
    const childrenHtml = await this.joinChildren(node.children);
    const trimmed = childrenHtml.replace(/\s+/g, ' ').trim();
    if (!trimmed) {
      return '';
    }

    return `<p${attrs}>${trimmed}</p>`;
  }

  async visitBlockquote(node: BlockquoteNode): Promise<string> {
    const childrenHtml = await this.joinChildren(node.children);
    const attrs = this.renderAllAttributes(node.attributes);

    return `<blockquote${attrs}>${childrenHtml}</blockquote>`;
  }

  async visitList(node: ListNode): Promise<string> {
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
      node.attributes.class = `${node.attributes.class ? `${node.attributes.class} ` : ''}zolt-list-plain`;
    }

    if (node.kind === 'task') {
      if (!node.attributes) {
        node.attributes = {};
      }
      node.attributes.class = `${node.attributes.class ? `${node.attributes.class} ` : ''}zolt-list-task`;
    }

    const childrenHtml = await this.joinChildren(node.children);
    const attrs = this.renderAllAttributes(node.attributes);

    return `<${tag}${attrs}>
${childrenHtml}
</${tag}>`;
  }

  async visitListItem(node: ListItemNode): Promise<string> {
    const checkbox =
      node.checked !== undefined
        ? `<input type="checkbox" ${node.checked ? 'checked' : ''} onclick="return false;">`
        : '';
    const childrenHtml = await this.joinChildren(node.children);
    const trimmed = childrenHtml.replace(/\s+/g, ' ').trim();

    const attrs = this.renderAllAttributes(node.attributes);

    return `<li${attrs}>${checkbox}${trimmed}</li>`;
  }

  async visitDefinitionTerm(node: DefinitionTermNode): Promise<string> {
    const childrenHtml = await this.joinChildren(node.children);
    const trimmed = childrenHtml.replace(/\s+/g, ' ').trim();

    const attrs = this.renderAllAttributes(node.attributes);

    return `<dt${attrs}>${trimmed}</dt>`;
  }

  async visitDefinitionDescription(node: DefinitionDescriptionNode): Promise<string> {
    const childrenHtml = await this.joinChildren(node.children);
    const trimmed = childrenHtml.replace(/\s+/g, ' ').trim();

    const attrs = this.renderAllAttributes(node.attributes);

    return `<dd${attrs}>${trimmed}</dd>`;
  }

  async visitIndentation(node: IndentationNode): Promise<string> {
    const childrenHtml = await this.joinChildren(node.children);
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
