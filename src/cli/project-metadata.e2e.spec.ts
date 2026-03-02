import { describe, expect, it } from 'bun:test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { main } from './index';

describe('CLI: Project Metadata (zolt.yaml and .yml)', () => {
  const testDir = join(process.cwd(), 'temp_project_test_metadata');
  const testDirYml = join(process.cwd(), 'temp_project_test_yml_metadata');

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

    await writeFile(join(testDir, 'zolt.yaml'), projectYaml);
    await writeFile(join(testDir, 'index.zlt'), zltContent);
    await writeFile(join(testDir, 'resources/logo.png'), 'fake-image-content');

    // Mock process.argv
    const originalArgv = process.argv;
    process.argv = ['bun', 'src/cli.ts', 'build', join(testDir, 'index.zlt'), '-o', join(testDir, 'dist/')];

    try {
      await main();

      const output = await Bun.file(join(testDir, 'dist/index.html')).text();
      expect(output).toContain('Welcome to E2E Test Site');
      expect(output).toContain('Global site description');

      // Check if image was copied
      const imageExists = await Bun.file(join(testDir, 'dist/resources/logo.png')).exists();
      expect(imageExists).toBe(true);

      // Check if URL was resolved in meta tag
      expect(output).toContain('<meta property="og:image" content="resources/logo.png">');
    } finally {
      process.argv = originalArgv;
      await rm(testDir, { recursive: true, force: true });
    }
  });

  it('should load project metadata from .yml extension', async () => {
    await mkdir(testDirYml, { recursive: true });

    const projectYml = `
title: "YML Test Site"
description: "Test description from yml"
`.trim();

    const zltContent = `
# Welcome to {$title}
{$description}
`.trim();

    await writeFile(join(testDirYml, 'zolt.yml'), projectYml);
    await writeFile(join(testDirYml, 'index.zlt'), zltContent);

    // Mock process.argv
    const originalArgv = process.argv;
    process.argv = ['bun', 'src/cli.ts', 'build', join(testDirYml, 'index.zlt'), '-o', join(testDirYml, 'dist/')];

    try {
      await main();

      const output = await Bun.file(join(testDirYml, 'dist/index.html')).text();
      expect(output).toContain('Welcome to YML Test Site');
      expect(output).toContain('Test description from yml');
    } finally {
      process.argv = originalArgv;
      await rm(testDirYml, { recursive: true, force: true });
    }
  });
});
