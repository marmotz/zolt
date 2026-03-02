import { beforeAll, describe, expect, it } from 'bun:test';
import { createHighlighter, type Highlighter } from 'shiki';
import { zoltLanguage } from './zolt';

describe('Zolt Shiki Grammar', () => {
  let highlighter: Highlighter;

  beforeAll(async () => {
    highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: [zoltLanguage as any, 'yaml'],
    });
  });

  const highlight = (code: string) => {
    return highlighter.codeToHtml(code, {
      lang: 'zolt',
      theme: 'github-dark',
    });
  };

  describe('Separators & Metadata', () => {
    it('should highlight separators exactly as expected', () => {
      const html = highlight('***\n---\n___');
      expect(html).toContain('style="color:#6A737D">***</span>');
      expect(html).toContain('style="color:#6A737D">---</span>');
      expect(html).toContain('style="color:#6A737D">___</span>');
    });

    it('should highlight separators with attributes', () => {
      const html = highlight('--- {color=red}');
      expect(html).toContain('style="color:#6A737D">--- {</span>');
      expect(html).toContain('style="color:#FFAB70">color</span>');
      expect(html).toContain('style="color:#9ECBFF">red</span>');
    });

    it('should highlight file metadata (YAML)', () => {
      const html = highlight('---\ntitle: Hello\n---');
      expect(html).toContain('---');
      expect(html).toContain('style="color:#85E89D">title</span>');
      expect(html).toContain('style="color:#9ECBFF">Hello</span>');
    });
  });

  describe('Headings & Attributes', () => {
    it('should highlight numbered flag in headings', () => {
      const html = highlight('## Chapter 1{numbered}');
      expect(html).toContain('style="color:#79B8FF;font-weight:bold">## Chapter 1{</span>');
      expect(html).toContain('style="color:#FFAB70;font-weight:bold">numbered</span>');
    });
  });

  describe('Lists', () => {
    it('should highlight bullet lists (- and *)', () => {
      const html = highlight('- Item 1\n* Item 2');
      expect(html).toContain('style="color:#79B8FF">-</span>');
      expect(html).toContain('style="color:#79B8FF">*</span>');
    });

    it('should highlight numbered lists', () => {
      const html = highlight('1. First\n10. Second');
      expect(html).toContain('style="color:#79B8FF">1.</span>');
      expect(html).toContain('style="color:#79B8FF">10.</span>');
    });

    it('should highlight plain lists (+)', () => {
      const html = highlight('+ Plain item');
      expect(html).toContain('style="color:#79B8FF">+</span>');
    });

    it('should highlight definition lists (:)', () => {
      const html = highlight(': Term\n:   Definition');
      expect(html).toContain('style="color:#79B8FF">:</span>');
    });

    it('should highlight checkbox lists', () => {
      const html = highlight('- [ ] Unchecked\n- [x] Checked\n[ ] Standalone');
      expect(html).toContain('[ ]</span>');
      expect(html).toContain('[x]</span>');
    });

    it('should highlight nested lists with mixed types', () => {
      const html = highlight('- Fruits\n  1. Apple\n    - [x] Red\n    - [ ] Green\n  2. Banana');
      // Level 0
      expect(html).toContain('style="color:#79B8FF">-</span>');
      // Level 1
      expect(html).toContain('style="color:#79B8FF">  1.</span>');
      // Level 2
      expect(html).toContain('style="color:#79B8FF">    -</span>');
      expect(html).toContain('[x]</span>');
      expect(html).toContain('[ ]</span>');
    });
  });
});
