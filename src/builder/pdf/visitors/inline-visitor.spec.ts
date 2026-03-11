import { describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import { join } from 'node:path';
import type { DocumentNode, TextNode } from '../../../parser/types';
import { PDFBuilder } from '../builder';

describe('PDFBuilder - InlineVisitor', () => {
  const builder = new PDFBuilder();

  test('should build text nodes', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        {
          type: 'Paragraph',
          children: [{ type: 'Text', content: 'Hello' } as TextNode],
        } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].text[0].text).toBe('Hello');
  });

  test('should build inline styles (bold, italic)', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        {
          type: 'Paragraph',
          children: [
            {
              type: 'Bold',
              children: [{ type: 'Text', content: 'B' } as TextNode],
            } as any,
            {
              type: 'Italic',
              children: [{ type: 'Text', content: 'I' } as TextNode],
            } as any,
          ],
        } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    const paragraphContent = content[0].text;
    expect(paragraphContent[0].style).toBe('bold');
    expect(paragraphContent[1].style).toBe('italic');
  });

  test('should build code nodes', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [{ type: 'Code', content: 'code' } as any],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].text).toBe('code');
    expect(content[0].style).toBe('code');
  });

  test('should build link nodes', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        {
          type: 'Link',
          href: 'https://zolt.dev',
          children: [{ type: 'Text', content: 'Zolt' } as TextNode],
        } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].link).toBe('https://zolt.dev');
  });

  test('should build subscripts and superscripts', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        {
          type: 'Paragraph',
          children: [
            { type: 'Superscript', children: [{ type: 'Text', content: 'sup' } as TextNode] } as any,
            { type: 'Subscript', children: [{ type: 'Text', content: 'sub' } as TextNode] } as any,
          ],
        } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].text[0].sup).toBe(true);
    expect(content[0].text[1].sub).toBe(true);
  });

  test('should build images', async () => {
    const tmpImg = join(process.cwd(), 'test-inline-image.png');
    fs.writeFileSync(tmpImg, 'dummy');

    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [{ type: 'Image', src: tmpImg, alt: 'A' } as any],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].image).toContain('data:image/png;base64,');

    fs.unlinkSync(tmpImg);
  });

  test('should build media nodes as links', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        { type: 'Video', src: 'v.mp4', alt: 'Vid' } as any,
        { type: 'Audio', src: 'a.mp3' } as any,
        { type: 'Embed', src: 'e.html', title: 'Emb' } as any,
        { type: 'File', src: 'f.pdf', title: 'Doc' } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].link).toBe('v.mp4');
    expect(content[1].link).toBe('a.mp3');
    expect(content[2].link).toBe('e.html');
    expect(content[3].link).toBe('f.pdf');
  });

  test('should build footnotes and abbreviations', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        { type: 'Footnote', id: '1' } as any,
        { type: 'Abbreviation', abbreviation: 'Z', definition: 'Zolt' } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].linkToDestination).toBe('fn-1');
    expect(content[1].text).toBe('Z');
  });

  test('should build math and comments', async () => {
    const ast: DocumentNode = {
      type: 'Document',
      sourceFile: 'test.zlt',
      children: [
        { type: 'Math', content: 'E=mc^2', isBlock: false } as any,
        { type: 'CommentInline', content: 'hidden' } as any,
      ],
    };

    const docDef = await builder.buildToDefinition(ast);
    const content = docDef.content as any[];
    expect(content[0].text).toBe('E=mc^2');
    // Le commentaire vide est filtré par PDFBuilder.buildToDefinition
    expect(content.length).toBe(1);
  });
});
