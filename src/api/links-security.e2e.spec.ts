import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('Link Attributes & Security', () => {
  test('should support {title=value} attribute on links', async () => {
    const input = '[Zolt](https://zolt.marmotz.dev){title="The high-voltage markup language"}';
    const html = await buildString(input);
    expect(html).toContain('title="The high-voltage markup language"');
  });

  test('should support {rel=value} attribute on links', async () => {
    const input = '[Zolt](https://zolt.marmotz.dev){rel=nofollow}';
    const html = await buildString(input);
    expect(html).toContain('rel="nofollow"');
  });

  test('should automatically add rel="noopener" when target="_blank" is used', async () => {
    const input = '[External Link](https://example.com){target=_blank}';
    const html = await buildString(input);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener"');
  });

  test('should not overwrite existing rel attribute when adding noopener', async () => {
    const input = '[External Link](https://example.com){target=_blank, rel=nofollow}';
    const html = await buildString(input);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="nofollow noopener"');
  });

  test('should automatically add rel="noopener" for file links (&&)', async () => {
    const input = '&&[Manual](manual.pdf)';
    const html = await buildString(input);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener"');
  });
});
