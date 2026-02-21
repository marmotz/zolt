import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { unlink, writeFile } from 'fs/promises';
import { extractZltLinks, getLinkedFiles } from './index';

describe('API: Links', () => {
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

    test('should not be greedy with spaces and text between links', () => {
      const content = '- [link1](file1.zlt) — some description\n- [link2](file2.zlt)';
      const links = extractZltLinks(content);
      expect(links).toEqual(['file1.zlt', 'file2.zlt']);
    });
  });

  describe('getLinkedFiles', () => {
    const linkedTestFile = '/tmp/test-links-extract.zlt';

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
