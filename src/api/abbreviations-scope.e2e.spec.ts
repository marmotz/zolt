import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { unlink, writeFile } from 'fs/promises';
import { HTMLBuilder } from '../builder/html/builder';
import { buildFileToString, buildString } from './index';

describe('API: Abbreviations Scope', () => {
  const file1 = '/tmp/test-scope-file1.zlt';
  const file2 = '/tmp/test-scope-file2.zlt';
  const file3 = '/tmp/test-scope-file3.zlt';

  beforeEach(async () => {
    // Clear global abbreviations before each test
    HTMLBuilder.clearGlobalAbbreviations();
  });

  afterEach(async () => {
    try {
      await unlink(file1);
    } catch {}
    try {
      await unlink(file2);
    } catch {}
    try {
      await unlink(file3);
    } catch {}
  });

  describe('Local abbreviations', () => {
    test('should apply local abbreviation only in current document', async () => {
      const content = '*[HTML]: HyperText Markup Language\n\nHTML is the standard.';
      const html = await buildString(content);

      expect(html).toContain('<abbr title="HyperText Markup Language">HTML</abbr>');
    });

    test('should not apply local abbreviation to other documents', async () => {
      await writeFile(file1, '*[HTML]: HyperText Markup Language\n\nHTML is defined here.');
      await writeFile(file2, 'HTML should NOT be expanded here.');

      const html1 = await buildFileToString(file1);
      const html2 = await buildFileToString(file2);

      expect(html1).toContain('<abbr title="HyperText Markup Language">HTML</abbr>');
      expect(html2).not.toContain('<abbr');
      expect(html2).toContain('HTML should NOT be expanded');
    });
  });

  describe('Global abbreviations', () => {
    test('should define global abbreviation with **[ABBR]', async () => {
      const content = '**[HTML]: HyperText Markup Language\n\nHTML is the standard.';
      const html = await buildString(content);

      expect(html).toContain('<abbr title="HyperText Markup Language">HTML</abbr>');
    });

    test('should apply global abbreviation across multiple documents', async () => {
      await writeFile(file1, '**[API]: Application Programming Interface\n\nThe API is defined here.');
      await writeFile(file2, 'The API provides endpoints.');
      await writeFile(file3, 'Using the API in applications.');

      const html1 = await buildFileToString(file1);
      const html2 = await buildFileToString(file2);
      const html3 = await buildFileToString(file3);

      // All documents should have the abbreviation expanded
      expect(html1).toContain('<abbr title="Application Programming Interface">API</abbr>');
      expect(html2).toContain('<abbr title="Application Programming Interface">API</abbr>');
      expect(html3).toContain('<abbr title="Application Programming Interface">API</abbr>');
    });

    test('should prioritize local over global abbreviation', async () => {
      const content = '**[HTML]: Global Definition\n*[HTML]: Local Definition\n\nHTML uses local definition.';
      const html = await buildString(content);

      expect(html).toContain('<abbr title="Local Definition">HTML</abbr>');
      expect(html).not.toContain('Global Definition');
    });
  });

  describe('Mixed abbreviations', () => {
    test('should handle both local and global abbreviations together', async () => {
      const content = '*[CSS]: Local CSS\n**[HTML]: Global HTML\n\nHTML and CSS work together.';
      const html = await buildString(content);

      expect(html).toContain('<abbr title="Global HTML">HTML</abbr>');
      expect(html).toContain('<abbr title="Local CSS">CSS</abbr>');
    });

    test('should handle inline abbreviation with local/global definitions', async () => {
      const content = '*[HTML]: Definition\n\nHTML{abbr="Custom Definition"} overrides the local definition.';
      const html = await buildString(content);

      // Inline abbreviation takes precedence over local definitions
      expect(html).toContain('<abbr title="Custom Definition">HTML</abbr>');
      expect(html).toContain('overrides the local definition');
    });
  });
});
