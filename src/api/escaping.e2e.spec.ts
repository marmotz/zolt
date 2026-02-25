import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('E2E: Escaping', () => {
  test('should escape special formatting characters', async () => {
    const input = 'Show \\*\\*bold\\*\\* and \\/\\/italic\\/\\/ literally.';
    const html = await buildString(input);
    expect(html).toContain('Show **bold** and //italic// literally.');
    expect(html).not.toContain('<strong>');
    expect(html).not.toContain('<em>');
  });

  test('should escape backticks in text', async () => {
    const input = 'To show code: use \\`print()\\` function.';
    const html = await buildString(input);
    expect(html).toContain('To show code: use `print()` function.');
    expect(html).not.toContain('<code>');
  });

  test('should escape backslash itself', async () => {
    const input = 'This is a backslash: \\\\';
    const html = await buildString(input);
    expect(html).toContain('This is a backslash: \\');
  });

  test('should handle escaped characters in headings', async () => {
    const input = '# Heading with \\*\\*stars\\*\\*';
    const html = await buildString(input);
    expect(html).toContain('Heading with **stars**');
    expect(html).not.toContain('<strong>');
  });

  test('should handle escaped line breaks', async () => {
    const input = 'Line 1\\nLine 2';
    const html = await buildString(input);
    expect(html).toContain('Line 1<br />Line 2');
  });

  test('should escape attribute braces', async () => {
    const input = 'Normal text \\{not attributes\\}';
    const html = await buildString(input);
    expect(html).toContain('Normal text {not attributes}');
    expect(html).not.toContain('<p not');
  });
});
