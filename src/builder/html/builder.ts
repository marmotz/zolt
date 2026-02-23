import { InlineParser } from '../../parser/inline-parser';
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
`.trim();

type InitialVariables = Record<string, number | string | boolean | null | undefined>;

export class HTMLBuilder implements Builder {
  private inlineParser = new InlineParser();
  private abbreviationDefinitions: Map<string, string> = new Map();
  private static globalAbbreviations: Map<string, string> = new Map();
  private tabsCounter: number = 0;
  private hasTabs: boolean = false;
  private evaluator: ExpressionEvaluator;
  private contentProcessor: ContentProcessor;

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
    this.globalAbbreviations.clear();
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
      case 'AbbreviationDefinition':
        return this.visitAbbreviationDefinition(node as AbbreviationDefinitionNode);
      case 'Table':
        return this.visitTable(node as TableNode);
      case 'CommentInline':
        return '';
      default:
        return '';
    }
  }

  visitTable(node: TableNode): string {
    let html = '<table>\n';

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
    const content = this.processInlineContent(node.content);
    return `<${tag}>${content}</${tag}>`;
  }

  buildDocument(node: DocumentNode): string {
    this.abbreviationDefinitions.clear();
    this.tabsCounter = 0;
    this.hasTabs = false;

    this.collectAbbreviations(node);

    const allAbbreviations = new Map<string, string>([
      ...HTMLBuilder.globalAbbreviations.entries(),
      ...this.abbreviationDefinitions.entries(),
    ]);

    this.inlineParser.setGlobalAbbreviations(allAbbreviations);

    const childrenHtmlParts = node.children.map((child) => this.build(child)).filter((h) => h !== '');
    const childrenHtml = this.mergeAdjacentListHTML(childrenHtmlParts).join('\n');

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

    return `<!DOCTYPE html>
<html lang="">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
${DEFAULT_CSS}
  </style>
</head>
<body>
${childrenHtml}
${tabsScript}
</body>
</html>`;
  }

  private collectAbbreviations(node: ASTNode): void {
    if (node.type === 'AbbreviationDefinition') {
      this.visitAbbreviationDefinition(node as AbbreviationDefinitionNode);
    } else if (
      node.type === 'Paragraph' ||
      node.type === 'Heading' ||
      node.type === 'ListItem' ||
      node.type === 'DefinitionTerm' ||
      node.type === 'DefinitionDescription' ||
      node.type === 'TableCell'
    ) {
      const content = (node as any).content;
      if (typeof content === 'string') {
        const regex = /([A-Za-z0-9μ]+)\{abbr="([^"]+)"[^}]*}/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          const abbreviation = match[1];
          const definition = match[2];
          if (!this.abbreviationDefinitions.has(abbreviation)) {
            this.abbreviationDefinitions.set(abbreviation, definition);
          }
        }
      }
    }

    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.collectAbbreviations(child);
      }
    }

    if (node.type === 'Table') {
      const table = node as TableNode;
      if (table.header) {
        this.collectAbbreviations(table.header);
      }
      for (const row of table.rows) {
        this.collectAbbreviations(row);
      }
    } else if (node.type === 'TableRow') {
      const row = node as TableRowNode;
      for (const cell of row.cells) {
        this.collectAbbreviations(cell);
      }
    }
  }

  visitDocument(node: DocumentNode): string {
    const htmlParts = node.children.map((child) => this.build(child)).filter((h) => h !== '');
    return this.mergeAdjacentListHTML(htmlParts).join('\n');
  }

  visitHeading(node: HeadingNode): string {
    const level = Math.min(Math.max(node.level, 1), 6);
    const attrs = this.renderAllAttributes(node.attributes);
    const content = this.processInlineContent(node.content);
    const trimmed = content.replace(/\s+/g, ' ').trim();
    if (!trimmed) return '';
    return `<h${level}${attrs}>${trimmed}</h${level}>`;
  }

  visitParagraph(node: ParagraphNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const content = this.processInlineContent(node.content);
    const trimmed = content.replace(/\s+/g, ' ').trim();
    if (!trimmed) return '';
    return `<p${attrs}>${trimmed}</p>`;
  }

  visitBlockquote(node: BlockquoteNode): string {
    const childrenHtml = node.children.map((child) => this.build(child)).join('');

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

    const childrenHtml = node.children.map((child) => this.build(child)).join('\n');

    const attrs = this.renderAllAttributes(node.attributes);
    return `<${tag}${attrs}>\n${childrenHtml}\n</${tag}>`;
  }

  visitListItem(node: ListItemNode): string {
    const checkbox =
      node.checked !== undefined
        ? `<input type="checkbox" ${node.checked ? 'checked' : ''} onclick="return false;">`
        : '';
    const inlineContent = this.processInlineContent(node.content);
    const childrenHtml = node.children.map((child) => this.build(child)).join('\n');
    const content = (inlineContent + (childrenHtml ? '\n' + childrenHtml : '')).trim();
    const trimmed = content.replace(/\s+/g, ' ').trim();

    const attrs = this.renderAllAttributes(node.attributes);
    return `<li${attrs}>${checkbox}${trimmed}</li>`;
  }

  visitDefinitionTerm(node: DefinitionTermNode): string {
    const inlineContent = this.processInlineContent(node.content);
    const childrenHtml = node.children.map((child) => this.build(child)).join('\n');
    const content = (inlineContent + (childrenHtml ? '\n' + childrenHtml : '')).trim();
    const trimmed = content.replace(/\s+/g, ' ').trim();

    const attrs = this.renderAllAttributes(node.attributes);
    return `<dt${attrs}>${trimmed}</dt>`;
  }

  visitDefinitionDescription(node: DefinitionDescriptionNode): string {
    const inlineContent = this.processInlineContent(node.content);
    const childrenHtml = node.children.map((child) => this.build(child)).join('\n');
    const content = (inlineContent + (childrenHtml ? '\n' + childrenHtml : '')).trim();
    const trimmed = content.replace(/\s+/g, ' ').trim();

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
    console.log(`VISIT TRIPLE COLON: type="${node.blockType}"`);
    if (node.blockType === 'tabs') {
      return this.visitTabsBlock(node);
    }

    if (node.blockType === 'tab') {
      return this.visitTabBlock(node);
    }

    const foreachInfo = this.contentProcessor.parseForeach(node.blockType);
    if (foreachInfo) {
      return this.visitForeachBlock(node, foreachInfo.collection, foreachInfo.iterator);
    }

    const ifMatch = node.blockType.match(/^if\s+(.+)$/);
    if (ifMatch) {
      const condition = ifMatch[1];
      if (!this.contentProcessor.evaluateCondition(condition)) {
        return '';
      }

      return this.joinChildren(node.children);
    }

    const childrenHtml = this.joinChildren(node.children);

    if (node.blockType === 'details') {
      const open = node.attributes?.open === 'true' ? ' open' : '';
      const attrs = this.renderAllAttributes(node.attributes);
      const title = node.title ? this.processInlineContent(node.title) : 'Details';
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
      const title = this.processInlineContent(node.title);
      html += `<div class="block-title">${title}</div>\n`;
    }
    html += `${childrenHtml}\n</div>`;
    return html;
  }

  private visitForeachBlock(node: TripleColonBlockNode, collectionVar: string, iteratorName: string): string {
    const collection = this.contentProcessor.getCollection(collectionVar);
    if (collection.length === 0) return '';

    const results: string[] = [];

    for (let i = 0; i < collection.length; i++) {
      const item = collection[i];

      const childEvaluator = this.evaluator.createChildScope();
      childEvaluator.setVariable(iteratorName, item);
      childEvaluator.setVariable('foreach', {
        index: i,
        index1: i + 1,
        first: i === 0,
        last: i === collection.length - 1,
        even: i % 2 === 0,
        odd: i % 2 === 1,
      });

      const childBuilder = new HTMLBuilder();
      childBuilder.evaluator = childEvaluator;
      childBuilder.contentProcessor = new ContentProcessor(childEvaluator);
      childBuilder.abbreviationDefinitions = this.abbreviationDefinitions;
      childBuilder.tabsCounter = this.tabsCounter;
      childBuilder.hasTabs = this.hasTabs;
      childBuilder.inlineParser = this.inlineParser;

      for (const child of node.children) {
        const childClone = JSON.parse(JSON.stringify(child));
        const childHtml = childBuilder.build(childClone);
        if (childHtml) {
          results.push(childHtml);
        }
      }

      this.tabsCounter = childBuilder.tabsCounter;
      this.hasTabs = childBuilder.hasTabs || this.hasTabs;
    }

    return this.mergeAdjacentListHTML(results).join('\n');
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
    const attrs = this.renderAllAttributes(node.attributes);
    return `<div${attrs} class="double-bracket-block" data-type="${node.blockType}">${node.content}</div>`;
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

  processInline(text: string): string {
    const nodes = this.inlineParser.parse(text);
    return nodes.map((node) => this.buildInlineNode(node)).join('');
  }

  processInlineContent(text: string): string {
    if (!text) return '';

    const processed = this.contentProcessor.processContent(text);

    return this.processInlineWithExpressions(processed);
  }

  private processInlineWithExpressions(text: string): string {
    if (!text) return '';

    const parts: { type: 'text' | 'expr' | 'var'; content: string }[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      const exprMatch = remaining.match(/\{\{(.+?)}}/);
      const varMatch = remaining.match(/\{\$([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*|\[[^\]]+])*)}/);
      const codeMatch = remaining.match(/`[^`]*`/);

      let firstMatch: { type: 'expr' | 'var' | 'code'; index: number; length: number; content: string } | null = null;

      if (exprMatch && exprMatch.index !== undefined) {
        firstMatch = { type: 'expr', index: exprMatch.index, length: exprMatch[0].length, content: exprMatch[1] };
      }

      if (varMatch && varMatch.index !== undefined) {
        if (!firstMatch || varMatch.index < firstMatch.index) {
          firstMatch = { type: 'var', index: varMatch.index, length: varMatch[0].length, content: varMatch[1] };
        }
      }

      if (codeMatch && codeMatch.index !== undefined) {
        if (!firstMatch || codeMatch.index < firstMatch.index) {
          firstMatch = { type: 'code', index: codeMatch.index, length: codeMatch[0].length, content: codeMatch[0] };
        }
      }

      if (firstMatch) {
        if (firstMatch.index > 0) {
          parts.push({ type: 'text', content: remaining.slice(0, firstMatch.index) });
        }

        if (firstMatch.type === 'expr') {
          const value = this.evaluator.evaluate(firstMatch.content);
          parts.push({ type: 'text', content: this.formatValue(value) });
        } else if (firstMatch.type === 'var') {
          const value = this.evaluator.evaluate('$' + firstMatch.content);
          if (value === null || value === undefined) {
            parts.push({
              type: 'text',
              content: remaining.slice(firstMatch.index, firstMatch.index + firstMatch.length),
            });
          } else {
            parts.push({ type: 'text', content: this.formatValue(value) });
          }
        } else {
          parts.push({ type: 'text', content: firstMatch.content });
        }

        remaining = remaining.slice(firstMatch.index + firstMatch.length);
      } else {
        parts.push({ type: 'text', content: remaining });
        break;
      }
    }

    const textOnly = parts.map((p) => p.content).join('');
    return this.processInline(textOnly);
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
        return (node as any).content;
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
      case 'Abbreviation':
        return this.visitAbbreviation(node as AbbreviationNode);
      case 'CommentInline':
        return this.visitCommentInline();
      default:
        return (node as any).content || '';
    }
  }

  visitBold(node: BoldNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    return `<strong${attrs}>${node.content}</strong>`;
  }

  visitItalic(node: ItalicNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    return `<em${attrs}>${node.content}</em>`;
  }

  visitUnderline(node: UnderlineNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    return `<u${attrs}>${node.content}</u>`;
  }

  visitStrikethrough(node: StrikethroughNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    return `<del${attrs}>${node.content}</del>`;
  }

  visitCode(node: CodeNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    return `<code${attrs}>${node.content}</code>`;
  }

  visitSuperscript(node: SuperscriptNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const content = this.processInline(node.content);
    return `<sup${attrs}>${content}</sup>`;
  }

  visitSubscript(node: SubscriptNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const content = this.processInline(node.content);
    return `<sub${attrs}>${content}</sub>`;
  }

  visitHighlight(node: HighlightNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    return `<mark${attrs}>${node.content}</mark>`;
  }

  visitInlineStyle(node: InlineStyleNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    return `<span${attrs}>${node.content}</span>`;
  }

  private renderAllAttributes(attrs?: Attributes): string {
    if (!attrs) return '';

    const htmlAttrs = this.filterCssProperties(attrs);
    const styleStr = this.buildStyleAttribute(attrs);
    const otherAttrs = this.buildAttributes(htmlAttrs);

    return `${styleStr}${otherAttrs}`;
  }

  private mergeAdjacentListHTML(htmlStrings: string[]): string[] {
    if (htmlStrings.length <= 1) return htmlStrings;

    const merged: string[] = [];
    let current = htmlStrings[0];

    for (let i = 1; i < htmlStrings.length; i++) {
      const next = htmlStrings[i];
      const mergedContent = this.tryMergeLists(current, next);

      if (mergedContent) {
        current = mergedContent;
      } else {
        merged.push(current);
        current = next;
      }
    }
    merged.push(current);
    return merged;
  }

  private tryMergeLists(html1: string, html2: string): string | null {
    const h1 = html1.trim();
    const h2 = html2.trim();

    const ulRegex = /^<(ul|ol|dl)([^>]*)>([\s\S]*)<\/\1>$/i;
    const match1 = h1.match(ulRegex);
    const match2 = h2.match(ulRegex);

    if (match1 && match2 && match1[1].toLowerCase() === match2[1].toLowerCase()) {
      const attrs1 = match1[2].trim();
      const attrs2 = match2[2].trim();

      if (attrs1 === attrs2) {
        const content1 = match1[3].trim();
        const content2 = match2[3].trim();
        return `<${match1[1]}${match1[2]}>\n${content1}\n${content2}\n</${match1[1]}>`;
      }
    }

    return null;
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
        cssProps.push(`${cssPropertyMap[key]}: ${value}`);
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
    if (href.endsWith('.zlt')) {
      return href.replace(/\.zlt$/, '.html');
    }
    return href;
  }

  visitLink(node: LinkNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const title = node.title ? ` title="${node.title}"` : '';
    const href = this.transformHref(node.href);
    return `<a href="${href}"${title}${attrs}>${node.content}</a>`;
  }

  visitImage(node: ImageNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    return `<img src="${node.src}" alt="${node.alt}"${attrs}>`;
  }

  visitVideo(node: VideoNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    return `<video src="${node.src}"${attrs}>${node.alt}</video>`;
  }

  visitAudio(node: AudioNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    return `<audio src="${node.src}"${attrs}>${node.alt}</audio>`;
  }

  visitEmbed(node: EmbedNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const title = node.title ? ` title="${node.title}"` : '';
    return `<iframe src="${node.src}"${title}${attrs}></iframe>`;
  }

  visitFile(node: FileNode): string {
    const attrs = this.renderAllAttributes(node.attributes);
    const src = this.transformHref(node.src);
    return `<a href="${src}"${attrs}>${node.title || node.src}</a>`;
  }

  visitVariable(node: VariableNode): string {
    return node.isGlobal ? `$${node.name}` : `\$var`;
  }

  visitExpression(node: ExpressionNode): string {
    return `{{${node.expression}}}`;
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
      HTMLBuilder.globalAbbreviations.set(node.abbreviation, node.definition);
    } else {
      this.abbreviationDefinitions.set(node.abbreviation, node.definition);
    }
    return '';
  }

  visitCommentInline(): string {
    return '';
  }

  private buildAttributes(attrs?: Attributes): string {
    if (!attrs) return '';

    const parts: string[] = [];
    if (attrs.id) parts.push(`id="${attrs.id}"`);
    if (attrs.class) parts.push(`class="${attrs.class}"`);

    for (const [key, value] of Object.entries(attrs)) {
      if (key !== 'id' && key !== 'class' && value !== undefined) {
        if (value === '') {
          parts.push(key);
        } else {
          parts.push(`${key}="${value}"`);
        }
      }
    }

    return parts.length > 0 ? ' ' + parts.join(' ') : '';
  }

  private joinChildren(nodes: ASTNode[]): string {
    const htmlParts = nodes.map((child) => this.build(child)).filter((h) => h !== '');
    return this.mergeAdjacentListHTML(htmlParts).join('\n');
  }
}
