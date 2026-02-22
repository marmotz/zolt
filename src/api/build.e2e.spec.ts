import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { unlink, writeFile } from 'fs/promises';
import { buildFile, buildString } from './index';

describe('API: Build', () => {
  const testFilePath = '/tmp/test-build.zlt';
  const testOutputPath = '/tmp/test-build.html';

  beforeEach(async () => {
    await writeFile(testFilePath, '# Hello World\n\nThis is a paragraph.');
  });

  afterEach(async () => {
    try {
      await unlink(testFilePath);
    } catch {}
    try {
      await unlink(testOutputPath);
    } catch {}
  });

  describe('buildString', () => {
    test('should build simple document', async () => {
      const html = await buildString('# Hello World');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<h1>Hello World</h1>');
    });

    test('should build document with paragraph', async () => {
      const html = await buildString('Paragraph text');

      expect(html).toContain('<p>Paragraph text</p>');
    });

    test('should build list', async () => {
      const html = await buildString('- item 1\n- item 2');

      expect(html).toContain('<ul>');
      expect(html).toContain('<li>');
    });

    test('should build list with content', async () => {
      const html = await buildString('- item 1\n- item 2');

      expect(html).toContain('item 1');
      expect(html).toContain('item 2');
    });

    test('should build nested lists', async () => {
      const html = await buildString('- parent\n  - child');

      expect(html).toContain('<ul>');
      expect(html).toContain('<li>parent');
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>child</li>');
    });

    test('should build heading with different levels', async () => {
      const html = await buildString('# H1\n## H2\n### H3');

      expect(html).toContain('<h1>H1</h1>');
      expect(html).toContain('<h2>H2</h2>');
      expect(html).toContain('<h3>H3</h3>');
    });

    test('should build link in paragraph', async () => {
      const html = await buildString('[example.zlt](example.zlt)');

      expect(html).toContain('<a href="example.html">example.zlt</a>');
    });

    test('should build link in list item', async () => {
      const html = await buildString('- [file.zlt](file.zlt) — description');

      expect(html).toContain('<a href="file.html">file.zlt</a>');
      expect(html).toContain('— description');
    });

    test('should build complex document with all features', async () => {
      const html = await buildString(`# Title

Paragraph with [link](url).

## Section

- [item 1](item1.zlt)
- [item 2](item2.zlt)

1. First
2. Second`);

      expect(html).toContain('<h1>Title</h1>');
      expect(html).toContain('<h2>Section</h2>');
      expect(html).toContain('<a href="url">link</a>');
      expect(html).toContain('<a href="item1.html">item 1</a>');
      expect(html).toContain('<ol>');
      expect(html).toContain('First');
    });

    test('should build inline style with color attribute', async () => {
      const html = await buildString('This is ||important||{color=red} text');

      expect(html).toContain('<span style="color: red">important</span>');
    });

    test('should build inline style with multiple attributes', async () => {
      const html = await buildString('||Warning||{color=red font-weight=bold}');

      expect(html).toContain('<span style="color: red; font-weight: bold">Warning</span>');
    });

    test('should build inline style with background', async () => {
      const html = await buildString('||Highlighted||{background=yellow}');

      expect(html).toContain('<span style="background: yellow">Highlighted</span>');
    });

    test('should build inline style with padding', async () => {
      const html = await buildString('||Button||{background=blue color=white padding=4px 8px}');

      expect(html).toContain('<span style="background: blue; color: white; padding: 4px 8px">Button</span>');
    });

    test('should build inline style with border', async () => {
      const html = await buildString('||Bordered||{border=1px solid black}');

      expect(html).toContain('<span style="border: 1px solid black">Bordered</span>');
    });

    test('should build inline style without attributes', async () => {
      const html = await buildString('||Just text||');

      expect(html).toContain('<span>Just text</span>');
    });

    test('should build inline style with font-size', async () => {
      const html = await buildString('||Small||{font-size=0.8em}');

      expect(html).toContain('<span style="font-size: 0.8em">Small</span>');
    });

    test('should build inline style with text-decoration', async () => {
      const html = await buildString('||Strikethrough||{text-decoration=line-through}');

      expect(html).toContain('<span style="text-decoration: line-through">Strikethrough</span>');
    });

    test('should build inline style with border-radius', async () => {
      const html = await buildString('||Rounded||{border=1px solid red border-radius=4px}');

      expect(html).toContain('<span style="border: 1px solid red; border-radius: 4px">Rounded</span>');
    });

    test('should build inline style with display block', async () => {
      const html = await buildString('||Centered||{text-align=center display=block}');

      expect(html).toContain('<span style="text-align: center; display: block">Centered</span>');
    });

    test('should build inline style with hex color', async () => {
      const html = await buildString('||Purple||{color=#8B5CF6}');

      expect(html).toContain('<span style="color: #8B5CF6">Purple</span>');
    });
  });

  describe('superscript and subscript', () => {
    test('should build superscript', async () => {
      const html = await buildString('2^{10} = 1024');

      expect(html).toContain('<sup>10</sup>');
    });

    test('should build subscript', async () => {
      const html = await buildString('H_{2}O is water');

      expect(html).toContain('<sub>2</sub>');
    });

    test('should build nested superscript', async () => {
      const html = await buildString('2^{3^{2}} = 512');

      expect(html).toContain('<sup>3<sup>2</sup></sup>');
    });

    test('should build deeply nested superscript', async () => {
      const html = await buildString('a^{b^{c^{d}}}');

      expect(html).toContain('<sup>b<sup>c<sup>d</sup></sup></sup>');
    });

    test('should build nested subscript', async () => {
      const html = await buildString('x_{y_{z}}');

      expect(html).toContain('<sub>y<sub>z</sub></sub>');
    });

    test('should build superscript with subscript inside', async () => {
      const html = await buildString('a^{b_{c}}');

      expect(html).toContain('<sup>b<sub>c</sub></sup>');
    });

    test('should build subscript with superscript inside', async () => {
      const html = await buildString('a_{b^{c}}');

      expect(html).toContain('<sub>b<sup>c</sup></sub>');
    });
  });

  describe('buildFile', () => {
    test('should build file to output', async () => {
      await buildFile(testFilePath, testOutputPath);

      const { exists } = await import('fs/promises');
      expect(await exists(testOutputPath)).toBe(true);
    });
  });
});
