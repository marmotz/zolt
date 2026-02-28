export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function toRoman(num: number): string {
  const lookup: { [key: string]: number } = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };
  let roman = '';
  for (const i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }

  return roman;
}

export function toAlpha(num: number): string {
  let alpha = '';
  while (num > 0) {
    const mod = (num - 1) % 26;
    alpha = String.fromCharCode(65 + mod) + alpha;
    num = Math.floor((num - mod) / 26);
  }

  return alpha || 'A';
}

export function formatValue(value: any): string {
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

export function transformHref(href: string): string {
  if (href.startsWith('@')) {
    return '#' + href.substring(1);
  }
  if (href.endsWith('.zlt')) {
    return href.replace(/\.zlt$/, '.html');
  }

  return href;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
