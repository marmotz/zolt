import { describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildString } from './index';

describe('Block-level Layout System', () => {
  const layoutPath = path.resolve(process.cwd(), 'temp-block-layout.zlt');

  it('should evaluate a block-level layout and inject content', async () => {
    fs.writeFileSync(
      layoutPath,
      `<div class="block-layout-wrapper">\n<h1>Header</h1>\n<div class="block-content">\n:::content:::\n</div>\n<h2>Footer</h2>\n</div>`
    );

    const content = `
Before block

:::layout temp-block-layout.zlt
This is the **inner** content!
:::

After block
    `;

    const html = await buildString(content);

    expect(html).toContain('Before block');
    expect(html).toContain('<div class="block-layout-wrapper">');
    expect(html).toContain('<h1>Header</h1>');
    expect(html).toContain('<div class="block-content">');
    expect(html).toContain('<strong>inner</strong>');
    expect(html).toContain('<h2>Footer</h2>');
    expect(html).toContain('After block');

    if (fs.existsSync(layoutPath)) {
      fs.unlinkSync(layoutPath);
    }
  });

  it('should support block-level layout with brackets [path]', async () => {
    fs.writeFileSync(layoutPath, `<section>\n:::content:::\n</section>`);

    const content = `
:::layout [temp-block-layout.zlt]
Content inside brackets
:::
    `;

    const html = await buildString(content);

    expect(html).toContain('<section>');
    expect(html).toContain('Content inside brackets');
    expect(html).toContain('</section>');

    if (fs.existsSync(layoutPath)) {
      fs.unlinkSync(layoutPath);
    }
  });

  it('should correctly evaluate variables inside block layout', async () => {
    fs.writeFileSync(
      layoutPath,
      `---
customVar: Hello World
---
<div class="var-test">
{$customVar} - :::content:::
</div>`
    );

    const content = `
:::layout temp-block-layout.zlt
Inner text
:::
    `;

    const html = await buildString(content);

    expect(html).toContain('<div class="var-test">');
    expect(html).toContain('Hello World -');
    expect(html).toContain('Inner text');
    expect(html).not.toContain('customVar:');

    if (fs.existsSync(layoutPath)) {
      fs.unlinkSync(layoutPath);
    }
  });

  it('should correctly propagate global variables into block layout', async () => {
    fs.writeFileSync(
      layoutPath,
      `<div class="global-test">
{$title} - :::content:::
</div>`
    );

    const content = `---
title: Global Title
---
:::layout temp-block-layout.zlt
Inner text
:::
    `;

    const html = await buildString(content);

    expect(html).toContain('<div class="global-test">');
    expect(html).toContain('Global Title -');
    expect(html).toContain('Inner text');

    if (fs.existsSync(layoutPath)) {
      fs.unlinkSync(layoutPath);
    }
  });
});
