import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('API: Abbreviations', () => {
  describe('buildString', () => {
    test('should build basic abbreviation', async () => {
      const html = await buildString('HTML{abbr="HyperText Markup Language"} is the standard');

      expect(html).toContain('<abbr title="HyperText Markup Language">HTML</abbr>');
      expect(html).toContain('is the standard');
    });

    test('should build abbreviation in list item', async () => {
      const html = await buildString('- HTML{abbr="HyperText Markup Language"} is used for web');

      expect(html).toContain('<li>');
      expect(html).toContain('<abbr title="HyperText Markup Language">HTML</abbr>');
    });

    test('should build multiple abbreviations', async () => {
      const html = await buildString('HTML{abbr="HyperText Markup Language"} and CSS{abbr="Cascading Style Sheets"}');

      expect(html).toContain('<abbr title="HyperText Markup Language">HTML</abbr>');
      expect(html).toContain('<abbr title="Cascading Style Sheets">CSS</abbr>');
    });

    test('should build abbreviation with class attribute', async () => {
      const html = await buildString('W3C{abbr="World Wide Web Consortium" class="org-link"}');

      expect(html).toContain('<abbr');
      expect(html).toContain('title="World Wide Web Consortium"');
      expect(html).toContain('class="org-link"');
    });

    test('should build abbreviation with id attribute', async () => {
      const html = await buildString('HTML5{abbr="HTML version 5" id="html5-def"}');

      expect(html).toContain('id="html5-def"');
      expect(html).toContain('>HTML5</abbr>');
    });

    test('should build abbreviation with both class and id', async () => {
      const html = await buildString('API{abbr="Application Programming Interface" class="tech" id="api-def"}');

      expect(html).toContain('class="tech"');
      expect(html).toContain('id="api-def"');
    });

    test('should handle Greek letter mu in abbreviation', async () => {
      const html = await buildString('μs{abbr="microsecond"} is one millionth of a second');

      expect(html).toContain('<abbr title="microsecond">μs</abbr>');
    });

    test('should build abbreviation followed by punctuation', async () => {
      const html = await buildString('The CPU{abbr="Central Processing Unit"} executes instructions.');

      expect(html).toContain('<abbr title="Central Processing Unit">CPU</abbr>');
      expect(html).toContain('executes instructions.');
    });

    test('should handle abbreviations in tables', async () => {
      const html = await buildString('| JSON{abbr="JavaScript Object Notation"} | Data format |');

      expect(html).toContain('<abbr title="JavaScript Object Notation">JSON</abbr>');
    });

    test('should handle abbreviations with numbers', async () => {
      const html = await buildString('CSS3{abbr="Cascading Style Sheets version 3"} is modern');

      expect(html).toContain('<abbr title="Cascading Style Sheets version 3">CSS3</abbr>');
    });

    test('should handle abbreviation at start of text', async () => {
      const html = await buildString('API{abbr="Application Programming Interface"} provides endpoints');

      expect(html).toContain('<abbr title="Application Programming Interface">API</abbr>');
      expect(html).toContain('provides endpoints');
    });

    test('should handle abbreviation at end of text', async () => {
      const html = await buildString('The standard is HTML{abbr="HyperText Markup Language"}');

      expect(html).toContain('The standard is');
      expect(html).toContain('<abbr title="HyperText Markup Language">HTML</abbr>');
    });

    test('should handle multiple abbreviations in same paragraph', async () => {
      const html = await buildString(
        'The CPU{abbr="Central Processing Unit"} and GPU{abbr="Graphics Processing Unit"} are important.'
      );

      expect(html).toContain('<abbr title="Central Processing Unit">CPU</abbr>');
      expect(html).toContain('<abbr title="Graphics Processing Unit">GPU</abbr>');
    });

    test('should apply global abbreviation definition', async () => {
      const html = await buildString('*[HTML]: HyperText Markup Language\n\nHTML is the standard');

      expect(html).toContain('<abbr title="HyperText Markup Language">HTML</abbr>');
      expect(html).toContain('is the standard');
    });

    test('should apply multiple global abbreviations', async () => {
      const html = await buildString(
        '*[HTML]: HyperText Markup Language\n*[CSS]: Cascading Style Sheets\n\nHTML and CSS work together'
      );

      expect(html).toContain('<abbr title="HyperText Markup Language">HTML</abbr>');
      expect(html).toContain('<abbr title="Cascading Style Sheets">CSS</abbr>');
    });

    test('should not duplicate inline abbreviation when global definition exists', async () => {
      const html = await buildString(
        '*[HTML]: HyperText Markup Language\n\nHTML{abbr="HyperText Markup Language"} is great'
      );

      expect(html).toMatch(/<abbr title="HyperText Markup Language">HTML<\/abbr> is great/);
      expect(html).not.toContain('HTML{abbr=');
    });

    test('should apply global abbreviation with punctuation', async () => {
      const html = await buildString(
        '*[API]: Application Programming Interface\n\nThe API, REST, and JSON are related.'
      );

      expect(html).toContain('<abbr title="Application Programming Interface">API</abbr> ,');
    });
  });
});
