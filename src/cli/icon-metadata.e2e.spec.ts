import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { spawn } from 'child_process';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';

describe('CLI: Icon and Manifest Metadata Copying', () => {
  const testDir = join(process.cwd(), 'temp_icon_test');
  const zoltBin = join(process.cwd(), 'src/cli.ts');

  beforeAll(async () => {
    await mkdir(testDir, { recursive: true });
    await mkdir(join(testDir, 'assets'), { recursive: true });
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should copy icon assets and update URLs in HTML from file metadata', async () => {
    const zltContent = `---
title: "Icon Copy Test"
icon_png: "assets/favicon-96x96.png"
icon_svg: "assets/favicon.svg"
icon_ico: "assets/favicon.ico"
icon_apple: "assets/apple-touch-icon.png"
manifest: "assets/site.webmanifest"
---
# Content`;

    await writeFile(join(testDir, 'index.zlt'), zltContent);
    await writeFile(join(testDir, 'assets/favicon-96x96.png'), 'fake-png');
    await writeFile(join(testDir, 'assets/favicon.svg'), '<svg></svg>');
    await writeFile(join(testDir, 'assets/favicon.ico'), 'fake-ico');
    await writeFile(join(testDir, 'assets/apple-touch-icon.png'), 'fake-apple');
    await writeFile(join(testDir, 'assets/site.webmanifest'), '{"name": "test"}');

    return new Promise<void>((resolve, reject) => {
      const proc = spawn('bun', [zoltBin, 'build', join(testDir, 'index.zlt'), '-o', join(testDir, 'dist/')]);

      proc.on('close', async (code) => {
        try {
          expect(code).toBe(0);
          const output = await Bun.file(join(testDir, 'dist/index.html')).text();

          // Check if URLs are correctly referenced in HTML
          expect(output).toContain('<link rel="icon" type="image/png" href="assets/favicon-96x96.png" sizes="96x96">');
          expect(output).toContain('<link rel="icon" type="image/svg+xml" href="assets/favicon.svg">');
          expect(output).toContain('<link rel="shortcut icon" href="assets/favicon.ico">');
          expect(output).toContain('<link rel="apple-touch-icon" sizes="180x180" href="assets/apple-touch-icon.png">');
          expect(output).toContain('<link rel="manifest" href="assets/site.webmanifest">');

          // Check if files were physically copied to dist/assets/
          expect(await Bun.file(join(testDir, 'dist/assets/favicon-96x96.png')).exists()).toBe(true);
          expect(await Bun.file(join(testDir, 'dist/assets/favicon.svg')).exists()).toBe(true);
          expect(await Bun.file(join(testDir, 'dist/assets/favicon.ico')).exists()).toBe(true);
          expect(await Bun.file(join(testDir, 'dist/assets/apple-touch-icon.png')).exists()).toBe(true);
          expect(await Bun.file(join(testDir, 'dist/assets/site.webmanifest')).exists()).toBe(true);

          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  });

  it('should copy icon assets from project metadata', async () => {
    const projectYaml = `
title: "Project Icons Test"
icon_png: "assets/proj-favicon.png"
manifest: "assets/proj.webmanifest"
`.trim();

    const zltContent = `# Project Icons`;

    await writeFile(join(testDir, 'project.zlt'), zltContent);
    await writeFile(join(testDir, 'zolt.project.yaml'), projectYaml);
    await writeFile(join(testDir, 'assets/proj-favicon.png'), 'fake-proj-png');
    await writeFile(join(testDir, 'assets/proj.webmanifest'), '{"name": "proj"}');

    return new Promise<void>((resolve, reject) => {
      const proc = spawn('bun', [zoltBin, 'build', join(testDir, 'project.zlt'), '-o', join(testDir, 'dist-proj/')]);

      proc.on('close', async (code) => {
        try {
          expect(code).toBe(0);
          const output = await Bun.file(join(testDir, 'dist-proj/project.html')).text();

          expect(output).toContain('<link rel="icon" type="image/png" href="assets/proj-favicon.png" sizes="96x96">');
          expect(output).toContain('<link rel="manifest" href="assets/proj.webmanifest">');

          expect(await Bun.file(join(testDir, 'dist-proj/assets/proj-favicon.png')).exists()).toBe(true);
          expect(await Bun.file(join(testDir, 'dist-proj/assets/proj.webmanifest')).exists()).toBe(true);

          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  });
});
