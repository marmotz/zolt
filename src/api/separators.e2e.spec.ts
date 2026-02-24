import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('Separators E2E', () => {
  test('should build basic horizontal rule', async () => {
    const html = await buildString('---');
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-width: 2px');
    expect(html).toContain('border-top-style: solid');
  });

  test('should build thick horizontal rule', async () => {
    const html = await buildString('***');
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-width: 4px');
  });

  test('should build thin horizontal rule', async () => {
    const html = await buildString('___');
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-width: 1px');
  });

  test('should build horizontal rule with color attribute', async () => {
    const html = await buildString('--- {color=red}');
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-color: red');
  });

  test('should build horizontal rule with blue color', async () => {
    const html = await buildString('*** {color=blue}');
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-color: blue');
  });

  test('should build horizontal rule with green color', async () => {
    const html = await buildString('___ {color=green}');
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-color: green');
  });

  test('should build horizontal rule with dashed style', async () => {
    const html = await buildString('--- {style=dashed}');
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-style: dashed');
  });

  test('should build horizontal rule with dotted style', async () => {
    const html = await buildString('--- {style=dotted}');
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-style: dotted');
  });

  test('should build horizontal rule with solid style', async () => {
    const html = await buildString('--- {style=solid}');
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-style: solid');
  });

  test('should build horizontal rule with width in percentage', async () => {
    const html = await buildString('--- {width=50%}');
    expect(html).toContain('<hr');
    expect(html).toContain('width: 50%');
  });

  test('should build horizontal rule with width in pixels', async () => {
    const html = await buildString('--- {width=200px}');
    expect(html).toContain('<hr');
    expect(html).toContain('width: 200px');
  });

  test('should build horizontal rule with width in em', async () => {
    const html = await buildString('--- {width=30em}');
    expect(html).toContain('<hr');
    expect(html).toContain('width: 30em');
  });

  test('should build horizontal rule with left alignment', async () => {
    const html = await buildString('--- {align=left}');
    expect(html).toContain('<hr');
    expect(html).toContain('margin-right: auto');
    expect(html).not.toContain('margin-left: auto');
  });

  test('should build horizontal rule with center alignment', async () => {
    const html = await buildString('--- {align=center}');
    expect(html).toContain('<hr');
    expect(html).toContain('margin-left: auto');
    expect(html).toContain('margin-right: auto');
  });

  test('should build horizontal rule with right alignment', async () => {
    const html = await buildString('--- {align=right}');
    expect(html).toContain('<hr');
    expect(html).toContain('margin-left: auto');
    expect(html).not.toContain('margin-right: auto');
  });

  test('should build horizontal rule with multiple attributes', async () => {
    const html = await buildString('--- {color=blue style=dashed width=80%}');
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-color: blue');
    expect(html).toContain('border-top-style: dashed');
    expect(html).toContain('width: 80%');
  });

  test('should build thick horizontal rule with multiple attributes', async () => {
    const html = await buildString('*** {color=red style=solid width=300px align=center}');
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-width: 4px');
    expect(html).toContain('border-top-color: red');
    expect(html).toContain('border-top-style: solid');
    expect(html).toContain('width: 300px');
    expect(html).toContain('margin-left: auto');
    expect(html).toContain('margin-right: auto');
  });

  test('should build thin horizontal rule with multiple attributes', async () => {
    const html = await buildString('___ {color=purple style=dotted width=60% align=right}');
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-width: 1px');
    expect(html).toContain('border-top-color: purple');
    expect(html).toContain('border-top-style: dotted');
    expect(html).toContain('width: 60%');
    expect(html).toContain('margin-left: auto');
    expect(html).not.toContain('margin-right: auto');
  });

  test('should build document with multiple separators', async () => {
    const html = await buildString(`# Title

---

Some content

***

More content

___`);

    expect(html).toContain('Title</h1>');
    expect(html).toContain('border-top-width: 2px');
    expect(html).toContain('border-top-width: 4px');
    expect(html).toContain('border-top-width: 1px');
  });

  test('should build separator between paragraphs', async () => {
    const html = await buildString(`First paragraph

---

Second paragraph`);

    expect(html).toContain('<p>First paragraph</p>');
    expect(html).toContain('<hr');
    expect(html).toContain('<p>Second paragraph</p>');
  });

  test('should build separator with gray color', async () => {
    const html = await buildString('*** {color=gray}');
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-color: gray');
  });

  test('should build separator with orange color', async () => {
    const html = await buildString('--- {color=orange style=dashed}');
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-color: orange');
    expect(html).toContain('border-top-style: dashed');
  });

  test('should build separator with teal color', async () => {
    const html = await buildString('--- {color=teal style=dotted}');
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-color: teal');
    expect(html).toContain('border-top-style: dotted');
  });
});
