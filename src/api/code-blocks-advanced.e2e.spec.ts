import { describe, expect, it } from 'bun:test';
import { buildString } from './index';

describe('Advanced Code Blocks', () => {
  it('should render a code block with title and highlighting', async () => {
    const content =
      '```python {title="test.py" highlight="1,3-4" start=10}\ndef hello():\n    print("Hello")\n    print("World")\n    return True\n```';

    const html = await buildString(content);

    // Check title
    expect(html).toContain('test.py');
    expect(html).toContain('zolt-code-title');

    // Check copy button
    expect(html).toContain('zolt-copy-button');
    expect(html).toContain('Copier');

    // Check highlighting (Shiki adds 'highlight' class via our transformer)
    expect(html).toContain('highlight');

    // Check start line number variable
    expect(html).toContain('--zlt-code-start: 9');
    expect(html).toContain('with-line-numbers');
  });

  it('should support complex highlight ranges', async () => {
    const content = '```js {highlight="1,3,5-6"}\nline 1\nline 2\nline 3\nline 4\nline 5\nline 6\n```';

    const html = await buildString(content);

    // We expect multiple highlighted lines
    const highlightMatches = html.match(/class="[^"]*line highlight[^"]*"/g);
    expect(highlightMatches?.length).toBe(4);
  });
});
