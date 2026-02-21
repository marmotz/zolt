import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { unlink, writeFile } from 'fs/promises';
import { buildFile, buildString, lint } from './index';

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
});
