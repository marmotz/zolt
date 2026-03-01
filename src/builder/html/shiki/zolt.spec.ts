import { beforeAll, describe, expect, it } from 'bun:test';
import { createHighlighter, type Highlighter } from 'shiki';
import { zoltLanguage } from './zolt';

describe('Zolt Shiki Grammar - Separators & Attributes', () => {
  let highlighter: Highlighter;

  beforeAll(async () => {
    highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: [zoltLanguage],
    });
  });

  const highlight = (code: string) => {
    const html = highlighter.codeToHtml(code, {
      lang: 'zolt',
      theme: 'github-dark',
    });
    console.log(`Input: ${JSON.stringify(code)}\nOutput: ${html}\n`);
    return html;
  };

  it('should highlight --- exactly as expected', () => {
    const html = highlight('---    (standard)');
    expect(html).not.toContain('font-weight:bold');
    // The whole line is greyed out as a comment
    expect(html).toContain('style="color:#6A737D">---    (standard)</span>');
  });

  it('should highlight *** exactly as expected', () => {
    const html = highlight('***    (thick)');
    expect(html).not.toContain('font-weight:bold');
    expect(html).not.toContain('color:#F97583');
    expect(html).toContain('style="color:#6A737D">***    (thick)</span>');
  });

  it('should highlight ___ exactly as expected', () => {
    const html = highlight('___    (thin)');
    expect(html).not.toContain('text-decoration:underline');
    expect(html).toContain('style="color:#6A737D">___    (thin)</span>');
  });

  it('should highlight ---\n***\n___ exactly as expected', () => {
    const html = highlight('---\n***\n___');

    // Check for 3 separate lines
    const lines = html.match(/<span class="line">.*?<\/span>/g);
    expect(lines).toHaveLength(3);

    // All lines should be grey and not bold/underlined
    expect(lines![0]).toContain('style="color:#6A737D">---</span>');
    expect(lines![1]).toContain('style="color:#6A737D">***</span>');
    expect(lines![2]).toContain('style="color:#6A737D">___</span>');
  });

  it('should highlight separators with attributes and keep attribute colors', () => {
    const html = highlight('--- {color=red}');
    // Symbols and spaces are grey
    expect(html).toContain('style="color:#6A737D">--- {</span>');
    // Attribute key is orange
    expect(html).toContain('style="color:#FFAB70">color</span>');
    // Equals is grey
    expect(html).toContain('style="color:#6A737D">=</span>');
    // Attribute value is light blue
    expect(html).toContain('style="color:#9ECBFF">red</span>');
    // Closing brace is grey
    expect(html).toContain('style="color:#6A737D">}</span>');
  });

  it('should highlight numbering flag in headings with correct colors', () => {
    const html = highlight('## Chapter 1{numbering}');

    // Heading symbols and text are blue/bold
    expect(html).toContain('style="color:#79B8FF;font-weight:bold">## Chapter 1{</span>');
    // Flag "numbering" is orange/bold (variable.parameter)
    expect(html).toContain('style="color:#FFAB70;font-weight:bold">numbering</span>');
    // Closing brace is blue/bold
    expect(html).toContain('style="color:#79B8FF;font-weight:bold">}</span>');
  });
});
