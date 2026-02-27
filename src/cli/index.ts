#!/usr/bin/env bun

import { existsSync, watch as watchFile } from 'fs';
import { copyFile, mkdir, readFile, stat } from 'fs/promises';
import { basename, dirname, join, relative, resolve } from 'path';
import pc from 'picocolors';
import { parseArgs } from 'util';
import { version } from '../../package.json';
import { buildFile, getAssetFiles, getLinkedFiles, lint } from '../api';
import { FileMetadataUtils, KNOWN_METADATA_KEYS } from '../utils/file-metadata';

const PROJECT_FILENAMES = ['zolt.project.yaml', 'zolt.project.yml'];

async function findProjectFile(baseDir: string): Promise<string | null> {
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

async function loadProjectMetadata(baseInputDir: string): Promise<Record<string, any>> {
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

  // Filter keys
  const filtered: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (KNOWN_METADATA_KEYS.has(key)) {
      filtered[key] = value;
    }
  }

  return filtered;
}

async function buildFileWithDeps(
  inputFile: string,
  outputDir: string,
  type: 'html' | 'pdf',
  visited: Set<string>,
  baseInputDir: string,
  customOutputFile?: string,
  projectMetadata: Record<string, any> = {},
  entryPoint?: string
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

    try {
      const assetStat = await stat(fullAssetPath);
      if (assetStat.isFile()) {
        touchedFiles.add(fullAssetPath);
        await mkdir(dirname(destAssetPath), { recursive: true });

        if (fullAssetPath !== resolve(destAssetPath)) {
          await copyFile(fullAssetPath, destAssetPath);
        }
      }
    } catch {
      console.warn(`${pc.yellow('Warning:')} Asset file not found: ${fullAssetPath}`);
    }
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
          entryPoint
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

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printHelp();
    process.exit(0);
  }

  const command = args[0];

  if (command === '-v' || command === '--version') {
    console.log(`zolt v${version}`);
    process.exit(0);
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
      process.exit(1);
  }
}

function printHelp() {
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
  ${opt('--help')}, ${opt('-h')}             Show this help message

${pc.bold('Lint Options:')}
  ${opt('--format')} ${arg('<json|text>')}   Output format ${dim('(default: text)')}
  ${opt('--fix')}                  Auto-fix fixable issues

${pc.bold('Build Options:')}
  ${opt('-o')}, ${opt('--output')} ${arg('<path>')}    Output file or directory
  ${opt('-t')}, ${opt('--type')}   ${arg('<html>')}    Output type ${dim('(default: html)')}
  ${opt('-w')}, ${opt('--watch')}            Watch for file changes and rebuild

${pc.bold('Examples:')}
  ${dim('$')} zolt ${cmd('lint')} document.zlt
  ${dim('$')} zolt ${cmd('lint')} *.zlt ${opt('--format')} json
  ${dim('$')} zolt ${cmd('build')} document.zlt ${opt('-o')} output.html
  ${dim('$')} zolt ${cmd('build')} *.zlt ${opt('-o')} dist/ ${opt('-t')} html
`);
}

async function handleLint(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    options: {
      format: {
        type: 'string',
        default: 'text',
        short: 'f',
      },
      fix: {
        type: 'boolean',
        default: false,
      },
    },
    allowPositionals: true,
  });

  const files = positionals;

  if (files.length === 0) {
    console.error(`${pc.red('Error:')} No files specified for linting`);
    process.exit(1);
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

  process.exit(hasErrors ? 1 : 0);
}

async function performBuild(files: string[], output: string | undefined, type: 'html' | 'pdf'): Promise<Set<string>> {
  const allTouchedFiles = new Set<string>();
  const visited = new Set<string>();

  // Determine the base input directory to preserve structure
  let baseInputDir = '';
  if (files.length > 0) {
    const absoluteFiles = files.map((f) => resolve(f));
    baseInputDir = dirname(absoluteFiles[0]);

    // Find common parent directory
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
      // If output has no extension, assume it's a directory
      if (!output.endsWith('.html') && !output.endsWith('.pdf')) {
        await mkdir(output, { recursive: true });
        const touched = await buildFileWithDeps(
          resolve(inputFile),
          output,
          type,
          visited,
          baseInputDir,
          undefined,
          projectMetadata,
          entryPoint
        );
        for (const f of touched) allTouchedFiles.add(f);

        return allTouchedFiles;
      }

      const outputStat = await stat(output).catch(() => null);
      if (outputStat?.isDirectory()) {
        const touched = await buildFileWithDeps(
          resolve(inputFile),
          output,
          type,
          visited,
          baseInputDir,
          undefined,
          projectMetadata,
          entryPoint
        );
        for (const f of touched) allTouchedFiles.add(f);

        return allTouchedFiles;
      } else {
        outputFile = output;
      }
    } else {
      outputFile = inputFile.replace(/\.zlt$/, '.html');
    }

    const resolvedOutputFile = resolve(outputFile);
    const outputDir = dirname(resolvedOutputFile);
    const touched = await buildFileWithDeps(
      resolve(inputFile),
      outputDir,
      type,
      visited,
      baseInputDir,
      resolvedOutputFile,
      projectMetadata,
      entryPoint
    );
    for (const f of touched) allTouchedFiles.add(f);
  } else {
    if (!output) {
      throw new Error('Output directory required for multiple files');
    }

    await mkdir(output, { recursive: true });
    const outputStat = await stat(output).catch(() => null);
    if (!outputStat?.isDirectory()) {
      throw new Error('Output must be a directory for multiple files');
    }

    for (const inputFile of files) {
      const touched = await buildFileWithDeps(
        resolve(inputFile),
        output,
        type,
        visited,
        baseInputDir,
        undefined,
        projectMetadata,
        entryPoint
      );
      for (const f of touched) allTouchedFiles.add(f);
    }
  }

  return allTouchedFiles;
}

async function handleWatch(files: string[], output: string | undefined, type: 'html' | 'pdf') {
  console.log(`\n${pc.cyan(pc.bold('Watching for changes...'))} (Press Ctrl+C to stop)`);

  const watchers = new Map<string, any>();
  let buildTimeout: any = null;
  let isBuilding = false;

  // Find zolt.project.yaml to watch it
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

  const updateWatchers = (touchedFiles: Set<string>) => {
    // Add project metadata files to touched files so they are watched
    if (projectFile) {
      touchedFiles.add(projectFile);
    }
    if (cwdProjectFile) {
      touchedFiles.add(cwdProjectFile);
    }

    // Files that are currently being watched but are no longer in the dependency graph
    for (const [filePath, watcher] of watchers) {
      if (!touchedFiles.has(filePath)) {
        watcher.close();
        watchers.delete(filePath);
      }
    }

    // New files in the dependency graph
    for (const filePath of touchedFiles) {
      if (!watchers.has(filePath)) {
        try {
          const watcher = watchFile(filePath, () => {
            if (buildTimeout) clearTimeout(buildTimeout);
            buildTimeout = setTimeout(async () => {
              if (isBuilding) {
                return;
              }
              isBuilding = true;
              console.log(`\n${pc.yellow('Change detected, rebuilding...')}`);
              try {
                const newTouchedFiles = await performBuild(files, output, type);
                updateWatchers(newTouchedFiles);
              } catch (err) {
                console.error(`${pc.red('Rebuild failed:')}`, err instanceof Error ? err.message : 'Unknown error');
              } finally {
                isBuilding = false;
                console.log(`\n${pc.cyan('Waiting for changes...')}`);
              }
            }, 20);
          });

          watcher.on('error', () => {
            watchers.delete(filePath);
            watcher.close();
          });

          watchers.set(filePath, watcher);
        } catch {
          // Ignore files that cannot be watched (e.g., deleted during build)
        }
      }
    }
  };

  try {
    const initialTouchedFiles = await performBuild(files, output, type);
    updateWatchers(initialTouchedFiles);
    console.log(`\n${pc.cyan('Waiting for changes...')}`);
  } catch (err) {
    console.error(`${pc.red('Initial build failed:')}`, err instanceof Error ? err.message : 'Unknown error');
    updateWatchers(new Set(files.map((f) => resolve(f))));
  }

  // Handle termination
  process.on('SIGINT', () => {
    for (const watcher of watchers.values()) watcher.close();
    process.exit(0);
  });
}

async function handleBuild(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    options: {
      output: {
        type: 'string',
        short: 'o',
      },
      type: {
        type: 'string',
        short: 't',
        default: 'html',
      },
      watch: {
        type: 'boolean',
        short: 'w',
        default: false,
      },
    },
    allowPositionals: true,
  });

  const files = positionals;
  const output = values.output as string | undefined;
  const type = values.type as 'html' | 'pdf';
  const watch = values.watch as boolean;

  if (files.length === 0) {
    console.error(`${pc.red('Error:')} No files specified for building`);
    process.exit(1);
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
    process.exit(1);
  }
}

main();
