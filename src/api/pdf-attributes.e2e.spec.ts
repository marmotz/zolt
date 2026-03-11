import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('PDF Build - Section 7 Attributes', () => {
  const options = { type: 'pdf' as const };

  test('should apply ID and class attributes', async () => {
    const input = `
# Heading {#my-id .my-class}

Paragraph {.p-class}
    `;

    const result = await buildString(input, options);
    const docDef = JSON.parse(result);

    const headings = docDef.content.filter(
      (c: any) => c.style && (c.style === 'header1' || (Array.isArray(c.style) && c.style.includes('header1')))
    );
    const paragraphs = docDef.content.filter(
      (c: any) => c.style && (c.style === 'paragraph' || (Array.isArray(c.style) && c.style.includes('paragraph')))
    );

    expect(headings[0].id).toBe('my-id');
    expect(headings[0].style).toContain('my-class');

    expect(paragraphs[0].style).toContain('p-class');
  });

  test('should apply inline style attributes (color, background, fontSize)', async () => {
    const input = `
**Colored Bold**{color=red background=yellow fontSize=20}

[Linked Text](https://zlt.dev){color=green}
    `;

    const result = await buildString(input, options);
    const docDef = JSON.parse(result);

    const paragraph = docDef.content[0];
    const boldText = paragraph.text[0];
    const link = docDef.content[1].text[0];

    expect(boldText.color).toBe('red');
    expect(boldText.background).toBe('yellow');
    expect(boldText.fontSize).toBe(20);

    expect(link.color).toBe('green');
  });

  test('should apply generic attributes and basic types conversion', async () => {
    const input = `
:::info {bold=true italics=false opacity=0.5}
Info content
:::
    `;

    const result = await buildString(input, options);
    const docDef = JSON.parse(result);

    const infoBlock = docDef.content[0];
    // infoBlock est une table
    expect(infoBlock.bold).toBe(true);
    expect(infoBlock.italics).toBe(false);
    expect(infoBlock.opacity).toBe(0.5);
  });

  test('should handle margin attribute', async () => {
    const input = `
# Heading {margin="[20, 10, 20, 10]"}

# Another Heading {margin=15}
    `;

    const result = await buildString(input, options);
    const docDef = JSON.parse(result);

    expect(docDef.content[0].margin).toEqual([20, 10, 20, 10]);
    expect(docDef.content[1].margin).toBe(15);
  });

  test('should apply attributes from next line', async () => {
    const input = `
# Heading
{#next-line-id .next-line-class}
    `;

    const result = await buildString(input, options);
    const docDef = JSON.parse(result);

    const heading = docDef.content[0];
    expect(heading.id).toBe('next-line-id');
    expect(heading.style).toContain('next-line-class');
  });
});
