import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { unlink, writeFile } from 'node:fs/promises';
import { lint } from './index';

describe('API: Lint', () => {
  const testFilePath = '/tmp/test-lint.zlt';

  beforeEach(async () => {
    await writeFile(testFilePath, '# Hello World\n\nThis is a paragraph.');
  });

  afterEach(async () => {
    try {
      await unlink(testFilePath);
    } catch {}
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
});
