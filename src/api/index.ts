import { readFile, writeFile } from 'fs/promises';
import { Builder } from '../builder/builder';
import { HTMLBuilder } from '../builder/html/builder';
import { Lexer } from '../lexer/lexer';
import { Parser } from '../parser/parser';

export interface BuildOptions {
  type?: 'html' | 'pdf';
  variables?: Record<string, unknown>;
  frontmatter?: boolean;
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
  const lexer = new Lexer(content);
  const tokens = lexer.tokenize();

  const parser = new Parser(tokens);
  const ast = parser.parse();

  let builder: Builder;

  if (options?.type === 'html' || !options?.type) {
    builder = new HTMLBuilder();
  } else {
    throw new Error(`Unsupported output type: ${options.type}`);
  }

  return builder.buildDocument(ast);
}

export async function buildFile(inputPath: string, outputPath: string, options?: BuildOptions): Promise<void> {
  const content = await readFile(inputPath, 'utf-8');
  const html = await buildString(content, options);
  await writeFile(outputPath, html, 'utf-8');
}

export async function buildFileToString(filePath: string, options?: BuildOptions): Promise<string> {
  const content = await readFile(filePath, 'utf-8');
  return buildString(content, options);
}

export function extractZltLinks(content: string): string[] {
  const linkRegex = /\[([^\]]+)\]\(([^\s)]+?\.zlt)\)/g;
  const links: string[] = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[2];
    if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('#')) {
      links.push(href);
    }
  }

  return [...new Set(links)];
}

export async function getLinkedFiles(inputPath: string): Promise<string[]> {
  const content = await readFile(inputPath, 'utf-8');
  return extractZltLinks(content);
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
