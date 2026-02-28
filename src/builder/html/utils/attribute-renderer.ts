import { Attributes } from '../../../parser/types';
import { escapeHtml, formatValue } from './string-utils';

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
      w: 'width',
      h: 'height',
      float: 'float',
      'margin-left': 'margin-left',
      'margin-right': 'margin-right',
      'list-style': 'list-style',
      'list-style-type': 'list-style-type',
      shadow: 'box-shadow',
    };

    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined && cssPropertyMap[key]) {
        let processedValue = this.evaluateString(String(value));

        if (key === 'shadow' && processedValue === 'true') {
          processedValue = '0 4px 12px var(--zlt-color-shadow)';
        }

        // Add px to numeric width/height if no unit specified
        if (
          (key === 'width' || key === 'height' || key === 'w' || key === 'h') &&
          /^\d+(\.\d+)?$/.test(processedValue)
        ) {
          processedValue += 'px';
        }

        cssProps.push(`${cssPropertyMap[key]}: ${processedValue}`);

        if (key === 'float') {
          if (processedValue === 'right' && !attrs['margin-left'] && !attrs['margin']) {
            cssProps.push('margin-left: 1rem');
          } else if (processedValue === 'left' && !attrs['margin-right'] && !attrs['margin']) {
            cssProps.push('margin-right: 1rem');
          }
        }
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
      'w',
      'h',
      'float',
      'margin-left',
      'margin-right',
      'list-style',
      'list-style-type',
      'shadow',
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

        return escapeHtml(formatValue(val));
      } catch {
        return `{$${name}}`;
      }
    });
  }
}
