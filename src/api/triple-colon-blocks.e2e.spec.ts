import { describe, expect, test } from 'bun:test';
import { buildString } from '../index';

describe('Triple Colon Blocks E2E', () => {
  test('should handle details block with title', async () => {
    const input = `
:::details [My Title]
Content here
:::`;
    const html = await buildString(input);
    expect(html).toContain('<details');
    expect(html).toContain('<summary>My Title</summary>');
    expect(html).toContain('Content here');
  });

  test('should handle details with attributes', async () => {
    const input = `
:::details [Opened Details] {open=true}
Always visible
:::`;
    const html = await buildString(input);
    expect(html).toContain('<details');
    expect(html).toContain('open');
    expect(html).toContain('<summary>Opened Details</summary>');
  });

  test('should handle semantic blocks with titles', async () => {
    const input = `
:::info [Information]
Some info
:::`;
    const html = await buildString(input);
    expect(html).toContain('class="triple-colon-block info"');
    expect(html).toContain('<div class="block-title">Information</div>');
    expect(html).toContain('Some info');
  });

  test('should handle nested blocks', async () => {
    const input = `
:::columns
:::column
:::info [Left Info]
Nested info
:::
:::
:::column
Right content
:::
:::`;
    const html = await buildString(input);
    expect(html).toContain('class="triple-colon-block columns"');
    expect(html).toContain('class="triple-colon-block column"');
    expect(html).toContain('class="triple-colon-block info"');
    expect(html).toContain('Nested info');
  });

  test('should handle cols attribute on columns', async () => {
    const input = `
:::columns {cols=3}
:::column
1
:::
:::column
2
:::
:::column
3
:::
:::`;
    const html = await buildString(input);
    expect(html).toContain('style="--zolt-cols: 3;"');
    expect(html).toContain('class="triple-colon-block columns"');
  });
});
