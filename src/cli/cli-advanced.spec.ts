import { afterEach, beforeEach, describe, expect, jest, spyOn, test } from 'bun:test';
import * as fs from 'fs';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { version } from '../../package.json';
import * as api from '../api';
import { buildFileWithDeps, findProjectFile, handleWatch, loadProjectMetadata, main, performBuild } from './index';

describe('CLI Advanced', () => {
  const testDir = resolve(join(process.cwd(), 'temp_cli_test_advanced'));

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  const runMain = async (args: string[]) => {
    const originalArgv = process.argv;
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = spyOn(console, 'warn').mockImplementation(() => {});

    process.argv = ['bun', 'src/cli.ts', ...args];

    try {
      await main();
    } catch (e) {
      // Ignore
    } finally {
      process.argv = originalArgv;
    }

    const logs = logSpy.mock.calls.map((args) => args.join(' ')).join('\n');
    const errors = errorSpy.mock.calls.map((args) => args.join(' ')).join('\n');
    const warns = warnSpy.mock.calls.map((args) => args.join(' ')).join('\n');

    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();

    return (logs + '\n' + warns + '\n' + errors).trim();
  };

  describe('Metadata Loading', () => {
    test('loadProjectMetadata should fallback to CWD if not found in baseInputDir', async () => {
      const exists = await findProjectFile(process.cwd());
      const meta = await loadProjectMetadata(testDir);
      if (exists) {
        expect(Object.keys(meta).length).toBeGreaterThan(0);
      }
    });

    test('loadProjectMetadata should handle missing metadata gracefully', async () => {
      const meta = await loadProjectMetadata('/non/existent/dir');
      expect(meta).toEqual({});
    });

    test('loadProjectMetadata should handle read errors', async () => {
      await writeFile(join(testDir, 'zolt.project.yaml'), 'invalid yaml');
      const meta = await loadProjectMetadata(testDir);
      expect(meta).toEqual({});
    });
  });

  describe('buildFileWithDeps', () => {
    test('should handle visited files', async () => {
      const file = join(testDir, 'test.zlt');
      await writeFile(file, 'test');
      const visited = new Set<string>();
      visited.add(resolve(file));
      const touched = await buildFileWithDeps(file, testDir, 'html', visited, testDir);
      expect(touched.size).toBe(0);
    });

    test('should handle assets in parent directory', async () => {
      const inputDir = join(testDir, 'input/sub');
      const parentAsset = join(testDir, 'input/asset.png');
      const outputDir = join(testDir, 'output');
      await mkdir(inputDir, { recursive: true });
      await writeFile(join(inputDir, 'test.zlt'), 'test');
      await writeFile(parentAsset, 'asset');

      spyOn(api, 'getAssetFiles').mockResolvedValue(['../asset.png']);
      spyOn(api, 'buildFile').mockResolvedValue(undefined);

      await buildFileWithDeps(join(inputDir, 'test.zlt'), outputDir, 'html', new Set(), inputDir);
      expect(await Bun.file(join(outputDir, 'asset.png')).exists()).toBe(true);
    });

    test('should handle missing assets with warning', async () => {
      const inputDir = join(testDir, 'input');
      const outputDir = join(testDir, 'output');
      await mkdir(inputDir, { recursive: true });
      const inputFile = join(inputDir, 'test.zlt');
      await writeFile(inputFile, '![Missing](missing.png)');
      spyOn(api, 'getAssetFiles').mockResolvedValue(['missing.png']);
      spyOn(api, 'buildFile').mockResolvedValue(undefined);
      const warnSpy = spyOn(console, 'warn').mockImplementation(() => {});
      await buildFileWithDeps(inputFile, outputDir, 'html', new Set(), inputDir);
      expect(warnSpy).toHaveBeenCalled();
    });

    test('should handle linked files recursively', async () => {
      const inputDir = join(testDir, 'input');
      const outputDir = join(testDir, 'output');
      await mkdir(inputDir, { recursive: true });
      const inputFile = join(inputDir, 'test.zlt');
      const linkedFile = join(inputDir, 'linked.zlt');
      await writeFile(inputFile, '[[linked.zlt]]');
      await writeFile(linkedFile, '# Linked content');
      spyOn(api, 'getLinkedFiles').mockImplementation(async (file) => {
        if (file.endsWith('test.zlt')) return ['linked.zlt'];
        return [];
      });
      const buildFileSpy = spyOn(api, 'buildFile').mockResolvedValue(undefined);
      await buildFileWithDeps(inputFile, outputDir, 'html', new Set(), inputDir);
      expect(buildFileSpy).toHaveBeenCalledTimes(2);
    });

    test('should handle layout bubbling', async () => {
      const projectRoot = join(testDir, 'project');
      const inputDir = join(projectRoot, 'sub/dir');
      const outputDir = join(testDir, 'output');
      await mkdir(inputDir, { recursive: true });

      const inputFile = join(inputDir, 'test.zlt');
      const layoutFile = join(projectRoot, '_layout.zlt');

      await writeFile(inputFile, 'content');
      await writeFile(layoutFile, 'layout');

      spyOn(api, 'getLinkedFiles').mockImplementation(async (file) => {
        if (file.endsWith('test.zlt')) return ['_layout.zlt'];
        return [];
      });
      spyOn(api, 'buildFile').mockResolvedValue(undefined);

      await buildFileWithDeps(inputFile, outputDir, 'html', new Set(), projectRoot);
      expect(api.buildFile).toHaveBeenCalledWith(resolve(layoutFile), expect.anything(), expect.anything());
    });

    test('should handle missing linked files with warning', async () => {
      const file = join(testDir, 'test.zlt');
      await writeFile(file, 'test');
      spyOn(api, 'getLinkedFiles').mockResolvedValue(['missing.zlt']);
      spyOn(api, 'buildFile').mockResolvedValue(undefined);
      const warnSpy = spyOn(console, 'warn').mockImplementation(() => {});

      await buildFileWithDeps(file, testDir, 'html', new Set(), testDir);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Linked file not found'));
    });
  });

  describe('Linting', () => {
    test('should output JSON format', async () => {
      const testFile = join(testDir, 'test.zlt');
      await writeFile(testFile, '# Test');
      const output = await runMain(['lint', testFile, '--format', 'json']);
      expect(JSON.parse(output).filePath).toBeDefined();
    });

    test('should show warnings and errors', async () => {
      spyOn(api, 'lint').mockResolvedValue({
        valid: false,
        filePath: 'test.zlt',
        errors: [{ line: 1, column: 1, message: 'Err', code: 'E' }],
        warnings: [{ line: 2, column: 2, message: 'Warn', code: 'W' }],
      });
      const output = await runMain(['lint', 'test.zlt']);
      expect(output).toContain('Errors:');
      expect(output).toContain('Warnings:');
    });

    test('should print success message when no issues found', async () => {
      const file = join(testDir, 'test.zlt');
      await writeFile(file, 'test');
      spyOn(api, 'lint').mockResolvedValue({ valid: true, filePath: file, errors: [], warnings: [] });
      const output = await runMain(['lint', file]);
      expect(output).toContain('No issues found');
    });

    test('should handle runtime errors in JSON format', async () => {
      spyOn(api, 'lint').mockRejectedValue(new Error('Mock Error'));
      const output = await runMain(['lint', 'fake.zlt', '--format', 'json']);
      expect(JSON.parse(output).errors[0].message).toBe('Mock Error');
    });

    test('should handle runtime errors in text format', async () => {
      spyOn(api, 'lint').mockRejectedValue(new Error('Fatal'));
      const output = await runMain(['lint', 'fake.zlt']);
      expect(output).toContain('Fatal');
    });
  });

  describe('Main Switch', () => {
    test('should show version and help', async () => {
      expect(await runMain(['-v'])).toContain('zolt v' + version);
      expect(await runMain(['--version'])).toContain('zolt v' + version);
      expect(await runMain(['version'])).toContain('zolt v' + version);
      expect(await runMain(['help'])).toContain('Usage:');
      expect(await runMain(['-h'])).toContain('Usage:');
      expect(await runMain(['unknown'])).toContain('Unknown command: unknown');
    });
  });

  describe('Build Options', () => {
    test('should build with single file and directory output', async () => {
      const file = join(testDir, 'test.zlt');
      const outDir = join(testDir, 'out');
      await writeFile(file, 'test');
      spyOn(api, 'buildFile').mockResolvedValue(undefined);
      await runMain(['build', file, '-o', outDir]);
      expect(api.buildFile).toHaveBeenCalled();
    });

    test('should handle output directory ending in .html but being a directory', async () => {
      const file = join(testDir, 'test.zlt');
      const outDir = join(testDir, 'dir.html');
      await mkdir(outDir);
      await writeFile(file, 'test');
      spyOn(api, 'buildFile').mockResolvedValue(undefined);
      await performBuild([file], outDir, 'html');
      expect(api.buildFile).toHaveBeenCalled();
    });

    test('should build multiple files from different directories', async () => {
      const dir1 = join(testDir, 'dir1');
      const dir2 = join(testDir, 'dir2');
      await mkdir(dir1);
      await mkdir(dir2);
      const file1 = join(dir1, '1.zlt');
      const file2 = join(dir2, '2.zlt');
      const outDir = join(testDir, 'out');
      await writeFile(file1, '1');
      await writeFile(file2, '2');
      spyOn(api, 'buildFile').mockResolvedValue(undefined);
      await runMain(['build', file1, file2, '-o', outDir]);
      expect(api.buildFile).toHaveBeenCalledTimes(2);
    });

    test('should fail if output is not a directory for multiple files', async () => {
      const file1 = join(testDir, '1.zlt');
      const file2 = join(testDir, '2.zlt');
      const notADir = join(testDir, 'not-a-dir.html');
      await writeFile(file1, '1');
      await writeFile(file2, '2');
      await writeFile(notADir, 'content');
      const output = await runMain(['build', file1, file2, '-o', notADir]);
      expect(output).toContain('Build error');
    });

    test('should handle build error in handleBuild', async () => {
      const file = join(testDir, 'test.zlt');
      await writeFile(file, 'test');
      spyOn(api, 'buildFile').mockRejectedValue(new Error('Fatal Build'));
      const output = await runMain(['build', file]);
      expect(output).toContain('Fatal Build');
    });
  });

  describe('Watch Mode', () => {
    test('handleWatch full cycle', async () => {
      const file = resolve(join(testDir, 'test.zlt'));
      await writeFile(file, 'test');

      let watchCallback: any;
      spyOn(fs, 'watch').mockImplementation((_path, cb) => {
        watchCallback = cb;
        return { close: () => {}, on: () => {} } as any;
      });

      spyOn(api, 'buildFile').mockResolvedValue(undefined);
      spyOn(process, 'on').mockImplementation(() => process);

      await handleWatch([file], undefined, 'html');

      // Wait for initial build
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Trigger change
      if (watchCallback) {
        await watchCallback('change', 'test.zlt');
      }

      // Wait for debouncing and rebuild
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    test('handleWatch error cases', async () => {
      const file = join(testDir, 'test.zlt');
      await writeFile(file, 'test');

      let watchErrorCb: any;
      spyOn(fs, 'watch').mockImplementation(() => {
        return {
          close: () => {},
          on: (event: string, callback: CallableFunction) => {
            if (event === 'error') {
              watchErrorCb = callback;
            }
          },
        } as any;
      });
      spyOn(api, 'buildFile').mockResolvedValue(undefined);
      spyOn(process, 'on').mockImplementation(() => process);

      await handleWatch([file], undefined, 'html');
      if (watchErrorCb) watchErrorCb(new Error('Watch Error'));
    });

    test('handleWatch SIGINT', async () => {
      const file = join(testDir, 'test.zlt');
      await writeFile(file, 'test');

      let sigintCb: any;
      spyOn(process, 'on').mockImplementation((event: string, cb: CallableFunction) => {
        if (event === 'SIGINT') {
          sigintCb = cb;
        }

        return process;
      });
      spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('EXIT');
      });
      spyOn(fs, 'watch').mockReturnValue({ close: () => {}, on: () => {} } as any);
      spyOn(api, 'buildFile').mockResolvedValue(undefined);

      await handleWatch([file], undefined, 'html');

      try {
        if (sigintCb) sigintCb();
      } catch (e: any) {
        expect(e.message).toBe('EXIT');
      }
    });
  });
});
