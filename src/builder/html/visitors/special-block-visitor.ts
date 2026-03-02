import * as path from 'node:path';
import type {
  ASTNode,
  Attributes,
  DoubleBracketBlockNode,
  HeadingNode,
  TripleColonBlockNode,
} from '../../../parser/types';
import type { ProjectNode } from '../../../utils/project-graph';
import { escapeHtml, slugify, toAlpha, toRoman } from '../utils/string-utils';

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
    private projectGraph?: ProjectNode[],
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

      if (node.blockType === 'sidebar-header') {
        const toggleButton = `
  <button class="zolt-sidebar-toggle" aria-label="Toggle sidebar">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
  </button>`;
        const closeButton = `
  <button class="zolt-sidebar-close" aria-label="Close sidebar">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  </button>`;

        return `<div${attrs} class="zolt-sidebar-header">\n${childrenHtml}\n${toggleButton}\n${closeButton}\n</div>`;
      }

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
      const cols = parseInt(node.attributes.cols, 10);
      if (!Number.isNaN(cols)) {
        const style = `--zolt-cols: ${cols};`;
        node.attributes.style = node.attributes.style ? `${node.attributes.style} ${style}` : style;
      }
    }

    if (node.blockType === 'column' && node.attributes?.width?.endsWith('%')) {
      const p = parseFloat(node.attributes.width);
      if (!Number.isNaN(p)) {
        const factor = (1 - p / 100).toFixed(3);
        node.attributes.width = `calc(${p}% - (var(--zolt-column-gap, 1.5rem) * ${factor}))`;
        // Ensure flex-grow/shrink don't override the width
        const flexStyle = 'flex: none;';
        node.attributes.style = node.attributes.style ? `${node.attributes.style} ${flexStyle}` : flexStyle;
      }
    }

    const attrs = this.renderAllAttributes(node.attributes);

    const extraClass = node.blockType === 'columns' || node.blockType === 'column' ? ` ${node.blockType}` : '';
    const semanticTypes = ['info', 'warning', 'error', 'success', 'note'];
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
    if (node.blockType === 'filetree-nav') {
      return await this.visitFileTreeNav(node);
    }
    const attrs = this.renderAllAttributes(node.attributes);

    return `<div${attrs} class="double-bracket-block" data-type="${node.blockType}">${escapeHtml(node.content)}</div>`;
  }

  private flattenProjectGraph(nodes: ProjectNode[]): ProjectNode[] {
    const flattened: ProjectNode[] = [];
    for (const node of nodes) {
      flattened.push(node);
      if (node.children.length > 0) {
        flattened.push(...this.flattenProjectGraph(node.children));
      }
    }

    return flattened;
  }

  private async visitFileTreeNav(node: DoubleBracketBlockNode): Promise<string> {
    if (!this.projectGraph || !this.currentFilePath) {
      return '';
    }

    const flattened = this.flattenProjectGraph(this.projectGraph);
    const normCurrent = path.normalize(this.currentFilePath);
    const currentIndex = flattened.findIndex((n) => path.normalize(n.absPath) === normCurrent);

    if (currentIndex === -1) {
      return '';
    }

    const prev = currentIndex > 0 ? flattened[currentIndex - 1] : null;
    const next = currentIndex < flattened.length - 1 ? flattened[currentIndex + 1] : null;

    if (!prev && !next) {
      return '';
    }

    const currentDir = path.dirname(this.currentFilePath);
    const labels = { prev: '← Previous', next: 'Next →' };

    let prevHtml = '';
    if (prev) {
      const relPath = path
        .relative(currentDir, prev.absPath)
        .replace(/\.zlt$/, '.html')
        .replace(/\\/g, '/');
      prevHtml = `<a href="${relPath}" class="zolt-nav-link prev">
        <span class="nav-label">${labels.prev}</span>
        <span class="nav-title">${escapeHtml(prev.title)}</span>
      </a>`;
    }

    let nextHtml = '';
    if (next) {
      const relPath = path
        .relative(currentDir, next.absPath)
        .replace(/\.zlt$/, '.html')
        .replace(/\\/g, '/');
      nextHtml = `<a href="${relPath}" class="zolt-nav-link next">
        <span class="nav-label">${labels.next}</span>
        <span class="nav-title">${escapeHtml(next.title)}</span>
      </a>`;
    }

    const attrs = this.renderAllAttributes(node.attributes);

    return `
<div${attrs} class="triple-colon-block columns filetree-nav" data-type="columns">
  <div class="triple-colon-block column" data-type="column">
    ${prevHtml}
  </div>
  <div class="triple-colon-block column" data-type="column" style="text-align: right;">
    ${nextHtml}
  </div>
</div>`.trim();
  }

  private async visitFileTree(node: DoubleBracketBlockNode): Promise<string> {
    if (!this.projectGraph) {
      return '<div class="zolt-filetree-error">Project graph not available. Please specify an entry point.</div>';
    }

    const from = parseInt(node.attributes?.from || '0', 10) || 0;
    const to = parseInt(node.attributes?.to || '99', 10) || 99;
    const depth = parseInt(node.attributes?.depth || '99', 10) || 99;
    const numbered =
      node.attributes?.numbered === 'true' ||
      (node.attributes && Object.hasOwn(node.attributes, 'numbered') && node.attributes.numbered === '') ||
      false;
    const showToc =
      (node.attributes?.toc === 'true' ||
        (node.attributes && Object.hasOwn(node.attributes, 'toc') && node.attributes.toc === '')) ??
      false;

    const getIntAttr = (val: any, defaultVal: number) => {
      if (val === undefined || val === '') {
        return defaultVal;
      }
      const parsed = parseInt(val, 10);

      return Number.isNaN(parsed) ? defaultVal : parsed;
    };

    const tocNumbered =
      node.attributes?.tocNumbered === 'true' ||
      node.attributes?.['toc-numbered'] === 'true' ||
      (node.attributes && Object.hasOwn(node.attributes, 'tocNumbered') && node.attributes.tocNumbered === '') ||
      (node.attributes && Object.hasOwn(node.attributes, 'toc-numbered') && node.attributes['toc-numbered'] === '') ||
      false;

    const tocOptions = {
      from: getIntAttr(node.attributes?.tocFrom || node.attributes?.['toc-from'], 1),
      to: getIntAttr(node.attributes?.tocTo || node.attributes?.['toc-to'], 6),
      depth: getIntAttr(node.attributes?.tocDepth || node.attributes?.['toc-depth'], 3),
      numbered: tocNumbered,
      hasTo:
        (!!node.attributes?.tocTo && node.attributes?.tocTo !== '') ||
        (!!node.attributes?.['toc-to'] && node.attributes?.['toc-to'] !== ''),
      hasDepth:
        (!!node.attributes?.tocDepth && node.attributes?.tocDepth !== '') ||
        (!!node.attributes?.['toc-depth'] && node.attributes?.['toc-depth'] !== ''),
    };

    const html = await this.renderFileTreeNodes(this.projectGraph, 0, from, to, depth, showToc, tocOptions, numbered);

    return `<nav class="zolt-filetree">\n${html}\n</nav>`;
  }

  private getFilteredHeadings(
    headings: HeadingNode[],
    from: number,
    to: number,
    depth: number,
    hasTo: boolean,
    hasDepth: boolean
  ): HeadingNode[] {
    return headings.filter((h) => {
      if (h.attributes && Object.hasOwn(h.attributes, 'noToc')) {
        return false;
      }
      if (h.level < from) {
        return false;
      }

      let maxLevel: number;
      if (hasTo && hasDepth) {
        maxLevel = Math.min(to, depth);
      } else if (hasTo) {
        maxLevel = to;
      } else if (hasDepth) {
        maxLevel = depth;
      } else {
        maxLevel = 3; // default depth
      }

      return h.level <= maxLevel;
    });
  }

  private async renderFileTreeNodes(
    nodes: ProjectNode[],
    currentDepth: number,
    from: number,
    to: number,
    maxDepth: number,
    showToc: boolean,
    tocOptions: any,
    numbered: boolean
  ): Promise<string> {
    if (currentDepth > to || currentDepth > maxDepth) {
      return '';
    }
    if (!nodes || nodes.length === 0) {
      return '';
    }

    const htmlParts = [];
    for (const n of nodes) {
      htmlParts.push(await this.renderFileTreeNode(n, currentDepth, from, to, maxDepth, showToc, tocOptions, numbered));
    }
    const html = htmlParts.join('');

    const tag = numbered ? 'ol' : 'ul';

    return `<${tag}>\n${html}</${tag}>`;
  }

  private async renderFileTreeNode(
    node: ProjectNode,
    currentDepth: number,
    from: number,
    to: number,
    maxDepth: number,
    showToc: boolean,
    tocOptions: any,
    numbered: boolean
  ): Promise<string> {
    if (currentDepth > to || currentDepth > maxDepth) {
      return '';
    }

    const isVisible = currentDepth >= from;
    const normCurrent = this.currentFilePath ? path.normalize(this.currentFilePath) : null;
    const normNode = path.normalize(node.absPath);
    const isActive = normCurrent === normNode;

    const activeClass = isActive ? ' class="active"' : '';

    let html = '';

    if (isVisible) {
      let link = node.path.replace(/\.zlt$/, '.html');

      if (this.currentFilePath) {
        const currentDir = path.dirname(this.currentFilePath);
        const relativePath = path.relative(currentDir, node.absPath);
        link = relativePath.replace(/\.zlt$/, '.html').replace(/\\/g, '/');
      }

      html += `<li${activeClass}><a href="${link}">${escapeHtml(node.title)}</a>`;
    }

    if (isActive && showToc && this.currentHeadings.length > 0) {
      const filteredHeadings = this.getFilteredHeadings(
        this.currentHeadings,
        tocOptions.from,
        tocOptions.to,
        tocOptions.depth,
        tocOptions.hasTo,
        tocOptions.hasDepth
      );

      if (filteredHeadings.length > 0) {
        const tocHtml = await this.buildTocTree(filteredHeadings, tocOptions.from, tocOptions.numbered);
        html += `\n<div class="zolt-filetree-toc">${tocHtml}</div>\n`;
      }
    }

    if (node.children.length > 0 && currentDepth < to && currentDepth + 1 < maxDepth) {
      const childrenHtmlParts = [];
      for (const child of node.children) {
        childrenHtmlParts.push(
          await this.renderFileTreeNode(child, currentDepth + 1, from, to, maxDepth, showToc, tocOptions, numbered)
        );
      }
      const childrenHtml = childrenHtmlParts.join('');

      if (childrenHtml) {
        const tag = numbered ? 'ol' : 'ul';
        html += `\n<${tag}>\n${childrenHtml}</${tag}>\n`;
      }
    }

    if (isVisible) {
      html += '</li>\n';
    }

    return html;
  }

  private async visitToc(node: DoubleBracketBlockNode): Promise<string> {
    const getIntAttr = (val: any, defaultVal: number) => {
      if (val === undefined || val === '') {
        return defaultVal;
      }
      const parsed = parseInt(val, 10);

      return Number.isNaN(parsed) ? defaultVal : parsed;
    };

    const from = getIntAttr(node.attributes?.from, 1);
    const to = getIntAttr(node.attributes?.to, 6);
    const depth = getIntAttr(node.attributes?.depth, 3);
    const numbered =
      node.attributes?.numbered === 'true' ||
      (node.attributes && Object.hasOwn(node.attributes, 'numbered') && node.attributes.numbered === '') ||
      false;
    const customClass = node.attributes?.class || '';

    const hasTo = !!node.attributes?.to && node.attributes?.to !== '';
    const hasDepth = !!node.attributes?.depth && node.attributes?.depth !== '';

    const filteredHeadings = this.getFilteredHeadings(this.currentHeadings, from, to, depth, hasTo, hasDepth);

    if (filteredHeadings.length === 0) {
      return '';
    }

    const tocHtml = await this.buildTocTree(filteredHeadings, from, numbered);
    const classAttr = ` class="zolt-toc${customClass ? ` ${customClass}` : ''}"`;

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

      const isNumberingDisabled = h.attributes?.numbered === 'false' || Object.hasOwn(h.attributes || {}, 'noCount');

      if (!isNumberingDisabled) {
        counters[level]++;
        for (let i = level + 1; i <= 6; i++) {
          counters[i] = 0;
        }
      }

      const numberedVar = this.evaluator.getVariable('numbered');
      const globalValue = typeof numberedVar === 'string' ? numberedVar : 'decimal';
      const styles = globalValue.split(',').map((s) => s.trim());

      const formatPart = (val: number, style: string) => {
        switch (style) {
          case 'roman-lower':
            return toRoman(val).toLowerCase();
          case 'roman-upper':
            return toRoman(val).toUpperCase();
          case 'alpha-lower':
            return toAlpha(val).toLowerCase();
          case 'alpha-upper':
            return toAlpha(val).toUpperCase();
          default:
            return val.toString();
        }
      };

      let numberStr = '';

      if (numbered && !isNumberingDisabled) {
        const h1Count = this.currentHeadings.filter((h) => h.level === 1).length;
        const startLevel = h1Count === 1 ? 2 : 1;
        const effectiveFrom = Math.max(from, startLevel);

        const effectiveParts = counters.slice(effectiveFrom, level + 1);

        if (level >= effectiveFrom && effectiveParts.length > 0) {
          const formattedParts = effectiveParts.map((p, i) => {
            const styleIdx = effectiveFrom - startLevel + i;
            const style = styles[styleIdx] || styles[styles.length - 1] || 'decimal';

            return formatPart(p, style);
          });
          numberStr = `<span class="zolt-toc-number">${formattedParts.join('.')}</span>`;
        }
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
    const legendAttr = node.attributes?.legend === 'true' ? ' data-legend="true"' : '';
    const gridAttr = node.attributes?.grid === 'true' ? ' data-grid="true"' : '';
    const stackedAttr = node.attributes?.stacked === 'true' ? ' data-stacked="true"' : '';

    const seriesHtml = node.children.map((series: any) => this.visitChartSeries(series)).join('\n');

    return `<div${attrs}${layoutAttr}${legendAttr}${gridAttr}${stackedAttr} class="zolt-chart">\n${seriesHtml}\n</div>`;
  }

  private visitChartSeries(series: any): string {
    const filteredAttrs: Attributes = {};
    if (series.attributes) {
      for (const [key, value] of Object.entries(series.attributes)) {
        if (key !== 'title' && key !== 'colorScheme' && key !== 'legend' && key !== 'grid' && key !== 'stacked') {
          filteredAttrs[key] = value as string;
        }
      }
    }
    const attrs = this.renderAllAttributes(Object.keys(filteredAttrs).length > 0 ? filteredAttrs : undefined);

    const seriesTitle = series.title || series.attributes?.title;
    const titleAttr = seriesTitle ? ` data-title="${escapeHtml(String(seriesTitle))}"` : '';
    const schemeAttr = series.attributes?.colorScheme
      ? ` data-scheme="${escapeHtml(String(series.attributes.colorScheme as string))}"`
      : '';
    const legendAttr = series.attributes?.legend === 'true' ? ' data-legend="true"' : '';
    const gridAttr = series.attributes?.grid === 'true' ? ' data-grid="true"' : '';
    const stackedAttr = series.attributes?.stacked === 'true' ? ' data-stacked="true"' : '';

    const dataJson = JSON.stringify(series.data);

    return `  <div${attrs}${titleAttr}${schemeAttr}${legendAttr}${gridAttr}${stackedAttr}\n       class="zolt-chart-series"\n       data-chart-type="${series.chartType}"\n       data-data='${dataJson}'>\n  </div>`;
  }

  visitMermaid(node: any): string {
    this.hasMermaid = true;

    return `<div class="zolt-mermaid">\n  <div class="mermaid">${escapeHtml(node.content)}</div>\n</div>`;
  }
}
