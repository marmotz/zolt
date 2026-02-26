import { describe, expect, it } from 'bun:test';
import { buildString } from './index';

describe('API: Footnotes', () => {
  it('should render basic footnote references and definitions', async () => {
    const content = 'Text[^1]\n\n[^1]: Note content';
    const html = await buildString(content);

    expect(html).toContain('<a href="#fn:1" id="fnref:1">[1]</a>');
    expect(html).toContain('id="fn-1"');
    expect(html).toContain('class="footnote-item"');
  });

  it('should handle multiple references to the same footnote', async () => {
    const content = 'Ref 1[^reuse], Ref 2[^reuse]\n\n[^reuse]: Shared note';
    const html = await buildString(content);

    expect(html).toContain('Ref 1 <sup><a href="#fn:reuse" id="fnref:reuse">[1]</a></sup> ,');
    expect(html).toContain('Ref 2 <sup><a href="#fn:reuse" id="fnref:reuse:1">[1]</a></sup>');
    expect(html).toContain('href="#fnref-reuse"');
    expect(html).toContain('href="#fnref-reuse:1"');
  });

  it('should support attributes on footnote definitions (standalone)', async () => {
    const content = 'Text[^1]\n\n[^1]: Note content\n{#my-fn}';
    const html = await buildString(content);
    expect(html).toContain('id="fn-1"');
    expect(html).toContain('class="footnote-item"');
  });

  it('should support attributes on footnote definitions (same line)', async () => {
    const content = 'Text[^1]\n\n[^1]: Note content{#my-fn}';
    const html = await buildString(content);
    expect(html).toContain('id="fn-1"');
  });

  it('should handle multiple different footnotes in order of appearance', async () => {
    const content = 'First[^1], Second[^2]\n\n[^1]: One\n[^2]: Two';
    const html = await buildString(content);

    expect(html).toContain('[1]</a>');
    expect(html).toContain('[2]</a>');
    expect(html).toContain('id="fn-1"');
    expect(html).toContain('id="fn-2"');
  });
});
