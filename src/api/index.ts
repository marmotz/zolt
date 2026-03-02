import * as fs from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { ExpressionEvaluator, type Value } from '../builder/evaluator/expression-evaluator';
import { SourceEvaluator } from '../builder/evaluator/source-evaluator';
import { HTMLBuilder, type InitialVariables } from '../builder/html/builder';
import { Lexer } from '../lexer/lexer';
import { Parser } from '../parser/parser';
import { ProjectGraphBuilder, type ProjectNode } from '../utils/project-graph';

export interface BuildOptions {
  type?: 'html' | 'pdf';
  variables?: Record<string, unknown>;
  projectMetadata?: Record<string, unknown>;
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
  extraVariables?: Record<string, unknown>
): { content: string; variables: Record<string, unknown> } {
  const initialVariables: Record<string, unknown> = {
    ...options?.projectMetadata,
    ...options?.variables,
    ...extraVariables,
  };

  const evaluator = new ExpressionEvaluator();
  for (const [key, value] of Object.entries(initialVariables)) {
    evaluator.setVariable(key, value as Value);
  }

  const sourceEvaluator = new SourceEvaluator(evaluator, options?.filePath, [], undefined, false, true);

  const expandedContent = sourceEvaluator.evaluate(content);

  return {
    content: expandedContent,
    variables: evaluator.getAllVariables(),
  };
}

export async function buildString(content: string, options?: BuildOptions): Promise<string> {
  const extraVariables: Record<string, unknown> = {};

  // Phase 1: Expansion (Layouts, Includes, Variables)
  const { content: expandedContent, variables: expandedVariables } = getExpandedContent(
    content,
    options,
    extraVariables
  );

  // Phase 2: Lexing & Parsing
  const lexer = new Lexer(expandedContent);
  const tokens = lexer.tokenize();

  const parser = new Parser(tokens, options?.filePath, options?.globalAbbreviations);
  const ast = parser.parse();

  // Update global abbreviations if provided
  if (options?.globalAbbreviations) {
    const currentGlobals = parser.getGlobalAbbreviations();
    if (currentGlobals) {
      for (const [key, value] of currentGlobals.entries()) {
        options.globalAbbreviations.set(key, value);
      }
    }
  }

  // Phase 3: Final Variable Merging
  const mergedVariables: Record<string, unknown> = {
    ...options?.projectMetadata,
    ...options?.variables,
    ...expandedVariables,
    ...extraVariables,
  };

  // Merge variables from metadata (after expansion, so it includes layout metadata)
  if (ast.fileMetadata) {
    Object.assign(mergedVariables, ast.fileMetadata.data);
  }

  // Ensure project title is available
  if (options?.projectMetadata?.title && !mergedVariables.projectTitle) {
    mergedVariables.projectTitle = options.projectMetadata.title;
  }
  if (options?.projectMetadata?.projectTitle && !mergedVariables.projectTitle) {
    mergedVariables.projectTitle = options.projectMetadata.projectTitle;
  }

  // Handle project graph
  let projectGraph = options?.projectGraph;
  if (!projectGraph && options?.entryPoint) {
    const graphBuilder = new ProjectGraphBuilder(options.entryPoint);
    const result = graphBuilder.build();
    projectGraph = result ? result : undefined;
  }

  // Phase 4: HTML Building
  let builder: HTMLBuilder;
  if (options?.type === 'html' || !options?.type) {
    builder = new HTMLBuilder(
      mergedVariables as InitialVariables,
      options?.assetResolver,
      projectGraph,
      options?.filePath
    );
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
  projectMetadata?: Record<string, unknown>,
  filePath?: string
): { zltLinks: string[]; otherAssets: string[] } {
  // Expansion is needed to find assets inside includes/layouts
  const { content: expandedContent } = getExpandedContent(content, { projectMetadata, filePath });
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
      if (fs.existsSync(fullPath)) {
        return true;
      }
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        break;
      }
      currentDir = parentDir;
    }

    return false;
  };

  const checkHref = (href: unknown) => {
    if (!href || typeof href !== 'string') {
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

  // Check all possible metadata keys for assets
  const checkMetadata = (data: Record<string, unknown> | undefined) => {
    if (!data) {
      return;
    }
    const keys = [
      'image',
      'icon',
      'icon_png',
      'icon_svg',
      'icon_ico',
      'icon_apple',
      'iconPng',
      'iconSvg',
      'iconIco',
      'iconApple',
      'manifest',
      'layout',
      'sidebar',
    ];
    for (const key of keys) {
      if (data[key]) {
        checkHref(data[key]);
      }
    }
  };

  checkMetadata(projectMetadata);
  if (ast.fileMetadata) {
    checkMetadata(ast.fileMetadata.data);
  }

  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') {
      return;
    }

    const n = node as Record<string, unknown>;

    switch (n.type) {
      case 'Link':
        checkHref(n.href);
        break;
      case 'Include':
        checkHref(n.path);
        break;
      case 'Image':
      case 'Video':
      case 'Audio':
      case 'Embed':
      case 'File':
        checkHref(n.src || n.href);
        break;
    }

    if (n.children && Array.isArray(n.children)) {
      n.children.forEach(visit);
    }
    if (n.rows && Array.isArray(n.rows)) {
      n.rows.forEach(visit);
    }
    if (n.cells && Array.isArray(n.cells)) {
      n.cells.forEach(visit);
    }
    if (n.header) {
      visit(n.header);
    }
  };

  visit(ast);

  return {
    zltLinks: [...new Set(zltLinks)],
    otherAssets: [...new Set(otherAssets)],
  };
}

export function extractZltLinks(content: string, projectMetadata?: Record<string, unknown>): string[] {
  return extractAllAssets(content, projectMetadata).zltLinks;
}

export async function getLinkedFiles(inputPath: string, projectMetadata?: Record<string, unknown>): Promise<string[]> {
  const content = await readFile(inputPath, 'utf-8');
  const { zltLinks } = extractAllAssets(content, projectMetadata);

  return zltLinks;
}

export async function getAssetFiles(inputPath: string, projectMetadata?: Record<string, unknown>): Promise<string[]> {
  const content = await readFile(inputPath, 'utf-8');
  const { otherAssets } = extractAllAssets(content, projectMetadata, inputPath);

  // Parse manifests to find more assets (like icons mentioned inside site.webmanifest)
  const expandedAssets = [...otherAssets];
  for (const asset of otherAssets) {
    if (asset.endsWith('.webmanifest') || asset.endsWith('manifest.json')) {
      try {
        const fullPath = path.resolve(path.dirname(inputPath), asset);
        if (fs.existsSync(fullPath)) {
          const manifestContent = await readFile(fullPath, 'utf-8');
          const manifest = JSON.parse(manifestContent);
          const manifestDir = path.dirname(asset);

          const checkIcon = (icon: unknown) => {
            if (icon && typeof icon === 'object' && 'src' in icon && typeof icon.src === 'string') {
              if (
                !icon.src.startsWith('http://') &&
                !icon.src.startsWith('https://') &&
                !icon.src.startsWith('data:')
              ) {
                // Remove leading slash for path joining
                const cleanSrc = icon.src.startsWith('/') ? icon.src.slice(1) : icon.src;
                expandedAssets.push(path.join(manifestDir, cleanSrc));
              }
            }
          };

          if (manifest.icons && Array.isArray(manifest.icons)) {
            manifest.icons.forEach(checkIcon);
          }
          if (manifest.shortcuts && Array.isArray(manifest.shortcuts)) {
            manifest.shortcuts.forEach((s: unknown) => {
              const shortcut = s as Record<string, unknown>;
              if (shortcut.icons && Array.isArray(shortcut.icons)) {
                shortcut.icons.forEach(checkIcon);
              }
            });
          }
        }
      } catch {
        // Ignore parsing errors
      }
    }
  }

  return [...new Set(expandedAssets)];
}

export async function lint(filePath: string): Promise<LintResult> {
  const errors: LintError[] = [];
  const warnings: LintWarning[] = [];

  try {
    const content = await readFile(filePath, 'utf-8');
    const { content: expandedContent } = getExpandedContent(content, { filePath });

    const lexer = new Lexer(expandedContent);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens, filePath);
    parser.parse();

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

    errors.push({ line, column, message, code });

    return {
      valid: false,
      errors,
      warnings,
      filePath,
    };
  }
}
