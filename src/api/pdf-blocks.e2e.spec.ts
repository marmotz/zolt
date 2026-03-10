import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('PDF Build - Section 2 Content Blocks', () => {
  const options = { type: 'pdf' as const };

  test('should process all content blocks correctly', async () => {
    const input = `
# Title

> This is a quote

- Bullet 1
- Bullet 2

1. Numbered 1
2. Numbered 2

- [x] Done
- [ ] Todo

Term : Description

.. Plain Item

\`\`\`javascript
const x = 1;
\`\`\`

---

| Col 1 | Col 2 |
|-------|-------|
| Val 1 | Val 2 |

Indented
  Still indented

[^1]: Footnote definition

$$
E=mc^2
$$

:::tabs
:::tab [Tab 1]
Content 1
:::
:::tab [Tab 2]
Content 2
:::
:::

:::sidebar
Should be ignored
:::

:::details Title
Hidden details
:::
    `;

    const result = await buildString(input, options);
    const docDef = JSON.parse(result);

    expect(docDef.content).toBeDefined();
    const flatContent = JSON.stringify(docDef.content);

    expect(flatContent).toContain('Title');
    expect(flatContent).toContain('quote');
    expect(flatContent).toContain('Bullet 1');
    expect(flatContent).toContain('Numbered 1');
    expect(flatContent).toContain('☑');
    expect(flatContent).toContain('☐');
    expect(flatContent).toContain('Term');
    expect(flatContent).toContain('Description');
    expect(flatContent).toContain('Plain Item');
    expect(flatContent).toContain('const x = 1;');
    expect(flatContent).toContain('canvas'); // Horizontal rule
    expect(flatContent).toContain('table'); // Table and Alert
    expect(flatContent).toContain('Val 1');
    expect(flatContent).toContain('Footnote definition');
    expect(flatContent).toContain('E=mc^2');

    // New blocks
    expect(flatContent).toContain('Tab 1');
    expect(flatContent).toContain('Content 1');
    expect(flatContent).toContain('Tab 2');
    expect(flatContent).not.toContain('Should be ignored');
    expect(flatContent).toContain('Hidden details');
  });
});
