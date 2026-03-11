import type { Content } from 'pdfmake/interfaces';

/**
 * Applique les attributs Zolt (id, align, class, etc.) à un objet de contenu pdfmake.
 */
export function applyAttributes(content: Content, node: any): Content {
  if (!node || !node.attributes) {
    return content;
  }

  const attrs = node.attributes;
  const result = content as any;

  // 1. Identifiant unique
  if (attrs.id) {
    result.id = attrs.id;
  }

  // 2. Classes CSS (mappées sur les styles pdfmake)
  if (attrs.class) {
    // Si style existe déjà (ex: paragraph), on fusionne
    if (result.style) {
      const existingStyles = Array.isArray(result.style) ? result.style : [result.style];
      const newStyles = attrs.class.split(' ');
      result.style = [...existingStyles, ...newStyles];
    } else {
      result.style = attrs.class.split(' ');
    }
  }

  // 3. Styles inline et attributs génériques (mappage direct sur propriétés pdfmake)
  const directMappings: Record<string, string> = {
    align: 'alignment',
    alignment: 'alignment',
    color: 'color',
    background: 'background',
    backgroundColor: 'background',
    fontSize: 'fontSize',
    bold: 'bold',
    italics: 'italics',
    italic: 'italics',
    width: 'width',
    height: 'height',
    opacity: 'opacity',
  };

  for (const [key, value] of Object.entries(attrs)) {
    if (directMappings[key]) {
      const pdfProp = directMappings[key];
      // Conversion de type basique pour les booléens et nombres (y compris floats)
      if (value === 'true') {
        result[pdfProp] = true;
      } else if (value === 'false') {
        result[pdfProp] = false;
      } else if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) {
        result[pdfProp] = parseFloat(value);
      } else if (typeof value === 'number') {
        result[pdfProp] = value;
      } else {
        result[pdfProp] = value;
      }
    } else if (key === 'margin') {
      // Support du format margin="10" ou margin="[10, 5, 10, 5]"
      if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        try {
          result.margin = JSON.parse(value);
        } catch {
          /* ignore invalid margin */
        }
      } else if (!Number.isNaN(Number(value))) {
        result.margin = Number(value);
      }
    }
  }

  return result;
}
