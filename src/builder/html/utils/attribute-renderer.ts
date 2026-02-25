import { Attributes } from '../../../parser/types';
import { formatValue } from './string-utils';

export class AttributeRenderer {
  constructor(private evaluator: any) {}

  public renderAllAttributes(attrs?: Attributes): string {
    if (!attrs) {
      return '';
    }

    const htmlAttrs = this.filterCssProperties(attrs);
    const styleStr = this.buildStyleAttribute(attrs);
    const otherAttrs = this.buildAttributes(htmlAttrs);

    return `${styleStr}${otherAttrs}`;
  }

  public buildStyleAttribute(attrs?: Attributes): string {
    if (!attrs) {
      return '';
    }

    const cssProps: string[] = [];
    const cssPropertyMap: Record<string, string> = {
      'font-weight': 'font-weight',
      'font-size': 'font-size',
      'font-style': 'font-style',
      'font-family': 'font-family',
      'text-decoration': 'text-decoration',
      'text-align': 'text-align',
      color: 'color',
      background: 'background',
      'background-color': 'background-color',
      border: 'border',
      'border-radius': 'border-radius',
      padding: 'padding',
      margin: 'margin',
      display: 'display',
      opacity: 'opacity',
      transform: 'transform',
      width: 'width',
      height: 'height',
      float: 'float',
      'list-style': 'list-style',
      'list-style-type': 'list-style-type',
    };

    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined && cssPropertyMap[key]) {
        const processedValue = this.evaluateString(String(value));
        cssProps.push(`${cssPropertyMap[key]}: ${processedValue}`);
      }
    }

    return cssProps.length > 0 ? ` style="${cssProps.join('; ')}"` : '';
  }

  private filterCssProperties(attrs: Attributes): Attributes {
    const cssProps = new Set([
      'font-weight',
      'font-size',
      'font-style',
      'font-family',
      'text-decoration',
      'text-align',
      'color',
      'background',
      'background-color',
      'border',
      'border-radius',
      'padding',
      'margin',
      'display',
      'opacity',
      'transform',
      'width',
      'height',
      'float',
      'list-style',
      'list-style-type',
    ]);
    const filtered: Attributes = {};
    for (const [key, value] of Object.entries(attrs)) {
      if (!cssProps.has(key)) {
        filtered[key] = value;
      }
    }

    return filtered;
  }

  public buildAttributes(attrs?: Attributes): string {
    if (!attrs) {
      return '';
    }

    const parts: string[] = [];
    if (attrs.id) {
      const processedId = this.evaluateString(String(attrs.id));
      parts.push(`id="${processedId}"`);
    }
    if (attrs.class) {
      const processedClass = this.evaluateString(String(attrs.class));
      parts.push(`class="${processedClass}"`);
    }

    for (const [key, value] of Object.entries(attrs)) {
      if (key !== 'id' && key !== 'class' && value !== undefined) {
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
    return text.replace(/\{\$([a-zA-Z_]\w*)}/g, (_, name) => {
      try {
        const val = this.evaluator.evaluate('$' + name);

        return formatValue(val);
      } catch {
        return `{$${name}}`;
      }
    });
  }
}
