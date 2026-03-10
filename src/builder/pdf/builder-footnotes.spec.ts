import { describe, expect, test } from 'bun:test';
import type { DocumentNode, TextNode } from '../../parser/types';
import { PDFBuilder } from './builder';

describe('PDFBuilder - Footnotes', () => {
  const builder = new PDFBuilder();

  test('should collect and render footnotes at the end', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        {
          type: 'Paragraph',
          children: [{ type: 'Text', content: 'See note' } as TextNode, { type: 'Footnote', id: '1' } as any],
        } as any,
        {
          type: 'FootnoteDefinition',
          id: '1',
          children: [{ type: 'Text', content: 'Note content' } as TextNode],
        } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];

    // Le premier paragraphe contient la référence
    expect(content[0].text[1].linkToDestination).toBe('fn-1');

    // Le dernier élément est la stack de footnotes
    const lastElement = content[content.length - 1];
    expect(lastElement.stack).toBeDefined();
    expect(lastElement.stack[0].columns[0].text).toBe('[1] ');
    expect(lastElement.stack[0].columns[1].stack[0].text).toBe('Note content');
  });
});
