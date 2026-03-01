import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { unlink, writeFile } from 'node:fs/promises';
import { buildFile, buildFileToString, buildString } from './index';

describe('API: File Metadata Variables', () => {
  const testFilePath = '/tmp/test-metadata.zlt';

  beforeEach(async () => {
    await writeFile(testFilePath, '# Test\n\nCreated: {$created}\nModified: {$modified}');
    // Small delay to ensure modified time is different if needed in tests
    await new Promise((r) => setTimeout(r, 10));
  });

  afterEach(async () => {
    try {
      await unlink(testFilePath);
    } catch {}
  });

  describe('buildFileToString', () => {
    test('should replace {$created} with ISO 8601 timestamp', async () => {
      const html = await buildFileToString(testFilePath);

      expect(html).not.toContain('{$created}');
      expect(html).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should replace {$modified} with ISO 8601 timestamp', async () => {
      const html = await buildFileToString(testFilePath);

      expect(html).not.toContain('{$modified}');
      expect(html).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('buildFile', () => {
    const testOutputPath = '/tmp/test-metadata.html';

    afterEach(async () => {
      try {
        await unlink(testOutputPath);
      } catch {}
    });

    test('should generate HTML with file dates in the body', async () => {
      await buildFile(testFilePath, testOutputPath);

      const { readFile } = await import('node:fs/promises');
      const html = await readFile(testOutputPath, 'utf-8');

      expect(html).not.toContain('{$created}');
      expect(html).not.toContain('{$modified}');
      expect(html).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('buildString metadata behavior', () => {
    test('should NOT replace {$created} and {$modified} when no file path provided', async () => {
      const html = await buildString('Created: {$created}\nModified: {$modified}');

      expect(html).toContain('{$created}');
      expect(html).toContain('{$modified}');
    });

    test('should use file metadata when filePath option provided to buildString', async () => {
      const html = await buildString('Modified: {$modified}', {
        filePath: testFilePath,
      });

      expect(html).not.toContain('{$modified}');
      expect(html).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
