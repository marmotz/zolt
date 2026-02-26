import { describe, expect, it } from 'bun:test';
import { buildString } from './index';

describe('Project Metadata Hierarchy', () => {
  it('should use project metadata as variables', async () => {
    const content = '# Site: {$title}';
    const projectMetadata = { title: 'My Project' };
    const html = await buildString(content, { projectMetadata });
    expect(html).toContain('Site: My Project');
  });

  it('should override project metadata with file metadata', async () => {
    const content = `---
title: "Overridden Site"
---
# Site: {$title}`;
    const projectMetadata = { title: 'My Project' };
    const html = await buildString(content, { projectMetadata });
    expect(html).toContain('Site: Overridden Site');
  });

  it('should override file metadata with local variables', async () => {
    const content = `---
title: "Overridden Site"
---
$title = "Local Site"
# Site: {$title}`;
    const projectMetadata = { title: 'My Project' };
    const html = await buildString(content, { projectMetadata });
    expect(html).toContain('Site: Local Site');
  });

  it('should preserve other project metadata when one is overridden', async () => {
    const content = `---
author: "Specific Author"
---
# Site: {$title} by {$author}`;
    const projectMetadata = {
      title: 'My Project',
      author: 'Global Author',
    };
    const html = await buildString(content, { projectMetadata });
    expect(html).toContain('Site: My Project by Specific Author');
  });

  it('should concatenate project title with file title using " - " separator', async () => {
    const content = `---
title: "Home"
---
# Welcome`;
    const projectMetadata = { title: 'Zolt documentation' };
    const html = await buildString(content, { projectMetadata });
    expect(html).toContain('<title>Zolt documentation - Home</title>');
  });

  it('should use only project title when file has no title', async () => {
    const content = `# Welcome`;
    const projectMetadata = { title: 'Zolt documentation' };
    const html = await buildString(content, { projectMetadata });
    expect(html).toContain('<title>Zolt documentation</title>');
  });

  it('should use only file title when project has no title', async () => {
    const content = `---
title: "Home"
---
# Welcome`;
    const html = await buildString(content, {});
    expect(html).toContain('<title>Home</title>');
  });

  it('should use default title when neither project nor file has title', async () => {
    const content = `# Welcome`;
    const html = await buildString(content, {});
    expect(html).toContain('<title>Document</title>');
  });
});
