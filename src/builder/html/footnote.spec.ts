import { describe, expect, test } from 'bun:test';
import { Lexer } from '../../lexer/lexer';
import { Parser } from '../../parser/parser';
import { HTMLBuilder } from './builder';

describe('Footnotes HTML Rendering', () => {
  test('should render footnote references and definitions', async () => {
    const source = 'Text[^1]\n\n[^1]: Note content';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const doc = parser.parse();

    const builder = new HTMLBuilder();
    const html = await builder.buildDocument(doc);

    expect(html).toContain('<sup><a href="#fn-1" id="fnref-1">[1]</a></sup>');
    expect(html).toContain(
      '<li id="fn-1" class="footnote-item"><p>Note content <a href="#fnref-1" class="footnote-backref" aria-label="Back to content">↩</a></p></li>'
    );
  });

  test('should handle multiple footnotes in order of appearance', async () => {
    const source = 'First[^1], Second[^2]\n\n[^1]: One\n[^2]: Two';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const doc = parser.parse();

    const builder = new HTMLBuilder();
    const html = await builder.buildDocument(doc);

    expect(html).toContain('[1]</a>');
    expect(html).toContain('[2]</a>');
    expect(html).toContain('id="fn-1"');
    expect(html).toContain('id="fn-2"');
  });

  test('should handle complex footnote content with nested blocks', async () => {
    const source = 'Text[^1]\n\n[^1]: Note with **bold** and:\n- List item';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const doc = parser.parse();

    const builder = new HTMLBuilder();
    const html = await builder.buildDocument(doc);

    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>List item</li>');
  });

  test('should handle reusing footnotes without caret and definitions without caret', async () => {
    const source = 'Ref 1[^reuse]. Ref 2[^reuse].\n\n[^reuse]: This is reused.';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const doc = parser.parse();

    const builder = new HTMLBuilder();
    const html = await builder.buildDocument(doc);

    expect(html).toContain('Ref 1 <sup><a href="#fn-reuse" id="fnref-reuse">[1]</a></sup>');
    expect(html).toContain('Ref 2 <sup><a href="#fn-reuse" id="fnref-reuse-1">[1]</a></sup>');
    expect(html).toContain('<a href="#fnref-reuse" class="footnote-backref" aria-label="Back to content">↩</a>');
    expect(html).toContain(' <a href="#fnref-reuse-1" class="footnote-backref" aria-label="Back to content">↩-2</a>');
  });

  test('should handle multi-reference backlink placement inside last paragraph', async () => {
    const doc = {
      type: 'Document',
      children: [
        { type: 'Paragraph', children: [{ type: 'Footnote', id: 'multi' }] },
        { type: 'Paragraph', children: [{ type: 'Footnote', id: 'multi' }] },
        {
          type: 'FootnoteDefinition',
          id: 'multi',
          children: [{ type: 'Paragraph', children: [{ type: 'Text', content: 'Multi ref content' }] }],
        },
      ],
      sourceFile: 'test.zlt',
    } as any;

    const builder = new HTMLBuilder({});
    const html = await builder.buildDocument(doc);

    expect(html).toContain(
      '<li id="fn-multi" class="footnote-item"><p>Multi ref content <a href="#fnref-multi" class="footnote-backref" aria-label="Back to content">↩</a> <a href="#fnref-multi-1" class="footnote-backref" aria-label="Back to content">↩-2</a></p></li>'
    );
  });
});
