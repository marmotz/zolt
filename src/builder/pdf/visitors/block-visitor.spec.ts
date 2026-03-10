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
});
