import { describe, expect, test } from 'bun:test';
import type { DocumentNode, TextNode } from '../../../parser/types';
import { PDFBuilder } from '../builder';

describe('PDFBuilder - Structure Visitors (Table & SpecialBlocks)', () => {
  const builder = new PDFBuilder();

  test('should build tables', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        {
          type: 'Table',
          header: {
            type: 'TableRow',
            cells: [
              { type: 'TableCell', isHeader: true, children: [{ type: 'Text', content: 'H' } as TextNode] } as any,
            ],
          } as any,
          rows: [
            {
              type: 'TableRow',
              cells: [{ type: 'TableCell', children: [{ type: 'Text', content: 'C' } as TextNode] } as any],
            } as any,
          ],
        } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].table).toBeDefined();
    expect(content[0].table.body[0][0].stack[0].text).toBe('H');
    expect(content[0].table.body[1][0].stack[0].text).toBe('C');
  });

  test('should build alert blocks', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        {
          type: 'TripleColonBlock',
          blockType: 'info',
          title: 'Title',
          children: [{ type: 'Paragraph', children: [{ type: 'Text', content: 'Info' } as TextNode] } as any],
        } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].fillColor).toBe('#cce5ff');
    expect(content[0].table.body[0][0].stack[0].text).toBe('Title');
  });

  test('should build columns', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        {
          type: 'TripleColonBlock',
          blockType: 'columns',
          children: [
            { type: 'Paragraph', children: [{ type: 'Text', content: 'C1' } as TextNode] } as any,
            { type: 'Paragraph', children: [{ type: 'Text', content: 'C2' } as TextNode] } as any,
          ],
        } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].columns).toBeDefined();
    expect(content[0].columns.length).toBe(2);
  });
});
