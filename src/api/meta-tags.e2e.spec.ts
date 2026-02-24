import { describe, expect, it } from 'bun:test';
import { buildString } from './index';

describe('E2E: Meta Tags Generation', () => {
  it('should generate standard meta tags from frontmatter', async () => {
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
});
