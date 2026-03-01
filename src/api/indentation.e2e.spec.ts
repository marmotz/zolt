import { expect, test } from 'bun:test';
import { buildString } from './index';

test('should build simple technical indentation', async () => {
  const html = await buildString('& Indented text');
  expect(html).toContain('<div class="indented" style="margin-left: 2em">');
  expect(html).toContain('<p>Indented text</p>');
  expect(html).toContain('</div>');
});

test('should build multiple lines of technical indentation', async () => {
  const html = await buildString(`& Line 1\n& Line 2`);
  expect(html).toContain('<div class="indented" style="margin-left: 2em">');
  expect(html).toContain('<p>Line 1</p>');
  expect(html).toContain('<p>Line 2</p>');
  expect(html).toContain('</div>');
});

test('should build nested technical indentation', async () => {
  const html = await buildString(`& Level 1\n&& Level 2`);
  expect(html).toContain('<div class="indented" style="margin-left: 2em">');
  expect(html).toContain('<p>Level 1</p>');
  expect(html).toContain('<div class="indented" style="margin-left: 2em">');
  expect(html).toContain('<p>Level 2</p>');
});

test('should distinguish technical indentation from blockquotes', async () => {
  const html = await buildString(`& Indent\n> Quote`);
  expect(html).toContain('<div class="indented" style="margin-left: 2em">');
  expect(html).toContain('<p>Indent</p>');
  expect(html).toContain('<blockquote>');
  expect(html).toContain('<p>Quote</p>');
});

test('should parse ordered list inside indentation', async () => {
  const html = await buildString(`& Steps:\n& 1. First step\n& 2. Second step\n& 3. Third step`);
  expect(html).toContain('<div class="indented" style="margin-left: 2em">');
  expect(html).toContain('<p>Steps:</p>');
  expect(html).toContain('<ol>');
  expect(html).toContain('<li>First step</li>');
  expect(html).toContain('<li>Second step</li>');
  expect(html).toContain('<li>Third step</li>');
  expect(html).toContain('</ol>');
});

test('should parse bullet list inside indentation', async () => {
  const html = await buildString(`& Items:\n& - Item 1\n& - Item 2`);
  expect(html).toContain('<div class="indented" style="margin-left: 2em">');
  expect(html).toContain('<p>Items:</p>');
  expect(html).toContain('<ul>');
  expect(html).toContain('<li>Item 1</li>');
  expect(html).toContain('<li>Item 2</li>');
  expect(html).toContain('</ul>');
});

test('should handle indentation levels returning to previous level', async () => {
  const html = await buildString(`& Level 1\n&& Level 2\n&&& Level 3\n&& Back to level 2\n& Back to level 1`);
  expect(html).toContain('<div class="indented" style="margin-left: 2em">');
  expect(html).toContain('<div class="indented" style="margin-left: 2em">');
  expect(html).toContain('<div class="indented" style="margin-left: 2em">');
  expect(html).toContain('<p>Level 1</p>');
  expect(html).toContain('<p>Level 2</p>');
  expect(html).toContain('<p>Level 3</p>');
  expect(html).toContain('<p>Back to level 2</p>');
  expect(html).toContain('<p>Back to level 1</p>');
});

test('should group multiple lines at same indentation level', async () => {
  const html = await buildString(`& Line A\n& Line B\n& Line C`);
  const divMatches = html.match(/<div class="indented"/g);
  expect(divMatches?.length).toBe(1);
  expect(html).toContain('<p>Line A</p>');
  expect(html).toContain('<p>Line B</p>');
  expect(html).toContain('<p>Line C</p>');
});

test('should build indentation with heading', async () => {
  const html = await buildString(`& ## Heading inside indentation\n& Some text`);
  expect(html).toContain('<div class="indented" style="margin-left: 2em">');
  expect(html).toMatch(/<h2[^>]*>.*Heading inside indentation<\/h2>/);
  expect(html).toContain('<p>Some text</p>');
});

test('should build indentation with inline formatting and attributes', async () => {
  const html = await buildString(`& **Bold** and //italic// text\n& Colored text{color=blue}`);
  expect(html).toContain('<strong>Bold</strong>');
  expect(html).toContain('<em>italic</em>');
  expect(html).toContain('style="color: blue"');
});
