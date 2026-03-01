import { describe, expect, it } from 'bun:test';
import { unlinkSync, writeFileSync } from 'node:fs';
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

  it('should NOT replace variables in code blocks when document is injected into a layout', async () => {
    const layoutPath = 'layout-code-block-test.zlt';
    writeFileSync(layoutPath, ':::content:::');

    try {
      const content = `---\nlayout: "./${layoutPath}"\ntitle: "Home"\n---\n\n# Test\n\n\`\`\`zolt\n# {$title}\n\`\`\``;
      const html = await buildString(content);

      expect(html).toContain('{$title}');
      expect(html).not.toContain('# Home');
    } finally {
      try {
        unlinkSync(layoutPath);
      } catch (_e) {}
    }
  });

  it('should NOT replace expressions in code blocks when document is injected into a layout', async () => {
    const layoutPath = 'layout-expr-test.zlt';
    writeFileSync(layoutPath, ':::content:::');

    try {
      const content = `---\nlayout: "./${layoutPath}"\n---\n\n\`\`\`zolt\n{{ 1 + 1 }}\n\`\`\``;
      const html = await buildString(content);

      // Check that delimiters are present (they might be in separate spans)
      expect(html).toContain('{{');
      expect(html).toContain('}}');
      expect(html).toContain('1');

      // Ensure the result of calculation (2) didn't replace the expression.
      // In Shiki, 2 would be inside a span.
      // We check that we don't have something like <span>2</span> replacing the whole expr.
      expect(html).not.toMatch(/>2<\/span>/);
    } finally {
      try {
        unlinkSync(layoutPath);
      } catch (_e) {}
    }
  });
});
