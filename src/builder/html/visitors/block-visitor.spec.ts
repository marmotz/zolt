import { describe, expect, test } from 'bun:test';
import { HeadingNode, ParagraphNode } from '../../../parser/types';
import { HTMLBuilder } from '../builder';

describe('BlockVisitor', () => {
  const builder = new HTMLBuilder();

  test('should build heading', () => {
    const node: HeadingNode = {
      type: 'Heading',
      level: 1,
      children: [{ type: 'Text', content: 'Hello World' }],
    };

    const html = builder.build(node);
    expect(html).toBe('<h1 id="hello-world">Hello World</h1>');
  });

  test('should build paragraph', () => {
    const node: ParagraphNode = {
      type: 'Paragraph',
      children: [{ type: 'Text', content: 'This is a paragraph' }],
    };

    const html = builder.build(node);
    expect(html).toBe('<p>This is a paragraph</p>');
  });
});
