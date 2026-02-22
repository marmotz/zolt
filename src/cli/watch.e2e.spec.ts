import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { spawn } from 'child_process';
import { mkdir, readFile, rm, stat, writeFile } from 'fs/promises';
import { join } from 'path';

const CLI_SRC = 'src/cli/index.ts';

describe('CLI Watch', () => {
  const baseTestDir = '/tmp/zolt-watch-test';

  beforeEach(async () => {
    await mkdir(baseTestDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(baseTestDir, { recursive: true, force: true });
  });

  test('should rebuild when file changes', async () => {
    const testDir = join(baseTestDir, 'simple');
    await mkdir(testDir, { recursive: true });
    const inputFile = join(testDir, 'index.zlt');
    const outputFile = join(testDir, 'index.html');
    await writeFile(inputFile, '# Initial');

    const proc = spawn('bun', ['run', CLI_SRC, 'build', inputFile, '-o', outputFile, '--watch'], {
      shell: true,
    });

    try {
      // Wait for initial build
      let output = '';
      await new Promise<void>((resolve, reject) => {
        proc.stdout.on('data', (data) => {
          output += data.toString();
          if (output.includes('Watching for changes')) {
            setTimeout(() => {
              resolve();
            }, 500);
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
      expect(initialHtml).toContain('Initial');

      // Change file
      await writeFile(inputFile, '# Updated');

      // Wait for rebuild
      await new Promise<void>((resolve, reject) => {
        let output = '';
        proc.stdout.on('data', (data) => {
          output += data.toString();
          if (output.includes('Change detected, rebuilding')) {
            setTimeout(resolve, 500); // Rebuild might take longer
          }
        });
        proc.on('error', reject);
        setTimeout(() => reject(new Error('Timeout waiting for rebuild')), 15000);
      });

      // Verify updated output
      const updatedHtml = await readFile(outputFile, 'utf-8');
      expect(updatedHtml).toContain('Updated');
    } finally {
      proc.kill('SIGINT');
    }
  });

  test('should rebuild when linked file changes', async () => {
    const testDir = join(baseTestDir, 'linked');
    await mkdir(testDir, { recursive: true });
    const indexFile = join(testDir, 'index-link.zlt');
    const linkedFile = join(testDir, 'linked.zlt');
    const outputDir = join(testDir, 'dist');
    await mkdir(outputDir, { recursive: true });
    
    await writeFile(indexFile, '# Main\n[Linked](linked.zlt)');
    await writeFile(linkedFile, '# Linked Initial');

    const proc = spawn('bun', ['run', CLI_SRC, 'build', indexFile, '-o', outputDir, '--watch'], {
      shell: true,
    });

    try {
      // Wait for initial build
      let output = '';
      await new Promise<void>((resolve, reject) => {
        proc.stdout.on('data', (data) => {
          output += data.toString();
          if (output.includes('Watching for changes')) {
            setTimeout(() => {
              resolve();
            }, 500);
          }
        });
        proc.stderr.on('data', (data) => {
          output += data.toString();
        });
        proc.on('error', reject);
        setTimeout(() => reject(new Error(`Timeout waiting for initial build\nOutput: ${output}`)), 15000);
      });

      // Verify initial output
      const linkedHtml = await readFile(join(outputDir, 'linked.html'), 'utf-8');
      expect(linkedHtml).toContain('Linked Initial');

      // Change linked file
      await writeFile(linkedFile, '# Linked Updated');

      // Wait for rebuild
      await new Promise<void>((resolve, reject) => {
        let output = '';
        proc.stdout.on('data', (data) => {
          output += data.toString();
          if (output.includes('Change detected, rebuilding')) {
            setTimeout(resolve, 500); // Rebuild might take longer
          }
        });
        proc.on('error', reject);
        setTimeout(() => reject(new Error('Timeout waiting for rebuild')), 15000);
      });

      // Verify updated output
      const updatedLinkedHtml = await readFile(join(outputDir, 'linked.html'), 'utf-8');
      expect(updatedLinkedHtml).toContain('Linked Updated');
    } finally {
      proc.kill('SIGINT');
    }
  });

  test('should rebuild when included file changes', async () => {
    const testDir = join(baseTestDir, 'include');
    await mkdir(testDir, { recursive: true });
    const indexFile = join(testDir, 'index-include.zlt');
    const includedFile = join(testDir, 'header.zlt');
    const outputDir = join(testDir, 'dist-include');
    await mkdir(outputDir, { recursive: true });
    
    await writeFile(indexFile, '# Main\nSee [header](header.zlt)');
    await writeFile(includedFile, '# Header Initial');

    const proc = spawn('bun', ['run', CLI_SRC, 'build', indexFile, '-o', outputDir, '--watch'], {
      shell: true,
    });

    try {
      // Wait for initial build
      let output = '';
      await new Promise<void>((resolve, reject) => {
        proc.stdout.on('data', (data) => {
          output += data.toString();
          if (output.includes('Watching for changes')) {
            setTimeout(() => {
              resolve();
            }, 500);
          }
        });
        proc.stderr.on('data', (data) => {
          output += data.toString();
        });
        proc.on('error', reject);
        setTimeout(() => reject(new Error(`Timeout waiting for initial build\nOutput: ${output}`)), 15000);
      });

      // Verify initial output
      const includedHtmlFile = join(outputDir, 'header.html');
      try {
        const initialIncludedHtml = await readFile(includedHtmlFile, 'utf-8');
        expect(initialIncludedHtml).toContain('Header Initial');
      } catch (e) {
        console.error(`Initial CLI Output: ${output}`);
        throw e;
      }

      // Change included file
      await writeFile(includedFile, '# Header Updated');

      // Wait for rebuild
      let rebuildOutput = '';
      await new Promise<void>((resolve, reject) => {
        proc.stdout.on('data', (data) => {
          rebuildOutput += data.toString();
          if (rebuildOutput.includes('Change detected, rebuilding')) {
            setTimeout(resolve, 500);
          }
        });
        proc.stderr.on('data', (data) => {
          rebuildOutput += data.toString();
        });
        proc.on('error', reject);
        setTimeout(() => reject(new Error(`Timeout waiting for rebuild\nOutput: ${rebuildOutput}`)), 15000);
      });

      // Verify updated output
      try {
        const updatedIncludedHtml = await readFile(includedHtmlFile, 'utf-8');
        expect(updatedIncludedHtml).toContain('Header Updated');
      } catch (e) {
        console.error(`Rebuild CLI Output: ${rebuildOutput}`);
        throw e;
      }
    } finally {
      proc.kill('SIGINT');
    }
  });

  test('should watch new dependencies discovered during rebuild', async () => {
    const testDir = join(baseTestDir, 'discovery');
    await mkdir(testDir, { recursive: true });
    const indexFile = join(testDir, 'index.zlt');
    const newDepFile = join(testDir, 'new.zlt');
    const newDepOutputFile = join(testDir, 'new.html');
    
    await writeFile(indexFile, '# Initial');

    const proc = spawn('bun', ['run', CLI_SRC, 'build', indexFile, '-o', testDir, '--watch'], {
      shell: true,
    });

    try {
      // Wait for initial build
      let output = '';
      await new Promise<void>((resolve, reject) => {
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

      // Update index to link to new file
      await writeFile(newDepFile, '# New Content');
      await writeFile(indexFile, '# Main\n[New](new.zlt)');

      // Wait for rebuild
      let rebuildOutput = '';
      await new Promise<void>((resolve, reject) => {
        proc.stdout.on('data', (data) => {
          rebuildOutput += data.toString();
          if (rebuildOutput.includes('Change detected, rebuilding')) {
            setTimeout(resolve, 1000);
          }
        });
        proc.on('error', reject);
        setTimeout(() => reject(new Error(`Timeout waiting for rebuild\nOutput: ${rebuildOutput}`)), 15000);
      });

      // Now new.html should exist
      await stat(newDepOutputFile);

      // Now change the new dependency file, it should trigger a rebuild!
      await writeFile(newDepFile, '# New Updated');

      // Wait for rebuild
      let rebuildOutput2 = '';
      await new Promise<void>((resolve, reject) => {
        proc.stdout.on('data', (data) => {
          rebuildOutput2 += data.toString();
          if (rebuildOutput2.includes('Change detected, rebuilding')) {
            setTimeout(resolve, 1000);
          }
        });
        proc.on('error', reject);
        setTimeout(() => reject(new Error(`Timeout waiting for second rebuild\nOutput: ${rebuildOutput2}`)), 15000);
      });

      // Verify new updated content
      const updatedNewHtml = await readFile(newDepOutputFile, 'utf-8');
      expect(updatedNewHtml).toContain('New Updated');
    } finally {
      proc.kill('SIGINT');
    }
  });
});
