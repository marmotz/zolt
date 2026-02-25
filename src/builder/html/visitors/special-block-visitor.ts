import { InlineParser } from '../../../parser/inline-parser';
import { ASTNode, Attributes, DoubleBracketBlockNode, HeadingNode, TripleColonBlockNode } from '../../../parser/types';
import { slugify, toAlpha, toRoman } from '../utils/string-utils';

export class SpecialBlockVisitor {
  private tabsCounter: number = 0;
  public hasTabs: boolean = false;
  public hasCharts: boolean = false;
  public hasMermaid: boolean = false;

  constructor(
    private build: (node: ASTNode) => string,
    private joinChildren: (nodes: ASTNode[]) => string,
    private renderAllAttributes: (attrs?: any) => string,
    private inlineParser: InlineParser,
    private evaluator: any,
    private processInlineContent: (text: string) => string,
    private currentHeadings: HeadingNode[],
    private mergeAdjacentLists: (results: string[]) => string
  ) {}

  public reset(): void {
    this.tabsCounter = 0;
    this.hasTabs = false;
    this.hasCharts = false;
    this.hasMermaid = false;
  }

  visitTripleColonBlock(node: TripleColonBlockNode): string {
    if (node.blockType.startsWith('if ')) {
      return this.visitIfBlock(node);
    }

    if (node.blockType.startsWith('foreach ')) {
      return this.visitForeachBlock(node);
    }

    if (node.blockType === 'tabs') {
      return this.visitTabsBlock(node);
    }

    if (node.blockType === 'tab') {
      return this.visitTabBlock(node);
    }

    const childrenHtml = this.joinChildren(node.children);

    if (node.blockType === 'details') {
      const open = node.attributes?.open === 'true' ? ' open' : '';
      const attrs = this.renderAllAttributes(node.attributes);
      const title = node.title ? this.processInlineContent(node.title) : 'Details';

      return `<details${attrs}${open} class="triple-colon-block details" data-type="details">\n  <summary>${title}</summary>\n  <div class="details-content">\n${childrenHtml}\n  </div>\n</details>`;
    }

    if (node.blockType === 'columns' && node.attributes?.cols) {
      const cols = parseInt(node.attributes.cols);
      if (!isNaN(cols)) {
        const style = `--zolt-cols: ${cols};`;
        node.attributes.style = node.attributes.style ? `${node.attributes.style} ${style}` : style;
      }
    }

    if (node.blockType === 'column' && node.attributes?.width?.endsWith('%')) {
      const p = parseFloat(node.attributes.width);
      if (!isNaN(p)) {
        const factor = (1 - p / 100).toFixed(3);
        node.attributes.width = `calc(${p}% - (var(--zolt-column-gap, 1.5rem) * ${factor}))`;
      }
    }

    const attrs = this.renderAllAttributes(node.attributes);

    const extraClass = node.blockType === 'columns' || node.blockType === 'column' ? ` ${node.blockType}` : '';
    const semanticTypes = ['info', 'warning', 'error', 'success', 'note', 'abstract'];
    const semanticClass = semanticTypes.includes(node.blockType) ? ` ${node.blockType}` : '';

    let html = `<div${attrs} class="triple-colon-block${extraClass}${semanticClass}" data-type="${node.blockType}">\n`;
    if (node.title && node.blockType !== 'column' && node.blockType !== 'columns') {
      const title = this.processInlineContent(node.title);
      html += `<div class="block-title">${title}</div>\n`;
    }
    html += `${childrenHtml}\n</div>`;

    return html;
  }

  private visitIfBlock(node: TripleColonBlockNode): string {
    let condition = node.blockType.substring(3).trim();

    // Support multiple {{ }} or {$ } in the same condition string
    condition = condition.replace(/\{\{\s*(.+?)\s*}}/g, (_, expr) => {
      try {
        const val = this.evaluator.evaluate(expr);

        return String(val);
      } catch {
        return 'false';
      }
    });

    condition = condition.replace(/\{\$([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*|\[[^\]]+])*)}/g, (_, varPath) => {
      try {
        const val = this.evaluator.evaluate('$' + varPath);

        return String(val);
      } catch {
        return 'null';
      }
    });

    // Strip outer braces if it's a single block: { condition }
    if (condition.startsWith('{') && condition.endsWith('}')) {
      condition = condition.slice(1, -1).trim();
    }

    try {
      const result = this.evaluator.evaluate(condition);
      if (this.evaluator.isTruthy(result)) {
        return this.joinChildren(node.children);
      }
    } catch (e) {
      console.warn(`Failed to evaluate condition: ${condition}`, e);
    }

    return '';
  }

  private visitForeachBlock(node: TripleColonBlockNode): string {
    const foreachExpr = node.blockType.substring(8).trim();
    // Support foreach {$item in $items} or foreach {$items as $item}
    // and handle complex paths like $user.roles or $dict[$key]
    const match = foreachExpr.match(/^\{\s*(\$?[a-zA-Z_][\w.$\[\]]*)\s+(?:as|in)\s+\$([a-zA-Z_]\w*)\s*}$/);

    if (!match) {
      console.warn(`Invalid foreach expression: ${foreachExpr}`);

      return '';
    }

    let collectionPath = match[1];
    if (!collectionPath.startsWith('$')) collectionPath = '$' + collectionPath;
    const iteratorName = match[2];

    try {
      const collection = this.evaluator.evaluate(collectionPath);
      if (!Array.isArray(collection)) {
        return '';
      }

      const results: string[] = [];
      const originalIteratorValue = this.evaluator.getVariable(iteratorName);
      const originalForeachValue = this.evaluator.getVariable('foreach');

      collection.forEach((item, index) => {
        this.evaluator.setVariable(iteratorName, item);
        this.evaluator.setVariable('foreach', {
          index,
          index1: index + 1,
          first: index === 0,
          last: index === collection.length - 1,
          even: index % 2 === 0,
          odd: index % 2 === 1,
        });
        results.push(this.joinChildren(node.children));
      });

      // Restore original variables
      this.evaluator.setVariable(iteratorName, originalIteratorValue);
      this.evaluator.setVariable('foreach', originalForeachValue);

      return this.mergeAdjacentLists(results);
    } catch (e) {
      console.warn(`Failed to evaluate collection: ${collectionPath}`, e);

      return '';
    }
  }

  private visitTabsBlock(node: TripleColonBlockNode): string {
    this.hasTabs = true;
    const tabsId = `zolt-tabs-${this.tabsCounter++}`;
    const defaultTab = node.attributes?.default || null;

    const tabChildren = node.children.filter(
      (child): child is TripleColonBlockNode =>
        child.type === 'TripleColonBlock' && (child as TripleColonBlockNode).blockType === 'tab'
    );

    const buttons: string[] = [];
    const panels: string[] = [];

    let activeIndex = 0;
    if (defaultTab) {
      const idx = tabChildren.findIndex((tab) => tab.title === defaultTab);
      if (idx !== -1) {
        activeIndex = idx;
      }
    }

    tabChildren.forEach((tab, index) => {
      const isActiveByAttr = tab.attributes?.active === 'true';
      if (isActiveByAttr) {
        activeIndex = index;
      }
    });

    tabChildren.forEach((tab, index) => {
      const panelId = `${tabsId}-panel-${index}`;
      const buttonId = `${tabsId}-button-${index}`;
      const isActive = index === activeIndex;
      const title = tab.title || `Tab ${index + 1}`;

      buttons.push(
        `    <button id="${buttonId}" class="zolt-tab-button${isActive ? ' active' : ''}" role="tab" aria-selected="${isActive}" aria-controls="${panelId}" data-tab-index="${index}">${this.processInlineContent(title)}</button>`
      );

      const tabContent = this.joinChildren(tab.children);
      panels.push(
        `  <div id="${panelId}" class="zolt-tab-panel${isActive ? ' active' : ''}" role="tabpanel" aria-labelledby="${buttonId}" data-tab-index="${index}">\n${tabContent}\n  </div>`
      );
    });

    const defaultAttr = defaultTab ? ` data-default="${defaultTab}"` : '';

    return `<div id="${tabsId}" class="zolt-tabs"${defaultAttr}>\n  <div class="zolt-tab-list" role="tablist">\n${buttons.join('\n')}\n  </div>\n${panels.join('\n')}\n</div>`;
  }

  private visitTabBlock(node: TripleColonBlockNode): string {
    const childrenHtml = this.joinChildren(node.children);
    const activeAttr = node.attributes?.active === 'true' ? ' data-active="true"' : '';
    const attrs = this.renderAllAttributes(node.attributes);

    return `<div${attrs} class="zolt-tab-placeholder"${activeAttr} data-type="tab">\n${childrenHtml}\n</div>`;
  }

  visitDoubleBracketBlock(node: DoubleBracketBlockNode): string {
    if (node.blockType === 'toc') {
      return this.visitToc(node);
    }
    const attrs = this.renderAllAttributes(node.attributes);

    return `<div${attrs} class="double-bracket-block" data-type="${node.blockType}">${node.content}</div>`;
  }

  private visitToc(node: DoubleBracketBlockNode): string {
    const fromAttr = node.attributes?.from;
    const toAttr = node.attributes?.to;
    const depthAttr = node.attributes?.depth;
    const numbered = node.attributes?.numbered === 'true';
    const customClass = node.attributes?.class || '';

    const from = parseInt(fromAttr || '1');
    const to = parseInt(toAttr || '6');
    const depth = parseInt(depthAttr || '3');

    const filteredHeadings = this.currentHeadings.filter((h) => {
      const level = h.level;
      if (level < from) {
        return false;
      }

      let maxLevel: number;
      if (toAttr && depthAttr) {
        maxLevel = Math.min(to, depth);
      } else if (toAttr) {
        maxLevel = to;
      } else if (depthAttr) {
        maxLevel = depth;
      } else {
        maxLevel = 3; // default depth
      }

      return level <= maxLevel;
    });

    if (filteredHeadings.length === 0) {
      return '';
    }

    const tocHtml = this.buildTocTree(filteredHeadings, from, numbered);
    const classAttr = ` class="zolt-toc${customClass ? ' ' + customClass : ''}"`;

    const cleanAttrs: Attributes = { ...node.attributes };
    delete cleanAttrs.from;
    delete cleanAttrs.to;
    delete cleanAttrs.depth;
    delete cleanAttrs.numbered;
    delete cleanAttrs.class;

    const attrs = this.renderAllAttributes(cleanAttrs);

    return `<nav${attrs}${classAttr}>\n${tocHtml}\n</nav>`;
  }

  private buildTocTree(headings: HeadingNode[], from: number, numbered: boolean): string {
    let html = '<ul>\n';
    const counters: number[] = new Array(7).fill(0);
    let currentDepth = 0;

    for (const h of headings) {
      const level = h.level;
      const depth = level - from;

      while (currentDepth < depth) {
        html += '  <ul>\n';
        currentDepth++;
      }
      while (currentDepth > depth) {
        html += '  </ul>\n';
        currentDepth--;
      }

      counters[level]++;
      for (let i = level + 1; i <= 6; i++) counters[i] = 0;

      const numberingStyle = this.evaluator.getVariable('numbering_style') || 'decimal';
      const numberParts = counters.slice(from, level + 1);
      let numberStr = '';

      if (numbered) {
        let formattedParts: string[] = [];
        if (numberingStyle === 'decimal') {
          formattedParts = numberParts.map((p) => p.toString());
        } else if (numberingStyle === 'roman-lower') {
          formattedParts = numberParts.map((p) => toRoman(p).toLowerCase());
        } else if (numberingStyle === 'roman-upper') {
          formattedParts = numberParts.map((p) => toRoman(p).toUpperCase());
        } else if (numberingStyle === 'alpha-lower') {
          formattedParts = numberParts.map((p) => toAlpha(p).toLowerCase());
        } else if (numberingStyle === 'alpha-upper') {
          formattedParts = numberParts.map((p) => toAlpha(p).toUpperCase());
        }
        numberStr = `<span class="zolt-toc-number">${formattedParts.join('.')}</span>`;
      }

      const renderedContent = this.joinChildren(h.children).trim();
      const textContent = renderedContent.replace(/<[^>]+>/g, '').trim();
      const id = h.attributes?.id || slugify(textContent);

      html += `  <li class="toc-level-${level}">${numberStr}<a href="#${id}">${renderedContent}</a></li>\n`;
    }

    while (currentDepth > 0) {
      html += '  </ul>\n';
      currentDepth--;
    }

    html += '</ul>';

    return html;
  }

  visitChart(node: any): string {
    this.hasCharts = true;

    const filteredAttrs: Attributes = {};
    if (node.attributes) {
      for (const [key, value] of Object.entries(node.attributes)) {
        if (key !== 'legend' && key !== 'grid' && key !== 'stacked') {
          filteredAttrs[key] = value as string;
        }
      }
    }

    const attrs = this.renderAllAttributes(Object.keys(filteredAttrs).length > 0 ? filteredAttrs : undefined);
    const layoutAttr = node.layout ? ` data-layout="${node.layout}"` : '';
    const legendAttr = node.attributes?.['legend'] === 'true' ? ' data-legend="true"' : '';
    const gridAttr = node.attributes?.['grid'] === 'true' ? ' data-grid="true"' : '';
    const stackedAttr = node.attributes?.['stacked'] === 'true' ? ' data-stacked="true"' : '';

    const seriesHtml = node.children.map((series: any) => this.visitChartSeries(series)).join('\n');

    return `<div${attrs}${layoutAttr}${legendAttr}${gridAttr}${stackedAttr} class="zolt-chart">\n${seriesHtml}\n</div>`;
  }

  private visitChartSeries(series: any): string {
    const filteredAttrs: Attributes = {};
    if (series.attributes) {
      for (const [key, value] of Object.entries(series.attributes)) {
        if (key !== 'title' && key !== 'color-scheme' && key !== 'legend' && key !== 'grid' && key !== 'stacked') {
          filteredAttrs[key] = value as string;
        }
      }
    }
    const attrs = this.renderAllAttributes(Object.keys(filteredAttrs).length > 0 ? filteredAttrs : undefined);

    const seriesTitle = series.title || series.attributes?.title;
    const titleAttr = seriesTitle ? ` data-title="${this.escapeHtml(String(seriesTitle))}"` : '';
    const schemeAttr = series.attributes?.['color-scheme']
      ? ` data-scheme="${this.escapeHtml(String(series.attributes['color-scheme'] as string))}"`
      : '';
    const legendAttr = series.attributes?.['legend'] === 'true' ? ' data-legend="true"' : '';
    const gridAttr = series.attributes?.['grid'] === 'true' ? ' data-grid="true"' : '';
    const stackedAttr = series.attributes?.['stacked'] === 'true' ? ' data-stacked="true"' : '';

    const dataJson = JSON.stringify(series.data);

    return `  <div${attrs}${titleAttr}${schemeAttr}${legendAttr}${gridAttr}${stackedAttr}\n       class="zolt-chart-series"\n       data-chart-type="${series.chartType}"\n       data-data='${this.escapeHtml(dataJson)}'>\n  </div>`;
  }

  visitMermaid(node: any): string {
    this.hasMermaid = true;

    return `<div class="zolt-mermaid">\n  <div class="mermaid">${this.escapeHtml(node.content)}</div>\n</div>`;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };

    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
