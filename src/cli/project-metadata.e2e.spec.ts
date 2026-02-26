import { describe, expect, it } from 'bun:test';
import { spawn } from 'child_process';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';

describe('CLI: Project Metadata (zolt.project.yaml)', () => {
  const testDir = join(process.cwd(), 'temp_project_test');
  const zoltBin = join(process.cwd(), 'src/cli.ts');

  it('should load project metadata and process assets', async () => {
    await mkdir(testDir, { recursive: true });
    await mkdir(join(testDir, 'resources'), { recursive: true });

    const projectYaml = `
title: "E2E Test Site"
description: "Global site description"
image: "resources/logo.png"
`.trim();

    const zltContent = `
# Welcome to {$title}
{$description}
`.trim();

    await writeFile(join(testDir, 'zolt.project.yaml'), projectYaml);
    await writeFile(join(testDir, 'index.zlt'), zltContent);
    await writeFile(join(testDir, 'resources/logo.png'), 'fake-image-content');

    return new Promise<void>((resolve, reject) => {
      const proc = spawn('bun', [zoltBin, 'build', join(testDir, 'index.zlt'), '-o', join(testDir, 'dist/')]);

      proc.on('close', async (code) => {
        try {
          expect(code).toBe(0);
          const output = await Bun.file(join(testDir, 'dist/index.html')).text();
          expect(output).toContain('Welcome to E2E Test Site');
          expect(output).toContain('Global site description');

          // Check if image was copied
          const imageExists = await Bun.file(join(testDir, 'dist/resources/logo.png')).exists();
          expect(imageExists).toBe(true);

          // Check if URL was resolved in meta tag
          expect(output).toContain('<meta property="og:image" content="resources/logo.png">');

          await rm(testDir, { recursive: true, force: true });
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  });
});
