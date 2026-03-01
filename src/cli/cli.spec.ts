import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { version } from '../../package.json';
import { findProjectFile, loadProjectMetadata, main } from './index';

describe('CLI', () => {
  const testDir = join(process.cwd(), 'temp_cli_test_complex');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  const runMain = async (args: string[]) => {
    const originalArgv = process.argv;
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {});

    process.argv = ['bun', 'src/cli.ts', ...args];

    try {
      await main();
    } catch (_e) {
      // Ignore
    } finally {
      process.argv = originalArgv;
    }

    const logs = logSpy.mock.calls.map((args) => args.join(' ')).join('\n');
    const errors = errorSpy.mock.calls.map((args) => args.join(' ')).join('\n');

    logSpy.mockRestore();
    errorSpy.mockRestore();

    return `${logs}\n${errors}`.trim();
  };

  describe('Utility Functions', () => {
    test('findProjectFile should find zolt.project.yaml', async () => {
      await writeFile(join(testDir, 'zolt.project.yaml'), 'title: Test');
      const found = await findProjectFile(testDir);
      expect(found).toContain('zolt.project.yaml');
    });

    test('findProjectFile should find zolt.project.yml', async () => {
      await writeFile(join(testDir, 'zolt.project.yml'), 'title: Test');
      const found = await findProjectFile(testDir);
      expect(found).toContain('zolt.project.yml');
    });

    test('loadProjectMetadata should load all metadata without filtering', async () => {
      await writeFile(join(testDir, 'zolt.project.yaml'), 'title: Test Site\nunknown_key: value');
      const meta = await loadProjectMetadata(testDir);
      expect(meta.title).toBe('Test Site');
      expect(meta.unknown_key).toBe('value');
    });
  });

  describe('version', () => {
    test('should display version with version command', async () => {
      const output = await runMain(['version']);
      expect(output).toContain(version);
    });
  });

  describe('help', () => {
    test('should display help with --help flag', async () => {
      const output = await runMain(['--help']);
      expect(output).toContain('Usage:');
    });

    test('should display help when no command provided', async () => {
      const output = await runMain([]);
      expect(output).toContain('Usage:');
    });
  });

  describe('lint', () => {
    test('should lint valid file', async () => {
      const testFile = join(testDir, 'test.zlt');
      await writeFile(testFile, '# Hello World');
      const output = await runMain(['lint', testFile]);
      expect(output).toContain('No issues found');
    });

    test('should show error for missing files', async () => {
      const output = await runMain(['lint']);
      expect(output).toContain('No files specified for linting');
    });
  });

  describe('build', () => {
    test('should build file to output file', async () => {
      const testFile = join(testDir, 'test.zlt');
      const outputFile = join(testDir, 'test.html');
      await writeFile(testFile, '# Hello World');
      await runMain(['build', testFile, '-o', outputFile]);
      expect(await Bun.file(outputFile).exists()).toBe(true);
    });

    test('should handle build errors', async () => {
      const output = await runMain(['build', 'non-existent.zlt']);
      expect(output).toContain('Build error');
    });

    test('should show error for missing files in build', async () => {
      const output = await runMain(['build']);
      expect(output).toContain('No files specified for building');
    });
  });
});
