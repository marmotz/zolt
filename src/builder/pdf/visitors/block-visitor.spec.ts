import { describe, expect, test } from 'bun:test';
import type { DocumentNode, TextNode } from '../../../parser/types';
import { PDFBuilder } from '../builder';

describe('PDFBuilder - BlockVisitor', () => {
  const builder = new PDFBuilder();

  test('should build paragraphs', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [{ type: 'Paragraph', children: [{ type: 'Text', content: 'P' } as TextNode] } as any],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].style).toBe('paragraph');
  });

  test('should build headings', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [{ type: 'Heading', level: 1, children: [{ type: 'Text', content: 'H' } as TextNode] } as any],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].style).toBe('header1');
  });

  test('should build blockquotes', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [{ type: 'Blockquote', children: [{ type: 'Paragraph', children: [] } as any] } as any],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].style).toBe('blockquote');
    expect(content[0].stack).toBeDefined();
  });

  test('should build lists', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        {
          type: 'List',
          kind: 'bullet',
          children: [{ type: 'ListItem', children: [{ type: 'Text', content: 'I' } as TextNode] } as any],
        } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].ul).toBeDefined();
    expect(content[0].ul[0].text).toBe('I');
  });

  test('should build task lists with checkboxes', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        {
          type: 'List',
          kind: 'task',
          children: [
            { type: 'ListItem', checked: true, children: [{ type: 'Text', content: 'Done' } as TextNode] } as any,
            { type: 'ListItem', checked: false, children: [{ type: 'Text', content: 'Todo' } as TextNode] } as any,
          ],
        } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].ul).toBeDefined();
    // Les items de tâches utilisent des colonnes pour la checkbox
    expect(content[0].ul[0].columns[0].text).toBe('☑ ');
    expect(content[0].ul[1].columns[0].text).toBe('☐ ');
  });

  test('should build plain lists', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        {
          type: 'List',
          kind: 'plain',
          children: [{ type: 'ListItem', children: [{ type: 'Text', content: 'Item' } as TextNode] } as any],
        } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].stack).toBeDefined();
    expect(content[0].stack[0].text).toBe('Item');
  });

  test('should build definition lists', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        {
          type: 'List',
          kind: 'definition',
          children: [
            { type: 'DefinitionTerm', children: [{ type: 'Text', content: 'Term' } as TextNode] } as any,
            { type: 'DefinitionDescription', children: [{ type: 'Text', content: 'Desc' } as TextNode] } as any,
          ],
        } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].stack).toBeDefined();
    expect(content[0].stack[0].bold).toBe(true);
    expect(content[0].stack[1].margin[0]).toBe(15);
  });

  test('should build code blocks', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [{ type: 'CodeBlock', content: 'const x = 1;' } as any],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].table).toBeDefined();
    expect(content[0].table.body[0][0].text).toBe('const x = 1;');
  });

  test('should build horizontal rules', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [{ type: 'HorizontalRule' } as any],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].canvas).toBeDefined();
  });

  test('should apply ID attributes on blocks', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        {
          type: 'Heading',
          level: 1,
          children: [{ type: 'Text', content: 'H' } as TextNode],
          attributes: { id: 'my-id' },
        } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].id).toBe('my-id');
  });

  test('should handle nested Document nodes and context switching', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: '/base/doc1.zlt',
      children: [
        {
          type: 'Link',
          href: 'doc2.zlt',
          children: [{ type: 'Text', content: 'Link to 2' } as TextNode],
        } as any,
        {
          type: 'Document',
          sourceFile: '/base/doc2.zlt',
          children: [
            {
              type: 'Link',
              href: 'doc1.zlt',
              children: [{ type: 'Text', content: 'Link to 1' } as TextNode],
            } as any,
          ],
        } as any,
      ],
    };

    const builderWithContext = new PDFBuilder(undefined, undefined, '/base', '/base/doc1.zlt');
    const docDef = await builderWithContext.buildToDefinition(ast);
    const content = docDef.content as any[];

    // First link in doc1.zlt should point to doc2.zlt (as an anchor)
    expect(content[0].linkToDestination).toBe('file_doc2_zlt');

    // Second link in nested doc2.zlt should point back to doc1.zlt
    expect(content[1].linkToDestination).toBe('file_doc1_zlt');
  });
});
