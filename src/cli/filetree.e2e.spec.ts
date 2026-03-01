import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { spawn } from 'child_process';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { join } from 'path';

const CLI_SRC = 'src/cli/index.ts';

describe('CLI Filetree', () => {
  const baseTestDir = '/tmp/zolt-filetree-cli-test';

  beforeEach(async () => {
    await mkdir(baseTestDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(baseTestDir, { recursive: true, force: true });
  });

  test('should render filetree when built via CLI', async () => {
    const testDir = join(baseTestDir, 'project');
    await mkdir(testDir, { recursive: true });
    const indexFile = join(testDir, 'index.zlt');
    const page1File = join(testDir, 'page1.zlt');
    const outputFile = join(testDir, 'index.html');

    const indexContent = '---\ntitle: Home\n---\n[[filetree]]\n[Page 1](page1.zlt)';
    await writeFile(indexFile, indexContent);
    await writeFile(page1File, '# Page 1');

    const proc = spawn('bun', ['run', CLI_SRC, 'build', indexFile, '-o', outputFile], {
      shell: true,
    });

    await new Promise<void>((resolve, reject) => {
      proc.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('CLI failed'));
        }
      });
    });

    const html = await readFile(outputFile, 'utf-8');
    expect(html).toContain('zolt-filetree');
    expect(html).toContain('Home');
    expect(html).toContain('page1.html');
    expect(html).not.toContain('Project graph not available');
  });
});
