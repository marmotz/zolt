import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('PDF Build - Section 6 Metadata', () => {
  const options = { type: 'pdf' as const };

  test('should include frontmatter metadata in PDF definition', async () => {
    const input = `---
title: "Document Title"
author: "John Doe"
description: "A test document"
keywords: "test, zolt, pdf"
---

# Content
    `;

    const result = await buildString(input, options);
    const docDef = JSON.parse(result);

    expect(docDef.info).toBeDefined();
    expect(docDef.info.title).toBe('Document Title');
    expect(docDef.info.author).toBe('John Doe');
    expect(docDef.info.subject).toBe('A test document');
    expect(docDef.info.keywords).toBe('test, zolt, pdf');
  });

  test('should fallback to project title if document title is missing', async () => {
    const input = `# Content`;
    const result = await buildString(input, {
      ...options,
      projectMetadata: { projectTitle: 'Project Name' },
    });
    const docDef = JSON.parse(result);

    expect(docDef.info.title).toBe('Project Name');
  });

  test('should ignore HTML-specific metadata in PDF mode', async () => {
    const input = `---
layout: "main"
sidebar: true
---
# Content`;
    const result = await buildString(input, options);
    const docDef = JSON.parse(result);

    // Le contenu doit être généré sans erreur, et pas de traces de sidebar ou layout dans le JSON
    expect(docDef.content).toBeDefined();
    const flatContent = JSON.stringify(docDef.content);
    expect(flatContent).not.toContain('sidebar');
  });
});
