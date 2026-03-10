import type { Content } from 'pdfmake/interfaces';

/**
 * Applique les attributs Zolt (id, align, etc.) à un objet de contenu pdfmake.
 */
export function applyAttributes(content: Content, node: any): Content {
  if (!node || !node.attributes) {
    return content;
  }

  const attrs = node.attributes;
  const result = content as any;

  if (attrs.id) {
    result.id = attrs.id;
  }

  if (attrs.align) {
    result.alignment = attrs.align;
  }

  // On peut ajouter d'autres supports d'attributs ici si nécessaire

  return result;
}
