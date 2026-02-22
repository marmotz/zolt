import { describe, expect, test } from 'bun:test';
import { buildString } from '../api';

describe('Code Blocks E2E', () => {
  test('should build basic code block', async () => {
    const zolt = '```\nconst x = 1;\n```';
    const html = await buildString(zolt);
    expect(html).toContain('<pre><code>const x = 1;');
    expect(html).toContain('</code></pre>');
  });

  test('should build code block with language', async () => {
    const zolt = '```javascript\nconst x = 1;\n```';
    const html = await buildString(zolt);
    expect(html).toContain('<pre><code class="language-javascript">const x = 1;');
    expect(html).toContain('</code></pre>');
  });

  test('should handle multiple lines in code block', async () => {
    const zolt = '```\nline 1\nline 2\n```';
    const html = await buildString(zolt);
    expect(html).toContain('line 1\nline 2');
  });

  test('should preserve indentation in code block', async () => {
    const zolt = '```\nif (true) {\n  console.log("hello");\n}\n```';
    const html = await buildString(zolt);
    expect(html).toContain('if (true) {\n  console.log(&quot;hello&quot;);\n}');
  });

  test('should escape HTML in code block', async () => {
    const zolt = '```\n<div>Test</div> & "quoted"\n```';
    const html = await buildString(zolt);
    expect(html).toContain('&lt;div&gt;Test&lt;/div&gt; &amp; &quot;quoted&quot;');
  });

  test('should build code block with attributes', async () => {
    const zolt = '```javascript {title="My Script" class="custom-code"}\nconst x = 1;\n```';
    const html = await buildString(zolt);
    expect(html).toContain('class="custom-code"');
    expect(html).toContain('title="My Script"');
    expect(html).toContain('<code class="language-javascript">const x = 1;');
  });

  test('should NOT replace variables inside code block', async () => {
    const zolt = '$var = "REPLACED"\n```\n{$var}\n```';
    const html = await buildString(zolt);
    expect(html).toContain('<code>{$var}</code>');
    expect(html).not.toContain('REPLACED');
  });
});
