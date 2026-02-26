import { describe, expect, test } from 'bun:test';
import { DocumentNode } from '../../parser/types';
import { HTMLBuilder } from './builder';

describe('HTMLBuilder Anchor Highlight', () => {
  const builder = new HTMLBuilder();

  test('should include anchor highlight CSS in document', async () => {
    const node: DocumentNode = {
      type: 'Document',
      children: [],
      sourceFile: '',
    };

    const html = await builder.buildDocument(node);
    expect(html).toContain('scroll-behavior: smooth;');
    expect(html).toContain(':target {');
    expect(html).toContain('scroll-margin-top: 2rem;');
    expect(html).toContain('animation: zolt-anchor-highlight 3s ease-out;');
    expect(html).toContain('@keyframes zolt-anchor-highlight {');
  });

  test('should include anchor highlight script in document', async () => {
    const node: DocumentNode = {
      type: 'Document',
      children: [],
      sourceFile: '',
    };

    const html = await builder.buildDocument(node);
    expect(html).toContain("window.addEventListener('hashchange', function() {");
    expect(html).toContain("target.style.animation = 'none';");
    expect(html).toContain('target.offsetHeight; // trigger reflow');
  });
});
