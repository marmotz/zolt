/**
 * Formate une valeur (nombre, booléen, objet, tableau) en chaîne de caractères pour l'affichage.
 */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return value.toString();
    }
    const formatted = value.toFixed(10);

    return parseFloat(formatted).toString();
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}
