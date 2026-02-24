import { describe, expect, it } from 'bun:test';
import { buildString } from './index';

describe('E2E: Frontmatter and Evaluation Architecture', () => {
  it('should use frontmatter variables in the document body', async () => {
    const content = `---
title: "Zolt Rocks"
author: "Zolt Team"
---
# {$title}
By {$author}`;
    const html = await buildString(content);
    expect(html).toContain('Zolt Rocks');
    expect(html).toContain('By Zolt Team');
  });

  it('should use frontmatter variables in conditional blocks', async () => {
    const content = `---
show_secret: true
---
:::if {$show_secret}
The secret is: Zolt
:::`;
    const html = await buildString(content);
    expect(html).toContain('The secret is: Zolt');
  });

  it('should use frontmatter variables in foreach loops', async () => {
    const content = `---
items: [A, B, C]
---
:::foreach {$items as $item}
- Item {$item}
:::`;
    const html = await buildString(content);
    expect(html).toContain('<li>Item A</li>');
    expect(html).toContain('<li>Item B</li>');
    expect(html).toContain('<li>Item C</li>');
  });

  it('should format dates from frontmatter correctly', async () => {
    const content = `---
my_date: 2026-02-18
---
Date: {{Date.format($my_date, "DD/MM/YYYY")}}`;
    const html = await buildString(content);
    expect(html).toContain('Date: 18/02/2026');
  });
});
