import { describe, expect, it } from 'bun:test';
import { buildString } from './index';

describe('Async Rendering Regression', () => {
  it('should render complex nested structures without losing content', async () => {
    const content = `
- Item with [**bold link**](url)
- Item with ||styled **bold** text||{color=red}
- [Link with //italic//](url)

:::info [Title with **bold**]
Nested content with \`code\` and [link](url).
:::

| Header |
| --- |
| Cell with **bold** |
`;

    const html = await buildString(content);

    // Verify content is present and not [object Promise]
    expect(html).not.toContain('[object Promise]');

    expect(html).toContain('<strong>bold link</strong>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<code>code</code>');
    expect(html).toContain('Title with <strong>bold</strong>');
    expect(html).toContain('Cell with');
    expect(html).toContain('<strong>bold</strong>');
  });
});
