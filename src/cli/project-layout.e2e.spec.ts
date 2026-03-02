import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { main } from './index';

describe('CLI: Project Metadata Layout Regression', () => {
  const testDir = path.resolve(process.cwd(), 'temp_cli_project_layout');

  beforeAll(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should apply layout defined in zolt.yaml', async () => {
    const projectYaml = `
layout: _project_layout.zlt
custom_var: "SUCCESS"
`.trim();

    const layoutContent = `
<div class="layout">
  Variable: {$custom_var}
  :::content:::
</div>
`.trim();

    const docContent = `
# Page Content
`.trim();

    await writeFile(path.join(testDir, 'zolt.yaml'), projectYaml);
    await writeFile(path.join(testDir, '_project_layout.zlt'), layoutContent);
    await writeFile(path.join(testDir, 'index.zlt'), docContent);

    // Mock process.argv
    const originalArgv = process.argv;
    process.argv = ['bun', 'src/cli.ts', 'build', path.join(testDir, 'index.zlt'), '-o', path.join(testDir, 'dist/')];

    try {
      await main();

      const html = await Bun.file(path.join(testDir, 'dist/index.html')).text();

      // Check if layout was applied
      expect(html).toContain('<div class="layout">');
      // Check if custom variable from project metadata was resolved
      expect(html).toContain('Variable: SUCCESS');
      // Check if content was injected
      expect(html).toContain('Page Content');
    } finally {
      process.argv = originalArgv;
    }
  });
});
