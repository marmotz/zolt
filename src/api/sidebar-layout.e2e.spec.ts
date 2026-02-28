import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { mkdir, rm, writeFile } from 'fs/promises';
import * as path from 'path';
import { buildFileToString } from './index';

describe('E2E: Sidebar and Layout Regression', () => {
  const testDir = path.resolve(process.cwd(), 'temp_e2e_sidebar_layout');

  beforeAll(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should correctly render a sidebar when defined inside a layout file', async () => {
    const layoutPath = path.join(testDir, '_sidebar_layout.zlt');
    const docPath = path.join(testDir, 'test_page.zlt');

    // 1. Create a layout with a sidebar and content marker
    await writeFile(
      layoutPath,
      `
:::sidebar {side=left}
:::sidebar-header
# Layout Sidebar
:::
:::sidebar-content
* Navigation Item
:::
:::
<div class="custom-layout-wrapper">
  :::content:::
</div>
`.trim()
    );

    // 2. Create a document that uses this layout
    await writeFile(
      docPath,
      `---
layout: _sidebar_layout.zlt
title: "My Content Page"
---
# Main Content Body
This is the actual page content.
`.trim()
    );

    // 3. Build and verify
    const html = await buildFileToString(docPath);

    // Verify layout was applied (custom wrapper present)
    expect(html).toContain('<div class="custom-layout-wrapper">');

    // Verify sidebar was rendered
    expect(html).toContain('zolt-sidebar');
    expect(html).toContain('Layout Sidebar');
    expect(html).toContain('Navigation Item');

    // Verify content was injected
    expect(html).toContain('Main Content Body');
    expect(html).toContain('This is the actual page content.');

    // Verify structural wrapping (essential for CSS flex layout)
    // Zolt should have detected the sidebar and wrapped the content in zolt-main-content
    expect(html).toContain('class="zolt-main-content"');
    expect(html).toContain('class="zolt-content-container"');

    // Verify scripts are included (sidebar script)
    expect(html).toContain("sidebar.classList.toggle('is-open')");
  });
});
