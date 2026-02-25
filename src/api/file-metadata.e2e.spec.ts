import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { unlink, writeFile } from 'fs/promises';
import { buildFile, buildFileToString, buildString } from './index';

describe('API: File Metadata Variables', () => {
  const testFilePath = '/tmp/test-metadata.zlt';

  beforeEach(async () => {
    await writeFile(testFilePath, '# Test\n\nCreated: {$created}\nModified: {$modified}');
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

    test('should format dates with Date.format()', async () => {
      await writeFile(testFilePath, 'Date: {{ Date.format($modified, "DD/MM/YYYY") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    test('should support datetime format with Date.format()', async () => {
      await writeFile(testFilePath, 'Modified: {{ Date.format($modified, "DD/MM/YYYY HH:mm:ss") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/);
    });
  });

  describe('buildFile', () => {
    const testOutputPath = '/tmp/test-metadata.html';

    afterEach(async () => {
      try {
        await unlink(testOutputPath);
      } catch {}
    });

    test('should generate HTML with file dates', async () => {
      await buildFile(testFilePath, testOutputPath);

      const { readFile } = await import('fs/promises');
      const html = await readFile(testOutputPath, 'utf-8');

      expect(html).not.toContain('{$created}');
      expect(html).not.toContain('{$modified}');
    });
  });

  describe('buildString', () => {
    test('should NOT replace {$created} and {$modified} when no file path provided', async () => {
      const html = await buildString('Created: {$created}\nModified: {$modified}');

      expect(html).toContain('{$created}');
      expect(html).toContain('{$modified}');
    });

    test('should use file metadata when filePath option provided', async () => {
      const html = await buildString('Modified: {$modified}', {
        filePath: testFilePath,
      });

      expect(html).not.toContain('{$modified}');
      expect(html).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Date.format() tokens', () => {
    test('should support DD token for day', async () => {
      await writeFile(testFilePath, 'Day: {{ Date.format($modified, "DD") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/Day: \d{2}/);
    });

    test('should support MM token for month', async () => {
      await writeFile(testFilePath, 'Month: {{ Date.format($modified, "MM") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/Month: \d{2}/);
    });

    test('should support YYYY token for full year', async () => {
      await writeFile(testFilePath, 'Year: {{ Date.format($modified, "YYYY") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/Year: \d{4}/);
    });

    test('should support YY token for short year', async () => {
      await writeFile(testFilePath, 'Year: {{ Date.format($modified, "YY") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/Year: \d{2}/);
    });

    test('should support HH token for hours (24h)', async () => {
      await writeFile(testFilePath, 'Hour: {{ Date.format($modified, "HH") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/Hour: \d{2}/);
    });

    test('should support H token for hours (24h, no padding)', async () => {
      await writeFile(testFilePath, 'Hour: {{ Date.format($modified, "H") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/Hour: \d{1,2}/);
    });

    test('should support hh token for hours (12h)', async () => {
      await writeFile(testFilePath, 'Hour: {{ Date.format($modified, "hh") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/Hour: \d{2}/);
    });

    test('should support h token for 12-hour format (no padding)', async () => {
      await writeFile(testFilePath, 'Hour12: {{ Date.format($modified, "h") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/Hour12: \d{1,2}/);
    });

    test('should support a token for am/pm', async () => {
      await writeFile(testFilePath, 'Period: {{ Date.format($modified, "a") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/Period: [ap]m/);
    });

    test('should support mm token for minutes', async () => {
      await writeFile(testFilePath, 'Minute: {{ Date.format($modified, "mm") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/Minute: \d{2}/);
    });

    test('should support ss token for seconds', async () => {
      await writeFile(testFilePath, 'Second: {{ Date.format($modified, "ss") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/Second: \d{2}/);
    });

    test('should support ISO format', async () => {
      await writeFile(testFilePath, 'ISO: {{ Date.format($modified, "YYYY-MM-DD") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/ISO: \d{4}-\d{2}-\d{2}/);
    });

    test('should support European format', async () => {
      await writeFile(testFilePath, 'EU: {{ Date.format($modified, "DD/MM/YYYY") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/EU: \d{2}\/\d{2}\/\d{4}/);
    });

    test('should support US format', async () => {
      await writeFile(testFilePath, 'US: {{ Date.format($modified, "MM/DD/YYYY") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/US: \d{2}\/\d{2}\/\d{4}/);
    });

    test('should support full datetime format', async () => {
      await writeFile(testFilePath, 'Full: {{ Date.format($modified, "YYYY-MM-DD HH:mm:ss") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/Full: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Date.now()', () => {
    test('should return current timestamp', async () => {
      const html = await buildString('Now: {{ Date.now() }}');

      expect(html).toMatch(/Now: \d+/);
    });

    test('should format current date', async () => {
      const html = await buildString('Today: {{ Date.format(Date.now(), "YYYY-MM-DD") }}');

      expect(html).toMatch(/Today: \d{4}-\d{2}-\d{2}/);
    });
  });

  describe('Date.format() with variable', () => {
    test('should format $created variable', async () => {
      await writeFile(testFilePath, 'Created: {{ Date.format($created, "DD/MM/YYYY") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/Created: \d{2}\/\d{2}\/\d{4}/);
    });

    test('should format $modified variable', async () => {
      await writeFile(testFilePath, 'Modified: {{ Date.format($modified, "YYYY-MM-DD HH:mm") }}');
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/Modified: \d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
    });

    test('should format both dates in same document', async () => {
      await writeFile(
        testFilePath,
        'Created: {{ Date.format($created, "YYYY-MM-DD") }}\nModified: {{ Date.format($modified, "YYYY-MM-DD HH:mm") }}'
      );
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/Created: \d{4}-\d{2}-\d{2}/);
      expect(html).toMatch(/Modified: \d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
    });
  });
});
