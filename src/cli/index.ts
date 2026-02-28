#!/usr/bin/env bun

import { serve } from 'bun';
import { existsSync, watch as watchFile } from 'fs';
import { copyFile, mkdir, readFile, stat } from 'fs/promises';
import { basename, dirname, join, relative, resolve } from 'path';
import pc from 'picocolors';
import { parseArgs } from 'util';
import { version } from '../../package.json';
import { buildFile, getAssetFiles, getLinkedFiles, lint } from '../api';
import { FileMetadataUtils } from '../utils/file-metadata';

const PROJECT_FILENAMES = ['zolt.project.yaml', 'zolt.project.yml'];

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

    const baseName = relativePath.replace(/\.zlt$/, '.html');
    outputFile = join(outputDir, baseName);
  }

  await mkdir(dirname(outputFile), { recursive: true });

  const assetResolver = (originalAssetPath: string): string => {
    const absoluteAssetPath = resolve(dirname(absoluteInput), originalAssetPath);
    const assetPathRelativeToBase = relative(baseInputDir, absoluteAssetPath);

    let destAssetAbsolutePath;
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

    let destAssetPath;
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
      if (existsSync(fullPath)) return fullPath;
      const parentDir = dirname(currentDir);
      if (parentDir === currentDir) break;
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
${dim('v' + version)}

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
  ${opt('-s')}, ${opt('--server')}              Start a development server
  ${opt('-h')}, ${opt('--host')}   ${arg('<host>')}       Development server host ${dim('(default: 127.0.0.1)')}
  ${opt('-p')}, ${opt('--port')}   ${arg('<port>')}       Development server port ${dim('(default: 1302)')}

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
    if (import.meta.main) process.exit(1);
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
    if (import.meta.main) process.exit(1);
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
        for (const f of touched) allTouchedFiles.add(f);
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
          for (const f of touched) allTouchedFiles.add(f);
        } else {
          outputFile = output;
        }
      }
    } else {
      outputFile = inputFile.replace(/\.zlt$/, '.html');
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
      for (const f of touched) allTouchedFiles.add(f);
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
      for (const f of touched) allTouchedFiles.add(f);
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
    } catch (err) {
      console.warn(`${pc.yellow('Warning:')} Asset file not found: ${fullAssetPath}`);
    }
  }

  return { touchedFiles: allTouchedFiles, outputDir };
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

    try {
      const { touchedFiles: newTouchedFiles, outputDir } = await performBuild(files, output, type);
      updateWatchers(newTouchedFiles);
      if (onRebuild) onRebuild(outputDir);
    } catch (err) {
      console.error(`${pc.red('Rebuild failed:')}`, err instanceof Error ? err.message : 'Unknown error');
    } finally {
      isBuilding = false;
      if (buildPending) {
        buildPending = false;
        rebuild();
      } else {
        console.log(`\n${pc.cyan(pc.bold('Watching for changes...'))} (Press Ctrl+C to stop)\n`);
      }
    }
  };

  const updateWatchers = (touchedFiles: Set<string>) => {
    if (projectFile) touchedFiles.add(projectFile);
    if (cwdProjectFile) touchedFiles.add(cwdProjectFile);

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
            if (buildTimeout) clearTimeout(buildTimeout);
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

  try {
    const { touchedFiles: initialTouchedFiles, outputDir } = await performBuild(files, output, type);
    updateWatchers(initialTouchedFiles);
    if (onRebuild) onRebuild(outputDir);
    console.log(`\n${pc.cyan(pc.bold('Watching for changes...'))} (Press Ctrl+C to stop)\n`);
  } catch (err) {
    console.error(`${pc.red('Initial build failed:')}`, err instanceof Error ? err.message : 'Unknown error');
  }

  process.on('SIGINT', () => {
    for (const watcher of watchers.values()) watcher.close();
    process.exit(0);
  });
}

export function printServerInfo(files: string[], output: string | undefined, host: string, port: number) {
  const entryPoint = files.length > 0 ? files[0] : '';
  const entryBasename = entryPoint.endsWith('.zlt') ? basename(entryPoint.replace(/\.zlt$/, '.html')) : 'index.html';
  const urlPath = output && (output.endsWith('.html') || output.endsWith('.pdf')) ? basename(output) : entryBasename;

  console.log(`\n${pc.bold(pc.green('Zolt Development Server'))}`);
  console.log(`${pc.cyan('URL:')} http://${host}:${port}/${urlPath}`);
  console.log(`${pc.yellow('Notice:')} This server is for development only. Do not use in production.`);
}

export async function handleServer(
  files: string[],
  output: string | undefined,
  host: string = '127.0.0.1',
  port: number = 1302
) {
  let serverInstance: any = null;

  const startServer = (outputDir: string) => {
    if (serverInstance) {
      serverInstance.publish('reload', 'reload');
      printServerInfo(files, output, host, port);

      return;
    }

    serverInstance = serve({
      port,
      hostname: host,
      fetch(req, server) {
        if (server.upgrade(req)) return;

        const url = new URL(req.url);
        let pathname = url.pathname;
        if (pathname === '/') pathname = '/index.html';

        const filePath = join(outputDir, pathname);
        const file = Bun.file(filePath);

        if (filePath.endsWith('.html')) {
          return file
            .text()
            .then((text) => {
              const injected = text.replace(
                '</body>',
                `<script>
                (function() {
                  const ws = new WebSocket('ws://' + location.host);
                  ws.onmessage = (event) => {
                    if (event.data === 'reload') {
                      console.log('Zolt: Rebuild detected, reloading...');
                      location.reload();
                    }
                  };
                  ws.onclose = () => {
                    console.log('Zolt: Server disconnected. Retrying connection...');
                    const retry = setInterval(() => {
                      const nextWs = new WebSocket('ws://' + location.host);
                      nextWs.onopen = () => {
                        clearInterval(retry);
                        location.reload();
                      };
                    }, 1000);
                  };
                })();
              </script></body>`
              );
              console.log(
                `${pc.dim(new Date().toISOString())} ${pc.cyan(req.method)} ${pc.white(url.pathname)} - ${pc.green(200)}`
              );

              return new Response(injected, {
                headers: { 'Content-Type': 'text/html' },
              });
            })
            .catch(() => {
              console.log(
                `${pc.dim(new Date().toISOString())} ${pc.cyan(req.method)} ${pc.white(url.pathname)} - ${pc.red(404)}`
              );

              return new Response('Not Found', { status: 404 });
            });
        }

        return file.exists().then((exists) => {
          if (!exists) {
            console.log(
              `${pc.dim(new Date().toISOString())} ${pc.cyan(req.method)} ${pc.white(url.pathname)} - ${pc.red(404)}`
            );

            return new Response('Not Found', { status: 404 });
          }
          console.log(
            `${pc.dim(new Date().toISOString())} ${pc.cyan(req.method)} ${pc.white(url.pathname)} - ${pc.green(200)}`
          );

          return new Response(file);
        });
      },
      websocket: {
        open(ws) {
          ws.subscribe('reload');
        },
        message() {},
      },
    });

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
    if (import.meta.main) process.exit(1);
    throw new Error('No files specified for building');
  }

  if (server) {
    if (type !== 'html') {
      console.error(`${pc.red('Error:')} Server mode is only available for HTML output`);
      if (import.meta.main) process.exit(1);
      throw new Error('Server mode only available for HTML');
    }
    await handleServer(files, output, host, port);

    return;
  }

  if (watch) {
    await handleWatch(files, output, type);

    return;
  }

  try {
    await performBuild(files, output, type);
    console.log(`\n${pc.green(pc.bold('Build successful!'))}`);
  } catch (error) {
    console.error(`${pc.red('Build error:')}`, error instanceof Error ? error.message : 'Unknown error');
    if (import.meta.main) process.exit(1);
    throw error;
  }
}

export async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printHelp();
    if (import.meta.main) process.exit(0);

    return;
  }

  const command = args[0];

  if (command === '-v' || command === '--version') {
    console.log(`zolt v${version}`);
    if (import.meta.main) process.exit(0);

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
      if (import.meta.main) process.exit(1);
      throw new Error(`Unknown command: ${command}`);
  }
}

if (import.meta.main) {
  main();
}
