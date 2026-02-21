import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { unlink, writeFile } from 'fs/promises';
import { buildFile, buildString, extractZltLinks, getLinkedFiles, lint } from './index';

describe('API', () => {
  const testFilePath = '/tmp/test-api.zlt';
  const testOutputPath = '/tmp/test-api.html';

  beforeEach(async () => {
    await writeFile(testFilePath, '# Hello World\n\nThis is a paragraph.');
  });

  afterEach(async () => {
    try {
      await unlink(testFilePath);
    } catch {}
    try {
      await unlink(testOutputPath);
    } catch {}
  });

  describe('buildString', () => {
    test('should build simple document', async () => {
      const html = await buildString('# Hello World');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<h1>Hello World</h1>');
    });

    test('should build document with paragraph', async () => {
      const html = await buildString('Paragraph text');

      expect(html).toContain('<p>Paragraph text</p>');
    });

    test('should build list', async () => {
      const html = await buildString('- item 1\n- item 2');

      expect(html).toContain('<ul>');
      expect(html).toContain('<li>');
    });

    test('should build list with content', async () => {
      const html = await buildString('- item 1\n- item 2');

      expect(html).toContain('item 1');
      expect(html).toContain('item 2');
    });

    test('should build heading with different levels', async () => {
      const html = await buildString('# H1\n## H2\n### H3');

      expect(html).toContain('<h1>H1</h1>');
      expect(html).toContain('<h2>H2</h2>');
      expect(html).toContain('<h3>H3</h3>');
    });

    test('should build link in paragraph', async () => {
      const html = await buildString('[example.zlt](example.zlt)');

      expect(html).toContain('<a href="example.html">example.zlt</a>');
    });

    test('should build link in list item', async () => {
      const html = await buildString('- [file.zlt](file.zlt) — description');

      expect(html).toContain('<a href="file.html">file.zlt</a>');
      expect(html).toContain('— description');
    });

    test('should build complex document with all features', async () => {
      const html = await buildString(`# Title

Paragraph with [link](url).

## Section

- [item 1](item1.zlt)
- [item 2](item2.zlt)

1. First
2. Second`);

      expect(html).toContain('<h1>Title</h1>');
      expect(html).toContain('<h2>Section</h2>');
      expect(html).toContain('<a href="url">link</a>');
      expect(html).toContain('<a href="item1.html">item 1</a>');
      expect(html).toContain('<ol>');
      expect(html).toContain('First');
    });
  });

  describe('lint', () => {
    test('should lint valid file', async () => {
      const result = await lint(testFilePath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.filePath).toBe(testFilePath);
    });

    test('should return file path', async () => {
      const result = await lint(testFilePath);

      expect(result.filePath).toBe(testFilePath);
    });
  });

  describe('buildFile', () => {
    test('should build file to output', async () => {
      await buildFile(testFilePath, testOutputPath);

      const { exists } = await import('fs/promises');
      expect(await exists(testOutputPath)).toBe(true);
    });
  });

  describe('extractZltLinks', () => {
    test('should extract single .zlt link', () => {
      const content = '[Link](file.zlt)';
      const links = extractZltLinks(content);

      expect(links).toEqual(['file.zlt']);
    });

    test('should extract multiple .zlt links', () => {
      const content = '[Link1](file1.zlt) and [Link2](file2.zlt)';
      const links = extractZltLinks(content);

      expect(links).toEqual(['file1.zlt', 'file2.zlt']);
    });

    test('should not extract http links', () => {
      const content = '[Google](https://google.com) and [Link](file.zlt)';
      const links = extractZltLinks(content);

      expect(links).toEqual(['file.zlt']);
    });

    test('should not extract anchor links', () => {
      const content = '[Anchor](#section) and [Link](file.zlt)';
      const links = extractZltLinks(content);

      expect(links).toEqual(['file.zlt']);
    });

    test('should deduplicate links', () => {
      const content = '[Link1](file.zlt) and [Link2](file.zlt)';
      const links = extractZltLinks(content);

      expect(links).toEqual(['file.zlt']);
    });

    test('should return empty array for no links', () => {
      const content = 'No links here';
      const links = extractZltLinks(content);

      expect(links).toEqual([]);
    });

    test('should extract links in list items', () => {
      const content = '- [item 1](item1.zlt)\n- [item 2](item2.zlt)';
      const links = extractZltLinks(content);

      expect(links).toEqual(['item1.zlt', 'item2.zlt']);
    });
  });

  describe('getLinkedFiles', () => {
    const linkedTestFile = '/tmp/test-linked.zlt';

    beforeEach(async () => {
      await writeFile(linkedTestFile, '# Test\n\nLink to [file](other.zlt)');
    });

    afterEach(async () => {
      try {
        await unlink(linkedTestFile);
      } catch {}
    });

    test('should get linked files from file', async () => {
      const links = await getLinkedFiles(linkedTestFile);

      expect(links).toEqual(['other.zlt']);
    });

    test('should recursively extract links from linked files', async () => {
      const fileA = '/tmp/recursion-a.zlt';
      const fileB = '/tmp/recursion-b.zlt';
      const fileC = '/tmp/recursion-c.zlt';

      await writeFile(fileA, '# A\n\nLink to [B](recursion-b.zlt)');
      await writeFile(fileB, '# B\n\nLink to [C](recursion-c.zlt)');
      await writeFile(fileC, '# C\n\nNo links here');

      const linksA = await getLinkedFiles(fileA);
      expect(linksA).toEqual(['recursion-b.zlt']);

      const linksB = await getLinkedFiles(fileB);
      expect(linksB).toEqual(['recursion-c.zlt']);

      const linksC = await getLinkedFiles(fileC);
      expect(linksC).toEqual([]);

      await unlink(fileA).catch(() => {});
      await unlink(fileB).catch(() => {});
      await unlink(fileC).catch(() => {});
    });

    test('should handle relative paths in links', async () => {
      const fileWithRelativeLink = '/tmp/relative-test.zlt';
      await writeFile(fileWithRelativeLink, '# Test\n\nLink to [../other.zlt](../other.zlt)');

      const links = await getLinkedFiles(fileWithRelativeLink);
      expect(links).toEqual(['../other.zlt']);

      await unlink(fileWithRelativeLink).catch(() => {});
    });

    test('should not extract duplicate links', async () => {
      const duplicateLinksFile = '/tmp/duplicate-test.zlt';
      await writeFile(duplicateLinksFile, '# Test\n\n[Link1](file.zlt)\n\n[Link2](file.zlt)');

      const links = await getLinkedFiles(duplicateLinksFile);
      expect(links).toEqual(['file.zlt']);

      await unlink(duplicateLinksFile).catch(() => {});
    });
  });
});
