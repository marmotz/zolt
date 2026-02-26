import { describe, expect, test } from 'bun:test';
import { buildString } from '../api';

describe('Parser Safety (Anti-Hang)', () => {
  test('should not hang on unclosed code block at EOF', async () => {
    const zolt = '```javascript\nconst x = 1;';
    const html = await buildString(zolt);
    expect(html).toContain('zolt-code-block');
  });

  test('should not hang on unclosed triple colon block at EOF', async () => {
    const zolt = ':::info\nSome info';
    const html = await buildString(zolt);
    expect(html).toContain('triple-colon-block');
  });

  test('should handle nested unclosed blocks safely', async () => {
    const zolt = ':::columns\n:::column\nUnclosed';
    const html = await buildString(zolt);
    expect(html).toContain('Unclosed');
  });
});
