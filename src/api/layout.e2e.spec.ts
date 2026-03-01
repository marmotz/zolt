import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { buildString } from './index';

describe('Layout System', () => {
  const layoutPath = path.resolve(process.cwd(), 'test-layout.zlt');
  const docPath = path.resolve(process.cwd(), 'test-doc.zlt');

  beforeEach(() => {
    fs.writeFileSync(
      layoutPath,
      `---
theme: dark
---
<div class="layout">
# Layout Header
:::content:::
# Layout Footer
</div>`
    );
  });

  afterEach(() => {
    if (fs.existsSync(layoutPath)) {
      fs.unlinkSync(layoutPath);
    }
    if (fs.existsSync(docPath)) {
      fs.unlinkSync(docPath);
    }
  });

  it('should apply layout to a document', async () => {
    const content = `---
layout: test-layout.zlt
title: My Document
---
# Hello World
This is my content.`;

    const html = await buildString(content, { filePath: docPath });

    expect(html).toContain('<div class="layout">');
    expect(html).toContain('Layout Header</h1>');
    expect(html).toContain('Hello World</h1>');
    expect(html).toContain('This is my content.');
    expect(html).toContain('Layout Footer</h1>');
  });

  it('should allow nested includes in layout and content', async () => {
    const includePath = path.resolve(process.cwd(), 'test-include.zlt');
    fs.writeFileSync(includePath, 'Included Content');

    const content = `---
layout: test-layout.zlt
---
:::include test-include.zlt`;

    try {
      const html = await buildString(content, { filePath: docPath });
      expect(html).toContain('Included Content');
    } finally {
      if (fs.existsSync(includePath)) {
        fs.unlinkSync(includePath);
      }
    }
  });

  it('should use variables from document in layout', async () => {
    fs.writeFileSync(
      layoutPath,
      `---
title: Default Layout Title
---
# Welcome to {$title}
:::content:::`
    );

    const content = `---
layout: test-layout.zlt
title: Specific Doc Title
---
Content here`;

    const html = await buildString(content, { filePath: docPath });
    expect(html).toContain('Welcome to Specific Doc Title</h1>');
  });

  it('should use layout from project metadata', async () => {
    fs.writeFileSync(layoutPath, '# Project Layout\n:::content:::');

    const content = '# Hello from Doc';
    const projectMetadata = { layout: 'test-layout.zlt' };

    const html = await buildString(content, { projectMetadata, filePath: docPath });
    expect(html).toContain('Project Layout</h1>');
    expect(html).toContain('Hello from Doc</h1>');
  });

  it('should not apply layout to included files', async () => {
    const layout2Path = path.resolve(process.cwd(), 'test-layout-2.zlt');
    fs.writeFileSync(layout2Path, 'LAYOUT 2\n:::content:::');

    const includePath = path.resolve(process.cwd(), 'test-include-with-layout.zlt');
    fs.writeFileSync(includePath, `---\nlayout: test-layout-2.zlt\n---\nIncluded with layout`);

    const content = `# Main Doc\n:::include test-include-with-layout.zlt`;

    try {
      const html = await buildString(content, { filePath: docPath });
      expect(html).not.toContain('LAYOUT 2');
      expect(html).toContain('Included with layout');
    } finally {
      if (fs.existsSync(layout2Path)) {
        fs.unlinkSync(layout2Path);
      }
      if (fs.existsSync(includePath)) {
        fs.unlinkSync(includePath);
      }
    }
  });
});
