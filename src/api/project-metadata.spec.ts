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
});
