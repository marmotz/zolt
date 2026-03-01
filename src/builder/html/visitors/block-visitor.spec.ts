import { describe, expect, test } from 'bun:test';
import type { HeadingNode, ParagraphNode } from '../../../parser/types';
import { HTMLBuilder } from '../builder';

describe('BlockVisitor', () => {
  const builder = new HTMLBuilder();

  test('should build heading', async () => {
    const node: HeadingNode = {
      type: 'Heading',
      level: 1,
      children: [{ type: 'Text', content: 'Hello World' }],
    };

    const html = await builder.build(node);
    expect(html).toBe('<h1 id="hello-world">Hello World</h1>');
  });

  test('should build paragraph', async () => {
    const node: ParagraphNode = {
      type: 'Paragraph',
      children: [{ type: 'Text', content: 'This is a paragraph' }],
    };

    const html = await builder.build(node);
    expect(html).toBe('<p>This is a paragraph</p>');
  });
});
