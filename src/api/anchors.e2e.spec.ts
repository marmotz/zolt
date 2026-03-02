import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('API: Heading Anchors', () => {
  test('should include anchor link in headings', async () => {
    const zolt = '# My Heading';
    const html = await buildString(zolt);

    expect(html).toContain('id="my-heading"');
    expect(html).toContain('<a href="#my-heading" class="zolt-anchor" aria-hidden="true">#</a>');
  });

  test('should include anchor link with numbered', async () => {
    const zolt = `
$numbered = true
# First
## Second
`;
    const html = await buildString(zolt);

    // H1 should have anchor but NO numbered (since it's the only H1)
    expect(html).toContain('<h1 id="first"><a href="#first" class="zolt-anchor" aria-hidden="true">#</a>First</h1>');

    // H2 should have anchor AND numbered "1"
    expect(html).toContain(
      '<h2 id="second"><a href="#second" class="zolt-anchor" aria-hidden="true">#</a><span class="zolt-heading-number">1 </span>Second</h2>'
    );
  });

  test('should correctly place anchor before numbered', async () => {
    const zolt = `
$numbered = true
# H1
# H2
`;
    const html = await buildString(zolt);

    // Multiple H1s: they are numbered.
    // The anchor should be BEFORE the numbered span.
    expect(html).toContain(
      '<h1 id="h1"><a href="#h1" class="zolt-anchor" aria-hidden="true">#</a><span class="zolt-heading-number">1 </span>H1</h1>'
    );
    expect(html).toContain(
      '<h1 id="h2"><a href="#h2" class="zolt-anchor" aria-hidden="true">#</a><span class="zolt-heading-number">2 </span>H2</h1>'
    );
  });
});
