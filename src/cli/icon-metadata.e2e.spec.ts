import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { main } from './index';

describe('CLI: Icon and Manifest Metadata Copying', () => {
  const testDir = join(process.cwd(), 'temp_icon_test_complete');

  beforeAll(async () => {
    await mkdir(testDir, { recursive: true });
    await mkdir(join(testDir, 'assets/favicons'), { recursive: true });

    // Create dummy assets
    await writeFile(join(testDir, 'favicon.ico'), 'fake-ico');
    await writeFile(join(testDir, 'assets/favicons/favicon-96x96.png'), 'fake-png');
    await writeFile(join(testDir, 'assets/favicons/favicon.svg'), 'fake-svg');
    await writeFile(join(testDir, 'assets/favicons/apple-touch-icon.png'), 'fake-apple');

    const manifestContent = JSON.stringify({
      icons: [
        { src: '/web-app-manifest-192x192.png', type: 'image/png' },
        { src: 'web-app-manifest-512x512.png', type: 'image/png' },
      ],
      shortcuts: [
        {
          name: 'Shortcut',
          url: '/shortcut',
          icons: [{ src: 'shortcut-icon.png', sizes: '192x192' }],
        },
      ],
    });
    await writeFile(join(testDir, 'assets/favicons/site.webmanifest'), manifestContent);
    await writeFile(join(testDir, 'assets/favicons/web-app-manifest-192x192.png'), 'fake-192');
    await writeFile(join(testDir, 'assets/favicons/web-app-manifest-512x512.png'), 'fake-512');
    await writeFile(join(testDir, 'assets/favicons/shortcut-icon.png'), 'fake-shortcut');

    const projectYaml = `
title: Test Project
iconPng: assets/favicons/favicon-96x96.png
iconSvg: assets/favicons/favicon.svg
iconIco: favicon.ico
iconApple: assets/favicons/apple-touch-icon.png
manifest: assets/favicons/site.webmanifest
`.trim();

    await writeFile(join(testDir, 'zolt.project.yaml'), projectYaml);
    await writeFile(join(testDir, 'index.zlt'), '# Home');
    await writeFile(join(testDir, 'other.zlt'), '# Other page sharing assets');
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should copy all icon assets referenced in project metadata (camelCase) and inside manifest exactly once', async () => {
    const originalArgv = process.argv;
    const outputDir = join(testDir, 'dist');

    process.argv = [
      'bun',
      'src/cli.ts',
      'build',
      join(testDir, 'index.zlt'),
      join(testDir, 'other.zlt'),
      '-o',
      outputDir,
    ];

    await main();

    // Check if files are copied
    expect(await Bun.file(join(outputDir, 'assets/favicons/favicon-96x96.png')).exists()).toBe(true);
    expect(await Bun.file(join(outputDir, 'assets/favicons/favicon.svg')).exists()).toBe(true);
    expect(await Bun.file(join(outputDir, 'favicon.ico')).exists()).toBe(true);
    expect(await Bun.file(join(outputDir, 'assets/favicons/apple-touch-icon.png')).exists()).toBe(true);
    expect(await Bun.file(join(outputDir, 'assets/favicons/site.webmanifest')).exists()).toBe(true);

    // Manifest-referenced files (including shortcuts)
    expect(await Bun.file(join(outputDir, 'assets/favicons/web-app-manifest-192x192.png')).exists()).toBe(true);
    expect(await Bun.file(join(outputDir, 'assets/favicons/web-app-manifest-512x512.png')).exists()).toBe(true);
    expect(await Bun.file(join(outputDir, 'assets/favicons/shortcut-icon.png')).exists()).toBe(true);

    process.argv = originalArgv;
  });

  it('should handle manifest parsing errors gracefully', async () => {
    const errorDir = join(testDir, 'error_manifest');
    await mkdir(errorDir, { recursive: true });
    await writeFile(join(errorDir, 'bad.webmanifest'), '{ invalid json');

    const zltContent = `
---
manifest: bad.webmanifest
---
# Page
`.trim();
    await writeFile(join(errorDir, 'index.zlt'), zltContent);

    const originalArgv = process.argv;
    process.argv = ['bun', 'src/cli.ts', 'build', join(errorDir, 'index.zlt'), '-o', join(errorDir, 'dist')];

    await main();

    expect(await Bun.file(join(errorDir, 'dist/bad.webmanifest')).exists()).toBe(true);
    process.argv = originalArgv;
  });
});
