import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { unlink, writeFile } from 'fs/promises';
import { buildFileToString, buildString } from './index';

describe('API: Date Namespace', () => {
  const testFilePath = '/tmp/test-dates.zlt';

  beforeEach(async () => {
    await writeFile(testFilePath, '# Test Date Namespace');
  });

  afterEach(async () => {
    try {
      await unlink(testFilePath);
    } catch {}
  });

  describe('Date.format() tokens', () => {
    test('should support DD token for day', async () => {
      const html = await buildString('Day: {{ Date.format("2026-02-25", "DD") }}');
      expect(html).toContain('Day: 25');
    });

    test('should support MM token for month', async () => {
      const html = await buildString('Month: {{ Date.format("2026-02-25", "MM") }}');
      expect(html).toContain('Month: 02');
    });

    test('should support YYYY token for full year', async () => {
      const html = await buildString('Year: {{ Date.format("2026-02-25", "YYYY") }}');
      expect(html).toContain('Year: 2026');
    });

    test('should support YY token for short year', async () => {
      const html = await buildString('Year: {{ Date.format("2026-02-25", "YY") }}');
      expect(html).toContain('Year: 26');
    });

    test('should support HH token for hours (24h)', async () => {
      const html = await buildString('Hour: {{ Date.format("2026-02-25T14:30:00", "HH") }}');
      expect(html).toContain('Hour: 14');
    });

    test('should support H token for hours (24h, no padding)', async () => {
      const html = await buildString('Hour: {{ Date.format("2026-02-25T09:30:00", "H") }}');
      expect(html).toContain('Hour: 9');
    });

    test('should support hh token for hours (12h)', async () => {
      const html = await buildString('Hour: {{ Date.format("2026-02-25T14:30:00", "hh") }}');
      expect(html).toContain('Hour: 02');
    });

    test('should support h token for 12-hour format (no padding)', async () => {
      const html = await buildString('Hour12: {{ Date.format("2026-02-25T14:30:00", "h") }}');
      expect(html).toContain('Hour12: 2');
    });

    test('should support a token for am/pm', async () => {
      const htmlAm = await buildString('Period: {{ Date.format("2026-02-25T09:30:00", "a") }}');
      const htmlPm = await buildString('Period: {{ Date.format("2026-02-25T14:30:00", "a") }}');
      expect(htmlAm).toContain('Period: am');
      expect(htmlPm).toContain('Period: pm');
    });

    test('should support mm token for minutes', async () => {
      const html = await buildString('Minute: {{ Date.format("2026-02-25T14:05:00", "mm") }}');
      expect(html).toContain('Minute: 05');
    });

    test('should support ss token for seconds', async () => {
      const html = await buildString('Second: {{ Date.format("2026-02-25T14:30:07", "ss") }}');
      expect(html).toContain('Second: 07');
    });
  });

  describe('Timestamps', () => {
    test('Date.now() should return current timestamp', async () => {
      const html = await buildString('Now: {{ Date.now() }}');
      expect(html).toMatch(/Now: \d+/);
    });

    test('Date.timestamp() should return seconds', async () => {
      const html = await buildString('TS: {{ Date.timestamp("2026-02-25T14:30:00Z") }}');
      expect(html).toMatch(/TS: \d{10}/);
    });

    test('Date.msTimestamp() should return milliseconds', async () => {
      const html = await buildString('MS: {{ Date.msTimestamp("2026-02-25T14:30:00Z") }}');
      expect(html).toMatch(/MS: \d{13}/);
    });
  });

  describe('Integration with File Metadata', () => {
    test('should format $created and $modified variables', async () => {
      await writeFile(
        testFilePath,
        'Created: {{ Date.format($created, "YYYY-MM-DD") }}\nModified: {{ Date.format($modified, "HH:mm") }}'
      );
      const html = await buildFileToString(testFilePath);

      expect(html).toMatch(/Created: \d{4}-\d{2}-\d{2}/);
      expect(html).toMatch(/Modified: \d{2}:\d{2}/);
    });

    test('Date.timestamp($created) should work', async () => {
      await writeFile(testFilePath, 'TS: {{ Date.timestamp($created) }}');
      const html = await buildFileToString(testFilePath);
      expect(html).toMatch(/TS: \d{10}/);
    });
  });

  describe('Date Manipulation (parse, calc, diff)', () => {
    test('Date.parse() should parse formatted dates', async () => {
      const html = await buildString('{{ Date.format(Date.parse("25/02/2026", "DD/MM/YYYY"), "YYYY-MM-DD") }}');
      expect(html).toContain('2026-02-25');
    });

    test('Date.calc() should add duration using object', async () => {
      const html = await buildString('{{ Date.format(Date.calc("2026-02-25", { days: 7 }), "YYYY-MM-DD") }}');
      expect(html).toContain('2026-03-04');
    });

    test('Date.calc() should support multiple units and negative values', async () => {
      // 2026-02-25 + 1 day - 1 hour
      const html = await buildString('{{ Date.format(Date.calc("2026-02-25T10:00:00", { days: 1, hours: -1 }), "YYYY-MM-DD HH:mm") }}');
      expect(html).toContain('2026-02-26 09:00');
    });

    test('Date.diff() should calculate difference', async () => {
      const html = await buildString('{{ Date.diff("2026-03-01", "2026-02-25", "days") }}');
      expect(html).toContain('4');
    });
  });
});
