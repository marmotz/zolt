import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { unlink, writeFile } from 'node:fs/promises';
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
      expect(html).toMatch(/<h1[^>]*>Hello World<\/h1>/);
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

      expect(html).toMatch(/<h1[^>]*>H1<\/h1>/);
      expect(html).toMatch(/<h2[^>]*>H2<\/h2>/);
      expect(html).toMatch(/<h3[^>]*>H3<\/h3>/);
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

      expect(html).toMatch(/<h1[^>]*>Title<\/h1>/);
      expect(html).toMatch(/<h2[^>]*>Section<\/h2>/);
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
      const html = await buildString('||Warning||{color=red fontWeight=bold}');

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
      const html = await buildString('||Small||{fontSize=0.8em}');

      expect(html).toContain('<span style="font-size: 0.8em">Small</span>');
    });

    test('should build inline style with text-decoration', async () => {
      const html = await buildString('||Strikethrough||{textDecoration=line-through}');

      expect(html).toContain('<span style="text-decoration: line-through">Strikethrough</span>');
    });

    test('should build inline style with border-radius', async () => {
      const html = await buildString('||Rounded||{border=1px solid red borderRadius=4px}');

      expect(html).toContain('<span style="border: 1px solid red; border-radius: 4px">Rounded</span>');
    });

    test('should build inline style with display block', async () => {
      const html = await buildString('||Centered||{textAlign=center display=block}');

      expect(html).toContain('<span style="text-align: center; display: block">Centered</span>');
    });

    test('should build inline style with hex color', async () => {
      const html = await buildString('||Purple||{color=#8B5CF6}');

      expect(html).toContain('<span style="color: #8B5CF6">Purple</span>');
    });

    test('should NOT replace variables inside inline code spans', async () => {
      const html = await buildString('$var = "REPLACED"\nCode: `{$var}`');

      expect(html).toContain('<code>{$var}</code>');
      expect(html).not.toContain('<code>REPLACED</code>');
    });

    test('should NOT replace expressions inside inline code spans', async () => {
      const html = await buildString('Code: `{{1 + 1}}`');

      expect(html).toContain('<code>{{1 + 1}}</code>');
      expect(html).not.toContain('<code>2</code>');
    });

    test('should merge list items generated in a loop into a single list', async () => {
      const zolt = `
$items = ["Apple", "Banana", "Cherry"]

:::foreach {$items as $item}
- {$item}
:::
`;
      const html = await buildString(zolt);
      const ulCount = (html.match(/<ul>/g) || []).length;
      const liCount = (html.match(/<li>/g) || []).length;

      expect(ulCount).toBe(1);
      expect(liCount).toBe(3);
    });

    test('should merge lists separated by a conditional block', async () => {
      const zolt = `
- Item 1
:::if {true}
- Item 2
:::
- Item 3
`;
      const html = await buildString(zolt);
      const ulCount = (html.match(/<ul>/g) || []).length;
      const liCount = (html.match(/<li>/g) || []).length;

      expect(ulCount).toBe(1);
      expect(liCount).toBe(3);
    });

    // biome-ignore lint/suspicious/noTemplateCurlyInString: Testing Zolt variables that look like JS templates
    test('should NOT confuse ${$var} or ${{$var}} with math formulas', async () => {
      // biome-ignore lint/suspicious/noTemplateCurlyInString: Testing Zolt variables that look like JS templates
      const zolt = '\n$price = 100\n- Price: ${$price}\n- Double: ${{$price * 2}}\n';
      const html = await buildString(zolt);

      expect(html).toContain('Price: $100');
      expect(html).toContain('Double: $200');
      expect(html).not.toContain('katex');
    });

    describe('Heading Numbering', () => {
      test('should NOT number single H1 and start numbering from H2', async () => {
        const zolt = `
# Main Title
## Section 1{numbering}
## Section 2{numbering}
`;
        const html = await buildString(zolt);
        expect(html).not.toContain('zolt-heading-number">1 </span>Main Title');
        expect(html).toContain('zolt-heading-number">1 </span>Section 1');
        expect(html).toContain('zolt-heading-number">2 </span>Section 2');
      });

      test('should number H1 if there are multiple H1s', async () => {
        const zolt = `
# Part 1{numbering}
# Part 2{numbering}
`;
        const html = await buildString(zolt);
        expect(html).toContain('zolt-heading-number">1 </span>Part 1');
        expect(html).toContain('zolt-heading-number">2 </span>Part 2');
      });

      test('should support global numbering with $numbering', async () => {
        const zolt = `---
numbering: true
---
# Title 1
# Title 2
## Section 1
## Section 2
`;
        const html = await buildString(zolt);
        expect(html).toContain('zolt-heading-number">1 </span>Title 1');
        expect(html).toContain('zolt-heading-number">2 </span>Title 2');
        expect(html).toContain('zolt-heading-number">2.1 </span>Section 1');
      });

      test('should respect $numbering style globally', async () => {
        const zolt = `---
numbering: "roman-upper"
---
# Title 1
# Title 2
## Section
`;
        const html = await buildString(zolt);
        expect(html).toContain('zolt-heading-number">I </span>Title 1');
        expect(html).toContain('zolt-heading-number">II </span>Title 2');
        expect(html).toContain('zolt-heading-number">II.I </span>Section');
      });

      test('should support numbering variable in document body', async () => {
        const zolt = `
$numbering = true
# Title 1
# Title 2
## Section 1
`;
        const html = await buildString(zolt);
        expect(html).toContain('zolt-heading-number">1 </span>Title 1');
        expect(html).toContain('zolt-heading-number">2 </span>Title 2');
        expect(html).toContain('zolt-heading-number">2.1 </span>Section 1');
      });

      test('should support mixed numbering styles via comma-separated list', async () => {
        const zolt = `---
numbering: "decimal, alpha-lower, roman-upper"
---
# Part
## Chapter
### Section
`;
        const html = await buildString(zolt);
        // Note: Part is H1 unique, so it's not numbered.
        // Chapter is H2 -> level 1 of numbering -> uses 'decimal'
        // Section is H3 -> level 2 of numbering -> uses 'alpha-lower'
        expect(html).toContain('zolt-heading-number">1 </span>Chapter');
        expect(html).toContain('zolt-heading-number">1.a </span>Section');
      });

      test('should allow toggling numbering mid-document', async () => {
        const zolt = `
# Title 1
$numbering = true
# Title 2
$numbering = false
# Title 3
`;
        const html = await buildString(zolt);
        expect(html).not.toContain('zolt-heading-number">1 </span>Title 1');
        expect(html).toContain('zolt-heading-number">2 </span>Title 2');
        expect(html).not.toContain('zolt-heading-number">3 </span>Title 3');
      });
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

      const { exists } = await import('node:fs/promises');
      expect(await exists(testOutputPath)).toBe(true);
    });
  });
});
