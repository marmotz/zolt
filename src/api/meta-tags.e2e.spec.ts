import { describe, expect, it } from 'bun:test';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { buildFile, buildString } from './index';

describe('E2E: Meta Tags Generation', () => {
  it('should generate standard meta tags from file metadata', async () => {
    const content = `---
title: "SEO Test"
description: "A cool document about Zolt"
author: "Zolt Developer"
keywords: [zolt, markup, parser]
robots: "index, follow"
---
# Content`;
    const html = await buildString(content);

    expect(html).toContain('<meta name="description" content="A cool document about Zolt">');
    expect(html).toContain('<meta name="author" content="Zolt Developer">');
    expect(html).toContain('<meta name="keywords" content="zolt, markup, parser">');
    expect(html).toContain('<meta name="robots" content="index, follow">');
  });

  it('should generate Open Graph meta tags', async () => {
    const content = `---
title: "Social Media Test"
description: "Share me on Twitter"
image: "https://example.com/cover.jpg"
---
# Content`;
    const html = await buildString(content);

    expect(html).toContain('<meta property="og:title" content="Social Media Test">');
    expect(html).toContain('<meta property="og:description" content="Share me on Twitter">');
    expect(html).toContain('<meta property="og:image" content="https://example.com/cover.jpg">');
    expect(html).toContain('<meta property="og:type" content="website">');
  });

  it('should fall back to tags for keywords if keywords metadata is missing', async () => {
    const content = `---
tags: [tutorial, beginner]
---
# Content`;
    const html = await buildString(content);
    expect(html).toContain('<meta name="keywords" content="tutorial, beginner">');
  });

  it('should escape HTML characters in meta content', async () => {
    const content = `---
title: "Title & More"
description: 'Quoted "text" content'
---
# Content`;
    const html = await buildString(content);
    expect(html).toContain('<meta name="description" content="Quoted &quot;text&quot; content">');
    expect(html).toContain('<meta property="og:title" content="Title &amp; More">');
  });

  it('should generate icon link tags from file metadata', async () => {
    const content = `---
title: "Icon Test"
icon_png: "/favicon-96x96.png"
icon_svg: "/favicon.svg"
icon_ico: "/favicon.ico"
icon_apple: "/apple-touch-icon.png"
manifest: "/site.webmanifest"
---
# Content`;
    const html = await buildString(content);

    expect(html).toContain('<link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96">');
    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg">');
    expect(html).toContain('<link rel="shortcut icon" href="/favicon.ico">');
    expect(html).toContain('<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">');
    expect(html).toContain('<link rel="manifest" href="/site.webmanifest">');
  });

  it('should resolve local icon paths with assetResolver', async () => {
    const testDir = join('/tmp', 'zolt-icon-test-' + Date.now());
    const inputFile = join(testDir, 'test.zlt');
    const outputFile = join(testDir, 'output.html');
    const assetsDir = join(testDir, 'assets');

    await mkdir(assetsDir, { recursive: true });

    await writeFile(join(assetsDir, 'favicon.png'), 'fake png');
    await writeFile(join(assetsDir, 'apple-touch-icon.png'), 'fake apple');

    const content = `---
title: "Local Icons"
icon_png: "assets/favicon.png"
icon_apple: "assets/apple-touch-icon.png"
---
# Content`;

    await writeFile(inputFile, content);

    try {
      await buildFile(inputFile, outputFile);

      const { readFile } = await import('fs/promises');
      const html = await readFile(outputFile, 'utf-8');

      expect(html).toContain('href="assets/favicon.png"');
      expect(html).toContain('href="assets/apple-touch-icon.png"');
    } finally {
      await rm(testDir, { recursive: true, force: true });
    }
  });
});
