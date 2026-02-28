import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { buildString } from './index';

describe('Filetree TOC Option', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zolt-filetree-toc-'));
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should render TOC in filetree when toc=true', async () => {
    const indexFile = path.join(testDir, 'index.zlt');
    const content = `---
title: Unique Home Page
---
# Main Welcome Heading
[[filetree {toc=true}]]
[Link to other](other.zlt)`;

    fs.writeFileSync(indexFile, content);
    fs.writeFileSync(path.join(testDir, 'other.zlt'), '# Other\n[Home](index.zlt)');

    const html = await buildString(content, {
      entryPoint: indexFile,
      filePath: indexFile,
    });

    expect(html).toContain('zolt-filetree');
    expect(html).toContain('class="zolt-filetree-toc"');
    expect(html).toContain('href="#main-welcome-heading"');
    expect(html).toContain('Main Welcome Heading</a>');
  });

  it('should NOT render TOC in filetree when toc=false', async () => {
    const indexFile = path.join(testDir, 'no-toc.zlt');
    const content = `---
title: No TOC Page
---
# Heading Without TOC
[[filetree {toc=false}]]`;

    fs.writeFileSync(indexFile, content);

    const html = await buildString(content, {
      entryPoint: indexFile,
      filePath: indexFile,
    });

    expect(html).toContain('zolt-filetree');
    expect(html).not.toContain('class="zolt-filetree-toc"');
    expect(html).not.toContain('Heading Without TOC</a>');
  });

  it('should support short boolean attribute [[filetree {toc}]]', async () => {
    const indexFile = path.join(testDir, 'short-toc.zlt');
    const content = `---
title: Short TOC Page
---
# Short Heading
[[filetree {toc}]]`;

    fs.writeFileSync(indexFile, content);

    const html = await buildString(content, {
      entryPoint: indexFile,
      filePath: indexFile,
    });

    expect(html).toContain('zolt-filetree');
    expect(html).toContain('class="zolt-filetree-toc"');
    expect(html).toContain('Short Heading</a>');
  });
});
