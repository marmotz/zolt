import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('API: Definition Lists', () => {
  test('should build simple definition list', async () => {
    const content = `
: HTML
:   HyperText Markup Language
    `.trim();
    const html = await buildString(content);

    expect(html).toContain('<dl>');
    expect(html).toContain('<dt>HTML</dt>');
    expect(html).toContain('<dd>HyperText Markup Language</dd>');
    expect(html).toContain('</dl>');
  });

  test('should build multiple definitions', async () => {
    const content = `
: HTML
:   HyperText Markup Language
: CSS
:   Cascading Style Sheets
    `.trim();
    const html = await buildString(content);

    expect(html).toContain('<dl>');
    expect(html).toContain('<dt>HTML</dt>');
    expect(html).toContain('<dd>HyperText Markup Language</dd>');
    expect(html).toContain('<dt>CSS</dt>');
    expect(html).toContain('<dd>Cascading Style Sheets</dd>');
  });

  test('should build multiple terms for one definition', async () => {
    const content = `
: Term 1
: Term 2
:   Shared definition
    `.trim();
    const html = await buildString(content);

    expect(html).toContain('<dl>');
    expect(html).toContain('<dt>Term 1</dt>');
    expect(html).toContain('<dt>Term 2</dt>');
    expect(html).toContain('<dd>Shared definition</dd>');
  });

  test('should build multiple definitions for one term', async () => {
    const content = `
: Term
:   Definition 1
:   Definition 2
    `.trim();
    const html = await buildString(content);

    expect(html).toContain('<dl>');
    expect(html).toContain('<dt>Term</dt>');
    expect(html).toContain('<dd>Definition 1</dd>');
    expect(html).toContain('<dd>Definition 2</dd>');
  });

  test('should handle attributes on definition list items', async () => {
    const content = `
: HTML {color=red}
:   Language {font-weight=bold}
    `.trim();
    const html = await buildString(content);

    expect(html).toContain('<dt style="color: red">HTML</dt>');
    expect(html).toContain('<dd style="font-weight: bold">Language</dd>');
  });

  test('should handle inline styling in definition list content', async () => {
    const content = `
: **HTML**
:   //HyperText// Markup Language
    `.trim();
    const html = await buildString(content);

    expect(html).toContain('<dt><strong>HTML</strong></dt>');
    expect(html).toContain('<dd><em>HyperText</em> Markup Language</dd>');
  });
});
