import * as fs from 'fs';
import * as path from 'path';
import { Lexer } from '../../lexer/lexer';
import { InlineParser } from '../../parser/inline-parser';
import { Parser } from '../../parser/parser';
import { ASTNode, DocumentNode, IncludeNode } from '../../parser/types';
import { Builder } from '../builder';
import { ExpressionEvaluator } from '../evaluator/expression-evaluator';
import { DocumentRenderer } from './document-renderer';
import { AttributeRenderer } from './utils/attribute-renderer';
import { BlockVisitor } from './visitors/block-visitor';
import { InlineVisitor } from './visitors/inline-visitor';
import { SpecialBlockVisitor } from './visitors/special-block-visitor';
import { TableVisitor } from './visitors/table-visitor';

type InitialVariables = Record<string, number | string | boolean | null | undefined>;

export class HTMLBuilder implements Builder {
  private inlineParser = new InlineParser();
  private footnoteDefinitions: Map<string, { children: ASTNode[]; attributes?: any }> = new Map();
  private footnoteReferences: { id: string; refId: string }[] = [];
  private evaluator: ExpressionEvaluator;
  private attributeRenderer: AttributeRenderer;
  private currentHeadings: any[] = [];
  private includeStack: string[] = [];
  private currentFilePath: string = 'unknown';
  private readonly MAX_INCLUDE_DEPTH = 10;

  private blockVisitor: BlockVisitor;
  private inlineVisitor: InlineVisitor;
  private tableVisitor: TableVisitor;
  private specialBlockVisitor: SpecialBlockVisitor;
  private documentRenderer: DocumentRenderer;

  constructor(
    initialVariables?: InitialVariables,
    private assetResolver?: (path: string) => string
  ) {
    this.evaluator = new ExpressionEvaluator();
    if (initialVariables) {
      for (const [key, value] of Object.entries(initialVariables)) {
        if (value !== undefined) {
          this.evaluator.setVariable(key, value as any);
        }
      }
    }
    this.attributeRenderer = new AttributeRenderer(this.evaluator);
    this.documentRenderer = new DocumentRenderer(this.evaluator);

    const buildBound = this.build.bind(this);
    const joinChildrenBound = this.joinChildren.bind(this);
    const renderAttrsBound = this.attributeRenderer.renderAllAttributes.bind(this.attributeRenderer);
    const processInlineBound = this.processInline.bind(this);
    const processInlineContentBound = this.processInlineContent.bind(this);

    const registerFootnoteRef = (id: string) => {
      const count = this.footnoteReferences.filter((ref) => ref.id === id).length;
      const refId = count === 0 ? id : `${id}:${count}`;
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
      renderAttrsBound,
      processInlineContentBound,
      this.evaluator
    );

    this.inlineVisitor = new InlineVisitor(
      joinChildrenBound,
      renderAttrsBound,
      processInlineBound,
      this.evaluator,
      registerFootnoteRef,
      this.assetResolver
    );

    this.tableVisitor = new TableVisitor(joinChildrenBound, renderAttrsBound);

    this.specialBlockVisitor = new SpecialBlockVisitor(
      buildBound,
      joinChildrenBound,
      renderAttrsBound,
      this.inlineParser,
      this.evaluator,
      processInlineContentBound,
      this.currentHeadings,
      this.mergeAdjacentLists.bind(this)
    );
  }

  build(node: ASTNode): string {
    switch (node.type) {
      case 'Document':
        return this.visitDocument(node as DocumentNode);
      case 'Heading':
        return this.blockVisitor.visitHeading(node as any);
      case 'Paragraph':
        return this.blockVisitor.visitParagraph(node as any);
      case 'Blockquote':
        return this.blockVisitor.visitBlockquote(node as any);
      case 'List':
        return this.blockVisitor.visitList(node as any);
      case 'ListItem':
        return this.blockVisitor.visitListItem(node as any);
      case 'DefinitionTerm':
        return this.blockVisitor.visitDefinitionTerm(node as any);
      case 'DefinitionDescription':
        return this.blockVisitor.visitDefinitionDescription(node as any);
      case 'CodeBlock':
        return this.blockVisitor.visitCodeBlock(node as any);
      case 'TripleColonBlock':
        return this.specialBlockVisitor.visitTripleColonBlock(node as any);
      case 'DoubleBracketBlock':
        return this.specialBlockVisitor.visitDoubleBracketBlock(node as any);
      case 'Math':
        return this.inlineVisitor.visitMath(node as any);
      case 'HorizontalRule':
        return this.blockVisitor.visitHorizontalRule(
          node as any,
          this.attributeRenderer.renderAllAttributes.bind(this.attributeRenderer)
        );
      case 'Indentation':
        return this.blockVisitor.visitIndentation(node as any);
      case 'VariableDefinition':
        return this.visitVariableDefinition(node as any);
      case 'Include':
        return this.visitInclude(node as IncludeNode);
      case 'Attributes':
        return '';
      case 'AbbreviationDefinition':
        return this.visitAbbreviationDefinition();
      case 'FootnoteDefinition':
        return this.visitFootnoteDefinition(node as any);
      case 'Frontmatter':
        return this.visitFrontmatter(node as any);
      case 'LinkReferenceDefinition':
        return '';
      case 'Table':
        return this.tableVisitor.visitTable(node as any);
      case 'CommentInline':
        return '';
      case 'Chart':
        return this.specialBlockVisitor.visitChart(node as any);
      case 'Mermaid':
        return this.specialBlockVisitor.visitMermaid(node as any);
      default:
        return this.inlineVisitor.visit(node);
    }
  }

  buildDocument(node: DocumentNode): string {
    this.specialBlockVisitor.reset();
    this.blockVisitor.reset();
    this.footnoteDefinitions.clear();
    this.footnoteReferences = [];
    if (node.footnoteIds) {
      this.inlineParser.setFootnotes(node.footnoteIds);
    }
    this.currentFilePath = node.sourceFile || 'unknown';
    this.includeStack = [this.currentFilePath];
    this.currentHeadings.length = 0;
    this.currentHeadings.push(...this.findAllHeadingsRecursive(node.children, this.currentFilePath));

    const contentHtml = this.documentRenderer.renderDocumentContent(
      node,
      this.joinChildren.bind(this),
      this.visitFrontmatter.bind(this)
    );

    const footnotesHtml = this.renderFootnotes();

    const options = {
      hasTabs: this.hasNodeType(node.children, 'TripleColonBlock', (n: any) => n.blockType === 'tabs'),
      hasCharts: this.hasNodeType(node.children, 'Chart'),
      hasMermaid: this.hasNodeType(node.children, 'Mermaid'),
      hasMath: this.hasNodeType(node.children, 'Math'),
    };

    return this.documentRenderer.renderDocumentWithContent(
      node,
      contentHtml + footnotesHtml,
      options,
      this.visitFrontmatter.bind(this)
    );
  }

  visitDocument(node: DocumentNode): string {
    if (node.footnoteIds) {
      this.inlineParser.setFootnotes(node.footnoteIds);
    }
    this.currentFilePath = node.sourceFile || 'unknown';
    this.includeStack = [this.currentFilePath];
    this.currentHeadings.length = 0;
    this.currentHeadings.push(...this.findAllHeadingsRecursive(node.children, this.currentFilePath));

    const contentHtml = this.documentRenderer.renderDocumentContent(
      node,
      this.joinChildren.bind(this),
      this.visitFrontmatter.bind(this)
    );

    const footnotesHtml = this.renderFootnotes();

    return contentHtml + footnotesHtml;
  }

  private renderFootnotes(): string {
    if (this.footnoteReferences.length === 0) {
      return '';
    }

    let html = '<section class="footnotes">\n<hr>\n<ol>\n';

    const uniqueIds = Array.from(new Set(this.footnoteReferences.map((ref) => ref.id)));

    for (const id of uniqueIds) {
      const def = this.footnoteDefinitions.get(id);
      if (!def) continue;

      const content = def.children ? this.joinChildren(def.children) : '';
      const attrs = this.attributeRenderer.renderAllAttributes(def.attributes);

      // Backlinks
      const relevantRefs = this.footnoteReferences.filter((ref) => ref.id === id);
      const backlinks = relevantRefs
        .map((ref) => `<a href="#fnref:${ref.refId}" class="footnote-backref">↩</a>`)
        .join(' ');

      // If content is wrapped in a paragraph, append the backlinks before the closing </p>
      let itemContent = content;
      if (itemContent.endsWith('</p>')) {
        itemContent = itemContent.substring(0, itemContent.length - 4) + ' ' + backlinks + '</p>';
      } else {
        itemContent += ' ' + backlinks;
      }

      html += `<li id="fn:${id}"${attrs}>${itemContent}</li>\n`;
    }

    html += '</ol>\n</section>';

    return html;
  }

  private visitFootnoteDefinition(node: any): string {
    this.footnoteDefinitions.set(node.id, { children: node.children, attributes: node.attributes });
    return '';
  }

  private findAllHeadingsRecursive(nodes: ASTNode[], currentPath: string, depth: number = 0): any[] {
    const headings: any[] = [];
    if (depth >= this.MAX_INCLUDE_DEPTH) return headings;

    for (const node of nodes) {
      if (node.type === 'Heading') {
        headings.push(node);
      } else if (node.type === 'Include') {
        const includeNode = node as IncludeNode;
        const currentDir = currentPath !== 'unknown' ? path.dirname(currentPath) : process.cwd();
        const targetPath = path.resolve(currentDir, includeNode.path);

        if (fs.existsSync(targetPath)) {
          try {
            const content = fs.readFileSync(targetPath, 'utf8');
            const lexer = new Lexer(content);
            const tokens = lexer.tokenize();
            const parser = new Parser(tokens, targetPath);
            const doc = parser.parse();
            headings.push(...this.findAllHeadingsRecursive(doc.children, targetPath, depth + 1));
          } catch (err: any) {
            if (err.code === 'EACCES') {
              console.warn(`[Include Warning] Permission denied while collecting headings: ${targetPath}`);
            }
            // Silently ignore errors during heading collection
          }
        }
      } else if ('children' in node && Array.isArray(node.children)) {
        headings.push(...this.findAllHeadingsRecursive(node.children as ASTNode[], currentPath, depth));
      }
    }
    return headings;
  }

  public processInline(text: string): string {
    const nodes = this.inlineParser.parse(text);

    return nodes.map((node) => this.inlineVisitor.visit(node)).join('');
  }

  public processInlineContent(text: string): string {
    if (!text) {
      return '';
    }
    // Variables and expressions are now separate AST nodes,
    // so we don't need to process them as text here.

    return this.processInline(text);
  }

  visitInclude(node: IncludeNode): string {
    if (this.includeStack.length >= this.MAX_INCLUDE_DEPTH) {
      console.warn(`[Include Error] Max inclusion depth reached: ${this.MAX_INCLUDE_DEPTH}`);
      return `<div class="error">Error: Max inclusion depth reached</div>`;
    }

    const currentDir = this.currentFilePath !== 'unknown' ? path.dirname(this.currentFilePath) : process.cwd();
    const targetPath = path.resolve(currentDir, node.path);

    if (this.includeStack.includes(targetPath)) {
      console.warn(`[Include Error] Circular inclusion detected: ${targetPath}`);
      return `<div class="error">Error: Circular inclusion detected: ${node.path}</div>`;
    }

    if (!fs.existsSync(targetPath)) {
      console.warn(`[Include Error] File not found: ${targetPath}`);
      return `<div class="error">Error: Included file not found: ${node.path}</div>`;
    }

    try {
      const content = fs.readFileSync(targetPath, 'utf8');
      const lexer = new Lexer(content);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens, targetPath);
      const doc = parser.parse();

      // Track the stack for recursion
      const previousPath = this.currentFilePath;
      this.currentFilePath = targetPath;
      this.includeStack.push(targetPath);

      // Render the children of the included document
      const result = this.joinChildren(doc.children);

      // Restore the stack
      this.includeStack.pop();
      this.currentFilePath = previousPath;

      return result;
    } catch (err: any) {
      if (err.code === 'EACCES') {
        console.warn(`[Include Error] Permission denied: ${targetPath}`);
        return `<div class="error">Error: Permission denied for included file: ${node.path}</div>`;
      }
      console.error(`[Include Error] Failed to process ${targetPath}: ${err.message}`);
      return `<div class="error">Error: Failed to process include: ${node.path}</div>`;
    }
  }

  visitAbbreviationDefinition(): string {
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

  visitVariableDefinition(node: { name: string; value: string; isGlobal: boolean }): string {
    let value = node.value;

    // Handle comments in variable definitions
    const commentIndex = value.indexOf(' # ');
    if (commentIndex !== -1) {
      value = value.substring(0, commentIndex).trim();
    }

    let parsedValue: any;

    // Check if it's an expression or a literal value
    const isExpression = (val: string) => {
      const trimmed = val.trim();
      if (trimmed.startsWith('$')) {
        return true;
      }
      if (/[+\-*/%^]/.test(trimmed)) {
        const numOnly = /^-?\d+(?:\.\d+)?$/.test(trimmed);
        if (!numOnly) {
          return true;
        }
      }
      if (/^(Math|List|String|Date)\.\w+\(/.test(trimmed)) {
        return true;
      }

      return false;
    };

    if (isExpression(value)) {
      try {
        parsedValue = this.evaluator.evaluate(value);
      } catch {
        parsedValue = this.evaluator.parseValue(value);
      }
    } else {
      parsedValue = this.evaluator.parseValue(value);
    }

    this.evaluator.setVariable(node.name, parsedValue);

    return '';
  }

  private joinChildren(nodes: ASTNode[]): string {
    if (!nodes) {
      return '';
    }

    const results = nodes.map((child) => this.build(child)).filter((h) => h !== '');

    return this.mergeAdjacentLists(results);
  }

  private mergeAdjacentLists(results: string[]): string {
    if (results.length === 0) {
      return '';
    }

    const mergedResults: string[] = [];
    let lastResult = results[0];

    for (let i = 1; i < results.length; i++) {
      const current = results[i];
      // Regex to match a complete list block: <tag attrs>content</tag>
      const listMatch = lastResult.match(/^<(ul|ol|dl)([^>]*)>([\s\S]*)<\/\1>$/i);
      const currentMatch = current.match(/^<(ul|ol|dl)([^>]*)>([\s\S]*)<\/\1>$/i);

      if (listMatch && currentMatch && listMatch[1] === currentMatch[1] && listMatch[2] === currentMatch[2]) {
        // Merge the lists by combining their children
        lastResult = `<${listMatch[1]}${listMatch[2]}>${listMatch[3]}${currentMatch[3]}</${listMatch[1]}>`;
      } else {
        mergedResults.push(lastResult);
        lastResult = current;
      }
    }
    mergedResults.push(lastResult);

    return mergedResults.join('');
  }

  private hasNodeType(nodes: ASTNode[], type: string, extraCheck?: (node: ASTNode) => boolean): boolean {
    for (const node of nodes) {
      if (node.type === type) {
        if (!extraCheck || extraCheck(node)) {
          return true;
        }
      }

      // Cas spécial pour les mathématiques inline qui ne sont pas encore parsées dans l'AST
      if (type === 'Math' && node.type === 'Text') {
        if (/\$[^$]+\$/.test((node as any).content)) {
          return true;
        }
      }

      // Recheche récursive dans les enfants (Paragraph, List, etc.)
      if ('children' in node && Array.isArray((node as any).children)) {
        if (this.hasNodeType((node as any).children, type, extraCheck)) {
          return true;
        }
      }
      // Recherche dans les lignes de tableaux
      if (node.type === 'Table') {
        if (node.header && this.hasNodeType([node.header], type, extraCheck)) return true;
        if (node.rows && this.hasNodeType(node.rows, type, extraCheck)) return true;
      }
      if (node.type === 'TableRow') {
        if (node.cells && this.hasNodeType(node.cells, type, extraCheck)) return true;
      }
      if (node.type === 'TableCell') {
        if (node.children && this.hasNodeType(node.children, type, extraCheck)) return true;
      }
    }

    return false;
  }
}
