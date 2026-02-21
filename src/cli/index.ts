#!/usr/bin/env bun

import { copyFile, mkdir, stat } from 'fs/promises';
import { basename, dirname, join, resolve } from 'path';
import { parseArgs } from 'util';
import { version } from '../../package.json';
import { buildFile, getAssetFiles, getLinkedFiles, lint } from '../api';

async function buildFileWithDeps(
  inputFile: string,
  outputDir: string,
  type: 'html' | 'pdf',
  visited: Set<string>,
  customOutputFile?: string
): Promise<void> {
  const absoluteInput = resolve(inputFile);

  if (visited.has(absoluteInput)) {
    return;
  }
  visited.add(absoluteInput);

  let outputFile: string;
  if (customOutputFile) {
    outputFile = customOutputFile;
  } else {
    const baseName = basename(absoluteInput).replace(/\.zlt$/, '.html');
    outputFile = join(outputDir, baseName);
  }

  await buildFile(absoluteInput, outputFile, { type });
  console.log(`Built: ${outputFile}`);

  const inputDir = dirname(absoluteInput);

  // Handle other assets (images, etc.)
  const assets = await getAssetFiles(absoluteInput);
  for (const asset of assets) {
    const fullAssetPath = resolve(inputDir, asset);
    const destAssetPath = join(outputDir, asset);

    try {
      const assetStat = await stat(fullAssetPath);
      if (assetStat.isFile()) {
        await mkdir(dirname(destAssetPath), { recursive: true });
        await copyFile(fullAssetPath, destAssetPath);
        // console.log(`Copied asset: ${asset} -> ${destAssetPath}`);
      }
    } catch {
      console.warn(`Warning: Asset file not found: ${fullAssetPath}`);
    }
  }

  // Handle linked .zlt files recursively
  const linkedFiles = await getLinkedFiles(absoluteInput);

  for (const linkedFile of linkedFiles) {
    const fullLinkedPath = resolve(inputDir, linkedFile);

    try {
      const linkedStat = await stat(fullLinkedPath);
      if (linkedStat.isFile()) {
        await buildFileWithDeps(fullLinkedPath, outputDir, type, visited);
      }
    } catch {
      console.warn(`Warning: Linked file not found: ${fullLinkedPath}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printHelp();
    process.exit(1);
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
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

function printHelp() {
  console.log(`
Zolt - The high-voltage successor to Markdown
v${version}

Usage:
  zolt <command> [options]

Commands:
  lint <files...>
    Analyze .zlt files for errors and warnings
    
  build <files...>
    Compile .zlt files to output formats
    
  version
    Show version information

Options:
  --help, -h             Show this help message

Lint Options:
  --format <json|text>   Output format (default: text)
  --fix                  Auto-fix fixable issues

Build Options:
  -o, --output <path>    Output file or directory
  -t, --type <html>  Output type (default: html)
  -w, --watch            Watch for file changes and rebuild

Examples:
  zolt lint document.zlt
  zolt lint *.zlt --format json
  zolt build document.zlt -o output.html
  zolt build *.zlt -o dist/ -t html
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
    console.error('Error: No files specified for linting');
    process.exit(1);
  }

  const format = values.format as 'json' | 'text';
  const fix = values.fix as boolean;
  let hasErrors = false;

  for (const file of files) {
    try {
      const result = await lint(file);

      if (format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`\nFile: ${file}`);

        if (result.errors.length > 0) {
          hasErrors = true;
          console.log('  Errors:');
          for (const error of result.errors) {
            console.log(`    Line ${error.line}:${error.column} - ${error.message}`);
          }
        }

        if (result.warnings.length > 0) {
          console.log('  Warnings:');
          for (const warning of result.warnings) {
            console.log(`    Line ${warning.line}:${warning.column} - ${warning.message}`);
          }
        }

        if (result.errors.length === 0 && result.warnings.length === 0) {
          console.log('  ✓ No issues found');
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
        console.error(`Error processing ${file}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  process.exit(hasErrors ? 1 : 0);
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
    console.error('Error: No files specified for building');
    process.exit(1);
  }

  if (watch) {
    console.log('Watch mode is not yet implemented');
    process.exit(1);
  }

  try {
    if (files.length === 1) {
      const inputFile = files[0];
      let outputFile = output;

      if (output) {
        const outputStat = await stat(output).catch(() => null);
        if (outputStat?.isDirectory()) {
          const visited = new Set<string>();
          await buildFileWithDeps(inputFile, output, type, visited);
          return;
        } else {
          outputFile = output;
        }
      } else {
        outputFile = inputFile.replace(/\.zlt$/, '.html');
      }

      const outputDir = dirname(resolve(outputFile));
      const visited = new Set<string>();
      await buildFileWithDeps(inputFile, outputDir, type, visited, outputFile);
    } else {
      if (!output) {
        console.error('Error: Output directory required for multiple files');
        process.exit(1);
      }

      const outputStat = await stat(output).catch(() => null);
      if (!outputStat?.isDirectory()) {
        console.error('Error: Output must be a directory for multiple files');
        process.exit(1);
      }

      const visited = new Set<string>();
      for (const inputFile of files) {
        await buildFileWithDeps(inputFile, output, type, visited);
      }
    }
  } catch (error) {
    console.error('Build error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main();
