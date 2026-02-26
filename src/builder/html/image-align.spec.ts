import { describe, expect, test } from 'bun:test';
import { ImageNode, ParagraphNode } from '../../parser/types';
import { HTMLBuilder } from './builder';

describe('HTMLBuilder Image Alignment', () => {
  const builder = new HTMLBuilder();

  test('should apply text-align: center to paragraph when it contains only an image with align=center', async () => {
    const imageNode: ImageNode = {
      type: 'Image',
      src: 'img.jpg',
      alt: 'Centered Image',
      attributes: { align: 'center', width: '100px' },
    };

    const paragraphNode: ParagraphNode = {
      type: 'Paragraph',
      children: [imageNode],
    };

    const html = await builder.build(paragraphNode);
    // The style attribute might be rendered with or without spaces depending on implementation details
    // but based on my code: node.attributes.style = `${currentStyle}text-align: center`;
    // and renderAllAttributes probably adds style="..."
    expect(html).toContain('<p style="text-align: center">');
    expect(html).toContain('<img src="img.jpg" alt="Centered Image" style="width: 100px">');
    expect(html).not.toContain('align="center"');
  });

  test('should not apply text-align: center if paragraph has other content', async () => {
    const imageNode: ImageNode = {
      type: 'Image',
      src: 'img.jpg',
      alt: 'Centered Image',
      attributes: { align: 'center' },
    };

    const paragraphNode: ParagraphNode = {
      type: 'Paragraph',
      children: [{ type: 'Text', content: 'Some text ' }, imageNode],
    };

    const html = await builder.build(paragraphNode);
    expect(html).not.toContain('text-align: center');
    expect(html).toContain('<img src="img.jpg" alt="Centered Image" align="center">');
  });

  test('should preserve existing paragraph styles', async () => {
    const imageNode: ImageNode = {
      type: 'Image',
      src: 'img.jpg',
      alt: 'Centered Image',
      attributes: { align: 'center' },
    };

    const paragraphNode: ParagraphNode = {
      type: 'Paragraph',
      children: [imageNode],
      attributes: { style: 'color: red' },
    };

    const html = await builder.build(paragraphNode);
    expect(html).toContain('style="color: red;text-align: center"');
  });
});
