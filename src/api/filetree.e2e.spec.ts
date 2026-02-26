import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { buildString } from './index';

describe('Filetree Markup', () => {
  const testDir = path.resolve(process.cwd(), 'test-project-filetree');
  const indexFile = path.join(testDir, 'index.zlt');
  const page1File = path.join(testDir, 'page1.zlt');
  const page2File = path.join(testDir, 'page2.zlt');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
    fs.writeFileSync(
      indexFile,
      `---
title: Welcome Home
---
# Index
[[filetree]]
[Page 1](page1.zlt)`
    );
    fs.writeFileSync(
      page1File,
      `---
title: First Page
---
# Page 1
[[filetree]]
[Page 2](page2.zlt)`
    );
    fs.writeFileSync(
      page2File,
      `# Page 2
[Back](index.zlt)`
    );
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should render a project file tree', async () => {
    const content = fs.readFileSync(indexFile, 'utf-8');
    const html = await buildString(content, {
      entryPoint: indexFile,
      filePath: indexFile,
    });

    expect(html).toContain('zolt-filetree');
    expect(html).toContain('Welcome Home');
    expect(html).toContain('First Page');
    expect(html).toContain('page2.html');
    expect(html).toContain('class="active"');
  });

  it('should respect depth limits', async () => {
    const content = '[[filetree {depth=1}]]';
    const html = await buildString(content, {
      entryPoint: indexFile,
      filePath: indexFile,
    });

    expect(html).toContain('Welcome Home');
    expect(html).toContain('First Page');
    expect(html).not.toContain('page2.html');
  });

  it('should highlight the current page correctly', async () => {
    const content = fs.readFileSync(page1File, 'utf-8');
    const html = await buildString(content, {
      entryPoint: indexFile,
      filePath: page1File,
    });

    // On index.html, index should be active. On page1.html, page1 should be active.
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;

    expect(bodyContent).toContain('<li class="active"><a href="page1.html">First Page</a>');
  });
});
