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
      fontWeight: 'font-weight',
      fontSize: 'font-size',
      fontStyle: 'font-style',
      fontFamily: 'font-family',
      textDecoration: 'text-decoration',
      textAlign: 'text-align',
      color: 'color',
      background: 'background',
      backgroundColor: 'background-color',
      border: 'border',
      borderRadius: 'border-radius',
      borderLeft: 'border-left',
      borderRight: 'border-right',
      borderTop: 'border-top',
      borderBottom: 'border-bottom',
      padding: 'padding',
      paddingLeft: 'padding-left',
      paddingRight: 'padding-right',
      paddingTop: 'padding-top',
      paddingBottom: 'padding-bottom',
      margin: 'margin',
      marginLeft: 'margin-left',
      marginRight: 'margin-right',
      marginTop: 'margin-top',
      marginBottom: 'margin-bottom',
      display: 'display',
      opacity: 'opacity',
      transform: 'transform',
      width: 'width',
      height: 'height',
      w: 'width',
      h: 'height',
      float: 'float',
      listStyle: 'list-style',
      listStyleType: 'list-style-type',
      shadow: 'box-shadow',
      verticalAlign: 'vertical-align',
      whiteSpace: 'white-space',
      wordBreak: 'word-break',
      overflow: 'overflow',
      zIndex: 'z-index',
    };

    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined && (cssPropertyMap[key] || cssPropertyMap[this.camelToKebab(key)])) {
        const cssKey = cssPropertyMap[key] || cssPropertyMap[this.camelToKebab(key)];
        let processedValue = this.evaluateString(String(value));

        if (key === 'shadow' && processedValue === 'true') {
          processedValue = '0 4px 12px var(--zlt-color-shadow)';
        }

        // Add px to numeric width/height if no unit specified
        if ((cssKey === 'width' || cssKey === 'height') && /^\d+(\.\d+)?$/.test(processedValue)) {
          processedValue += 'px';
        }

        cssProps.push(`${cssKey}: ${processedValue}`);

        if (cssKey === 'float') {
          if (processedValue === 'right' && !attrs['marginLeft'] && !attrs['margin-left'] && !attrs['margin']) {
            cssProps.push('margin-left: 1rem');
          } else if (processedValue === 'left' && !attrs['marginRight'] && !attrs['margin-right'] && !attrs['margin']) {
            cssProps.push('margin-right: 1rem');
          }
        }
      }
    }

    return cssProps.length > 0 ? ` style="${cssProps.join('; ')}"` : '';
  }

  private filterCssProperties(attrs: Attributes): Attributes {
    const cssProps = new Set([
      'fontWeight',
      'fontSize',
      'fontStyle',
      'fontFamily',
      'textDecoration',
      'textAlign',
      'color',
      'background',
      'backgroundColor',
      'border',
      'borderRadius',
      'borderLeft',
      'borderRight',
      'borderTop',
      'borderBottom',
      'padding',
      'paddingLeft',
      'paddingRight',
      'paddingTop',
      'paddingBottom',
      'margin',
      'marginLeft',
      'marginRight',
      'marginTop',
      'marginBottom',
      'display',
      'opacity',
      'transform',
      'width',
      'height',
      'w',
      'h',
      'float',
      'listStyle',
      'listStyleType',
      'shadow',
      'verticalAlign',
      'whiteSpace',
      'wordBreak',
      'overflow',
      'zIndex',
      // Maintain old ones for backward compatibility if needed, but the goal is to migrate
      'font-weight',
      'font-size',
      'font-style',
      'font-family',
      'text-decoration',
      'text-align',
      'background-color',
      'border-radius',
      'border-left',
      'border-right',
      'border-top',
      'border-bottom',
      'padding-left',
      'padding-right',
      'padding-top',
      'padding-bottom',
      'margin-left',
      'margin-right',
      'margin-top',
      'margin-bottom',
      'list-style',
      'list-style-type',
      'vertical-align',
      'white-space',
      'word-break',
      'z-index',
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
        const kebabKey = this.camelToKebab(key);
        if (value === '') {
          parts.push(kebabKey);
        } else {
          const processedValue = this.evaluateString(String(value));
          parts.push(`${kebabKey}="${processedValue}"`);
        }
      }
    }

    return parts.length > 0 ? ' ' + parts.join(' ') : '';
  }

  private camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
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
