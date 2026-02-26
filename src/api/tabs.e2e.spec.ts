import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('Tabs E2E', () => {
  test('should build basic tabs', async () => {
    const input = `
:::tabs
:::tab [Tab 1]
Content 1
:::
:::tab [Tab 2]
Content 2
:::
:::`;
    const html = await buildString(input);
    expect(html).toContain('class="zolt-tabs"');
    expect(html).toContain('class="zolt-tab-list"');
    expect(html).toContain('class="zolt-tab-button');
    expect(html).toContain('Tab 1');
    expect(html).toContain('Tab 2');
    expect(html).toContain('class="zolt-tab-panel');
    expect(html).toContain('Content 1');
    expect(html).toContain('Content 2');
  });

  test('should mark first tab as active by default', async () => {
    const input = `
:::tabs
:::tab [First]
A
:::
:::tab [Second]
B
:::
:::`;
    const html = await buildString(input);
    expect(html).toContain('zolt-tab-button active');
    expect(html).toContain('zolt-tab-panel active');
  });

  test('should handle default attribute to set active tab', async () => {
    const input = `
:::tabs {default=Python}
:::tab [JavaScript]
JS content
:::
:::tab [Python]
Python content
:::
:::tab [Ruby]
Ruby content
:::
:::`;
    const html = await buildString(input);
    expect(html).toContain('data-default="Python"');
  });

  test('should handle active attribute on tab', async () => {
    const input = `
:::tabs
:::tab [First]
A
:::
:::tab [Second] {active=true}
B
:::
:::`;
    const html = await buildString(input);
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('zolt-tabs-0-button-1');
    expect(html).toContain('zolt-tabs-0-panel-1');
    expect(html).toContain('class="zolt-tab-panel active"');
  });

  test('should handle tabs with code blocks', async () => {
    const input = `
:::tabs
:::tab [JS]
\`\`\`javascript
console.log("hello");
\`\`\`
:::
:::tab [Python]
\`\`\`python
print("hello")
\`\`\`
:::
:::`;
    const html = await buildString(input);
    expect(html).toContain('class="zolt-tabs"');
    expect(html).toContain('zolt-tabs-0-panel-0');
    expect(html).toContain('zolt-tabs-0-panel-1');
  });

  test('should handle nested content in tabs', async () => {
    const input = `
:::tabs
:::tab [Info]
**Bold** and //italic//

- List item 1
- List item 2
:::
:::`;
    const html = await buildString(input);
    expect(html).toContain('<strong>Bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>');
  });

  test('should generate unique IDs for tab panels', async () => {
    const input = `
:::tabs
:::tab [A]
Content A
:::
:::tab [B]
Content B
:::
:::`;
    const html = await buildString(input);
    expect(html).toMatch(/id="zolt-tabs-\d+-panel-0"/);
    expect(html).toMatch(/id="zolt-tabs-\d+-panel-1"/);
  });

  test('should use aria attributes for accessibility', async () => {
    const input = `
:::tabs
:::tab [Tab A]
Content
:::
:::`;
    const html = await buildString(input);
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('aria-selected');
    expect(html).toContain('aria-controls');
    expect(html).toContain('aria-labelledby');
  });
});
