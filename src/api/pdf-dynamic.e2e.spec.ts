import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('PDF Build - Section 4 Dynamic Blocks', () => {
  const options = { type: 'pdf' as const };

  test('should process TOC and ignore filetree correctly', async () => {
    const input = `
[[toc {title="Table of Contents"}]]

# Chapter 1
Content 1

## Section 1.1
Content 1.1

[[filetree]]

# Chapter 2
Content 2
    `;

    const result = await buildString(input, options);
    const docDef = JSON.parse(result);

    expect(docDef.content).toBeDefined();
    const flatContent = JSON.stringify(docDef.content);

    expect(flatContent).toContain('toc');
    expect(flatContent).toContain('Table of Contents');
    expect(flatContent).toContain('Chapter 1');
    expect(flatContent).toContain('Section 1.1');
    expect(flatContent).toContain('Chapter 2');

    // Check that headings have tocItem: true
    const headings = docDef.content.filter((c: any) => c.tocItem === true);
    expect(headings.length).toBe(3);
    expect(headings[0].style).toBe('header1');
    expect(headings[0].tocLevel).toBe(0);
    expect(headings[1].style).toBe('header2');
    expect(headings[1].tocLevel).toBe(1);
  });
});
