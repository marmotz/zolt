import { afterEach, beforeEach, describe, expect, jest, spyOn, test } from 'bun:test';
import * as fs from 'fs';
import { mkdir, rm, writeFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { version } from '../../package.json';
import * as api from '../api';
import * as cli from './index';

describe('CLI Advanced', () => {
  const testDir = resolve(join(process.cwd(), 'temp_cli_test_advanced'));

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  const runMain = async (args: string[]): Promise<string> => {
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {});
    const originalArgv = process.argv;
    process.argv = ['bun', 'src/cli.ts', ...args];

    try {
      await cli.main();
    } catch (e) {
      // Ignore
    } finally {
      process.argv = originalArgv;
    }

    const output =
      logSpy.mock.calls.map((call) => call.join(' ')).join('\n') +
      errorSpy.mock.calls.map((call) => call.join(' ')).join('\n');
    logSpy.mockRestore();
    errorSpy.mockRestore();

    return output;
  };

  describe('Metadata Loading', () => {
    test('loadProjectMetadata should handle missing metadata gracefully', async () => {
      const metadata = await cli.loadProjectMetadata(join(testDir, 'nonexistent'));
      expect(metadata).toEqual({});
    });

    test('loadProjectMetadata should handle read errors', async () => {
      const projectFile = join(testDir, 'zolt.project.yaml');
      await writeFile(projectFile, 'invalid: yaml: :');
      const metadata = await cli.loadProjectMetadata(testDir);
      expect(metadata).toEqual({});
    });
  });

  describe('buildFileWithDeps', () => {
    test('should handle visited files', async () => {
      const file = join(testDir, 'test.zlt');
      await writeFile(file, 'test');
      const visited = new Set<string>();
      visited.add(resolve(file));
      const touched = await cli.buildFileWithDeps(
        file,
        testDir,
        'html',
        visited,
        testDir,
        undefined,
        {},
        undefined,
        new Map()
      );
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

      const assetsToCopy = new Map<string, string>();
      await cli.buildFileWithDeps(
        join(inputDir, 'test.zlt'),
        outputDir,
        'html',
        new Set(),
        inputDir,
        undefined,
        {},
        undefined,
        assetsToCopy
      );

      for (const [src, dest] of assetsToCopy) {
        await mkdir(dirname(dest), { recursive: true });
        await fs.promises.copyFile(src, dest);
      }

      expect(await Bun.file(join(outputDir, 'asset.png')).exists()).toBe(true);
    });
  });

  describe('Main Command Routing', () => {
    test('should show help when no command is provided', async () => {
      const output = await runMain([]);
      expect(output).toContain('Usage:');
    });

    test('should show version', async () => {
      expect(await runMain(['version'])).toContain('zolt v' + version);
    });

    test('should handle unknown command', async () => {
      const output = await runMain(['unknown']);
      expect(output).toContain('Unknown command');
    });

    test('should call handleServer from main', async () => {
      const serverSpy = spyOn(cli, 'handleServer').mockResolvedValue(undefined as any);

      const file = join(testDir, 'test.zlt');
      await writeFile(file, 'test');
      await runMain(['build', file, '--server']);

      expect(serverSpy).toHaveBeenCalled();
    });

    test('should call handleWatch from main', async () => {
      const watchSpy = spyOn(cli, 'handleWatch').mockResolvedValue(undefined as any);

      const file = join(testDir, 'test.zlt');
      await writeFile(file, 'test');
      await runMain(['build', file, '--watch']);

      expect(watchSpy).toHaveBeenCalled();
    });

    test('should handle build error', async () => {
      const file = join(testDir, 'test.zlt');
      await writeFile(file, 'test');
      spyOn(api, 'buildFile').mockRejectedValue(new Error('Fatal Build'));
      const output = await runMain(['build', file]);
      expect(output).toContain('Fatal Build');
    });

    test('should fail server mode with pdf type', async () => {
      const output = await runMain(['build', 'test.zlt', '--server', '--type', 'pdf']);
      expect(output).toContain('Server mode is only available for HTML');
    });
  });

  describe('Server Info', () => {
    test('printServerInfo should log server details', () => {
      const logSpy = spyOn(console, 'log').mockImplementation(() => {});
      cli.printServerInfo(['index.zlt'], undefined, 'localhost', 3000);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Zolt Live Preview'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('http://localhost:3000/index.html'));
      logSpy.mockRestore();
    });
  });

  describe('performBuild Edge Cases', () => {
    test('should throw error when multiple files and no output directory', async () => {
      let error: any;
      try {
        await cli.performBuild(['f1.zlt', 'f2.zlt'], undefined, 'html');
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toContain('Output directory required');
    });

    test('should throw error when output is not a directory for multiple files', async () => {
      const file = join(testDir, 'not_a_dir.txt');
      await writeFile(file, 'test');
      let error: any;
      try {
        await cli.performBuild(['f1.zlt', 'f2.zlt'], file, 'html');
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toContain('Output must be a directory');
    });
  });

  describe('Main Command Edge Cases', () => {
    test('lint should fail with no files', async () => {
      const output = await runMain(['lint']);
      expect(output).toContain('No files specified');
    });

    test('build should fail with no files', async () => {
      const output = await runMain(['build']);
      expect(output).toContain('No files specified');
    });
  });
});
