import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('Columns E2E', () => {
  test('should build basic columns', async () => {
    const input = `
:::columns
:::column
Left
:::
:::column
Right
:::
:::`;
    const html = await buildString(input);
    expect(html).toContain('class="triple-colon-block columns"');
    expect(html).toContain('class="triple-colon-block column"');
    expect(html).toContain('Left');
    expect(html).toContain('Right');
  });

  test('should handle column widths with gap calculation', async () => {
    const input = `
:::columns
:::column {width=70%}
Main
:::
:::column {width=30%}
Sidebar
:::
:::`;
    const html = await buildString(input);
    // Factor for 70% is (1 - 0.7) = 0.3
    expect(html).toContain('style="width: calc(70% - (var(--zolt-column-gap, 1.5rem) * 0.300))"');
    // Factor for 30% is (1 - 0.3) = 0.7
    expect(html).toContain('style="width: calc(30% - (var(--zolt-column-gap, 1.5rem) * 0.700))"');
  });

  test('should handle cols attribute', async () => {
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
    expect(html).toContain('cols="3"');
  });

  test('should correctly terminate blocks and not nest subsequent content', async () => {
    const input = `
:::columns
:::column
Left
:::
:::column
Right
:::
:::

## Outside Heading`;
    const html = await buildString(input);
    // The columns should be before the Outside Heading
    expect(html.indexOf('triple-colon-block columns')).toBeLessThan(html.indexOf('Outside Heading'));
    // The closing </div> of columns should be before the <h2>
    const lastClosingDiv = html.lastIndexOf('</div>');
    const headingStart = html.indexOf('<h2');
    expect(lastClosingDiv).toBeLessThan(headingStart);
  });
});
