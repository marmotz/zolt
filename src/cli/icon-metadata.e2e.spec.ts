import { describe, expect, it } from 'bun:test';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { main } from './index';

describe('CLI: Icon and Manifest Metadata Copying', () => {
  const testDir = join(process.cwd(), 'temp_icon_test_metadata');

  it('should copy icon assets and update URLs in HTML from file metadata', async () => {
    await mkdir(testDir, { recursive: true });
    await mkdir(join(testDir, 'resources'), { recursive: true });

    const iconContent = 'fake-icon-content';
    await writeFile(join(testDir, 'resources/icon.png'), iconContent);

    const zltContent = `
---
icon: resources/icon.png
---
# Page with icon
`.trim();

    await writeFile(join(testDir, 'index.zlt'), zltContent);

    const originalArgv = process.argv;
    process.argv = ['bun', 'src/cli.ts', 'build', join(testDir, 'index.zlt'), '-o', join(testDir, 'dist/')];

    try {
      await main();

      const output = await Bun.file(join(testDir, 'dist/index.html')).text();
      expect(output).toContain('<link rel="icon" type="image/png" href="resources/icon.png">');

      const iconExists = await Bun.file(join(testDir, 'dist/resources/icon.png')).exists();
      expect(iconExists).toBe(true);
    } catch (err) {
      console.error('Test Error:', err);
      throw err;
    } finally {
      process.argv = originalArgv;
      await rm(testDir, { recursive: true, force: true });
    }
  });

  it('should copy icon assets from project metadata', async () => {
    const testDirProj = join(process.cwd(), 'temp_icon_test_proj');
    await mkdir(testDirProj, { recursive: true });
    await mkdir(join(testDirProj, 'assets'), { recursive: true });

    await writeFile(join(testDirProj, 'assets/favicon.ico'), 'fake-ico-content');

    const projectYaml = `
icon: assets/favicon.ico
`.trim();

    await writeFile(join(testDirProj, 'zolt.project.yaml'), projectYaml);
    await writeFile(join(testDirProj, 'project.zlt'), '# Project Page');

    const originalArgv = process.argv;
    process.argv = [
      'bun',
      'src/cli.ts',
      'build',
      join(testDirProj, 'project.zlt'),
      '-o',
      join(testDirProj, 'dist-proj/'),
    ];

    try {
      await main();

      const output = await Bun.file(join(testDirProj, 'dist-proj/project.html')).text();
      expect(output).toContain('<link rel="icon" type="image/x-icon" href="assets/favicon.ico">');

      const iconExists = await Bun.file(join(testDirProj, 'dist-proj/assets/favicon.ico')).exists();
      expect(iconExists).toBe(true);
    } catch (err) {
      console.error('Test Error (Proj):', err);
      throw err;
    } finally {
      process.argv = originalArgv;
      await rm(testDirProj, { recursive: true, force: true });
    }
  });
});
