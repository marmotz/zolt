import { ASTNode, Attributes, DoubleBracketBlockNode, HeadingNode, TripleColonBlockNode } from '../../../parser/types';
import { slugify, toAlpha, toRoman } from '../utils/string-utils';

export class SpecialBlockVisitor {
  private tabsCounter: number = 0;
  public hasTabs: boolean = false;
  public hasCharts: boolean = false;
  public hasMermaid: boolean = false;
  public hasSidebar: boolean = false;
  public sidebarSide: 'left' | 'right' = 'left';

  constructor(
    private joinChildren: (nodes: ASTNode[]) => Promise<string>,
    private joinInlineChildren: (nodes: ASTNode[]) => Promise<string>,
    private renderAllAttributes: (attrs?: any) => string,
    private evaluator: any,
    private processInlineContent: (text: string) => Promise<string>,
    private currentHeadings: HeadingNode[],
    private projectGraph?: any,
    private currentFilePath?: string
  ) {}

  public reset(): void {
    this.tabsCounter = 0;
    this.hasTabs = false;
    this.hasCharts = false;
    this.hasMermaid = false;
    this.hasSidebar = false;
    this.sidebarSide = 'left';
  }

  async visitTripleColonBlock(node: TripleColonBlockNode): Promise<string> {
    if (node.blockType === 'tabs') {
      return await this.visitTabsBlock(node);
    }

    if (node.blockType === 'tab') {
      return await this.visitTabBlock(node);
    }

    if (node.blockType === 'sidebar') {
      this.hasSidebar = true;
      const side = node.attributes?.side === 'right' ? 'right' : 'left';
      this.sidebarSide = side;
      const attrs = this.renderAllAttributes(node.attributes);
      const childrenHtml = await this.joinChildren(node.children);
      return `<aside${attrs} class="zolt-sidebar zolt-sidebar-${side}" data-type="sidebar">\n${childrenHtml}\n</aside>`;
    }

    if (
      node.blockType === 'sidebar-header' ||
      node.blockType === 'sidebar-content' ||
      node.blockType === 'sidebar-footer'
    ) {
      const attrs = this.renderAllAttributes(node.attributes);
      const childrenHtml = await this.joinChildren(node.children);
      return `<div${attrs} class="zolt-${node.blockType}">\n${childrenHtml}\n</div>`;
    }

    const childrenHtml = await this.joinChildren(node.children);

    if (node.blockType === 'details') {
      const open = node.attributes?.open === 'true' ? ' open' : '';
      const attrs = this.renderAllAttributes(node.attributes);
      const title = node.title ? await this.processInlineContent(node.title) : 'Details';

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
      const title = await this.processInlineContent(node.title);
      html += `<div class="block-title">${title}</div>\n`;
    }
    html += `${childrenHtml}\n</div>`;

    return html;
  }

  private async visitTabsBlock(node: TripleColonBlockNode): Promise<string> {
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

    for (let index = 0; index < tabChildren.length; index++) {
      const tab = tabChildren[index];
      const panelId = `${tabsId}-panel-${index}`;
      const buttonId = `${tabsId}-button-${index}`;
      const isActive = index === activeIndex;
      const title = tab.title || `Tab ${index + 1}`;

      buttons.push(
        `    <button id="${buttonId}" class="zolt-tab-button${isActive ? ' active' : ''}" role="tab" aria-selected="${isActive}" aria-controls="${panelId}" data-tab-index="${index}">${await this.processInlineContent(title)}</button>`
      );

      const tabContent = await this.joinChildren(tab.children);
      panels.push(
        `  <div id="${panelId}" class="zolt-tab-panel${isActive ? ' active' : ''}" role="tabpanel" aria-labelledby="${buttonId}" data-tab-index="${index}">\n${tabContent}\n  </div>`
      );
    }

    const defaultAttr = defaultTab ? ` data-default="${defaultTab}"` : '';

    return `<div id="${tabsId}" class="zolt-tabs"${defaultAttr}>\n  <div class="zolt-tab-list" role="tablist">\n${buttons.join('\n')}\n  </div>\n${panels.join('\n')}\n</div>`;
  }

  private async visitTabBlock(node: TripleColonBlockNode): Promise<string> {
    const childrenHtml = await this.joinChildren(node.children);
    const activeAttr = node.attributes?.active === 'true' ? ' data-active="true"' : '';
    const attrs = this.renderAllAttributes(node.attributes);

    return `<div${attrs} class="zolt-tab-placeholder"${activeAttr} data-type="tab">\n${childrenHtml}\n</div>`;
  }

  async visitDoubleBracketBlock(node: DoubleBracketBlockNode): Promise<string> {
    if (node.blockType === 'toc') {
      return await this.visitToc(node);
    }
    if (node.blockType === 'filetree') {
      return await this.visitFileTree(node);
    }
    const attrs = this.renderAllAttributes(node.attributes);

    return `<div${attrs} class="double-bracket-block" data-type="${node.blockType}">${node.content}</div>`;
  }

  private async visitFileTree(node: DoubleBracketBlockNode): Promise<string> {
    if (!this.projectGraph) {
      return '<div class="zolt-filetree-error">Project graph not available. Please specify an entry point.</div>';
    }

    const from = parseInt(node.attributes?.from || '0');
    const to = parseInt(node.attributes?.to || '99');
    const depth = parseInt(node.attributes?.depth || '99');

    const html = this.renderFileTreeNode(this.projectGraph, 0, from, to, depth);
    const customClass = node.attributes?.class || '';

    return `<nav class="zolt-filetree${customClass ? ' ' + customClass : ''}">\n${html}\n</nav>`;
  }

  private renderFileTreeNode(node: any, currentDepth: number, from: number, to: number, maxDepth: number): string {
    if (currentDepth > to || currentDepth > maxDepth) return '';

    let html = '';

    const isVisible = currentDepth >= from;
    const isActive = this.currentFilePath && node.absPath.includes(this.currentFilePath);
    const activeClass = isActive ? ' class="active"' : '';

    if (isVisible) {
      // Basic relative link handling
      const link = node.path.replace(/\.zlt$/, '.html');
      html += `<li${activeClass}><a href="${link}">${this.escapeHtml(node.title)}</a>`;
    }

    if (node.children.length > 0 && currentDepth < to && currentDepth < maxDepth) {
      const childrenHtml = node.children
        .map((child: any) => this.renderFileTreeNode(child, currentDepth + 1, from, to, maxDepth))
        .join('');

      if (childrenHtml) {
        html += `\n<ul>\n${childrenHtml}</ul>\n`;
      }
    }

    if (isVisible) {
      html += '</li>\n';
    }

    if (isVisible && currentDepth === from) {
      return `<ul>\n${html}</ul>`;
    }

    return html;
  }

  private async visitToc(node: DoubleBracketBlockNode): Promise<string> {
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

    const tocHtml = await this.buildTocTree(filteredHeadings, from, numbered);
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

  private async buildTocTree(headings: HeadingNode[], from: number, numbered: boolean): Promise<string> {
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

      const renderedContent = (await this.joinInlineChildren(h.children)).trim();
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

    return `  <div${attrs}${titleAttr}${schemeAttr}${legendAttr}${gridAttr}${stackedAttr}\n       class="zolt-chart-series"\n       data-chart-type="${series.chartType}"\n       data-data='${dataJson}'>\n  </div>`;
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
