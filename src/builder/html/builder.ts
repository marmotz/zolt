import { createHighlighter, type Highlighter } from 'shiki';
import { InlineParser } from '../../parser/inline-parser';
import { ASTNode, Attributes, DocumentNode, HeadingNode } from '../../parser/types';
import { ProjectNode } from '../../utils/project-graph';
import { Builder } from '../builder';
import { ExpressionEvaluator } from '../evaluator/expression-evaluator';
import { DocumentRenderer } from './document-renderer';
import { zoltLanguage } from './shiki/zolt';
import { AttributeRenderer } from './utils/attribute-renderer';
import { parseLineRanges } from './utils/line-range-parser';
import { BlockVisitor } from './visitors/block-visitor';
import { InlineVisitor } from './visitors/inline-visitor';
import { SpecialBlockVisitor } from './visitors/special-block-visitor';
import { TableVisitor } from './visitors/table-visitor';

export type InitialVariables = Record<string, number | string | boolean | null | undefined>;

export class HTMLBuilder implements Builder {
  private inlineParser = new InlineParser();
  private footnoteDefinitions: Map<string, { children: ASTNode[]; attributes?: Record<string, unknown> }> = new Map();
  private footnoteReferences: { id: string; refId: string }[] = [];
  private evaluator: ExpressionEvaluator;
  private attributeRenderer: AttributeRenderer;
  private currentHeadings: ASTNode[] = [];

  private blockVisitor: BlockVisitor;
  private inlineVisitor: InlineVisitor;
  private tableVisitor: TableVisitor;
  private specialBlockVisitor: SpecialBlockVisitor;
  private documentRenderer: DocumentRenderer;
  private static highlighterPromise: Promise<Highlighter> | null = null;
  private projectGraph?: ProjectNode[];
  private currentFilePath?: string;

  constructor(
    initialVariables?: InitialVariables,
    private assetResolver?: (path: string) => string,
    projectGraph?: ProjectNode[],
    currentFilePath?: string
  ) {
    this.projectGraph = projectGraph;
    this.currentFilePath = currentFilePath;
    this.evaluator = new ExpressionEvaluator();
    if (initialVariables) {
      for (const [key, value] of Object.entries(initialVariables)) {
        if (value !== undefined) {
          this.evaluator.setVariable(key, value as any);
        }
      }
    }
    this.attributeRenderer = new AttributeRenderer(this.evaluator);
    this.documentRenderer = new DocumentRenderer(this.evaluator, this.assetResolver);

    const buildBound = this.build.bind(this);
    const joinChildrenBound = this.joinChildren.bind(this);
    const joinInlineChildrenBound = this.joinInlineChildren.bind(this);
    const renderAttrsBound = this.attributeRenderer.renderAllAttributes.bind(this.attributeRenderer);
    const processInlineBound = this.processInline.bind(this);

    const registerFootnoteRef = (id: string) => {
      const count = this.footnoteReferences.filter((ref) => ref.id === id).length;
      const refId = count === 0 ? id : `${id}-${count}`;
      this.footnoteReferences.push({ id, refId });

      const uniqueIds = Array.from(new Set(this.footnoteReferences.map((ref) => ref.id)));

      return {
        index: uniqueIds.indexOf(id) + 1,
        refId,
      };
    };

    this.blockVisitor = new BlockVisitor(
      buildBound,
      joinChildrenBound,
      joinInlineChildrenBound,
      renderAttrsBound,
      processInlineBound,
      this.evaluator
    );

    this.inlineVisitor = new InlineVisitor(
      joinInlineChildrenBound,
      renderAttrsBound,
      processInlineBound,
      this.evaluator,
      registerFootnoteRef.bind(this),
      this.assetResolver
    );

    this.tableVisitor = new TableVisitor(joinInlineChildrenBound, renderAttrsBound);

    this.specialBlockVisitor = new SpecialBlockVisitor(
      joinChildrenBound,
      joinInlineChildrenBound,
      renderAttrsBound,
      this.evaluator,
      processInlineBound,
      this.currentHeadings as HeadingNode[],
      this.projectGraph,
      this.currentFilePath
    );
  }

  private async ensureHighlighter(): Promise<Highlighter> {
    if (!HTMLBuilder.highlighterPromise) {
      HTMLBuilder.highlighterPromise = createHighlighter({
        themes: ['github-dark'],
        langs: [
          zoltLanguage,
          'javascript',
          'typescript',
          'python',
          'bash',
          'shell',
          'json',
          'yaml',
          'markdown',
          'html',
          'css',
          'rust',
          'go',
          'java',
          'c',
          'cpp',
          'php',
          'sql',
        ],
      });
    }

    return HTMLBuilder.highlighterPromise;
  }

  async build(node: ASTNode): Promise<string> {
    switch (node.type) {
      case 'Document':
        return await this.joinChildren(node.children);
      case 'Heading':
        return await this.blockVisitor.visitHeading(node as any);
      case 'Paragraph':
        return await this.blockVisitor.visitParagraph(node as any);
      case 'Blockquote':
        return await this.blockVisitor.visitBlockquote(node as any);
      case 'List':
        return await this.blockVisitor.visitList(node as any);
      case 'ListItem':
        return await this.blockVisitor.visitListItem(node as any);
      case 'DefinitionTerm':
        return await this.blockVisitor.visitDefinitionTerm(node as any);
      case 'DefinitionDescription':
        return await this.blockVisitor.visitDefinitionDescription(node as any);
      case 'CodeBlock':
        return await this.visitCodeBlock(node as any);
      case 'Table':
        return await this.tableVisitor.visitTable(node as any);
      case 'TripleColonBlock':
        return await this.specialBlockVisitor.visitTripleColonBlock(node as any);
      case 'DoubleBracketBlock':
        return await this.specialBlockVisitor.visitDoubleBracketBlock(node as any);
      case 'Mermaid':
        return await this.specialBlockVisitor.visitMermaid(node as any);
      case 'Chart':
        return await this.specialBlockVisitor.visitChart(node as any);
      case 'HorizontalRule':
        return this.blockVisitor.visitHorizontalRule(
          node as any,
          this.attributeRenderer.renderAllAttributes.bind(this.attributeRenderer)
        );
      case 'Indentation':
        return await this.blockVisitor.visitIndentation(node as any);
      case 'VariableDefinition':
        return '';
      case 'Include':
        return await this.joinChildren(node.children);
      case 'FootnoteDefinition':
        this.footnoteDefinitions.set((node as any).id, {
          children: (node as any).children,
          attributes: (node as any).attributes,
        });

        return '';
      default:
        // Pour tous les autres types (inline), on passe par l'InlineVisitor
        return await this.inlineVisitor.visit(node);
    }
  }

  async buildDocument(node: DocumentNode): Promise<string> {
    this.currentHeadings = this.documentRenderer.findAllHeadings(node.children);
    this.specialBlockVisitor.reset();
    (this.specialBlockVisitor as any).currentHeadings = this.currentHeadings;

    const contentHtml = await this.joinChildren(node.children);
    const footnotesHtml = await this.renderFootnotes();

    const options = {
      hasTabs: this.hasNodeType(node.children, 'TripleColonBlock', (n: any) => n.blockType === 'tabs'),
      hasCharts: this.hasNodeType(node.children, 'Chart'),
      hasMermaid: this.hasNodeType(node.children, 'Mermaid'),
      hasMath: this.hasNodeType(node.children, 'Math'),
      hasSidebar: this.specialBlockVisitor.hasSidebar,
      sidebarSide: this.specialBlockVisitor.sidebarSide,
    };

    return this.documentRenderer.renderDocumentWithContent(
      node,
      contentHtml + footnotesHtml,
      options,
      () => '' //visitFileMetadata placeholder
    );
  }

  private async joinChildren(nodes: ASTNode[]): Promise<string> {
    const pieces: string[] = [];
    for (const node of nodes) {
      pieces.push(await this.build(node));
    }

    return pieces.join('\n');
  }

  private async joinInlineChildren(nodes: ASTNode[]): Promise<string> {
    const pieces: string[] = [];
    for (const node of nodes) {
      pieces.push(await this.build(node));
    }

    return pieces.join('');
  }

  public async processInline(text: string): Promise<string> {
    const nodes = this.inlineParser.parse(text);
    const pieces: string[] = [];
    for (const node of nodes) {
      pieces.push(await this.inlineVisitor.visit(node));
    }

    return pieces.join('');
  }

  private async renderFootnotes(): Promise<string> {
    if (this.footnoteDefinitions.size === 0) {
      return '';
    }

    let html = '\n<section class="footnotes">\n<hr>\n<ol>\n';

    const sortedIds = Array.from(new Set(this.footnoteReferences.map((ref) => ref.id)));

    for (const id of sortedIds) {
      const def = this.footnoteDefinitions.get(id);
      if (!def) continue;

      const relevantRefs = this.footnoteReferences.filter((ref) => ref.id === id);
      const backlinks = relevantRefs
        .map((ref, idx) => {
          const suffix = idx === 0 ? '' : `-${idx + 1}`;

          return ` <a href="#fnref-${ref.refId}" class="footnote-backref" aria-label="Back to content">↩${suffix}</a>`;
        })
        .join('');

      let content: string;
      if (def.children && def.children.length > 0) {
        const lastChild = def.children[def.children.length - 1];
        if (lastChild.type === 'Paragraph') {
          const otherChildrenHtml = await this.joinInlineChildren(def.children.slice(0, -1));
          const lastChildHtml = await this.build(lastChild);
          if (lastChildHtml.endsWith('</p>')) {
            content = otherChildrenHtml + lastChildHtml.replace(/<\/p>$/, `${backlinks}</p>`);
          } else {
            content = otherChildrenHtml + lastChildHtml + backlinks;
          }
        } else {
          content = (await this.joinInlineChildren(def.children)) + backlinks;
        }
      } else {
        content = backlinks;
      }

      const attrs = this.attributeRenderer.renderAllAttributes(def.attributes as Attributes);
      html += `<li id="fn-${id}"${attrs} class="footnote-item">${content}</li>\n`;
    }

    html += '</ol>\n</section>\n';

    return html;
  }

  private hasNodeType(nodes: ASTNode[], type: string, extraCheck?: (node: ASTNode) => boolean): boolean {
    for (const node of nodes) {
      if (node.type === type) {
        if (!extraCheck || extraCheck(node)) return true;
      }
      if ('children' in node && Array.isArray(node.children)) {
        if (this.hasNodeType(node.children as ASTNode[], type, extraCheck)) return true;
      }
      if (node.type === 'Table') {
        const table = node as any;
        if (this.hasNodeType(table.rows as ASTNode[], type, extraCheck)) return true;
      }
      if (node.type === 'TableRow') {
        const row = node as any;
        if (this.hasNodeType(row.cells as ASTNode[], type, extraCheck)) return true;
      }
      if (node.type === 'TableCell') {
        const cell = node as any;
        if (cell.children && this.hasNodeType(cell.children as ASTNode[], type, extraCheck)) return true;
      }
    }

    return false;
  }

  private async visitCodeBlock(node: unknown): Promise<string> {
    const n = node as Record<string, any>;
    const highlighter = await this.ensureHighlighter();
    const lang = n.language || 'text';
    const code = n.content || '';
    const attributes = (n.attributes as Record<string, string>) || {};

    const supportedLangs = highlighter.getLoadedLanguages();
    const effectiveLang = supportedLangs.includes(lang) ? lang : 'text';

    const title = attributes.title;
    const highlightRange = attributes.highlight;
    const startLine = parseInt(attributes.start || '1', 10);

    const highlightedLines = parseLineRanges(highlightRange);

    const html = highlighter.codeToHtml(code, {
      lang: effectiveLang,
      theme: 'github-dark',
      transformers: [
        {
          line(hNode, line) {
            const actualLineNumber = line + startLine - 1;
            if (highlightedLines.has(actualLineNumber)) {
              hNode.properties.class = (hNode.properties.class || '') + ' highlight';
            }
          },
        },
      ],
    });

    const hasLineNumbers = attributes.start !== undefined;
    const containerClasses = ['zolt-code-block'];
    if (hasLineNumbers) containerClasses.push('with-line-numbers');

    const startStyle = hasLineNumbers ? ` style="--zlt-code-start: ${startLine - 1}"` : '';

    const filteredAttrs: Record<string, string> = {};
    for (const [key, value] of Object.entries(attributes)) {
      if (key !== 'title' && key !== 'highlight' && key !== 'start') {
        filteredAttrs[key] = value as string;
      }
    }
    const attrsHtml = Object.entries(filteredAttrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    const headerHtml = `
    <div class="zolt-code-header">
      <span class="zolt-code-title">${title || ''}</span>
      <button class="zolt-copy-button">Copier</button>
    </div>`;

    return `
    <div class="${containerClasses.join(' ')}"${startStyle}${attrsHtml ? ' ' + attrsHtml : ''}>
      ${headerHtml}
      ${html}
    </div>`;
  }
}
