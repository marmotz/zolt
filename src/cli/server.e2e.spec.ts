import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const CLI_SRC = 'src/cli/index.ts';

describe('CLI Server', () => {
  const baseTestDir = '/tmp/zolt-server-test';

  beforeEach(async () => {
    await mkdir(baseTestDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(baseTestDir, { recursive: true, force: true });
  });

  test('should start server and serve built file', async () => {
    const testDir = join(baseTestDir, 'simple');
    await mkdir(testDir, { recursive: true });
    const inputFile = join(testDir, 'index.zlt');
    await writeFile(inputFile, '# Hello Server');

    const port = 1400 + Math.floor(Math.random() * 500);
    const proc = spawn('bun', ['run', CLI_SRC, 'build', inputFile, '--server', '--port', port.toString()], {
      shell: true,
    });

    try {
      // Wait for server to start
      let output = '';
      await new Promise<void>((resolve, reject) => {
        proc.stdout.on('data', (data) => {
          output += data.toString();
          if (output.includes('Zolt Live Preview')) {
            resolve();
          }
        });
        proc.stderr.on('data', (data) => {
          output += data.toString();
        });
        proc.on('error', reject);
        setTimeout(
          () =>
            reject(
              new Error(`Timeout waiting for server to start
Output: ${output}`)
            ),
          15000
        );
      });

      // Try to fetch the file
      const response = await fetch(`http://127.0.0.1:${port}/index.html`);
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain('Hello Server');
      // Verify script injection
      expect(text).toContain('EventSource');
      expect(text).toContain('/zolt-events');
      expect(text).toContain('Zolt: Rebuild detected');
    } finally {
      proc.kill('SIGINT');
    }
  });

  test('should show error when type is pdf', async () => {
    const testDir = join(baseTestDir, 'pdf');
    await mkdir(testDir, { recursive: true });
    const inputFile = join(testDir, 'index.zlt');
    await writeFile(inputFile, '# Hello');

    const proc = spawn('bun', ['run', CLI_SRC, 'build', inputFile, '--server', '--type', 'pdf'], {
      shell: true,
    });

    let output = '';
    await new Promise<void>((resolve) => {
      proc.stdout.on('data', (data) => (output += data.toString()));
      proc.stderr.on('data', (data) => (output += data.toString()));
      proc.on('close', resolve);
      setTimeout(resolve, 5000);
    });

    expect(output).toContain('Server mode is only available for HTML output');
  });
});
