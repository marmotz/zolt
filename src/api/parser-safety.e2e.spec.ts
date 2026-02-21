import { describe, expect, test } from 'bun:test';
import { buildString } from '../api';

describe('Parser Safety (Anti-Hang)', () => {
  test('should not hang on unclosed code block at EOF', async () => {
    const zolt = `\`\`\`javascript
const x = 1;`;
    const html = await buildString(zolt);
    expect(html).toContain('const x = 1;');
  });

  test('should not hang on unclosed triple colon block at EOF', async () => {
    const zolt = `:::info
This is a warning`;
    const html = await buildString(zolt);
    expect(html).toContain('This is a warning');
  });

  test('should not hang on orphaned triple colon end', async () => {
    const zolt = `:::`;
    const html = await buildString(zolt);
    expect(html).toContain(':::');
  });

  test('should handle nested unclosed blocks safely', async () => {
    const zolt = `:::columns
:::column
Unclosed`;
    const html = await buildString(zolt);
    expect(html).toContain('Unclosed');
  });
});
