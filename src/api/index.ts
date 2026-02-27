import * as fs from 'fs';
import { readFile, stat, writeFile } from 'fs/promises';
import * as path from 'path';
import { Builder } from '../builder/builder';
import { ExpressionEvaluator } from '../builder/evaluator/expression-evaluator';
import { SourceEvaluator } from '../builder/evaluator/source-evaluator';
import { HTMLBuilder } from '../builder/html/builder';
import { Lexer } from '../lexer/lexer';
import { Parser } from '../parser/parser';
import { createFileDateVariables } from '../utils/file-metadata';
import { ProjectGraphBuilder, ProjectNode } from '../utils/project-graph';

export interface BuildOptions {
  type?: 'html' | 'pdf';
  variables?: Record<string, any>;
  projectMetadata?: Record<string, any>;
  fileMetadata?: boolean;
  filePath?: string;
  assetResolver?: (path: string) => string;
  globalAbbreviations?: Map<string, string>;
  entryPoint?: string;
  projectGraph?: ProjectNode[];
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

export function getExpandedContent(
  content: string,
  options?: BuildOptions,
  extraVariables?: Record<string, any>
): string {
  const initialVariables: Record<string, any> = {
    ...options?.projectMetadata,
    ...options?.variables,
    ...extraVariables,
  };

  const evaluator = new ExpressionEvaluator();
  for (const [key, value] of Object.entries(initialVariables)) {
    evaluator.setVariable(key, value);
  }

  const sourceEvaluator = new SourceEvaluator(evaluator, options?.filePath, [], undefined, false, true);
  return sourceEvaluator.evaluate(content);
}

export async function buildString(content: string, options?: BuildOptions): Promise<string> {
  const extraVariables: Record<string, any> = {};

  if (options?.filePath) {
    try {
      const fileStats = await stat(options.filePath);
      const dateVars = createFileDateVariables({
        created: fileStats.birthtime,
        modified: fileStats.mtime,
      });
      extraVariables.created = dateVars.created;
      extraVariables.modified = dateVars.modified;
    } catch {
      // File stats unavailable, leave variables empty
    }
  }

  const expandedContent = getExpandedContent(content, options, extraVariables);

  // Phase 2: Lexing & Parsing the expanded "pure Zolt"
  const lexer = new Lexer(expandedContent);
  const tokens = lexer.tokenize();

  const parser = new Parser(tokens, options?.filePath, options?.globalAbbreviations);
  const ast = parser.parse();

  // If we have global abbreviations from the parser, update the options object
  if (options && options.globalAbbreviations) {
    const currentGlobals = parser.getGlobalAbbreviations();
    if (currentGlobals) {
      for (const [key, value] of currentGlobals.entries()) {
        options.globalAbbreviations.set(key, value);
      }
    }
  }

  const mergedVariables: Record<string, any> = {
    ...options?.projectMetadata,
    ...options?.variables,
    ...extraVariables,
  };

  if (ast.fileMetadata) {
    Object.assign(mergedVariables, ast.fileMetadata.data);
  }

  if (options?.projectMetadata?.title) {
    mergedVariables.projectTitle = options.projectMetadata.title;
  }

  // Handle project graph for [[filetree]]
  let projectGraph = options?.projectGraph;
  if (!projectGraph && options?.entryPoint) {
    const builder = new ProjectGraphBuilder(options.entryPoint);
    const result = builder.build();
    projectGraph = result ? result : undefined;
  }

  let builder: Builder;

  if (options?.type === 'html' || !options?.type) {
    builder = new HTMLBuilder(mergedVariables, options?.assetResolver, projectGraph, options?.filePath);
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

export function extractAllAssets(
  content: string,
  projectMetadata?: Record<string, any>,
  filePath?: string
): { zltLinks: string[]; otherAssets: string[] } {
  const expandedContent = getExpandedContent(content, { projectMetadata, filePath });
  const lexer = new Lexer(expandedContent);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens, filePath);
  const ast = parser.parse();

  const zltLinks: string[] = [];
  const otherAssets: string[] = [];

  const bubblingFileExists = (dir: string, fileName: string): boolean => {
    let currentDir = dir;
    while (true) {
      const fullPath = path.resolve(currentDir, fileName);
      if (fs.existsSync(fullPath)) return true;
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break;
      currentDir = parentDir;
    }
    return false;
  };

  const checkHref = (href: string) => {
    if (!href) {
      return;
    }
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('#') ||
      href.startsWith('mailto:')
    ) {
      return;
    }

    if (href.endsWith('.zlt')) {
      // If we have a filePath, check if the file exists using bubbling if it's a layout-like file
      if (filePath && (href.startsWith('_layout') || href.startsWith('_template'))) {
        if (bubblingFileExists(path.dirname(filePath), href)) {
          zltLinks.push(href);
          return;
        }
      }
      zltLinks.push(href);
    } else {
      otherAssets.push(href);
    }
  };

  // Check project metadata
  if (projectMetadata?.image) {
    checkHref(projectMetadata.image);
  }
  if (projectMetadata?.icon_png) {
    checkHref(projectMetadata.icon_png);
  }
  if (projectMetadata?.icon_svg) {
    checkHref(projectMetadata.icon_svg);
  }
  if (projectMetadata?.icon_ico) {
    checkHref(projectMetadata.icon_ico);
  }
  if (projectMetadata?.icon_apple) {
    checkHref(projectMetadata.icon_apple);
  }
  if (projectMetadata?.manifest) {
    checkHref(projectMetadata.manifest);
  }
  if (projectMetadata?.layout) {
    checkHref(projectMetadata.layout);
  }

  // Check file metadata
  if (ast?.fileMetadata?.data.image) {
    checkHref(ast.fileMetadata.data.image);
  }
  if (ast?.fileMetadata?.data.icon_png) {
    checkHref(ast.fileMetadata.data.icon_png);
  }
  if (ast?.fileMetadata?.data.icon_svg) {
    checkHref(ast.fileMetadata.data.icon_svg);
  }
  if (ast?.fileMetadata?.data.icon_ico) {
    checkHref(ast.fileMetadata.data.icon_ico);
  }
  if (ast?.fileMetadata?.data.icon_apple) {
    checkHref(ast.fileMetadata.data.icon_apple);
  }
  if (ast?.fileMetadata?.data.manifest) {
    checkHref(ast.fileMetadata.data.manifest);
  }
  if (ast?.fileMetadata?.data.layout) {
    checkHref(ast.fileMetadata.data.layout);
  }

  const visit = (node: any) => {
    if (!node) {
      return;
    }

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

export function extractZltLinks(content: string, projectMetadata?: Record<string, any>): string[] {
  return extractAllAssets(content, projectMetadata).zltLinks;
}

export async function getLinkedFiles(inputPath: string, projectMetadata?: Record<string, any>): Promise<string[]> {
  const content = await readFile(inputPath, 'utf-8');
  const { zltLinks } = extractAllAssets(content, projectMetadata);

  return zltLinks;
}

export async function getAssetFiles(inputPath: string, projectMetadata?: Record<string, any>): Promise<string[]> {
  const content = await readFile(inputPath, 'utf-8');
  const { otherAssets } = extractAllAssets(content, projectMetadata);

  return otherAssets;
}

export async function lint(filePath: string): Promise<LintResult> {
  const errors: LintError[] = [];
  const warnings: LintWarning[] = [];

  try {
    const content = await readFile(filePath, 'utf-8');
    const expandedContent = getExpandedContent(content, { filePath });

    const lexer = new Lexer(expandedContent);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens, filePath);
    parser.parse();

    // Collect warnings from parser
    for (const w of parser.warnings) {
      warnings.push(w);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      filePath,
    };
  } catch (error) {
    const line = error instanceof Error && 'line' in error ? (error as { line: number }).line : 1;
    const column = error instanceof Error && 'column' in error ? (error as { column: number }).column : 1;
    const message = error instanceof Error ? error.message : 'Unknown error';
    let code = 'PARSE_ERROR';

    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'EACCES') {
        code = 'PERMISSION_ERROR';
      } else if (error.code === 'ENOENT') {
        code = 'FILE_NOT_FOUND';
      }
    }

    errors.push({
      line,
      column,
      message,
      code,
    });

    return {
      valid: false,
      errors,
      warnings,
      filePath,
    };
  }
}
