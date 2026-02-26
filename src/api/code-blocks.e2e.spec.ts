import { describe, expect, it } from 'bun:test';
import { buildString } from './index';

describe('Code Blocks E2E', () => {
  it('should build basic code block', async () => {
    const content = '```\nconst x = 1;\n```';
    const html = await buildString(content);
    expect(html).toContain('zolt-code-block');
    expect(html).toContain('const x = 1;');
  });

  it('should build code block with language', async () => {
    const content = '```javascript\nconst x = 1;\n```';
    const html = await buildString(content);
    expect(html).toContain('shiki');
    expect(html).toContain('shiki');
  });

  it('should handle multiple lines in code block', async () => {
    const content = '```\nline 1\nline 2\n```';
    const html = await buildString(content);
    expect(html).toContain('line 1');
    expect(html).toContain('line 2');
  });

  it('should preserve indentation in code block', async () => {
    const content = '```\n  indented\n```';
    const html = await buildString(content);
    expect(html).toContain('  indented');
  });

  it('should escape HTML in code block', async () => {
    const content = '```html\n<div></div>\n```';
    const html = await buildString(content);
    expect(html).toContain('div');
  });

  it('should build code block with attributes', async () => {
    const content = '```javascript {id=my-code}\nconst x = 1;\n```';
    const html = await buildString(content);
    expect(html).toContain('id="my-code"');
  });

  it('should NOT replace variables inside code block', async () => {
    const content = '$var = 1\n```\n{$var}\n```';
    const html = await buildString(content);
    expect(html).toContain('{$var}');
    expect(html).not.toContain('>1<');
  });
});
