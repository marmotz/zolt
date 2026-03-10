#!/usr/bin/env node

import { existsSync, watch as watchFile } from 'node:fs';
import { copyFile, mkdir, readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import pc from 'picocolors';
import { version } from '../../package.json';
import { buildFile, getAssetFiles, getLinkedFiles, lint } from '../api';
import { FileMetadataUtils } from '../utils/file-metadata';

const PROJECT_FILENAMES = ['zolt.yaml', 'zolt.yml'];

export async function findProjectFile(baseDir: string): Promise<string | null> {
  for (const filename of PROJECT_FILENAMES) {
    const filePath = join(baseDir, filename);
    try {
      await stat(filePath);

      return filePath;
    } catch {
      // File doesn't exist, try next
    }
  }

  return null;
}

export async function loadProjectMetadata(baseInputDir: string): Promise<Record<string, any>> {
  const projectFile = await findProjectFile(baseInputDir);
  let data: Record<string, any> = {};

  if (projectFile) {
    try {
      const content = await readFile(projectFile, 'utf-8');
      data = FileMetadataUtils.parse(content);
      console.log(`${pc.cyan('Info:')} Loaded project metadata from ${projectFile}`);
    } catch {
      // Ignore read errors
    }
  }

  // If not found in baseInputDir, try current working directory
  if (Object.keys(data).length === 0 && baseInputDir !== process.cwd()) {
    const cwdProjectFile = await findProjectFile(process.cwd());
    if (cwdProjectFile) {
      try {
        const content = await readFile(cwdProjectFile, 'utf-8');
        data = FileMetadataUtils.parse(content);
        console.log(`${pc.cyan('Info:')} Loaded project metadata from ${cwdProjectFile}`);
      } catch {
        // No project file found
      }
    }
  }

  return data;
}

export async function buildFileWithDeps(
  inputFile: string,
  outputDir: string,
  type: 'html' | 'pdf',
  visited: Set<string>,
  baseInputDir: string,
  customOutputFile?: string,
  projectMetadata: Record<string, any> = {},
  entryPoint?: string,
  assetsToCopy: Map<string, string> = new Map()
): Promise<Set<string>> {
  const absoluteInput = resolve(inputFile);
  const touchedFiles = new Set<string>();

  if (visited.has(absoluteInput)) {
    return touchedFiles;
  }
  visited.add(absoluteInput);
  touchedFiles.add(absoluteInput);

  let outputFile: string;
  if (customOutputFile) {
    outputFile = customOutputFile;
  } else {
    const relativePath = absoluteInput.startsWith(baseInputDir)
      ? absoluteInput.slice(baseInputDir.length).replace(/^[/\\]+/, '')
      : basename(absoluteInput);

    const extension = type === 'pdf' ? '.pdf' : '.html';
    const baseName = relativePath.replace(/\.zlt$/, extension);
    outputFile = join(outputDir, baseName);
  }

  await mkdir(dirname(outputFile), { recursive: true });

  const assetResolver = (originalAssetPath: string): string => {
    const absoluteAssetPath = resolve(dirname(absoluteInput), originalAssetPath);
    const assetPathRelativeToBase = relative(baseInputDir, absoluteAssetPath);

    let destAssetAbsolutePath: string;
    if (assetPathRelativeToBase.startsWith('..')) {
      const oneLevelUp = dirname(baseInputDir);
      const pathFromOneLevelUp = relative(oneLevelUp, absoluteAssetPath);
      destAssetAbsolutePath = resolve(outputDir, pathFromOneLevelUp);
    } else {
      destAssetAbsolutePath = resolve(outputDir, assetPathRelativeToBase);
    }

    const newRelativePathForHtml = relative(dirname(outputFile), destAssetAbsolutePath);

    return newRelativePathForHtml.replace(/\\/g, '/');
  };

  await buildFile(absoluteInput, outputFile, { type, assetResolver, projectMetadata, entryPoint });
  console.log(`${pc.green('Built:')} ${outputFile}`);

  const inputDir = dirname(absoluteInput);

  // Handle other assets (images, etc.)
  const assets = await getAssetFiles(absoluteInput, projectMetadata);
  for (const asset of assets) {
    const fullAssetPath = resolve(inputDir, asset);
    const assetPathRelativeToBase = relative(baseInputDir, fullAssetPath);

    let destAssetPath: string;
    if (assetPathRelativeToBase.startsWith('..')) {
      const oneLevelUp = dirname(baseInputDir);
      const pathFromOneLevelUp = relative(oneLevelUp, fullAssetPath);
      destAssetPath = resolve(outputDir, pathFromOneLevelUp);
    } else {
      destAssetPath = resolve(outputDir, assetPathRelativeToBase);
    }

    assetsToCopy.set(fullAssetPath, destAssetPath);
  }

  // Handle linked .zlt files recursively
  const linkedFiles = await getLinkedFiles(absoluteInput, projectMetadata);

  const findBubblingFile = (startDir: string, fileName: string): string | null => {
    let currentDir = startDir;
    while (true) {
      const fullPath = resolve(currentDir, fileName);
      if (existsSync(fullPath)) {
        return fullPath;
      }
      const parentDir = dirname(currentDir);
      if (parentDir === currentDir) {
        break;
      }
      currentDir = parentDir;
    }

    return null;
  };

  for (const linkedFile of linkedFiles) {
    let fullLinkedPath: string;
    if (linkedFile.startsWith('_layout') || linkedFile.startsWith('_template')) {
      const bubbledPath = findBubblingFile(inputDir, linkedFile);
      fullLinkedPath = bubbledPath || resolve(inputDir, linkedFile);
    } else {
      fullLinkedPath = resolve(inputDir, linkedFile);
    }

    try {
      const linkedStat = await stat(fullLinkedPath);
      if (linkedStat.isFile()) {
        const subDeps = await buildFileWithDeps(
          fullLinkedPath,
          outputDir,
          type,
          visited,
          baseInputDir,
          undefined,
          projectMetadata,
          entryPoint,
          assetsToCopy
        );
        for (const dep of subDeps) {
          touchedFiles.add(dep);
        }
      }
    } catch {
      console.warn(`${pc.yellow('Warning:')} Linked file not found: ${fullLinkedPath}`);
    }
  }

  return touchedFiles;
}

export function printHelp() {
  const cmd = pc.cyan;
  const opt = pc.magenta;
  const arg = pc.yellow;
  const dim = pc.dim;

  console.log(`
${pc.bold(pc.green('Zolt'))} - ${dim('The high-voltage successor to Markdown')}
${dim(`v${version}`)}

${pc.bold('Usage:')}
  zolt ${arg('<command>')} ${dim('[options]')}

${pc.bold('Commands:')}
  ${cmd('lint')} ${arg('<files...>')}
    Analyze .zlt files for errors and warnings
    
  ${cmd('build')} ${arg('<files...>')}
    Compile .zlt files to output formats
    
  ${cmd('version')}
    Show version information

${pc.bold('Options:')}
  ${opt('-h')}, ${opt('--help')}                Show this help message
  ${opt('-v')}, ${opt('--version')}             Show version information

${pc.bold('Lint Options:')}
  ${opt('-f')}, ${opt('--format')} ${arg('<text|json>')}  Output format ${dim('(default: text)')}

${pc.bold('Build Options:')}
  ${opt('-o')}, ${opt('--output')} ${arg('<path>')}       Output file or directory
  ${opt('-t')}, ${opt('--type')}   ${arg('<html|pdf>')}   Output type ${dim('(default: html)')}
  ${opt('-w')}, ${opt('--watch')}               Watch for file changes and rebuild
  ${opt('-s')}, ${opt('--server')}              Start a live preview server
  ${opt('-h')}, ${opt('--host')}   ${arg('<host>')}       Live preview host ${dim('(default: 127.0.0.1)')}
  ${opt('-p')}, ${opt('--port')}   ${arg('<port>')}       Live preview port ${dim('(default: 1302)')}

${pc.bold('Examples:')}
  ${dim('$')} zolt ${cmd('lint')} document.zlt
  ${dim('$')} zolt ${cmd('lint')} *.zlt ${opt('--format')} json
  ${dim('$')} zolt ${cmd('build')} document.zlt ${opt('-o')} output.html
  ${dim('$')} zolt ${cmd('build')} *.zlt ${opt('-o')} dist/ ${opt('-t')} html
  ${dim('$')} zolt ${cmd('build')} document.zlt ${opt('--server')} ${opt('--port')} 3000
`);
}

export async function handleLint(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    options: {
      format: {
        type: 'string',
        default: 'text',
        short: 'f',
      },
    },
    allowPositionals: true,
  });

  const files = positionals;

  if (files.length === 0) {
    console.error(`${pc.red('Error:')} No files specified for linting`);
    if (import.meta.main) {
      process.exit(1);
    }
    throw new Error('No files specified for linting');
  }

  const format = values.format as 'json' | 'text';
  let hasErrors = false;

  for (const file of files) {
    try {
      const result = await lint(file);

      if (format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`\n${pc.bold('File:')} ${pc.cyan(file)}`);

        if (result.errors.length > 0) {
          hasErrors = true;
          console.log(`  ${pc.red('Errors:')}`);
          for (const error of result.errors) {
            console.log(`    ${pc.dim(`Line ${error.line}:${error.column}`)} - ${error.message}`);
          }
        }

        if (result.warnings.length > 0) {
          console.log(`  ${pc.yellow('Warnings:')}`);
          for (const warning of result.warnings) {
            console.log(`    ${pc.dim(`Line ${warning.line}:${warning.column}`)} - ${warning.message}`);
          }
        }

        if (result.errors.length === 0 && result.warnings.length === 0) {
          console.log(`  ${pc.green('✓ No issues found')}`);
        }
      }
    } catch (error) {
      hasErrors = true;
      if (format === 'json') {
        console.log(
          JSON.stringify(
            {
              valid: false,
              filePath: file,
              errors: [
                {
                  line: 0,
                  column: 0,
                  message: error instanceof Error ? error.message : 'Unknown error',
                  code: 'RUNTIME_ERROR',
                },
              ],
              warnings: [],
            },
            null,
            2
          )
        );
      } else {
        console.error(
          `${pc.red(`Error processing ${file}:`)}`,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  }

  if (hasErrors) {
    if (import.meta.main) {
      process.exit(1);
    }
    throw new Error('Lint failed');
  }
}

export async function performBuild(
  files: string[],
  output: string | undefined,
  type: 'html' | 'pdf'
): Promise<{ touchedFiles: Set<string>; outputDir: string }> {
  const allTouchedFiles = new Set<string>();
  const visited = new Set<string>();
  const assetsToCopy = new Map<string, string>();
  let outputDir = '';

  let baseInputDir = '';
  if (files.length > 0) {
    const absoluteFiles = files.map((f) => resolve(f));
    baseInputDir = dirname(absoluteFiles[0]);
    for (let i = 1; i < absoluteFiles.length; i++) {
      while (!absoluteFiles[i].startsWith(baseInputDir) && baseInputDir !== '/') {
        baseInputDir = dirname(baseInputDir);
      }
    }
  }

  const projectMetadata = await loadProjectMetadata(baseInputDir);
  const entryPoint = files.length > 0 ? resolve(files[0]) : undefined;

  if (files.length === 1) {
    const inputFile = files[0];
    let outputFile = output;

    if (output) {
      if (!output.endsWith('.html') && !output.endsWith('.pdf')) {
        outputDir = resolve(output);
        await mkdir(outputDir, { recursive: true });
        const touched = await buildFileWithDeps(
          resolve(inputFile),
          outputDir,
          type,
          visited,
          baseInputDir,
          undefined,
          projectMetadata,
          entryPoint,
          assetsToCopy
        );
        for (const f of touched) {
          allTouchedFiles.add(f);
        }
      } else {
        const outputStat = await stat(output).catch(() => null);
        if (outputStat?.isDirectory()) {
          outputDir = resolve(output);
          const touched = await buildFileWithDeps(
            resolve(inputFile),
            outputDir,
            type,
            visited,
            baseInputDir,
            undefined,
            projectMetadata,
            entryPoint,
            assetsToCopy
          );
          for (const f of touched) {
            allTouchedFiles.add(f);
          }
        } else {
          outputFile = output;
        }
      }
    } else {
      const extension = type === 'pdf' ? '.pdf' : '.html';
      outputFile = inputFile.replace(/\.zlt$/, extension);
    }

    if (!outputDir) {
      const resolvedOutputFile = resolve(outputFile!);
      outputDir = dirname(resolvedOutputFile);
      const touched = await buildFileWithDeps(
        resolve(inputFile),
        outputDir,
        type,
        visited,
        baseInputDir,
        resolvedOutputFile,
        projectMetadata,
        entryPoint,
        assetsToCopy
      );
      for (const f of touched) {
        allTouchedFiles.add(f);
      }
    }
  } else {
    if (!output) {
      throw new Error('Output directory required for multiple files');
    }

    outputDir = resolve(output);
    const existingStat = await stat(outputDir).catch(() => null);
    if (existingStat && !existingStat.isDirectory()) {
      throw new Error('Output must be a directory for multiple files');
    }
    await mkdir(outputDir, { recursive: true });

    for (const inputFile of files) {
      const touched = await buildFileWithDeps(
        resolve(inputFile),
        outputDir,
        type,
        visited,
        baseInputDir,
        undefined,
        projectMetadata,
        entryPoint,
        assetsToCopy
      );
      for (const f of touched) {
        allTouchedFiles.add(f);
      }
    }
  }

  for (const [fullAssetPath, destAssetPath] of assetsToCopy.entries()) {
    try {
      const assetStat = await stat(fullAssetPath);
      if (assetStat.isFile()) {
        allTouchedFiles.add(fullAssetPath);
        await mkdir(dirname(destAssetPath), { recursive: true });

        if (fullAssetPath !== resolve(destAssetPath)) {
          await copyFile(fullAssetPath, destAssetPath);
          const relSrc = relative(process.cwd(), fullAssetPath);
          const relDest = relative(process.cwd(), destAssetPath);
          console.log(`${pc.blue('Copied:')} ${relSrc} ${pc.dim('->')} ${relDest}`);
        }
      }
    } catch (_err) {
      console.warn(`${pc.yellow('Warning:')} Asset file not found: ${fullAssetPath}`);
    }
  }

  return { touchedFiles: allTouchedFiles, outputDir };
}

export function printWatchingMessage(withExtraPadding: boolean = false) {
  const message = `\n${pc.cyan(pc.bold('Watching for changes...'))} (Press Ctrl+C to stop)`;
  if (withExtraPadding) {
    console.log(`${message}\n`);
  } else {
    console.log(message);
  }
}

export async function handleWatch(
  files: string[],
  output: string | undefined,
  type: 'html' | 'pdf',
  onRebuild?: (outputDir: string) => void
) {
  let isBuilding = false;
  let buildPending = false;
  let buildTimeout: any = null;
  const watchers = new Map<string, any>();

  let baseInputDir = '';
  if (files.length > 0) {
    const absoluteFiles = files.map((f) => resolve(f));
    baseInputDir = dirname(absoluteFiles[0]);
    for (let i = 1; i < absoluteFiles.length; i++) {
      while (!absoluteFiles[i].startsWith(baseInputDir) && baseInputDir !== '/') {
        baseInputDir = dirname(baseInputDir);
      }
    }
  }
  const projectFile = await findProjectFile(baseInputDir);
  const cwdProjectFile = await findProjectFile(process.cwd());

  const rebuild = async () => {
    if (isBuilding) {
      buildPending = true;

      return;
    }

    isBuilding = true;
    console.log(`\n${pc.cyan(pc.bold('Change detected, rebuilding...'))}`);
    const startTime = performance.now();

    try {
      const { touchedFiles: newTouchedFiles, outputDir } = await performBuild(files, output, type);
      const duration = (performance.now() - startTime).toFixed(0);
      console.log(`${pc.green(pc.bold('Build successful!'))} ${pc.dim(`(${duration}ms)`)}`);
      updateWatchers(newTouchedFiles);
      if (onRebuild) {
        onRebuild(outputDir);
      }
    } catch (err) {
      console.error(`${pc.red('Rebuild failed:')}`, err instanceof Error ? err.message : 'Unknown error');
    } finally {
      isBuilding = false;
      if (buildPending) {
        buildPending = false;
        rebuild();
      } else {
        printWatchingMessage(!!onRebuild);
      }
    }
  };

  const updateWatchers = (touchedFiles: Set<string>) => {
    if (projectFile) {
      touchedFiles.add(projectFile);
    }
    if (cwdProjectFile) {
      touchedFiles.add(cwdProjectFile);
    }

    for (const [filePath, watcher] of watchers) {
      if (!touchedFiles.has(filePath)) {
        watcher.close();
        watchers.delete(filePath);
      }
    }

    for (const filePath of touchedFiles) {
      if (!watchers.has(filePath)) {
        try {
          const watcher = watchFile(filePath, () => {
            if (buildTimeout) {
              clearTimeout(buildTimeout);
            }
            buildTimeout = setTimeout(rebuild, 20);
          });

          watcher.on('error', () => {
            watchers.delete(filePath);
            watcher.close();
          });

          watchers.set(filePath, watcher);
        } catch {
          // Ignore
        }
      }
    }
  };

  const startTime = performance.now();
  try {
    const { touchedFiles: initialTouchedFiles, outputDir } = await performBuild(files, output, type);
    const duration = (performance.now() - startTime).toFixed(0);
    console.log(`\n${pc.green(pc.bold('Build successful!'))} ${pc.dim(`(${duration}ms)`)}`);
    updateWatchers(initialTouchedFiles);
    if (onRebuild) {
      onRebuild(outputDir);
    }
    printWatchingMessage(!!onRebuild);
  } catch (err) {
    console.error(`${pc.red('Initial build failed:')}`, err instanceof Error ? err.message : 'Unknown error');
  }

  process.on('SIGINT', () => {
    for (const watcher of watchers.values()) {
      watcher.close();
    }
    process.exit(0);
  });
}

export function printServerInfo(files: string[], output: string | undefined, host: string, port: number) {
  const entryPoint = files.length > 0 ? files[0] : '';
  const entryBasename = entryPoint.endsWith('.zlt') ? basename(entryPoint.replace(/\.zlt$/, '.html')) : 'index.html';
  const urlPath = output && (output.endsWith('.html') || output.endsWith('.pdf')) ? basename(output) : entryBasename;

  console.log(`\n${pc.bold(pc.green('Zolt Live Preview'))}`);
  console.log(`${pc.cyan('URL:')} http://${host}:${port}/${urlPath}`);
  console.log(`${pc.yellow('Notice:')} This server is for preview only. Do not use in production.`);
}

export async function handleServer(
  files: string[],
  output: string | undefined,
  host: string = '127.0.0.1',
  port: number = 1302
) {
  let serverInstance: any = null;
  const sseClients = new Set<any>();

  const startServer = (outputDir: string) => {
    if (serverInstance) {
      for (const res of sseClients) {
        res.write('data: reload\n\n');
      }
      printServerInfo(files, output, host, port);

      return;
    }

    serverInstance = createServer(async (req, res) => {
      const url = new URL(req.url || '/', `http://${host}:${port}`);

      // SSE Endpoint
      if (url.pathname === '/zolt-events') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        sseClients.add(res);
        req.on('close', () => sseClients.delete(res));

        return;
      }

      let pathname = url.pathname;
      if (pathname === '/') {
        pathname = '/index.html';
      }

      const filePath = join(outputDir, pathname);

      try {
        const fileStat = await stat(filePath);
        if (!fileStat.isFile()) {
          res.writeHead(404);
          res.end('Not Found');

          return;
        }

        const content = await readFile(filePath);

        if (filePath.endsWith('.html')) {
          const injected = content.toString().replace(
            '</body>',
            `<script>
                (function() {
                  const eventSource = new EventSource('/zolt-events');
                  eventSource.onmessage = (event) => {
                    if (event.data === 'reload') {
                      console.log('Zolt: Rebuild detected, reloading...');
                      location.reload();
                    }
                  };
                  eventSource.onerror = () => {
                    console.log('Zolt: Server disconnected. Retrying connection...');
                    setTimeout(() => location.reload(), 1000);
                  };
                })();
              </script></body>`
          );

          console.log(
            `${pc.dim(new Date().toISOString())} ${pc.cyan(req.method)} ${pc.white(url.pathname)} - ${pc.green(200)}`
          );
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(injected);
        } else {
          // Simple mime type detection
          const ext = pathname.split('.').pop();
          const mimeTypes: Record<string, string> = {
            js: 'application/javascript',
            css: 'text/css',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            svg: 'image/svg+xml',
            json: 'application/json',
            pdf: 'application/pdf',
          };

          console.log(
            `${pc.dim(new Date().toISOString())} ${pc.cyan(req.method)} ${pc.white(url.pathname)} - ${pc.green(200)}`
          );
          res.writeHead(200, { 'Content-Type': mimeTypes[ext || ''] || 'application/octet-stream' });
          res.end(content);
        }
      } catch {
        console.log(
          `${pc.dim(new Date().toISOString())} ${pc.cyan(req.method)} ${pc.white(url.pathname)} - ${pc.red(404)}`
        );
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    serverInstance.listen(port, host);
    printServerInfo(files, output, host, port);
  };

  await handleWatch(files, output, 'html', (outputDir) => {
    startServer(outputDir);
  });
}

export async function handleBuild(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    options: {
      output: { type: 'string', short: 'o' },
      type: { type: 'string', short: 't', default: 'html' },
      watch: { type: 'boolean', short: 'w', default: false },
      server: { type: 'boolean', short: 's', default: false },
      host: { type: 'string', short: 'h', default: '127.0.0.1' },
      port: { type: 'string', short: 'p', default: '1302' },
    },
    allowPositionals: true,
  });

  const files = positionals;
  const output = values.output as string | undefined;
  const type = values.type as 'html' | 'pdf';
  const watch = values.watch as boolean;
  const server = values.server as boolean;
  const host = values.host as string;
  const port = parseInt(values.port as string, 10);

  if (files.length === 0) {
    console.error(`${pc.red('Error:')} No files specified for building`);
    if (import.meta.main) {
      process.exit(1);
    }
    throw new Error('No files specified for building');
  }

  if (server) {
    if (type === 'pdf') {
      console.error(`${pc.red('Error:')} Server mode is only available for HTML output.`);
      console.error('PDF generation does not support live preview via a web server.');
      if (import.meta.main || process.argv[1].endsWith('src/cli.ts')) {
        process.exit(1);
      }
      throw new Error('Server mode only available for HTML');
    }
    await handleServer(files, output, host, port);

    return;
  }

  if (watch) {
    await handleWatch(files, output, type);

    return;
  }

  const startTime = performance.now();
  try {
    await performBuild(files, output, type);
    const duration = (performance.now() - startTime).toFixed(0);
    console.log(`\n${pc.green(pc.bold('Build successful!'))} ${pc.dim(`(${duration}ms)`)}`);
  } catch (error) {
    console.error(`${pc.red('Build error:')}`, error instanceof Error ? error.message : 'Unknown error');
    if (import.meta.main) {
      process.exit(1);
    }
    throw error;
  }
}

export async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printHelp();
    if (import.meta.main) {
      process.exit(0);
    }

    return;
  }

  const command = args[0];

  if (command === '-v' || command === '--version') {
    console.log(`zolt v${version}`);
    if (import.meta.main) {
      process.exit(0);
    }

    return;
  }

  switch (command) {
    case 'lint':
      await handleLint(args.slice(1));
      break;
    case 'build':
      await handleBuild(args.slice(1));
      break;
    case 'version':
      console.log(`zolt v${version}`);
      break;
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      console.error(`${pc.red('Error:')} Unknown command: ${command}`);
      printHelp();
      if (import.meta.main) {
        process.exit(1);
      }
      throw new Error(`Unknown command: ${command}`);
  }
}

if (import.meta.main) {
  main();
}
