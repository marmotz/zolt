import { Attributes, BlockquoteNode } from '../../../parser/types';
import { HTMLBuilder } from '../builder';

export function visitBlockquote(node: BlockquoteNode, builder: HTMLBuilder): string {
  const childrenHtml = node.children.map((child) => builder.build(child)).join('');

  const attrs = buildAttributes(node.attributes);
  return `<blockquote${attrs}>${childrenHtml}</blockquote>`;
}

function buildAttributes(attrs?: Attributes): string {
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
