import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('API: TOC', () => {
  test('should generate basic TOC', async () => {
    const zolt = `
[[toc]]

# Heading 1
## Heading 2
`;
    const html = await buildString(zolt);
    expect(html).toContain('<nav class="zolt-toc">');
    expect(html).toContain('<a href="#heading-1">Heading 1</a>');
    expect(html).toContain('<a href="#heading-2">Heading 2</a>');
  });

  test('should support depth attribute', async () => {
    const zolt = `
[[toc {depth=1}]]

# Heading 1
## Heading 2
`;
    const html = await buildString(zolt);
    expect(html).toContain('Heading 1');
    expect(html).not.toContain('Heading 2</a>');
  });

  test('should support from and to attributes', async () => {
    const zolt = `
[[toc {from=2 to=2}]]

# Heading 1
## Heading 2
### Heading 3
`;
    const html = await buildString(zolt);
    const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/);
    const navHtml = navMatch ? navMatch[1] : '';

    expect(navHtml).not.toContain('Heading 1');
    expect(navHtml).toContain('Heading 2');
    expect(navHtml).not.toContain('Heading 3');
  });

  test('should support to attribute greater than default depth', async () => {
    const zolt = `
[[toc {from=2 to=4}]]

# H1
## H2
### H3
#### H4
##### H5
`;
    const html = await buildString(zolt);
    const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/);
    const navHtml = navMatch ? navMatch[1] : '';

    expect(navHtml).not.toContain('H1');
    expect(navHtml).toContain('H2');
    expect(navHtml).toContain('H3');
    expect(navHtml).toContain('H4');
    expect(navHtml).not.toContain('H5');
  });

  test('should support numbering attribute', async () => {
    const zolt = `
[[toc {numbering=true}]]

# Heading 1
## Heading 2
`;
    const html = await buildString(zolt);
    expect(html).toContain('<span class="zolt-toc-number">1</span>');
    expect(html).toContain('<span class="zolt-toc-number">1.1</span>');
  });

  test('should support custom class', async () => {
    const zolt = `
[[toc {class=custom-toc}]]

# Heading 1
`;
    const html = await buildString(zolt);
    expect(html).toContain('class="zolt-toc custom-toc"');
  });

  test('should generate slugs for headings', async () => {
    const zolt = `
[[toc]]

# My Awesome Heading!
`;
    const html = await buildString(zolt);
    expect(html).toContain('<h1 id="my-awesome-heading">My Awesome Heading!</h1>');
    expect(html).toContain('<a href="#my-awesome-heading">My Awesome Heading!</a>');
  });

  test('should preserve formatting in TOC and Headings', async () => {
    const zolt = `
[[toc]]

# Heading with **bold**
`;
    const html = await buildString(zolt);
    expect(html).toContain('Heading with <strong>bold</strong>');
    expect(html).toContain('<a href="#heading-with-bold">Heading with <strong>bold</strong></a>');
  });

  test('should handle nested TOC structure', async () => {
    const zolt = `
[[toc]]

# H1
## H2
### H3
# H1-bis
`;
    const html = await buildString(zolt);
    // H1 is at depth 0 (relative to from=1)
    // H2 is at depth 1 -> should have one <ul>
    // H3 is at depth 2 -> should have another <ul>
    expect(html).toContain('<li class="toc-level-1">');
    expect(html).toContain('<ul>'); // outer
    expect(html).toContain('<ul>'); // for H2
    expect(html).toContain('<ul>'); // for H3
  });

  test('should not render internal attributes in HTML', async () => {
    const zolt = `
[[toc {from=2 to=4 depth=3 numbering=true}]]

# H1
## H2
`;
    const html = await buildString(zolt);
    expect(html).toContain('<nav class="zolt-toc">');
    expect(html).not.toContain('from="2"');
    expect(html).not.toContain('to="4"');
    expect(html).not.toContain('depth="3"');
    expect(html).not.toContain('numbering="true"');
  });
});
