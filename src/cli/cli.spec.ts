import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { spawn } from 'child_process';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { version } from '../../package.json';

const CLI = './dist/zolt-linux-x64';
const VERSION = `zolt v${version}`;

describe('CLI', () => {
  const testDir = '/tmp/zolt-cli-test';

  beforeEach(async () => {
    process.env.NO_COLOR = 'true';

    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('version', () => {
    test('should display version with version command', async () => {
      const output = await new Promise<string>((resolve, reject) => {
        const proc = spawn(CLI, ['version'], { shell: true });
        let data = '';
        proc.stdout.on('data', (chunk) => (data += chunk));
        proc.on('close', () => resolve(data.trim()));
        proc.on('error', reject);
      });
      expect(output).toBe(VERSION);
    });

    test('should display version with -v flag', async () => {
      const output = await new Promise<string>((resolve, reject) => {
        const proc = spawn(CLI, ['-v'], { shell: true });
        let data = '';
        proc.stdout.on('data', (chunk) => (data += chunk));
        proc.on('close', () => resolve(data.trim()));
        proc.on('error', reject);
      });
      expect(output).toBe(VERSION);
    });

    test('should display version with --version flag', async () => {
      const output = await new Promise<string>((resolve, reject) => {
        const proc = spawn(CLI, ['--version'], { shell: true });
        let data = '';
        proc.stdout.on('data', (chunk) => (data += chunk));
        proc.on('close', () => resolve(data.trim()));
        proc.on('error', reject);
      });
      expect(output).toBe(VERSION);
    });
  });

  describe('help', () => {
    test('should display help with no arguments and exit 0', async () => {
      const { output, exitCode } = await new Promise<{ output: string; exitCode: number }>((resolve, reject) => {
        const proc = spawn(CLI, [], { shell: true });
        let data = '';
        proc.stdout.on('data', (chunk) => (data += chunk));
        proc.on('close', (code) => resolve({ output: data, exitCode: code ?? 1 }));
        proc.on('error', reject);
      });
      console.log('Help output:', output);
      expect(output).toContain('Zolt - The high-voltage successor to Markdown');
      expect(exitCode).toBe(0);
    });

    test('should display help with --help flag', async () => {
      const output = await new Promise<string>((resolve, reject) => {
        const proc = spawn(CLI, ['--help'], { shell: true });
        let data = '';
        proc.stdout.on('data', (chunk) => (data += chunk));
        proc.on('close', () => resolve(data));
        proc.on('error', reject);
      });
      expect(output).toContain('Zolt - The high-voltage successor to Markdown');
      expect(output).toContain(`v${version}`);
    });

    test('should display help with -h flag', async () => {
      const output = await new Promise<string>((resolve, reject) => {
        const proc = spawn(CLI, ['-h'], { shell: true });
        let data = '';
        proc.stdout.on('data', (chunk) => (data += chunk));
        proc.on('close', () => resolve(data));
        proc.on('error', reject);
      });
      expect(output).toContain('Zolt - The high-voltage successor to Markdown');
    });
  });

  describe('lint', () => {
    test('should lint valid file', async () => {
      const testFile = join(testDir, 'test.zlt');
      await writeFile(testFile, '# Hello World');

      const output = await new Promise<string>((resolve, reject) => {
        const proc = spawn(CLI, ['lint', testFile], { shell: true });
        let data = '';
        proc.stdout.on('data', (chunk) => (data += chunk));
        proc.on('close', () => resolve(data));
        proc.on('error', reject);
      });

      expect(output).toContain('✓ No issues found');
    });
  });

  describe('build', () => {
    test('should build file to output file', async () => {
      const testFile = join(testDir, 'test.zlt');
      const outputFile = join(testDir, 'test.html');
      await writeFile(testFile, '# Hello World');

      const output = await new Promise<string>((resolve, reject) => {
        const proc = spawn(CLI, ['build', testFile, '-o', outputFile], { shell: true });
        let data = '';
        proc.stdout.on('data', (chunk) => (data += chunk));
        proc.on('close', () => resolve(data));
        proc.on('error', reject);
      });

      expect(output).toContain(`Built: ${outputFile}`);
    });

    test('should build file to directory', async () => {
      const testFile = join(testDir, 'test.zlt');
      const outputDir = join(testDir, 'output');
      await mkdir(outputDir);
      await writeFile(testFile, '# Hello World');

      const output = await new Promise<string>((resolve, reject) => {
        const proc = spawn(CLI, ['build', testFile, '-o', outputDir], { shell: true });
        let data = '';
        proc.stdout.on('data', (chunk) => (data += chunk));
        proc.on('close', () => resolve(data));
        proc.on('error', reject);
      });

      expect(output).toContain('Built:');
      expect(output).toContain('test.html');
    });

    test('should use default output filename', async () => {
      const testFile = join(testDir, 'test.zlt');
      await writeFile(testFile, '# Hello World');

      const outputFile = join(testDir, 'output.html');
      const output = await new Promise<string>((resolve, reject) => {
        const proc = spawn(CLI, ['build', testFile, '-o', outputFile], { shell: true });
        let data = '';
        proc.stdout.on('data', (chunk) => (data += chunk));
        proc.on('close', () => resolve(data));
        proc.on('error', reject);
      });

      expect(output).toContain('Built:');
      expect(output).toContain('.html');
    });
  });
});
