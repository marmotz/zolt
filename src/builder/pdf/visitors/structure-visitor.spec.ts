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

  test('should build tabs sequentially', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        {
          type: 'TripleColonBlock',
          blockType: 'tabs',
          children: [
            {
              type: 'TripleColonBlock',
              blockType: 'tab',
              title: 'Tab 1',
              children: [{ type: 'Paragraph', children: [{ type: 'Text', content: 'Content 1' } as TextNode] } as any],
            } as any,
            {
              type: 'TripleColonBlock',
              blockType: 'tab',
              title: 'Tab 2',
              children: [{ type: 'Paragraph', children: [{ type: 'Text', content: 'Content 2' } as TextNode] } as any],
            } as any,
          ],
        } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].stack).toBeDefined();
    expect(content[0].stack.length).toBe(4); // Titre 1, Content 1, Titre 2, Content 2
    expect(content[0].stack[0].text).toBe('Tab 1');
  });

  test('should ignore sidebar', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        {
          type: 'TripleColonBlock',
          blockType: 'sidebar',
          children: [{ type: 'Paragraph', children: [] } as any],
        } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    // Le visiteur retourne { text: '' } pour la sidebar, qui est ensuite filtré par isEmptyText dans builder.ts
    // Si PDFBuilder.buildToDefinition filtre bien, content devrait être vide
    expect(content.length).toBe(0);
  });

  test('should build details block', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        {
          type: 'TripleColonBlock',
          blockType: 'details',
          title: 'More Info',
          children: [{ type: 'Paragraph', children: [{ type: 'Text', content: 'Details' } as TextNode] } as any],
        } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].table).toBeDefined();
    expect(content[0].table.body[0][0].stack[0].text).toBe('More Info');
  });
});
