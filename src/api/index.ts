import { readFile, stat, writeFile } from 'fs/promises';
import { Builder } from '../builder/builder';
import { HTMLBuilder } from '../builder/html/builder';
import { Lexer } from '../lexer/lexer';
import { InlineParser } from '../parser/inline-parser';
import { Parser } from '../parser/parser';
import { createFileDateVariables } from '../utils/file-metadata';
import { ExpressionEvaluator } from '../builder/evaluator/expression-evaluator';
import { SourceEvaluator } from '../builder/evaluator/source-evaluator';

export interface BuildOptions {
  type?: 'html' | 'pdf';
  variables?: Record<string, unknown>;
  frontMatter?: boolean;
  filePath?: string;
}

export interface LintOptions {
  format?: 'json' | 'text';
  fix?: boolean;
}

export interface LintResult {
  valid: boolean;
  errors: LintError[];
  warnings: LintWarning[];
  filePath: string;
}

export interface LintError {
  line: number;
  column: number;
  message: string;
  code: string;
}

export interface LintWarning {
  line: number;
  column: number;
  message: string;
  code: string;
}

export async function buildString(content: string, options?: BuildOptions): Promise<string> {
  const initialVariables: Record<string, any> = { ...options?.variables };

  if (options?.filePath) {
    try {
      const fileStats = await stat(options.filePath);
      const dateVars = createFileDateVariables({
        created: fileStats.birthtime,
        modified: fileStats.mtime,
      });
      initialVariables.created = dateVars.created;
      initialVariables.modified = dateVars.modified;
    } catch {
      // File stats unavailable, leave variables empty
    }
  }

  const evaluator = new ExpressionEvaluator();
  for (const [key, value] of Object.entries(initialVariables)) {
    evaluator.setVariable(key, value);
  }

  const sourceEvaluator = new SourceEvaluator(evaluator);
  const evaluatedContent = sourceEvaluator.evaluate(content);

  const lexer = new Lexer(evaluatedContent);
  const tokens = lexer.tokenize();

  const parser = new Parser(tokens);
  const ast = parser.parse();

  let builder: Builder;

  if (options?.type === 'html' || !options?.type) {
    builder = new HTMLBuilder(initialVariables);
  } else {
    throw new Error(`Unsupported output type: ${options.type}`);
  }

  return builder.buildDocument(ast);
}

export async function buildFile(inputPath: string, outputPath: string, options?: BuildOptions): Promise<void> {
  const content = await readFile(inputPath, 'utf-8');
  const html = await buildString(content, { ...options, filePath: inputPath });
  await writeFile(outputPath, html, 'utf-8');
}

export async function buildFileToString(filePath: string, options?: BuildOptions): Promise<string> {
  const content = await readFile(filePath, 'utf-8');
  return buildString(content, { ...options, filePath });
}

export function extractAllAssets(content: string): { zltLinks: string[]; otherAssets: string[] } {
  const lexer = new Lexer(content);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();

  const zltLinks: string[] = [];
  const otherAssets: string[] = [];
  const inlineParser = new InlineParser();

  const visit = (node: any) => {
    if (!node) return;

    const checkHref = (href: string) => {
      if (!href) return;
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('#') ||
        href.startsWith('mailto:')
      ) {
        return;
      }

      if (href.endsWith('.zlt')) {
        zltLinks.push(href);
      } else {
        otherAssets.push(href);
      }
    };

    switch (node.type) {
      case 'Link':
        checkHref(node.href);
        break;
      case 'Include':
        checkHref(node.path);
        break;
      case 'Image':
      case 'Video':
      case 'Audio':
      case 'Embed':
      case 'File':
        checkHref(node.src || node.href);
        break;
      case 'Paragraph':
      case 'Heading':
      case 'ListItem':
      case 'DefinitionTerm':
      case 'DefinitionDescription':
      case 'TableCell':
        if (node.content && typeof node.content === 'string') {
          const inlineNodes = inlineParser.parse(node.content);
          inlineNodes.forEach(visit);
        }
        break;
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(visit);
    }
    if (node.rows && Array.isArray(node.rows)) {
      node.rows.forEach(visit);
    }
    if (node.cells && Array.isArray(node.cells)) {
      node.cells.forEach(visit);
    }
    if (node.header) {
      visit(node.header);
    }
  };

  visit(ast);

  return {
    zltLinks: [...new Set(zltLinks)],
    otherAssets: [...new Set(otherAssets)],
  };
}

export function extractZltLinks(content: string): string[] {
  return extractAllAssets(content).zltLinks;
}

export async function getLinkedFiles(inputPath: string): Promise<string[]> {
  const content = await readFile(inputPath, 'utf-8');
  const { zltLinks } = extractAllAssets(content);
  return zltLinks;
}

export async function getAssetFiles(inputPath: string): Promise<string[]> {
  const content = await readFile(inputPath, 'utf-8');
  const { otherAssets } = extractAllAssets(content);
  return otherAssets;
}

export async function lint(filePath: string): Promise<LintResult> {
  const errors: LintError[] = [];
  const warnings: LintWarning[] = [];

  try {
    const content = await readFile(filePath, 'utf-8');

    const lexer = new Lexer(content);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens, filePath);
    parser.parse();

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      filePath,
    };
  } catch (error) {
    const line = error instanceof Error && 'line' in error ? (error as { line: number }).line : 1;
    const column = error instanceof Error && 'column' in error ? (error as { column: number }).column : 1;

    errors.push({
      line,
      column,
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'PARSE_ERROR',
    });

    return {
      valid: false,
      errors,
      warnings,
      filePath,
    };
  }
}
