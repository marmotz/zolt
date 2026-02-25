import { describe, expect, it } from 'bun:test';
import { buildString } from '../api';

describe('API: Footnotes', () => {
  it('should render basic footnote references and definitions', async () => {
    const source = `This is a note[^1].\n\n[^1]: Footnote content.`;
    const html = await buildString(source);

    expect(html).toContain('This is a note<sup><a href="#fn:1" id="fnref:1">[1]</a></sup>.');
    expect(html).toContain('<section class="footnotes">');
    expect(html).toContain('<li id="fn:1">');
    expect(html).toContain('Footnote content.');
    expect(html).toContain('class="footnote-backref"');
  });

  it('should handle multiple references to the same footnote', async () => {
    const source = `First[^1], second[^1].\n\n[^1]: Shared content.`;
    const html = await buildString(source);

    expect(html).toContain('First<sup><a href="#fn:1" id="fnref:1">[1]</a></sup>');
    expect(html).toContain('second<sup><a href="#fn:1" id="fnref:1:1">[1]</a></sup>');

    expect(html).toContain('<li id="fn:1">');
    // It should have two back-references
    expect(html).toContain('href="#fnref:1"');
    expect(html).toContain('href="#fnref:1:1"');
  });

  it('should support attributes on footnote references', async () => {
    const source = `Note[^1]{.custom-ref}.\n\n[^1]: Content.`;
    const html = await buildString(source);

    expect(html).toContain('<a href="#fn:1" id="fnref:1" class="custom-ref">[1]</a>');
  });

  it('should support attributes on footnote definitions (standalone)', async () => {
    const source = `Note[^1].\n\n[^1]: Content.\n{.custom-fn}`;
    const html = await buildString(source);

    // The attribute should apply to the <li> in the footnotes section
    expect(html).toContain('<li id="fn:1" class="custom-fn">');
  });

  it('should support attributes on footnote definitions (same line)', async () => {
    const source = `Note[^1].\n\n[^1]: Content. {.custom-fn}`;
    const html = await buildString(source);

    expect(html).toContain('<li id="fn:1" class="custom-fn">');
  });

  it('should handle multiple different footnotes in order of appearance', async () => {
    const source = `Second footnote[^2], first footnote[^1].\n\n[^1]: First definition.\n[^2]: Second definition.`;
    const html = await buildString(source);

    // [^2] appears first in text, so it should be [1]
    expect(html).toContain('Second footnote<sup><a href="#fn:2" id="fnref:2">[1]</a></sup>');
    // [^1] appears second in text, so it should be [2]
    expect(html).toContain('first footnote<sup><a href="#fn:1" id="fnref:1">[2]</a></sup>');

    // Section should have them in that order
    const fn2Index = html.indexOf('id="fn:2"');
    const fn1Index = html.indexOf('id="fn:1"');
    expect(fn2Index).toBeLessThan(fn1Index);
  });
});
