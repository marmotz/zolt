import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('Blockquotes E2E', () => {
  test('should build simple blockquote', async () => {
    const html = await buildString('> This is a simple blockquote.');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('This is a simple blockquote.');
    expect(html).toContain('</blockquote>');
  });

  test('should build multi-line blockquote as single blockquote', async () => {
    const html = await buildString('> Line 1\n> Line 2');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('Line 1');
    expect(html).toContain('Line 2');

    const blockquoteCount = (html.match(/<blockquote>/g) || []).length;
    expect(blockquoteCount).toBe(1);
  });

  test('should build blockquote with attributes', async () => {
    const html = await buildString('> This quote has an ID {#quote1}');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('id="quote1"');
  });

  test('should build nested blockquote', async () => {
    const html = await buildString('> Level 1\n> > Level 2');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('Level 1');
    expect(html).toContain('Level 2');

    const blockquoteCount = (html.match(/<blockquote>/g) || []).length;
    expect(blockquoteCount).toBe(2);
  });

  test('should build three-level nested blockquote', async () => {
    const html = await buildString('> Level 1\n> > Level 2\n> > > Level 3');
    expect(html).toContain('Level 1');
    expect(html).toContain('Level 2');
    expect(html).toContain('Level 3');

    const blockquoteCount = (html.match(/<blockquote>/g) || []).length;
    expect(blockquoteCount).toBe(3);
  });

  test('should build blockquote with content before and after nested blockquote', async () => {
    const html = await buildString('> Level 1 quote\n>\n> > Level 2 quote\n>\n> Back to level 1');
    expect(html).toContain('Level 1 quote');
    expect(html).toContain('Level 2 quote');
    expect(html).toContain('Back to level 1');
  });

  test('should build blockquote with list', async () => {
    const html = await buildString('> - Item 1\n> - Item 2');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Item 1</li>');
    expect(html).toContain('<li>Item 2</li>');
  });

  test('should build separate blockquotes separated by blank line', async () => {
    const html = await buildString('> First quote\n\n> Second quote');
    const blockquoteCount = (html.match(/<blockquote>/g) || []).length;
    expect(blockquoteCount).toBe(2);
  });

  test('should build blockquote with inline formatting', async () => {
    const html = await buildString('> **Bold** and //italic// in quote');
    expect(html).toContain('<strong>Bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });
});
