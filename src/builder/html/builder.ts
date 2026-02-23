import { InlineParser } from '../../parser/inline-parser';
import { Parser } from '../../parser/parser';
import {
  AbbreviationDefinitionNode,
  AbbreviationNode,
  ASTNode,
  Attributes,
  AudioNode,
  BlockquoteNode,
  BoldNode,
  CodeBlockNode,
  CodeNode,
  DefinitionDescriptionNode,
  DefinitionTermNode,
  DocumentNode,
  DoubleBracketBlockNode,
  EmbedNode,
  ExpressionNode,
  FileNode,
  FootnoteDefinitionNode,
  FootnoteNode,
  HeadingNode,
  HighlightNode,
  HorizontalRuleNode,
  ImageNode,
  IndentationNode,
  InlineStyleNode,
  ItalicNode,
  LinkNode,
  ListItemNode,
  ListNode,
  ParagraphNode,
  StrikethroughNode,
  SubscriptNode,
  SuperscriptNode,
  TableCellNode,
  TableNode,
  TableRowNode,
  TextNode,
  TripleColonBlockNode,
  UnderlineNode,
  VariableNode,
  VideoNode,
} from '../../parser/types';
import { Builder } from '../builder';
import { ContentProcessor } from '../evaluator/content-processor';
import { ExpressionEvaluator } from '../evaluator/expression-evaluator';

const DEFAULT_CSS = `
  * {
    box-sizing: border-box;
  }
  html {
    scroll-behavior: smooth;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    color: #333;
    background: #fafafa;
  }
  h1, h2, h3, h4, h5, h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
    line-height: 1.3;
    color: #111;
  }
  h1 { font-size: 2rem; border-bottom: 2px solid #e0e0e0; padding-bottom: 0.3em; }
  h2 { font-size: 1.5rem; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.2em; }
  h3 { font-size: 1.25rem; }
  h4 { font-size: 1rem; }
  ul, ol, dl { padding-left: 2rem; margin: 1em 0; }
  ul ul, ol ol, ul ol, ol ul {  margin: 0; }
  li, dt, dd { margin: 0.25em 0; }
  dt { font-weight: bold; margin-top: 1em; }
  dd { margin-left: 1.5rem; }
  a { color: #0066cc; text-decoration: none; }
  a:hover { text-decoration: underline; }
  blockquote {
    margin: 1em 0;
    padding: 0.5em 1rem;
    border-left: 4px solid #e0e0e0;
    background: #f5f5f5;
    color: #555;
  }
  code {
    font-family: 'SF Mono', Monaco, Consolas, monospace;
    font-size: 0.9em;
    background: #f0f0f0;
    padding: 0.2em 0.4em;
    border-radius: 3px;
  }
  pre {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
  }
  pre code { background: none; padding: 0; color: inherit; }
  hr { border: none; border-top: 2px solid #e0e0e0; margin: 2rem 0; }
  input[type="checkbox"] { margin-right: 0.5em; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
  }
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }
  th {
    background: #f8f8f8;
    font-weight: 600;
  }
  abbr {
    color: #7c3aed;
    text-decoration: underline dotted;
    text-decoration-color: #c4b5fd;
    text-underline-offset: 2px;
    cursor: help;
    font-weight: 500;
  }
  abbr:hover {
    color: #6d28d9;
    text-decoration-color: #a78bfa;
  }
  .columns {
    display: flex;
    gap: var(--zolt-column-gap, 1.5rem);
    margin: 1.5rem 0;
    flex-wrap: wrap;
  }
  .columns[style*="--zolt-cols"] {
    display: grid;
    grid-template-columns: repeat(var(--zolt-cols, 1), 1fr);
  }
  .column {
    flex: 1 1 0;
    min-width: 0;
  }
  .column[style*="width"] {
    flex: 0 0 auto;
  }
  .triple-colon-block.info, 
  .triple-colon-block.warning, 
  .triple-colon-block.error, 
  .triple-colon-block.success, 
  .triple-colon-block.note, 
  .triple-colon-block.abstract {
    padding: 1rem;
    margin: 1rem 0;
    border-left: 4px solid #ccc;
    background: #f9f9f9;
  }
  .triple-colon-block.info { border-left-color: #3b82f6; background: #eff6ff; }
  .triple-colon-block.warning { border-left-color: #f59e0b; background: #fffbeb; }
  .triple-colon-block.error { border-left-color: #ef4444; background: #fef2f2; }
  .triple-colon-block.success { border-left-color: #10b981; background: #ecfdf5; }
  .triple-colon-block.note { border-left-color: #6366f1; background: #eef2ff; }
  .triple-colon-block.abstract { border-left-color: #6b7280; background: #f3f4f6; }
  
  .block-title {
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  details.triple-colon-block {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin: 1rem 0;
  }
  summary {
    padding: 0.5rem 1rem;
    font-weight: bold;
    cursor: pointer;
    background: #f5f5f5;
  }
  .details-content {
    padding: 1rem;
  }
  @media (max-width: 768px) {
    .columns[style*="--zolt-cols"] {
      grid-template-columns: 1fr;
    }
    .column {
      flex: 1 1 100% !important;
      width: 100% !important;
    }
  }
  .zolt-tabs {
    margin: 1rem 0;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    overflow: hidden;
  }
  .zolt-tab-list {
    display: flex;
    background: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
    overflow-x: auto;
  }
  .zolt-tab-button {
    padding: 0.75rem 1.25rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.95em;
    font-weight: 500;
    color: #666;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  .zolt-tab-button:hover {
    color: #333;
    background: #eee;
  }
  .zolt-tab-button.active {
    color: #0066cc;
    border-bottom-color: #0066cc;
    background: #fff;
  }
  .zolt-tab-panel {
    padding: 1rem;
    display: none;
  }
  .zolt-tab-panel.active {
    display: block;
  }
  .zolt-toc {
    margin: 1rem 0;
    padding: 1rem;
    background: #f9f9f9;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
  }
  .zolt-toc ul {
    list-style: none;
    padding-left: 1.5rem;
    margin: 0.25rem 0;
  }
  .zolt-toc > ul {
    padding-left: 0;
  }
  .zolt-toc li {
    margin: 0.25rem 0;
  }
  .zolt-toc a {
    color: #333;
    text-decoration: none;
  }
  .zolt-toc a:hover {
    color: #0066cc;
    text-decoration: underline;
  }
  .zolt-toc-number {
    margin-right: 0.5rem;
    color: #666;
    font-size: 0.9em;
  }
  :target {
    scroll-margin-top: 2rem;
    animation: zolt-anchor-highlight 3s ease-out;
  }
  @keyframes zolt-anchor-highlight {
    0% { background-color: #fffdba; }
    80% { background-color: #fffdba; }
    100% { background-color: transparent; }
  }
`.trim();

type InitialVariables = Record<string, number | string | boolean | null | undefined>;

export class HTMLBuilder implements Builder {
  private inlineParser = new InlineParser();
  private abbreviationDefinitions: Map<string, string> = new Map();
  private tabsCounter: number = 0;
  private hasTabs: boolean = false;
  private evaluator: ExpressionEvaluator;
  private contentProcessor: ContentProcessor;
  private currentHeadings: HeadingNode[] = [];
  private headingCounters: number[] = new Array(7).fill(0);

  constructor(initialVariables?: InitialVariables) {
    this.evaluator = new ExpressionEvaluator();
    if (initialVariables) {
      for (const [key, value] of Object.entries(initialVariables)) {
        if (value !== undefined) {
          this.evaluator.setVariable(key, value as any);
        }
      }
    }
    this.contentProcessor = new ContentProcessor(this.evaluator);
  }

  static clearGlobalAbbreviations(): void {
    Parser.clearGlobalAbbreviations();
  }

  build(node: ASTNode): string {
    switch (node.type) {
      case 'Document':
        return this.visitDocument(node as DocumentNode);
      case 'Heading':
        return this.visitHeading(node as HeadingNode);
      case 'Paragraph':
        return this.visitParagraph(node as ParagraphNode);
      case 'Blockquote':
        return this.visitBlockquote(node as BlockquoteNode);
      case 'List':
        return this.visitList(node as ListNode);
      case 'ListItem':
        return this.visitListItem(node as ListItemNode);
      case 'DefinitionTerm':
        return this.visitDefinitionTerm(node as DefinitionTermNode);
      case 'DefinitionDescription':
        return this.visitDefinitionDescription(node as DefinitionDescriptionNode);
      case 'CodeBlock':
        return this.visitCodeBlock(node as CodeBlockNode);
      case 'TripleColonBlock':
        return this.visitTripleColonBlock(node as TripleColonBlockNode);
      case 'DoubleBracketBlock':
        return this.visitDoubleBracketBlock(node as DoubleBracketBlockNode);
      case 'HorizontalRule':
        return this.visitHorizontalRule(node as HorizontalRuleNode);
      case 'Indentation':
        return this.visitIndentation(node as IndentationNode);
      case 'Attributes':
        return '';
      case 'AbbreviationDefinition':
        return this.visitAbbreviationDefinition(node as AbbreviationDefinitionNode);
      case 'Frontmatter':
        return this.visitFrontmatter(node as any);
      case 'LinkReferenceDefinition':
        return '';
      case 'Table':
        return this.visitTable(node as TableNode);
      case 'CommentInline':
        return '';
      default:
        return this.buildInlineNode(node);
    }
  }

  visitTable(node: TableNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    let html = `<table${attrs}>\n`;

    if (node.header) {
      html += '  <thead>\n';
      html += '    ' + this.visitTableRow(node.header, true) + '\n';
      html += '  </thead>\n';
    }

    if (node.rows.length > 0) {
      html += '  <tbody>\n';
      for (const row of node.rows) {
        html += '    ' + this.visitTableRow(row, false) + '\n';
      }
      html += '  </tbody>\n';
    }

    html += '</table>';
    return html;
  }

  visitTableRow(node: TableRowNode, isHeader: boolean): string {
    let html = '<tr>';
    for (const cell of node.cells) {
      html += this.visitTableCell(cell, isHeader);
    }
    html += '</tr>';
    return html;
  }

  visitTableCell(node: TableCellNode, isHeader: boolean): string {
    const tag = isHeader ? 'th' : 'td';
    const childrenHtml = this.joinChildren(node.children);
    const alignStyle = node.alignment ? ` style="text-align: ${node.alignment};"` : '';
    return `<${tag}${alignStyle}>${childrenHtml}</${tag}>`;
  }

  buildDocument(node: DocumentNode): string {
    this.tabsCounter = 0;
    this.hasTabs = false;
    this.headingCounters.fill(0);
    this.currentHeadings = this.findAllHeadings(node.children);

    // Ensure frontmatter is processed first
    if (node.frontmatter) {
      this.visitFrontmatter(node.frontmatter);
    }

    const children = [...node.children];
    if (this.evaluator.getVariable('toc') === true) {
      children.unshift({
        type: 'DoubleBracketBlock',
        blockType: 'toc',
        content: '',
        attributes: {},
      } as any);
    }

    const childrenHtml = children
      .map((child) => (child.type === 'Frontmatter' ? '' : this.build(child)))
      .filter((h) => h !== '')
      .join('\n');

    const tabsScript = this.hasTabs
      ? `
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('.zolt-tabs').forEach(function(tabsContainer) {
        var buttons = tabsContainer.querySelectorAll('.zolt-tab-button');
        var panels = tabsContainer.querySelectorAll('.zolt-tab-panel');
        
        buttons.forEach(function(button) {
          button.addEventListener('click', function() {
            var tabIndex = this.getAttribute('data-tab-index');
            
            buttons.forEach(function(btn) {
              btn.classList.remove('active');
              btn.setAttribute('aria-selected', 'false');
            });
            panels.forEach(function(panel) {
              panel.classList.remove('active');
            });
            
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            tabsContainer.querySelector('.zolt-tab-panel[data-tab-index="' + tabIndex + '"]').classList.add('active');
          });
        });
      });
    });
  </script>`
      : '';

    const anchorScript = `
  <script>
    window.addEventListener('hashchange', function() {
      var target = document.querySelector(':target');
      if (target) {
        target.style.animation = 'none';
        target.offsetHeight; // trigger reflow
        target.style.animation = '';
      }
    });
  </script>`;

    const lang = node.frontmatter?.data?.lang || 'en';
    const title = node.frontmatter?.data?.title || 'Document';

    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
${DEFAULT_CSS}
  </style>
</head>
<body>
${childrenHtml}
${tabsScript}
${anchorScript}
</body>
</html>`;
  }

  visitDocument(node: DocumentNode): string {
    this.currentHeadings = this.findAllHeadings(node.children);

    // Ensure frontmatter is processed first
    if (node.frontmatter) {
      this.visitFrontmatter(node.frontmatter);
    }

    const children = [...node.children];
    if (this.evaluator.getVariable('toc') === true) {
      children.unshift({
        type: 'DoubleBracketBlock',
        blockType: 'toc',
        content: '',
        attributes: {},
      } as any);
    }

    return children
      .map((child) => (child.type === 'Frontmatter' ? '' : this.build(child)))
      .filter((h) => h !== '')
      .join('\n');
  }

  private findAllHeadings(nodes: ASTNode[]): HeadingNode[] {
    const headings: HeadingNode[] = [];
    for (const node of nodes) {
      if (node.type === 'Heading') {
        headings.push(node as HeadingNode);
      } else if ('children' in node && Array.isArray(node.children)) {
        headings.push(...this.findAllHeadings(node.children as ASTNode[]));
      }
    }
    return headings;
  }

  visitHeading(node: HeadingNode): string {
    const level = Math.min(Math.max(node.level, 1), 6);
    const inlineHtml = this.processInlineContent((node as any).content);
    const childrenHtml = this.joinChildren(node.children);
    const renderedContent = (inlineHtml + childrenHtml).trim();

    if (!renderedContent) return '';

    if (!node.attributes) {
      node.attributes = {};
    }

    // Handle numbering
    const isGlobalNumbering = this.evaluator.getVariable('numbering') === true;
    const isLocalNumbering = node.attributes.numbered === 'true';
    const isNumberingDisabled = node.attributes.numbered === 'false';

    let numberStr = '';
    if ((isGlobalNumbering && !isNumberingDisabled) || isLocalNumbering) {
      this.headingCounters[level]++;
      for (let i = level + 1; i <= 6; i++) this.headingCounters[i] = 0;

      const numberingStyle = this.evaluator.getVariable('numbering_style') || 'decimal';
      const parts = this.headingCounters.slice(1, level + 1);

      if (numberingStyle === 'decimal') {
        numberStr = `<span class="zolt-heading-number">${parts.join('.')} </span>`;
      } else if (numberingStyle === 'roman-lower') {
        numberStr = `<span class="zolt-heading-number">${parts.map((p) => this.toRoman(p).toLowerCase()).join('.')} </span>`;
      } else if (numberingStyle === 'roman-upper') {
        numberStr = `<span class="zolt-heading-number">${parts.map((p) => this.toRoman(p).toUpperCase()).join('.')} </span>`;
      } else if (numberingStyle === 'alpha-lower') {
        numberStr = `<span class="zolt-heading-number">${parts.map((p) => this.toAlpha(p).toLowerCase()).join('.')} </span>`;
      } else if (numberingStyle === 'alpha-upper') {
        numberStr = `<span class="zolt-heading-number">${parts.map((p) => this.toAlpha(p).toUpperCase()).join('.')} </span>`;
      }
    }

    if (!node.attributes.id) {
      const textContent = renderedContent.replace(/<[^>]+>/g, '').trim();
      node.attributes.id = this.slugify(textContent);
    }

    const attrs = this.renderAllAttributes(node.attributes);
    return `<h${level}${attrs}>${numberStr}${renderedContent}</h${level}>`;
  }

  private toRoman(num: number): string {
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

  private toAlpha(num: number): string {
    let alpha = '';
    while (num > 0) {
      const mod = (num - 1) % 26;
      alpha = String.fromCharCode(65 + mod) + alpha;
      num = Math.floor((num - mod) / 26);
    }
    return alpha || 'A';
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  visitParagraph(node: ParagraphNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const inlineHtml = this.processInlineContent((node as any).content);
    const childrenHtml = this.joinChildren(node.children);
    const trimmed = (inlineHtml + childrenHtml).replace(/\s+/g, ' ').trim();
    if (!trimmed) return '';
    return `<p${attrs}>${trimmed}</p>`;
  }

  visitBlockquote(node: BlockquoteNode): string {
    const childrenHtml = this.joinChildren(node.children);

    const attrs = this.renderAllAttributes(node.attributes);
    return `<blockquote${attrs}>${childrenHtml}</blockquote>`;
  }

  visitList(node: ListNode): string {
    let tag = 'ul';
    if (node.kind === 'numbered') {
      tag = 'ol';
    } else if (node.kind === 'definition') {
      tag = 'dl';
    }

    const childrenHtml = this.joinChildren(node.children);

    const attrs = this.renderAllAttributes(node.attributes);
    return `<${tag}${attrs}>\n${childrenHtml}\n</${tag}>`;
  }

  visitListItem(node: ListItemNode): string {
    const checkbox =
      node.checked !== undefined
        ? `<input type="checkbox" ${node.checked ? 'checked' : ''} onclick="return false;">`
        : '';
    const inlineHtml = this.processInlineContent((node as any).content);
    const childrenHtml = this.joinChildren(node.children);
    const trimmed = (inlineHtml + childrenHtml).replace(/\s+/g, ' ').trim();

    const attrs = this.renderAllAttributes(node.attributes);
    return `<li${attrs}>${checkbox}${trimmed}</li>`;
  }

  visitDefinitionTerm(node: DefinitionTermNode): string {
    const inlineHtml = this.processInlineContent((node as any).content);
    const childrenHtml = this.joinChildren(node.children);
    const trimmed = (inlineHtml + childrenHtml).replace(/\s+/g, ' ').trim();

    const attrs = this.renderAllAttributes(node.attributes);
    return `<dt${attrs}>${trimmed}</dt>`;
  }

  visitDefinitionDescription(node: DefinitionDescriptionNode): string {
    const inlineHtml = this.processInlineContent((node as any).content);
    const childrenHtml = this.joinChildren(node.children);
    const trimmed = (inlineHtml + childrenHtml).replace(/\s+/g, ' ').trim();

    const attrs = this.renderAllAttributes(node.attributes);
    return `<dd${attrs}>${trimmed}</dd>`;
  }

  visitCodeBlock(node: CodeBlockNode): string {
    const lang = node.language ? ` class="language-${node.language}"` : '';
    const attrs = this.renderAllAttributes(node.attributes);
    const escapedContent = node.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return `<pre${attrs}><code${lang}>${escapedContent}</code></pre>`;
  }

  visitTripleColonBlock(node: TripleColonBlockNode): string {
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
      const title = node.title ? this.joinChildren(this.inlineParser.parse(node.title)) : 'Details';
      return `<details${attrs}${open} class="triple-colon-block details" data-type="details">
  <summary>${title}</summary>
  <div class="details-content">
${childrenHtml}
  </div>
</details>`;
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
      const title = this.joinChildren(this.inlineParser.parse(node.title));
      html += `<div class="block-title">${title}</div>\n`;
    }
    html += `${childrenHtml}\n</div>`;
    return html;
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
        `    <button id="${buttonId}" class="zolt-tab-button${isActive ? ' active' : ''}" role="tab" aria-selected="${isActive}" aria-controls="${panelId}" data-tab-index="${index}">${this.joinChildren(this.inlineParser.parse(title))}</button>`
      );

      const tabContent = tab.children.map((child) => this.build(child)).join('\n');
      panels.push(
        `  <div id="${panelId}" class="zolt-tab-panel${isActive ? ' active' : ''}" role="tabpanel" aria-labelledby="${buttonId}" data-tab-index="${index}">
${tabContent}
  </div>`
      );
    });

    const defaultAttr = defaultTab ? ` data-default="${defaultTab}"` : '';

    return `<div id="${tabsId}" class="zolt-tabs"${defaultAttr}>
  <div class="zolt-tab-list" role="tablist">
${buttons.join('\n')}
  </div>
${panels.join('\n')}
</div>`;
  }

  private visitTabBlock(node: TripleColonBlockNode): string {
    const childrenHtml = this.joinChildren(node.children);
    const activeAttr = node.attributes?.active === 'true' ? ' data-active="true"' : '';
    const attrs = this.renderAllAttributes(node.attributes);

    return `<div${attrs} class="zolt-tab-placeholder"${activeAttr} data-type="tab">
${childrenHtml}
</div>`;
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
      if (level < from) return false;

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

    if (filteredHeadings.length === 0) return '';

    const tocHtml = this.buildTocTree(filteredHeadings, from, numbered);
    const classAttr = ` class="zolt-toc${customClass ? ' ' + customClass : ''}"`;

    // Filter out internal attributes
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

      // Handle nesting: open new sub-lists
      while (currentDepth < depth) {
        html += '  <ul>\n';
        currentDepth++;
      }
      // Handle nesting: close sub-lists
      while (currentDepth > depth) {
        html += '  </ul>\n';
        currentDepth--;
      }

            // Update counters for numbering
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
                formattedParts = numberParts.map((p) => this.toRoman(p).toLowerCase());
              } else if (numberingStyle === 'roman-upper') {
                formattedParts = numberParts.map((p) => this.toRoman(p).toUpperCase());
              } else if (numberingStyle === 'alpha-lower') {
                formattedParts = numberParts.map((p) => this.toAlpha(p).toLowerCase());
              } else if (numberingStyle === 'alpha-upper') {
                formattedParts = numberParts.map((p) => this.toAlpha(p).toUpperCase());
              }
              numberStr = `<span class="zolt-toc-number">${formattedParts.join('.')}</span>`;
            }

      const inlineHtml = this.processInlineContent((h as any).content);
      const childrenHtml = this.joinChildren(h.children);
      const renderedContent = (inlineHtml + childrenHtml).trim();
      const textContent = renderedContent.replace(/<[^>]+>/g, '').trim();
      const id = h.attributes?.id || this.slugify(textContent);

      html += `  <li class="toc-level-${level}">${numberStr}<a href="#${id}">${renderedContent}</a></li>\n`;
    }

    // Close all remaining sub-lists
    while (currentDepth > 0) {
      html += '  </ul>\n';
      currentDepth--;
    }

    html += '</ul>';
    return html;
  }

  visitHorizontalRule(node: HorizontalRuleNode): string {
    const attrs: Attributes = node.attributes ? { ...node.attributes } : {};
    const cssProps: string[] = [];

    if (node.style === 'thick') {
      cssProps.push('border-top-width: 4px');
    } else if (node.style === 'thin') {
      cssProps.push('border-top-width: 1px');
    } else {
      cssProps.push('border-top-width: 2px');
    }

    let borderStyle = 'solid';
    if (attrs.style) {
      if (attrs.style === 'dashed' || attrs.style === 'dotted' || attrs.style === 'solid' || attrs.style === 'double') {
        borderStyle = attrs.style;
        delete attrs.style;
      }
    }
    cssProps.push(`border-top-style: ${borderStyle}`);

    if (attrs.color) {
      cssProps.push(`border-top-color: ${attrs.color}`);
      delete attrs.color;
    }
    if (attrs.width) {
      if (
        attrs.width.endsWith('%') ||
        attrs.width.endsWith('px') ||
        attrs.width.endsWith('em') ||
        attrs.width.endsWith('rem')
      ) {
        cssProps.push(`width: ${attrs.width}`);
        delete attrs.width;
      }
    }
    if (attrs.align) {
      if (attrs.align === 'center') {
        cssProps.push(`margin-left: auto`);
        cssProps.push(`margin-right: auto`);
      } else if (attrs.align === 'left') {
        cssProps.push(`margin-right: auto`);
      } else if (attrs.align === 'right') {
        cssProps.push(`margin-left: auto`);
      }
      delete attrs.align;
    }

    const styleStr = cssProps.length > 0 ? ` style="${cssProps.join('; ')}"` : '';
    const otherAttrs = this.renderAllAttributes(attrs);
    return `<hr${styleStr}${otherAttrs}>`;
  }

  visitIndentation(node: IndentationNode): string {
    const childrenHtml = this.joinChildren(node.children);
    if (!childrenHtml.trim()) return '';
    const attrs = this.renderAllAttributes(node.attributes);

    return `<div${attrs} class="indented" style="margin-left: 2em">${childrenHtml}</div>`;
  }

  public processInline(text: string): string {
    const nodes = this.inlineParser.parse(text);
    return nodes.map((node) => this.buildInlineNode(node)).join('');
  }

  public processInlineContent(text: string): string {
    if (!text) return '';
    const processed = this.contentProcessor.processContent(text);
    return this.processInline(processed);
  }

  private formatValue(value: any): string {
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

  private buildInlineNode(node: ASTNode): string {
    switch (node.type) {
      case 'Text':
        return this.visitText(node as TextNode);
      case 'Bold':
        return this.visitBold(node as BoldNode);
      case 'Italic':
        return this.visitItalic(node as ItalicNode);
      case 'Underline':
        return this.visitUnderline(node as UnderlineNode);
      case 'Strikethrough':
        return this.visitStrikethrough(node as StrikethroughNode);
      case 'Code':
        return this.visitCode(node as CodeNode);
      case 'Superscript':
        return this.visitSuperscript(node as SuperscriptNode);
      case 'Subscript':
        return this.visitSubscript(node as SubscriptNode);
      case 'Highlight':
        return this.visitHighlight(node as HighlightNode);
      case 'InlineStyle':
        return this.visitInlineStyle(node as InlineStyleNode);
      case 'Link':
        return this.visitLink(node as LinkNode);
      case 'Image':
        return this.visitImage(node as ImageNode);
      case 'Video':
        return this.visitVideo(node as VideoNode);
      case 'Audio':
        return this.visitAudio(node as AudioNode);
      case 'Embed':
        return this.visitEmbed(node as EmbedNode);
      case 'File':
        return this.visitFile(node as FileNode);
      case 'Variable':
        return this.visitVariable(node as VariableNode);
      case 'Expression':
        return this.visitExpression(node as ExpressionNode);
      case 'Abbreviation':
        return this.visitAbbreviation(node as AbbreviationNode);
      case 'CommentInline':
        return this.visitCommentInline();
      default:
        return (node as any).content || '';
    }
  }

  visitText(node: TextNode): string {
    return this.contentProcessor.processContent(node.content);
  }

  visitBold(node: BoldNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const inlineHtml = this.processInline((node as any).content);
    const childrenHtml = this.joinChildren(node.children);
    return `<strong${attrs}>${inlineHtml}${childrenHtml}</strong>`;
  }

  visitItalic(node: ItalicNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const inlineHtml = this.processInline((node as any).content);
    const childrenHtml = this.joinChildren(node.children);
    return `<em${attrs}>${inlineHtml}${childrenHtml}</em>`;
  }

  visitUnderline(node: UnderlineNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const inlineHtml = this.processInline((node as any).content);
    const childrenHtml = this.joinChildren(node.children);
    return `<u${attrs}>${inlineHtml}${childrenHtml}</u>`;
  }

  visitStrikethrough(node: StrikethroughNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const inlineHtml = this.processInline((node as any).content);
    const childrenHtml = this.joinChildren(node.children);
    return `<del${attrs}>${inlineHtml}${childrenHtml}</del>`;
  }

  visitCode(node: CodeNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    return `<code${attrs}>${node.content}</code>`;
  }

  visitSuperscript(node: SuperscriptNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const inlineHtml = this.processInline((node as any).content);
    const childrenHtml = this.joinChildren(node.children);
    return `<sup${attrs}>${inlineHtml}${childrenHtml}</sup>`;
  }

  visitSubscript(node: SubscriptNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const inlineHtml = this.processInline((node as any).content);
    const childrenHtml = this.joinChildren(node.children);
    return `<sub${attrs}>${inlineHtml}${childrenHtml}</sub>`;
  }

  visitHighlight(node: HighlightNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const inlineHtml = this.processInline((node as any).content);
    const childrenHtml = this.joinChildren(node.children);
    return `<mark${attrs}>${inlineHtml}${childrenHtml}</mark>`;
  }

  visitInlineStyle(node: InlineStyleNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const inlineHtml = this.processInline((node as any).content);
    const childrenHtml = this.joinChildren(node.children);
    return `<span${attrs}>${inlineHtml}${childrenHtml}</span>`;
  }

  private renderAllAttributes(attrs?: Attributes): string {
    if (!attrs) return '';

    const htmlAttrs = this.filterCssProperties(attrs);
    const styleStr = this.buildStyleAttribute(attrs);
    const otherAttrs = this.buildAttributes(htmlAttrs);

    return `${styleStr}${otherAttrs}`;
  }

  private buildStyleAttribute(attrs?: Attributes): string {
    if (!attrs) return '';

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
    };

    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined && cssPropertyMap[key]) {
        const processedValue = this.contentProcessor.processContent(String(value));
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
    ]);
    const filtered: Attributes = {};
    for (const [key, value] of Object.entries(attrs)) {
      if (!cssProps.has(key)) {
        filtered[key] = value;
      }
    }
    return filtered;
  }

  private transformHref(href: string): string {
    if (href.startsWith('@')) {
      return '#' + href.substring(1);
    }
    if (href.endsWith('.zlt')) {
      return href.replace(/\.zlt$/, '.html');
    }
    return href;
  }

  visitLink(node: LinkNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const title = node.title ? ` title="${this.contentProcessor.processContent(node.title)}"` : '';
    const href = this.transformHref(this.contentProcessor.processContent(node.href));
    const childrenHtml =
      node.children && node.children.length > 0
        ? this.joinChildren(node.children)
        : this.processInlineContent((node as any).content);
    return `<a href="${href}"${title}${attrs}>${childrenHtml}</a>`;
  }

  visitImage(node: ImageNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const src = this.contentProcessor.processContent(node.src);
    const alt = this.contentProcessor.processContent(node.alt);
    return `<img src="${src}" alt="${alt}"${attrs}>`;
  }

  visitVideo(node: VideoNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const src = this.contentProcessor.processContent(node.src);
    const alt = this.contentProcessor.processContent(node.alt ?? '');
    return `<video src="${src}"${attrs}>${alt}</video>`;
  }

  visitAudio(node: AudioNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const src = this.contentProcessor.processContent(node.src);
    const alt = this.contentProcessor.processContent(node.alt ?? '');
    return `<audio src="${src}"${attrs}>${alt}</audio>`;
  }

  visitEmbed(node: EmbedNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const src = this.contentProcessor.processContent(node.src);
    const title = node.title ? ` title="${this.contentProcessor.processContent(node.title)}"` : '';
    return `<iframe src="${src}"${title}${attrs}></iframe>`;
  }

  visitFile(node: FileNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const src = this.transformHref(this.contentProcessor.processContent(node.src));
    const title = node.title ? this.contentProcessor.processContent(node.title) : null;
    return `<a href="${src}"${attrs}>${title || src}</a>`;
  }

  visitVariable(node: VariableNode): string {
    try {
      const value = this.evaluator.evaluate('$' + node.name);
      if (value === null || value === undefined) {
        return `{$${node.name}}`;
      }
      return this.formatValue(value);
    } catch {
      return `{$${node.name}}`;
    }
  }

  visitExpression(node: ExpressionNode): string {
    try {
      const value = this.evaluator.evaluate(node.expression);
      if (value === null || value === undefined) {
        return `{{${node.expression}}}`;
      }
      return this.formatValue(value);
    } catch {
      return `{{${node.expression}}}`;
    }
  }

  visitFootnote(node: FootnoteNode): string {
    return `<sup><a href="#fn-${node.id}" id="fnref-${node.id}">[${node.id}]</a></sup>`;
  }

  visitFootnoteDefinition(node: FootnoteDefinitionNode): string {
    return `<div id="fn-${node.id}"><sup>${node.id}</sup>${node.content}</div>`;
  }

  visitAbbreviation(node: AbbreviationNode): string {
    const attrs = this.buildAttributes(node.attributes);
    return `<abbr title="${node.definition}"${attrs}>${node.abbreviation}</abbr>`;
  }

  visitAbbreviationDefinition(node: AbbreviationDefinitionNode): string {
    if (node.isGlobal) {
      Parser.globalAbbreviations.set(node.abbreviation, node.definition);
    } else {
      this.abbreviationDefinitions.set(node.abbreviation, node.definition);
    }
    return '';
  }

  visitFrontmatter(node: { data: Record<string, any> }): string {
    if (node.data) {
      for (const [key, value] of Object.entries(node.data)) {
        this.evaluator.setVariable(key, value);
      }
    }
    return '';
  }

  visitCommentInline(): string {
    return '';
  }

  private buildAttributes(attrs?: Attributes): string {
    if (!attrs) return '';

    const parts: string[] = [];
    if (attrs.id) {
      const processedId = this.contentProcessor.processContent(String(attrs.id));
      parts.push(`id="${processedId}"`);
    }
    if (attrs.class) {
      const processedClass = this.contentProcessor.processContent(String(attrs.class));
      parts.push(`class="${processedClass}"`);
    }

    for (const [key, value] of Object.entries(attrs)) {
      if (key !== 'id' && key !== 'class' && value !== undefined) {
        if (value === '') {
          parts.push(key);
        } else {
          const processedValue = this.contentProcessor.processContent(String(value));
          parts.push(`${key}="${processedValue}"`);
        }
      }
    }

    return parts.length > 0 ? ' ' + parts.join(' ') : '';
  }

  private joinChildren(nodes: ASTNode[]): string {
    if (!nodes) return '';
    return nodes
      .map((child) => this.build(child))
      .filter((h) => h !== '')
      .join('');
  }
}
