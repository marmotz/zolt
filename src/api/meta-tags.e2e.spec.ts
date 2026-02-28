import { describe, expect, it } from 'bun:test';
import { buildString } from './index';

describe('Metadata Tags E2E', () => {
  it('should render standard meta tags', async () => {
    const content = `---
title: "My Page"
description: "A cool page"
author: "John Doe"
keywords: [zolt, test]
---
# Hello`;
    const html = await buildString(content);

    expect(html).toContain('<meta name="description" content="A cool page">');
    expect(html).toContain('<meta name="author" content="John Doe">');
    expect(html).toContain('<meta name="keywords" content="zolt, test">');
  });

  it('should render Open Graph meta tags', async () => {
    const content = `---
title: "OG Page"
description: "OG Description"
image: "https://example.com/image.jpg"
ogType: "article"
url: "https://example.com/page"
ogImageWidth: 1200
ogImageHeight: 630
siteName: "My Site"
---
# Hello`;
    const html = await buildString(content);

    expect(html).toContain('<meta property="og:site_name" content="My Site">');
    expect(html).toContain('<meta property="og:type" content="article">');
    expect(html).toContain('<meta property="og:title" content="OG Page">');
    expect(html).toContain('<meta property="og:description" content="OG Description">');
    expect(html).toContain('<meta property="og:url" content="https://example.com/page">');
    expect(html).toContain('<meta property="og:image" content="https://example.com/image.jpg">');
    expect(html).toContain('<meta property="og:image:width" content="1200">');
    expect(html).toContain('<meta property="og:image:height" content="630">');
  });

  it('should render Twitter meta tags', async () => {
    const content = `---
title: "Twitter Page"
description: "Twitter Description"
image: "https://example.com/image.jpg"
twitterSite: "@marmotz"
twitterCreator: "@jane"
---
# Hello`;
    const html = await buildString(content);

    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta name="twitter:site" content="@marmotz">');
    expect(html).toContain('<meta name="twitter:creator" content="@jane">');
    expect(html).toContain('<meta name="twitter:title" content="Twitter Page">');
    expect(html).toContain('<meta name="twitter:description" content="Twitter Description">');
    expect(html).toContain('<meta name="twitter:image" content="https://example.com/image.jpg">');
  });

  it('should use summary card if no image is present', async () => {
    const content = `---
title: "No Image"
---
# Hello`;
    const html = await buildString(content);
    expect(html).toContain('<meta name="twitter:card" content="summary">');
  });

  it('should fallback to title for og:site_name if siteName is missing', async () => {
    const content = `---
title: "My Awesome Page"
---
# Hello`;
    const html = await buildString(content);
    expect(html).toContain('<meta property="og:site_name" content="My Awesome Page">');
  });

  it('should use ogTitle and ogDescription if provided, with fallbacks', async () => {
    const content = `---
title: "Standard Title"
description: "Standard Description"
ogTitle: "OG Specific Title"
ogDescription: "OG Specific Description"
---
# Hello`;
    const html = await buildString(content);

    // Standard tags should use standard metadata
    expect(html).toContain('<meta name="description" content="Standard Description">');

    // OG and Twitter tags should use OG metadata
    expect(html).toContain('<meta property="og:title" content="OG Specific Title">');
    expect(html).toContain('<meta property="og:description" content="OG Specific Description">');
    expect(html).toContain('<meta name="twitter:title" content="OG Specific Title">');
    expect(html).toContain('<meta name="twitter:description" content="OG Specific Description">');
  });

  it('should make image URL absolute if url is provided', async () => {
    const content = `---
title: "Absolute Image"
url: "https://zolt.marmotz.dev"
image: "assets/img.png"
---
# Hello`;
    const html = await buildString(content);

    expect(html).toContain('<meta property="og:image" content="https://zolt.marmotz.dev/assets/img.png">');
    expect(html).toContain('<meta name="twitter:image" content="https://zolt.marmotz.dev/assets/img.png">');
  });
});
