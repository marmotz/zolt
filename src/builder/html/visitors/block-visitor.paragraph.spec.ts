import { describe, expect, test } from 'bun:test';
import type { ParagraphNode } from '../../../parser/types';
import { BlockVisitor } from './block-visitor.ts';

describe('BlockVisitor Paragraphs', () => {
  test('should not add spaces between inline children', async () => {
    const visitor = new BlockVisitor(
      async () => '',
      async () => '',
      async (nodes) => nodes.map((n: any) => n.content).join(''),
      () => '',
      async () => ''
    );

    const node: ParagraphNode = {
      type: 'Paragraph',
      children: [{ type: 'Text', content: 'hello' } as any, { type: 'Text', content: 'world' } as any],
    };

    const html = await visitor.visitParagraph(node);
    expect(html).toBe('<p>helloworld</p>');
  });
});
