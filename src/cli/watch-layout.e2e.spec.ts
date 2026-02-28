import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { spawn } from 'child_process';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { join } from 'path';

const CLI_SRC = 'src/cli/index.ts';

describe('CLI Watch Layout', () => {
  const baseTestDir = '/tmp/zolt-watch-layout-test';

  beforeEach(async () => {
    await mkdir(baseTestDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(baseTestDir, { recursive: true, force: true });
  });

  test('should rebuild when layout file changes', async () => {
    const testDir = join(baseTestDir, 'layout');
    await mkdir(testDir, { recursive: true });
    const inputFile = join(testDir, 'index.zlt');
    const layoutFile = join(testDir, 'layout.zlt');
    const outputFile = join(testDir, 'index.html');

    await writeFile(layoutFile, 'LAYOUT V1\n:::content:::');
    await writeFile(inputFile, '---\nlayout: layout.zlt\n---\n# Content');

    const proc = spawn('bun', ['run', CLI_SRC, 'build', inputFile, '-o', outputFile, '--watch'], {
      shell: true,
    });

    try {
      // Wait for initial build
      await new Promise<void>((resolve, reject) => {
        let output = '';
        proc.stdout.on('data', (data) => {
          output += data.toString();
          if (output.includes('Watching for changes')) {
            setTimeout(resolve, 500);
          }
        });
        proc.stderr.on('data', (data) => {
          output += data.toString();
        });
        proc.on('error', reject);
        setTimeout(() => reject(new Error(`Timeout waiting for initial build\nOutput: ${output}`)), 15000);
      });

      // Verify initial output
      const initialHtml = await readFile(outputFile, 'utf-8');
      expect(initialHtml).toContain('LAYOUT V1');

      // Change layout file
      await writeFile(layoutFile, 'LAYOUT V2\n:::content:::');

      // Wait for rebuild
      await new Promise<void>((resolve, reject) => {
        let output = '';
        proc.stdout.on('data', (data) => {
          output += data.toString();
          if (output.includes('Watching for changes')) {
            setTimeout(resolve, 1000);
          }
        });
        proc.on('error', reject);
        setTimeout(() => reject(new Error('Timeout waiting for rebuild')), 15000);
      });

      // Verify updated output
      const updatedHtml = await readFile(outputFile, 'utf-8');
      expect(updatedHtml).toContain('LAYOUT V2');
    } finally {
      proc.kill('SIGINT');
    }
  });
});
